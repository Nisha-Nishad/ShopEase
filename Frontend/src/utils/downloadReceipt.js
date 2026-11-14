import api from '../services/api';

const pdfEscape = (text) =>
  String(text ?? '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const formatINR = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString('en-IN')}`;

/**
 * Builds a standards-compliant PDF 1.4 Blob from an Order object.
 */
export const buildOrderReceiptPDFBlob = (order) => {
  const invoiceNo = `INV-${order._id.toString().slice(-8).toUpperCase()}`;
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const ops = [];

  const drawText = (
    x,
    y,
    text,
    size = 10,
    bold = false,
    rgb = [0.06, 0.09, 0.16]
  ) => {
    const font = bold ? '/F2' : '/F1';
    ops.push(
      `BT ${font} ${size} Tf ${rgb[0]} ${rgb[1]} ${rgb[2]} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${pdfEscape(text)}) Tj ET`
    );
  };

  const drawRect = (x, y, w, h, rgb) => {
    ops.push(
      `${rgb[0]} ${rgb[1]} ${rgb[2]} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`
    );
  };

  const drawLine = (x1, y1, x2, y2, width = 1, rgb = [0.88, 0.91, 0.94]) => {
    ops.push(
      `${width} w ${rgb[0]} ${rgb[1]} ${rgb[2]} RG ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`
    );
  };

  // 1. Header Banner
  drawText(45, 785, 'ShopEase', 24, true, [0.31, 0.27, 0.9]);
  drawText(
    45,
    768,
    'Official Order Receipt & Tax Invoice',
    10,
    false,
    [0.39, 0.45, 0.55]
  );

  drawText(370, 790, `Invoice No: ${invoiceNo}`, 10, true);
  drawText(
    370,
    776,
    `Order ID: #${order._id.toString().slice(-12).toUpperCase()}`,
    9,
    false,
    [0.28, 0.33, 0.41]
  );
  drawText(370, 763, `Date: ${orderDate}`, 9, false, [0.28, 0.33, 0.41]);
  drawText(
    370,
    750,
    `Order Status: ${order.orderStatus || 'Placed'}`,
    9,
    false,
    [0.28, 0.33, 0.41]
  );
  drawText(
    370,
    737,
    `Payment: ${order.paymentMethod} (${order.isPaid ? 'PAID' : 'PENDING / COD'})`,
    9,
    true,
    order.isPaid ? [0.02, 0.59, 0.41] : [0.71, 0.33, 0.04]
  );

  drawLine(45, 722, 550, 722, 1.5, [0.31, 0.27, 0.9]);

  // 2. Billed & Shipped To / Sold By
  const addr = order.shippingAddress || {};
  drawText(45, 700, 'BILLED & SHIPPED TO:', 8.5, true, [0.39, 0.45, 0.55]);
  drawText(45, 685, addr.fullName || order.user?.name || 'Customer', 11, true);
  drawText(
    45,
    671,
    (addr.street || '').slice(0, 50),
    9.5,
    false,
    [0.2, 0.25, 0.33]
  );
  drawText(
    45,
    657,
    `${addr.city || ''}, ${addr.state || ''} - ${addr.postalCode || ''}`,
    9.5,
    false,
    [0.2, 0.25, 0.33]
  );
  drawText(
    45,
    643,
    `Phone: ${addr.phone || '-'}`,
    9.5,
    false,
    [0.2, 0.25, 0.33]
  );

  drawText(370, 700, 'SOLD BY:', 8.5, true, [0.39, 0.45, 0.55]);
  drawText(370, 685, 'ShopEase Retail Pvt. Ltd.', 10.5, true);
  drawText(
    370,
    671,
    '100 Feet Road, Indiranagar',
    9.5,
    false,
    [0.2, 0.25, 0.33]
  );
  drawText(
    370,
    657,
    'Bengaluru, Karnataka - 560038',
    9.5,
    false,
    [0.2, 0.25, 0.33]
  );
  drawText(
    370,
    643,
    'India | support@shopease.com',
    9.5,
    false,
    [0.2, 0.25, 0.33]
  );

  // 3. Itemized Table Header
  let y = 610;
  drawRect(45, y - 6, 505, 22, [0.945, 0.961, 0.976]);
  drawText(52, y + 2, '#', 9, true, [0.2, 0.25, 0.33]);
  drawText(75, y + 2, 'ITEM DESCRIPTION', 9, true, [0.2, 0.25, 0.33]);
  drawText(355, y + 2, 'QTY', 9, true, [0.2, 0.25, 0.33]);
  drawText(400, y + 2, 'UNIT PRICE', 9, true, [0.2, 0.25, 0.33]);
  drawText(480, y + 2, 'LINE TOTAL', 9, true, [0.2, 0.25, 0.33]);

  y -= 24;

  // 4. Table Rows
  const items = order.orderItems || [];
  items.forEach((item, idx) => {
    if (y < 160) return;
    const variant = [item.variant?.size, item.variant?.color]
      .filter(Boolean)
      .join(' / ');
    const lineTotal = (item.price || 0) * (item.qty || 1);
    const cleanName =
      item.name && item.name.length > 44
        ? `${item.name.slice(0, 44)}...`
        : item.name || 'Product';

    drawText(52, y, String(idx + 1), 9.5, false);
    drawText(75, y, cleanName, 9.5, true);
    drawText(360, y, String(item.qty || 1), 9.5, false);
    drawText(400, y, formatINR(item.price), 9.5, false);
    drawText(480, y, formatINR(lineTotal), 9.5, true);

    if (variant) {
      y -= 12;
      drawText(75, y, `Variant: ${variant}`, 8, false, [0.39, 0.45, 0.55]);
    }

    drawLine(45, y - 7, 550, y - 7, 0.5, [0.88, 0.91, 0.94]);
    y -= 22;
  });

  // 5. Totals Breakdown
  y -= 6;
  drawText(350, y, 'Items Subtotal:', 9.5, false, [0.28, 0.33, 0.41]);
  drawText(475, y, formatINR(order.itemsPrice), 9.5, true);

  if (order.discount > 0) {
    y -= 16;
    drawText(
      350,
      y,
      `Coupon Discount (${order.couponCode || 'PROMO'}):`,
      9.5,
      false,
      [0.02, 0.59, 0.41]
    );
    drawText(
      475,
      y,
      `-${formatINR(order.discount)}`,
      9.5,
      true,
      [0.02, 0.59, 0.41]
    );
  }

  y -= 16;
  drawText(350, y, 'Shipping Charges:', 9.5, false, [0.28, 0.33, 0.41]);
  drawText(
    475,
    y,
    order.shippingPrice === 0 ? 'FREE' : formatINR(order.shippingPrice),
    9.5,
    true,
    order.shippingPrice === 0 ? [0.02, 0.59, 0.41] : [0.06, 0.09, 0.16]
  );

  y -= 16;
  drawText(350, y, 'GST (5%):', 9.5, false, [0.28, 0.33, 0.41]);
  drawText(475, y, formatINR(order.taxPrice), 9.5, true);

  y -= 10;
  drawLine(350, y, 550, y, 1.2, [0.06, 0.09, 0.16]);

  y -= 18;
  drawText(350, y, 'Grand Total:', 12, true, [0.06, 0.09, 0.16]);
  drawText(465, y, formatINR(order.totalPrice), 12, true, [0.31, 0.27, 0.9]);

  // 6. Footer Note
  drawLine(45, 70, 550, 70, 0.5, [0.88, 0.91, 0.94]);
  drawText(
    95,
    52,
    'Thank you for shopping with ShopEase! This is a computer-generated receipt and requires no signature.',
    8.5,
    false,
    [0.5, 0.55, 0.65]
  );

  const contentStream = ops.join('\n');
  const encoder = new TextEncoder();
  const streamBytes = encoder.encode(contentStream).length;

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n',
    `6 0 obj\n<< /Length ${streamBytes} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (const obj of objects) {
    offsets.push(encoder.encode(pdf).length);
    pdf += obj;
  }

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
};

/**
 * Downloads the Order Receipt as a PDF file (`ShopEase_Receipt_INV-XXXXXXXX.pdf`).
 */
export const downloadOrderReceipt = async (order) => {
  if (!order?._id) return;
  const invoiceNo = `INV-${order._id.toString().slice(-8).toUpperCase()}`;
  const filename = `ShopEase_Receipt_${invoiceNo}.pdf`;

  let blob;
  try {
    const response = await api.get(`/orders/${order._id}/invoice?format=pdf`, {
      responseType: 'blob',
    });
    if (
      response.data &&
      response.headers?.['content-type']?.includes('application/pdf')
    ) {
      blob = new Blob([response.data], { type: 'application/pdf' });
    } else {
      blob = buildOrderReceiptPDFBlob(order);
    }
  } catch {
    blob = buildOrderReceiptPDFBlob(order);
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 1500);
};
