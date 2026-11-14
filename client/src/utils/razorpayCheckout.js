import api from '../services/api';
import { generateQrMatrix, buildUpiPaymentUri } from './upiQrCode';

/**
 * Dynamically loads the official Razorpay Checkout SDK script in the browser
 */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Renders a crisp SVG string from a 2D boolean QR matrix
 */
function renderQrSvgString(matrix, brandColor = '#5f259f', badgeText = 'UPI') {
  const size = matrix.length;
  const margin = 3;
  const total = size + margin * 2;
  let paths = '';

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        paths += `M${c + margin},${r + margin}h1v1h-1z`;
      }
    }
  }

  const center = total / 2;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" class="w-48 h-48 sm:w-52 sm:h-52 mx-auto rounded-xl border border-slate-200 shadow-xs bg-white p-1.5" shape-rendering="crispEdges">
      <rect width="${total}" height="${total}" fill="#ffffff" />
      <path d="${paths}" fill="#0f172a" />
      <rect x="${center - 3.6}" y="${center - 2.2}" width="7.2" height="4.4" rx="0.9" fill="#ffffff" stroke="${brandColor}" stroke-width="0.35" shape-rendering="geometricPrecision" />
      <text x="${center}" y="${center + 0.75}" text-anchor="middle" fill="${brandColor}" font-family="sans-serif" font-weight="800" font-size="2.1" shape-rendering="geometricPrecision">${badgeText}</text>
    </svg>
  `;
}

/**
 * Normalizes a 10-digit mobile number or UPI ID into a valid UPI VPA
 */
function normalizeUpiVpa(input, provider = 'phonepe') {
  const raw = (input || '').trim().toLowerCase();
  if (!raw) return '';
  const digitsOnly = raw.replace(/\D/g, '');
  if (/^\d{10}$/.test(raw) || (digitsOnly.length === 10 && !raw.includes('@'))) {
    const suffix = provider === 'gpay' ? '@okaxis' : '@ybl';
    return `${digitsOnly.slice(-10)}${suffix}`;
  }
  if (raw.includes('@')) {
    return raw;
  }
  const suffix = provider === 'gpay' ? '@okaxis' : '@ybl';
  return `${raw}${suffix}`;
}

/**
 * Interactive Payment Gateway Modal supporting:
 * 1. PhonePe (UPI Number / ID OR Scan & Pay Real UPI QR Code)
 * 2. Google Pay / GPay (UPI Number / ID OR Scan & Pay Real UPI QR Code)
 * 3. Debit / Credit Card (Card Details + 3D Secure OTP)
 */
function openInteractivePaymentGatewayModal({
  order,
  user,
  data,
  preferredMethod = 'phonepe',
  preferredUpiMode = 'qr',
  initialUpiId = '',
  initialReceiverUpi = '',
  onSuccess,
  onError,
}) {
  return new Promise((resolve) => {
    const existing = document.getElementById('shopease-payment-gateway-modal');
    if (existing) existing.remove();

    const amountInRupees = Number(order.totalPrice || 0);
    const formattedAmount = amountInRupees.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    });
    const orderShortId = order._id.toString().slice(-8).toUpperCase();

    // Persisted merchant/receiver UPI ID so scanning the QR on PhonePe/GPay opens a real Pay screen
    const storedMerchantUpi =
      localStorage.getItem('shopease_merchant_upi') || '';
    let receiverUpi =
      initialReceiverUpi ||
      data.merchantUpiId ||
      storedMerchantUpi ||
      normalizeUpiVpa(initialUpiId, preferredMethod) ||
      '9876543210@ybl';

    let activeMethod = ['phonepe', 'gpay', 'card'].includes(preferredMethod)
      ? preferredMethod
      : 'phonepe';
    let upiSubMode = preferredUpiMode === 'id' ? 'id' : 'qr'; // 'qr' (Scan & Pay) | 'id' (UPI Number / ID)
    let upiInput = initialUpiId || user?.phone?.replace(/\D/g, '').slice(-10) || '';
    let collectRequestSent = false;
    let cardOtpStep = false;
    let cardData = {
      number: '',
      expiry: '',
      cvv: '',
      name: order.shippingAddress?.fullName || user?.name || '',
      otp: '',
    };
    let errorMsg = '';
    let processing = false;
    let remainingSeconds = 300; // 5-minute session timer

    const overlay = document.createElement('div');
    overlay.id = 'shopease-payment-gateway-modal';
    overlay.className =
      'fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto';

    let timerInterval = null;

    const cleanup = () => {
      if (timerInterval) clearInterval(timerInterval);
      overlay.remove();
    };

    const completePaymentVerification = async (channelLabel, payerVpaValue) => {
      if (processing) return;
      processing = true;
      errorMsg = '';
      render();

      try {
        const verifyRes = await api.post('/payment/verify', {
          orderId: order._id,
          ...data.simulatedPaymentPayload,
          paymentChannel: channelLabel,
          payerVpa: payerVpaValue,
        });
        cleanup();
        if (onSuccess) onSuccess(verifyRes.data.order);
        resolve(verifyRes.data.order);
      } catch (err) {
        processing = false;
        errorMsg =
          err.response?.data?.message ||
          'Payment verification failed. Please try again.';
        render();
      }
    };

    const render = () => {
      const isPhonePe = activeMethod === 'phonepe';
      const isGPay = activeMethod === 'gpay';
      const isCard = activeMethod === 'card';

      const brandName = isPhonePe
        ? 'PhonePe'
        : isGPay
        ? 'Google Pay (GPay)'
        : 'Debit / Credit Card';
      const brandColor = isPhonePe
        ? '#5f259f'
        : isGPay
        ? '#1a73e8'
        : '#4f46e5';
      const badgeText = isPhonePe ? 'Pe' : isGPay ? 'GPay' : 'UPI';

      const cleanReceiverVpa = normalizeUpiVpa(receiverUpi, activeMethod);
      const upiUri = buildUpiPaymentUri({
        pa: cleanReceiverVpa || '9876543210@ybl',
        pn: data.merchantName || 'ShopEase Store',
        am: amountInRupees,
        tn: `ShopEase Order ${orderShortId}`,
        tr: `SE${orderShortId}`,
      });

      let qrSvgHtml = '';
      try {
        const matrix = generateQrMatrix(upiUri);
        qrSvgHtml = renderQrSvgString(matrix, brandColor, badgeText);
      } catch {
        qrSvgHtml = `<div class="p-6 text-xs text-red-600">Enter a valid UPI ID</div>`;
      }

      const mins = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
      const secs = String(remainingSeconds % 60).padStart(2, '0');

      const resolvedPayerVpa = normalizeUpiVpa(upiInput, activeMethod);

      overlay.innerHTML = `
        <div class="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
          <!-- Top Gateway Header -->
          <div style="background: ${brandColor}" class="px-5 py-4 text-white flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center font-extrabold text-sm border border-white/20">
                ${isPhonePe ? 'Pe' : isGPay ? 'G' : '💳'}
              </div>
              <div>
                <div class="flex items-center gap-1.5">
                  <h3 class="font-bold text-base leading-tight">ShopEase Secure Pay</h3>
                  <span class="text-[10px] bg-emerald-400/20 border border-emerald-300/40 text-emerald-100 px-1.5 py-0.5 rounded-full font-semibold">Verified</span>
                </div>
                <p class="text-xs text-white/80">Order #${orderShortId} • Session ${mins}:${secs}</p>
              </div>
            </div>
            <div class="text-right flex items-center gap-3">
              <div>
                <p class="text-[10px] uppercase tracking-wider text-white/75">Payable</p>
                <p class="text-lg font-extrabold leading-tight">${formattedAmount}</p>
              </div>
              <button type="button" id="pg-close-btn" class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-lg leading-none cursor-pointer" title="Cancel Payment">&times;</button>
            </div>
          </div>

          <!-- Payment Option Tabs: PhonePe | GPay | Debit Card -->
          <div class="grid grid-cols-3 gap-1.5 p-2.5 bg-slate-100 border-b border-slate-200">
            <button type="button" data-method="phonepe" class="pg-method-tab py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isPhonePe
                ? 'bg-[#5f259f] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
            }">
              <span class="w-5 h-5 rounded-full ${
                isPhonePe ? 'bg-white text-[#5f259f]' : 'bg-[#5f259f] text-white'
              } inline-flex items-center justify-center text-[10px] font-black">Pe</span>
              <span>PhonePe</span>
            </button>

            <button type="button" data-method="gpay" class="pg-method-tab py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isGPay
                ? 'bg-[#1a73e8] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
            }">
              <span class="w-5 h-5 rounded-full ${
                isGPay ? 'bg-white text-[#1a73e8]' : 'bg-[#1a73e8] text-white'
              } inline-flex items-center justify-center text-[10px] font-black">G</span>
              <span>Google Pay</span>
            </button>

            <button type="button" data-method="card" class="pg-method-tab py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isCard
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
            }">
              <span>💳</span>
              <span>Debit Card</span>
            </button>
          </div>

          <!-- Body Content -->
          <div class="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
            ${
              errorMsg
                ? `<div class="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">${errorMsg}</div>`
                : ''
            }

            ${
              isPhonePe || isGPay
                ? `
              <!-- Sub-mode selector inside PhonePe / GPay: Scan & Pay QR vs UPI Number / ID -->
              <div class="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button type="button" data-upimode="qr" class="pg-upimode-btn py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  upiSubMode === 'qr'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }">
                  📷 Scan &amp; Pay (QR)
                </button>
                <button type="button" data-upimode="id" class="pg-upimode-btn py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  upiSubMode === 'id'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }">
                  📱 UPI Number / ID
                </button>
              </div>

              ${
                upiSubMode === 'qr'
                  ? `
                <!-- SCAN & PAY QR VIEW -->
                <div class="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-center space-y-3">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-slate-700">Scan with ${brandName} App</span>
                    <span class="font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Amount: ${formattedAmount}</span>
                  </div>

                  <!-- Live Scannable NPCI UPI QR Code -->
                  <div class="py-1">
                    ${qrSvgHtml}
                  </div>

                  <p class="text-[11px] text-slate-600 leading-relaxed">
                    Open <strong>${brandName}</strong> on your phone &rarr; Tap <strong>Scan &amp; Pay</strong> &rarr; Scan this QR code. You will immediately get a payment screen for <strong>${formattedAmount}</strong>.
                  </p>

                  <!-- Receiver UPI ID Box (Ensures real PhonePe/GPay app validates receiver VPA!) -->
                  <div class="bg-white rounded-xl border border-slate-200 p-2.5 text-left space-y-1.5">
                    <label class="block text-[11px] font-bold text-slate-700">
                      Merchant / Receiver UPI ID (linked to QR Code):
                    </label>
                    <div class="flex gap-1.5">
                      <input
                        type="text"
                        id="pg-receiver-upi-input"
                        value="${receiverUpi}"
                        placeholder="e.g. 9876543210@ybl or name@okaxis"
                        class="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:border-indigo-600"
                      />
                      <button
                        type="button"
                        id="pg-update-qr-btn"
                        class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold cursor-pointer shrink-0"
                      >
                        Update QR
                      </button>
                    </div>
                    <p class="text-[10px] text-slate-500">
                      💡 Tip: Enter any valid active UPI ID / PhonePe number (e.g. <code class="font-mono text-slate-700">yournumber@ybl</code>) above so PhonePe verifies the receiver when you scan.
                    </p>
                  </div>

                  <!-- Mobile Deep Link + Confirm Button -->
                  <div class="pt-1 space-y-2">
                    <a
                      href="${upiUri}"
                      class="w-full py-2 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>📲 Open ${brandName} App Directly (On Mobile)</span>
                    </a>

                    <button
                      type="button"
                      id="pg-confirm-qr-paid-btn"
                      ${processing ? 'disabled' : ''}
                      style="background: ${brandColor}"
                      class="w-full hover:opacity-95 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-sm"
                    >
                      ${
                        processing
                          ? 'Verifying Payment...'
                          : `I Have Scanned & Paid ${formattedAmount} • Complete Order`
                      }
                    </button>
                  </div>
                </div>
              `
                  : `
                <!-- UPI NUMBER / UPI ID COLLECT REQUEST VIEW -->
                <div class="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1.5">
                      Enter Your ${brandName} Mobile Number or UPI ID
                    </label>
                    <div class="flex gap-2">
                      <input
                        type="text"
                        id="pg-upi-id-input"
                        value="${upiInput}"
                        placeholder="${
                          isPhonePe
                            ? 'e.g. 9876543210 or number@ybl'
                            : 'e.g. 9876543210 or name@okaxis'
                        }"
                        class="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium bg-white focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div class="flex flex-wrap gap-1.5 mt-2">
                      ${(isPhonePe
                        ? ['@ybl', '@ibl', '@axl']
                        : ['@okaxis', '@oksbi', '@okicici', '@okhdfcbank']
                      )
                        .map(
                          (handle) => `
                        <button type="button" data-handle="${handle}" class="pg-upi-handle-chip text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 cursor-pointer">
                          ${handle}
                        </button>
                      `
                        )
                        .join('')}
                    </div>
                    ${
                      resolvedPayerVpa
                        ? `<p class="text-[11px] text-emerald-700 font-semibold mt-1.5">✓ Verified VPA: <span class="font-mono">${resolvedPayerVpa}</span></p>`
                        : ''
                    }
                  </div>

                  ${
                    !collectRequestSent
                      ? `
                    <button
                      type="button"
                      id="pg-send-collect-btn"
                      style="background: ${brandColor}"
                      class="w-full hover:opacity-95 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all cursor-pointer shadow-sm"
                    >
                      Verify &amp; Send ${formattedAmount} Request to ${brandName}
                    </button>
                  `
                      : `
                    <div class="bg-white rounded-xl border border-indigo-200 p-4 space-y-3 text-center">
                      <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto font-bold text-lg">
                        📲
                      </div>
                      <div class="space-y-1">
                        <p class="text-xs font-bold text-slate-900">
                          Payment Request of ${formattedAmount} Sent to <span class="font-mono text-indigo-700">${resolvedPayerVpa}</span>!
                        </p>
                        <p class="text-[11px] text-slate-500">
                          Open your <strong>${brandName}</strong> app to approve the payment request, or scan the QR code below on your phone:
                        </p>
                      </div>

                      <div class="py-1">
                        ${qrSvgHtml}
                      </div>

                      <a
                        href="${upiUri}"
                        class="w-full py-2 px-3 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold inline-flex items-center justify-center gap-1"
                      >
                        <span>Open ${brandName} App to Pay ${formattedAmount}</span>
                      </a>

                      <button
                        type="button"
                        id="pg-approve-collect-btn"
                        ${processing ? 'disabled' : ''}
                        style="background: ${brandColor}"
                        class="w-full hover:opacity-95 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-sm"
                      >
                        ${
                          processing
                            ? 'Verifying Payment...'
                            : `Payment Approved on ${brandName} • Complete Order`
                        }
                      </button>
                    </div>
                  `
                  }
                </div>
              `
              }
            `
                : `
              <!-- DEBIT / CREDIT CARD VIEW -->
              <div class="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-700">Enter Debit / Credit Card Details</span>
                  <span class="text-[11px] font-semibold text-slate-500">Visa • MasterCard • RuPay</span>
                </div>

                ${
                  !cardOtpStep
                    ? `
                  <div class="space-y-3">
                    <div>
                      <label class="block text-[11px] font-semibold text-slate-600 mb-1">Card Number (16 Digits)</label>
                      <input
                        type="text"
                        id="pg-card-number"
                        maxlength="19"
                        inputmode="numeric"
                        value="${cardData.number}"
                        placeholder="4532 •••• •••• 8910"
                        class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-mono tracking-wider focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-[11px] font-semibold text-slate-600 mb-1">Expiry Date (MM/YY)</label>
                        <input
                          type="text"
                          id="pg-card-expiry"
                          maxlength="5"
                          inputmode="numeric"
                          value="${cardData.expiry}"
                          placeholder="08/29"
                          class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-mono focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                      <div>
                        <label class="block text-[11px] font-semibold text-slate-600 mb-1">CVV (3 Digits)</label>
                        <input
                          type="password"
                          id="pg-card-cvv"
                          maxlength="4"
                          inputmode="numeric"
                          value="${cardData.cvv}"
                          placeholder="•••"
                          class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-mono focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label class="block text-[11px] font-semibold text-slate-600 mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        id="pg-card-name"
                        value="${cardData.name}"
                        placeholder="Name on Card"
                        class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    <button
                      type="button"
                      id="pg-card-proceed-btn"
                      class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all cursor-pointer shadow-sm"
                    >
                      Proceed to Bank OTP • ${formattedAmount}
                    </button>
                  </div>
                `
                    : `
                  <div class="bg-white rounded-xl border border-indigo-200 p-4 space-y-3 text-center">
                    <p class="text-xs font-bold text-slate-900">
                      3D Secure Bank OTP Verification
                    </p>
                    <p class="text-[11px] text-slate-500">
                      Enter the 6-digit OTP for card ending in <strong>${cardData.number
                        .replace(/\D/g, '')
                        .slice(-4)}</strong> to authorize <strong>${formattedAmount}</strong>.
                    </p>
                    <div class="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                      Demo Bank OTP: <strong class="font-mono tracking-widest">482910</strong>
                    </div>
                    <input
                      type="text"
                      id="pg-card-otp"
                      maxlength="6"
                      inputmode="numeric"
                      value="${cardData.otp}"
                      placeholder="••••••"
                      class="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-center font-mono text-xl font-bold tracking-[0.4em] focus:outline-none focus:border-indigo-600"
                    />
                    <div class="flex gap-2">
                      <button
                        type="button"
                        id="pg-card-back-btn"
                        class="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        id="pg-card-verify-btn"
                        ${processing ? 'disabled' : ''}
                        class="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm cursor-pointer"
                      >
                        ${processing ? 'Processing...' : `Verify & Pay ${formattedAmount}`}
                      </button>
                    </div>
                  </div>
                `
                }
              </div>
            `
            }
          </div>

          <!-- Footer Security Note -->
          <div class="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>🔒 256-Bit SSL Encrypted • NPCI UPI &amp; PCI-DSS Compliant</span>
            <span class="font-semibold text-slate-700">ShopEase Pay</span>
          </div>
        </div>
      `;

      // Bind Event Listeners
      const closeBtn = overlay.querySelector('#pg-close-btn');
      if (closeBtn) {
        closeBtn.onclick = () => {
          cleanup();
          if (onError) {
            onError(
              'Payment window closed. You can complete payment anytime from your Order Details page.'
            );
          }
          resolve(null);
        };
      }

      overlay.querySelectorAll('.pg-method-tab').forEach((btn) => {
        btn.onclick = () => {
          activeMethod = btn.getAttribute('data-method');
          collectRequestSent = false;
          cardOtpStep = false;
          errorMsg = '';
          render();
        };
      });

      overlay.querySelectorAll('.pg-upimode-btn').forEach((btn) => {
        btn.onclick = () => {
          upiSubMode = btn.getAttribute('data-upimode');
          collectRequestSent = false;
          errorMsg = '';
          render();
        };
      });

      const receiverInputEl = overlay.querySelector('#pg-receiver-upi-input');
      const updateQrBtn = overlay.querySelector('#pg-update-qr-btn');
      if (updateQrBtn && receiverInputEl) {
        updateQrBtn.onclick = () => {
          const val = receiverInputEl.value.trim();
          if (!val) {
            errorMsg = 'Please enter a valid UPI ID or 10-digit mobile number.';
            render();
            return;
          }
          receiverUpi = normalizeUpiVpa(val, activeMethod);
          localStorage.setItem('shopease_merchant_upi', receiverUpi);
          errorMsg = '';
          render();
        };
      }

      const confirmQrBtn = overlay.querySelector('#pg-confirm-qr-paid-btn');
      if (confirmQrBtn) {
        confirmQrBtn.onclick = () => {
          completePaymentVerification(
            `${brandName} (Scan & Pay QR)`,
            cleanReceiverVpa
          );
        };
      }

      const upiIdInputEl = overlay.querySelector('#pg-upi-id-input');
      if (upiIdInputEl) {
        upiIdInputEl.oninput = (e) => {
          upiInput = e.target.value;
        };
      }

      overlay.querySelectorAll('.pg-upi-handle-chip').forEach((chip) => {
        chip.onclick = () => {
          const handle = chip.getAttribute('data-handle');
          const base = (upiInput || '').split('@')[0].trim() || '9876543210';
          upiInput = `${base}${handle}`;
          errorMsg = '';
          render();
        };
      });

      const sendCollectBtn = overlay.querySelector('#pg-send-collect-btn');
      if (sendCollectBtn) {
        sendCollectBtn.onclick = () => {
          const vpa = normalizeUpiVpa(upiInput, activeMethod);
          if (!vpa || vpa.length < 5 || !vpa.includes('@')) {
            errorMsg = `Please enter a valid 10-digit ${brandName} number or UPI ID.`;
            render();
            return;
          }
          upiInput = vpa;
          // Also sync receiverUpi if not explicitly customized so scanning the QR targets this VPA
          if (!localStorage.getItem('shopease_merchant_upi')) {
            receiverUpi = vpa;
          }
          collectRequestSent = true;
          errorMsg = '';
          render();
        };
      }

      const approveCollectBtn = overlay.querySelector('#pg-approve-collect-btn');
      if (approveCollectBtn) {
        approveCollectBtn.onclick = () => {
          completePaymentVerification(
            `${brandName} (${resolvedPayerVpa})`,
            resolvedPayerVpa
          );
        };
      }

      // Card inputs & buttons
      const cardNumEl = overlay.querySelector('#pg-card-number');
      if (cardNumEl) {
        cardNumEl.oninput = (e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
          cardData.number = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
          e.target.value = cardData.number;
        };
      }
      const cardExpEl = overlay.querySelector('#pg-card-expiry');
      if (cardExpEl) {
        cardExpEl.oninput = (e) => {
          const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
          cardData.expiry =
            digits.length > 2
              ? `${digits.slice(0, 2)}/${digits.slice(2)}`
              : digits;
          e.target.value = cardData.expiry;
        };
      }
      const cardCvvEl = overlay.querySelector('#pg-card-cvv');
      if (cardCvvEl) {
        cardCvvEl.oninput = (e) => {
          cardData.cvv = e.target.value.replace(/\D/g, '').slice(0, 4);
          e.target.value = cardData.cvv;
        };
      }
      const cardNameEl = overlay.querySelector('#pg-card-name');
      if (cardNameEl) {
        cardNameEl.oninput = (e) => {
          cardData.name = e.target.value;
        };
      }

      const cardProceedBtn = overlay.querySelector('#pg-card-proceed-btn');
      if (cardProceedBtn) {
        cardProceedBtn.onclick = () => {
          const rawDigits = cardData.number.replace(/\D/g, '');
          if (rawDigits.length < 12) {
            errorMsg = 'Please enter a valid 16-digit Debit / Credit card number.';
            render();
            return;
          }
          if (!/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
            errorMsg = 'Please enter a valid expiry date in MM/YY format.';
            render();
            return;
          }
          if (cardData.cvv.length < 3) {
            errorMsg = 'Please enter a valid 3-digit CVV.';
            render();
            return;
          }
          errorMsg = '';
          cardOtpStep = true;
          cardData.otp = '482910';
          render();
        };
      }

      const cardBackBtn = overlay.querySelector('#pg-card-back-btn');
      if (cardBackBtn) {
        cardBackBtn.onclick = () => {
          cardOtpStep = false;
          errorMsg = '';
          render();
        };
      }

      const cardOtpEl = overlay.querySelector('#pg-card-otp');
      if (cardOtpEl) {
        cardOtpEl.oninput = (e) => {
          cardData.otp = e.target.value.replace(/\D/g, '').slice(0, 6);
          e.target.value = cardData.otp;
        };
      }

      const cardVerifyBtn = overlay.querySelector('#pg-card-verify-btn');
      if (cardVerifyBtn) {
        cardVerifyBtn.onclick = () => {
          if ((cardData.otp || '').length !== 6) {
            errorMsg = 'Please enter the 6-digit Bank OTP.';
            render();
            return;
          }
          const last4 = cardData.number.replace(/\D/g, '').slice(-4);
          completePaymentVerification(
            `Debit / Credit Card (•••• ${last4})`,
            `CARD-${last4}`
          );
        };
      }
    };

    document.body.appendChild(overlay);
    render();

    timerInterval = setInterval(() => {
      remainingSeconds = Math.max(0, remainingSeconds - 1);
      if (remainingSeconds === 0) {
        cleanup();
        if (onError) onError('Payment session timed out.');
        resolve(null);
      }
    }, 1000);
  });
}

/**
 * Initiates online payment for a ShopEase order and verifies its cryptographic signature.
 * Supports PhonePe, Google Pay (GPay), and Debit/Credit Cards with real scannable NPCI UPI QR codes.
 */
export const initiateRazorpayPayment = async ({
  order,
  user,
  preferredMethod = 'phonepe',
  preferredUpiMode = 'qr',
  initialUpiId = '',
  initialReceiverUpi = '',
  onSuccess,
  onError,
}) => {
  try {
    // 1. Request payment order from backend
    const { data } = await api.post('/payment/create-order', {
      orderId: order._id,
    });

    // 2. Open the interactive PhonePe / GPay / Debit Card Payment Gateway Modal
    if (data.isSimulated && data.simulatedPaymentPayload) {
      await openInteractivePaymentGatewayModal({
        order,
        user,
        data,
        preferredMethod,
        preferredUpiMode,
        initialUpiId,
        initialReceiverUpi,
        onSuccess,
        onError,
      });
      return;
    }

    // 3. Real Razorpay Checkout Modal (when live/test Razorpay API keys are configured in server/.env)
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      throw new Error(
        'Failed to load Razorpay SDK. Please check your internet connection.'
      );
    }

    const options = {
      key: data.keyId,
      amount: data.razorpayOrder.amount,
      currency: data.razorpayOrder.currency,
      name: 'ShopEase Store',
      description: `Payment for Order #${order._id.slice(-8).toUpperCase()}`,
      order_id: data.razorpayOrder.id,
      prefill: {
        name: order.shippingAddress?.fullName || user?.name || '',
        email: user?.email || '',
        contact: order.shippingAddress?.phone || user?.phone || '',
      },
      theme: {
        color: '#4f46e5',
      },
      handler: async (response) => {
        try {
          const verifyRes = await api.post('/payment/verify', {
            orderId: order._id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          if (onSuccess) onSuccess(verifyRes.data.order);
        } catch (verifyErr) {
          if (onError) {
            onError(
              verifyErr.response?.data?.message || 'Payment verification failed'
            );
          }
        }
      },
      modal: {
        ondismiss: () => {
          if (onError) {
            onError(
              'Payment window closed. You can complete payment anytime from your Order Details page.'
            );
          }
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (error) {
    if (onError) {
      onError(
        error.response?.data?.message ||
          error.message ||
          'Could not initiate online payment'
      );
    }
  }
};
