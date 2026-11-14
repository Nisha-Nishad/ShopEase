/**
 * Standards-compliant ISO/IEC 18004 QR Code Matrix Generator (Byte Mode, ECC Level L)
 * Supports Versions 1 to 10 (up to 271 bytes) — ideal for NPCI `upi://pay?...` URIs.
 * Zero external dependencies, works 100% offline and renders crisp SVG QR codes.
 */

// Total codewords and ECC codewords per block for ECC Level L (Versions 1..10)
const VERSION_TABLE_L = [
  null,
  { total: 26, ecPerBlock: 7, blocks1: 1, data1: 19, blocks2: 0, data2: 0, align: [] },
  { total: 44, ecPerBlock: 10, blocks1: 1, data1: 34, blocks2: 0, data2: 0, align: [6, 18] },
  { total: 70, ecPerBlock: 15, blocks1: 1, data1: 55, blocks2: 0, data2: 0, align: [6, 22] },
  { total: 100, ecPerBlock: 20, blocks1: 1, data1: 80, blocks2: 0, data2: 0, align: [6, 26] },
  { total: 134, ecPerBlock: 26, blocks1: 1, data1: 108, blocks2: 0, data2: 0, align: [6, 30] },
  { total: 172, ecPerBlock: 18, blocks1: 2, data1: 68, blocks2: 0, data2: 0, align: [6, 34] },
  { total: 196, ecPerBlock: 20, blocks1: 2, data1: 78, blocks2: 0, data2: 0, align: [6, 22, 38] },
  { total: 242, ecPerBlock: 24, blocks1: 2, data1: 97, blocks2: 0, data2: 0, align: [6, 24, 42] },
  { total: 292, ecPerBlock: 30, blocks1: 2, data1: 116, blocks2: 0, data2: 0, align: [6, 26, 46] },
  { total: 346, ecPerBlock: 18, blocks1: 2, data1: 68, blocks2: 2, data2: 69, align: [6, 28, 50] },
];

// Galois Field GF(256) tables with primitive polynomial 0x11D
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree) {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const root = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data, ecLen) {
  const gen = rsGeneratorPoly(ecLen);
  const msg = new Uint8Array(data.length + ecLen);
  msg.set(data, 0);
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 1; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return msg.slice(data.length);
}

function getBCHFormatInfo(maskPattern) {
  // ECC Level L = 01
  const data = (0b01 << 3) | maskPattern;
  let rem = data << 10;
  for (let i = 14; i >= 10; i--) {
    if ((rem >> i) & 1) {
      rem ^= 0b10100110111 << (i - 10);
    }
  }
  return ((data << 10) | rem) ^ 0b101010000010010;
}

function getBCHVersionInfo(version) {
  let rem = version << 12;
  for (let i = 17; i >= 12; i--) {
    if ((rem >> i) & 1) {
      rem ^= 0b1111100100101 << (i - 12);
    }
  }
  return (version << 12) | rem;
}

/**
 * Generates a 2D boolean matrix (true = dark module, false = light module) for the given text
 */
export function generateQrMatrix(text) {
  const bytes = new TextEncoder().encode(text);

  // Pick smallest version (1..10) that fits Byte Mode payload
  let version = 1;
  while (version <= 10) {
    const info = VERSION_TABLE_L[version];
    const dataCapacityBytes =
      info.blocks1 * info.data1 + info.blocks2 * info.data2;
    const headerBits = version <= 9 ? 4 + 8 : 4 + 16;
    const maxPayload = Math.floor((dataCapacityBytes * 8 - headerBits) / 8);
    if (bytes.length <= maxPayload) break;
    version++;
  }
  if (version > 10) {
    throw new Error('QR payload too long');
  }

  const vInfo = VERSION_TABLE_L[version];
  const totalDataBytes =
    vInfo.blocks1 * vInfo.data1 + vInfo.blocks2 * vInfo.data2;

  // Build bit stream
  const bits = [];
  const pushBits = (val, len) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  // Mode indicator: Byte mode = 0100
  pushBits(0b0100, 4);
  // Character count indicator: 8 bits for v1-9, 16 bits for v10+
  pushBits(bytes.length, version <= 9 ? 8 : 16);
  for (const b of bytes) {
    pushBits(b, 8);
  }

  // Terminator (up to 4 zero bits)
  const maxBits = totalDataBytes * 8;
  const termLen = Math.min(4, maxBits - bits.length);
  pushBits(0, termLen);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Pad bytes (0xEC, 0x11 alternating)
  const dataWords = new Uint8Array(totalDataBytes);
  for (let i = 0; i < bits.length / 8; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    dataWords[i] = b;
  }
  let padToggle = true;
  for (let i = bits.length / 8; i < totalDataBytes; i++) {
    dataWords[i] = padToggle ? 0xec : 0x11;
    padToggle = !padToggle;
  }

  // Split into blocks & compute Reed-Solomon ECC
  const dataBlocks = [];
  const ecBlocks = [];
  let offset = 0;
  for (let b = 0; b < vInfo.blocks1; b++) {
    const block = dataWords.slice(offset, offset + vInfo.data1);
    offset += vInfo.data1;
    dataBlocks.push(block);
    ecBlocks.push(rsEncode(block, vInfo.ecPerBlock));
  }
  for (let b = 0; b < vInfo.blocks2; b++) {
    const block = dataWords.slice(offset, offset + vInfo.data2);
    offset += vInfo.data2;
    dataBlocks.push(block);
    ecBlocks.push(rsEncode(block, vInfo.ecPerBlock));
  }

  // Interleave data and EC codewords
  const interleaved = [];
  const maxDataLen = Math.max(vInfo.data1, vInfo.data2);
  for (let i = 0; i < maxDataLen; i++) {
    for (const block of dataBlocks) {
      if (i < block.length) interleaved.push(block[i]);
    }
  }
  for (let i = 0; i < vInfo.ecPerBlock; i++) {
    for (const block of ecBlocks) {
      interleaved.push(block[i]);
    }
  }

  // Initialize QR grid
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => new Uint8Array(size));
  const isFunction = Array.from({ length: size }, () => new Uint8Array(size));

  const setFunctionModule = (r, c, dark) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = dark ? 1 : 0;
      isFunction[r][c] = 1;
    }
  };

  // Finder patterns + separators
  const drawFinder = (row, col) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = row + dr;
        const c = col + dc;
        const inOuter =
          dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6 &&
          (dr === 0 || dr === 6 || dc === 0 || dc === 6);
        const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunctionModule(r, c, inOuter || inInner);
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunctionModule(6, i, i % 2 === 0);
    setFunctionModule(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  const alignCoords = vInfo.align;
  for (const r of alignCoords) {
    for (const c of alignCoords) {
      // Skip if overlapping finder patterns
      if (
        (r === 6 && c === 6) ||
        (r === 6 && c === size - 7) ||
        (r === size - 7 && c === 6)
      ) {
        continue;
      }
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dark =
            Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setFunctionModule(r + dr, c + dc, dark);
        }
      }
    }
  }

  // Dark module
  setFunctionModule(4 * version + 9, 8, true);

  // Reserve format information areas
  for (let i = 0; i <= 8; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = 1;
    if (!isFunction[i][8]) isFunction[i][8] = 1;
  }
  for (let i = 0; i < 8; i++) {
    isFunction[8][size - 1 - i] = 1;
    isFunction[size - 1 - i][8] = 1;
  }

  // Version information (for version >= 7)
  if (version >= 7) {
    const vBits = getBCHVersionInfo(version);
    for (let i = 0; i < 18; i++) {
      const dark = ((vBits >> i) & 1) === 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFunctionModule(a, b, dark);
      setFunctionModule(b, a, dark);
    }
  }

  // Place data bits in zigzag upward/downward 2-column strips
  let bitIdx = 0;
  const totalBits = interleaved.length * 8;
  let upward = true;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // Skip vertical timing pattern column
    for (let vert = 0; vert < size; vert++) {
      const r = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        if (!isFunction[r][c]) {
          let dark = false;
          if (bitIdx < totalBits) {
            dark =
              ((interleaved[Math.floor(bitIdx / 8)] >> (7 - (bitIdx % 8))) &
                1) ===
              1;
            bitIdx++;
          }
          modules[r][c] = dark ? 1 : 0;
        }
      }
    }
    upward = !upward;
  }

  // Apply mask pattern 0 ((r + c) % 2 === 0) and write Format Information
  const mask = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isFunction[r][c] && (r + c) % 2 === 0) {
        modules[r][c] ^= 1;
      }
    }
  }

  const formatBits = getBCHFormatInfo(mask);
  const getFmtBit = (bitIndex) => ((formatBits >> bitIndex) & 1) === 1;

  // Top-left format info: (8, 0..5) -> bits 14..9, (8, 7) -> bit 8, (8, 8) -> bit 7
  for (let i = 0; i <= 5; i++) setFunctionModule(8, i, getFmtBit(14 - i));
  setFunctionModule(8, 7, getFmtBit(8));
  setFunctionModule(8, 8, getFmtBit(7));
  // Top-left vertical: (7, 8) -> bit 6, (5..0, 8) -> bits 5..0
  setFunctionModule(7, 8, getFmtBit(6));
  for (let i = 0; i <= 5; i++) setFunctionModule(5 - i, 8, getFmtBit(5 - i));

  // Bottom-left vertical: (size - 1 .. size - 7, 8) -> bits 14..8
  for (let i = 0; i < 7; i++) {
    setFunctionModule(size - 1 - i, 8, getFmtBit(14 - i));
  }
  // Top-right horizontal: (8, size - 8 .. size - 1) -> bits 7..0
  for (let i = 0; i < 8; i++) {
    setFunctionModule(8, size - 8 + i, getFmtBit(7 - i));
  }

  return modules;
}

/**
 * Builds an NPCI-compliant UPI payment deep-link URI (`upi://pay?...`)
 * Scanning this URI with PhonePe, GPay, Paytm, or BHIM opens the payment screen
 * with the exact order amount and payee name pre-filled.
 */
export function buildUpiPaymentUri({
  pa,
  pn = 'ShopEase Store',
  am,
  tn = 'ShopEase Order',
  tr = '',
}) {
  const cleanVpa = (pa || '').trim();
  const formattedAmount = Number(am || 0).toFixed(2);
  let uri = `upi://pay?pa=${encodeURIComponent(cleanVpa)}&pn=${encodeURIComponent(
    pn
  )}&am=${encodeURIComponent(formattedAmount)}&cu=INR`;
  if (tn) uri += `&tn=${encodeURIComponent(tn)}`;
  if (tr) uri += `&tr=${encodeURIComponent(tr)}`;
  return uri;
}
