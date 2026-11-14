/**
 * Generates a print-ready HTML Tax Invoice for an Order.
 */
export const generateInvoiceHTML = (order) => {
  const invoiceNo = `INV-${order._id.toString().slice(-8).toUpperCase()}`;
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const rowsHtml = order.orderItems
    .map((item, idx) => {
      const variant = [item.variant?.size, item.variant?.color]
        .filter(Boolean)
        .join(' / ');
      const lineTotal = item.price * item.qty;
      return `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${idx + 1}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">
            <strong>${item.name}</strong>
            ${variant ? `<br/><small style="color:#64748b;">Variant: ${variant}</small>` : ''}
          </td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.qty}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;">₹${item.price.toLocaleString('en-IN')}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;"><strong>₹${lineTotal.toLocaleString('en-IN')}</strong></td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tax Invoice ${invoiceNo} - ShopEase</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 32px; background: #f8fafc; }
    .invoice-box { max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 24px; }
    .brand { font-size: 26px; font-weight: 800; color: #4f46e5; }
    .meta { text-align: right; font-size: 13px; color: #475569; }
    .addresses { display: flex; justify-content: space-between; margin-bottom: 28px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px; }
    th { background: #f1f5f9; color: #334155; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; padding: 10px; text-align: left; }
    .totals { width: 300px; margin-left: auto; font-size: 14px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
    .totals-grand { border-top: 2px solid #0f172a; font-size: 16px; font-weight: 800; padding-top: 10px; margin-top: 6px; }
    .print-bar { max-width: 800px; margin: 0 auto 16px; text-align: right; display: flex; justify-content: flex-end; gap: 10px; }
    .btn { background: #4f46e5; color: #fff; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; text-decoration: none; font-size: 13px; }
    @media print { .print-bar { display: none; } body { background: #fff; padding: 0; } .invoice-box { border: none; padding: 16px; } }
  </style>
</head>
<body>
  <div class="print-bar">
    <a class="btn" href="?format=pdf">Download PDF Receipt</a>
  </div>
  <div class="invoice-box">
    <div class="header">
      <div>
        <div class="brand">ShopEase</div>
        <div style="font-size:13px;color:#64748b;margin-top:4px;">Tax Invoice / Order Receipt</div>
      </div>
      <div class="meta">
        <div><strong>Invoice No:</strong> ${invoiceNo}</div>
        <div><strong>Order ID:</strong> #${order._id}</div>
        <div><strong>Date:</strong> ${orderDate}</div>
        <div><strong>Order Status:</strong> ${order.orderStatus}</div>
        <div><strong>Payment:</strong> ${order.paymentMethod} (${order.isPaid ? 'PAID' : 'PENDING'})</div>
      </div>
    </div>

    <div class="addresses">
      <div>
        <strong style="color:#64748b;font-size:12px;text-transform:uppercase;">Billed &amp; Shipped To:</strong><br/>
        <strong>${order.shippingAddress.fullName}</strong><br/>
        ${order.shippingAddress.street}<br/>
        ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}<br/>
        Phone: ${order.shippingAddress.phone}
      </div>
      <div style="text-align:right;">
        <strong style="color:#64748b;font-size:12px;text-transform:uppercase;">Sold By:</strong><br/>
        <strong>ShopEase Retail Pvt. Ltd.</strong><br/>
        100 Feet Road, Indiranagar<br/>
        Bengaluru, Karnataka - 560038<br/>
        India
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Item Description</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Unit Price</th>
          <th style="text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row"><span>Items Subtotal:</span><span>₹${order.itemsPrice.toLocaleString('en-IN')}</span></div>
      ${
        order.discount > 0
          ? `<div class="totals-row" style="color:#059669;"><span>Coupon Discount (${order.couponCode}):</span><span>-₹${order.discount.toLocaleString('en-IN')}</span></div>`
          : ''
      }
      <div class="totals-row"><span>Shipping Charges:</span><span>${order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}</span></div>
      <div class="totals-row"><span>GST (5%):</span><span>₹${order.taxPrice.toLocaleString('en-IN')}</span></div>
      <div class="totals-row totals-grand"><span>Grand Total:</span><span>₹${order.totalPrice.toLocaleString('en-IN')}</span></div>
    </div>

    <p style="margin-top:36px;font-size:12px;color:#94a3b8;text-align:center;">
      Thank you for shopping with ShopEase! This is a computer-generated invoice and requires no physical signature.
    </p>
  </div>
</body>
</html>`;
};

const pdfEscape = (text) =>
  String(text ?? '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const formatINR = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString('en-IN')}`;

/**
 * Generates a standalone, standards-compliant PDF 1.4 binary Buffer for an Order Receipt / Tax Invoice.
 * Uses built-in Type1 Helvetica & Helvetica-Bold fonts so zero external dependencies are required.
 */
export const generateInvoicePDF = (order) => {
  const invoiceNo = `INV-${order._id.toString().slice(-8).toUpperCase()}`;
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const ops = [];

  const drawText = (x, y, text, size = 10, bold = false, rgb = [0.06, 0.09, 0.16]) => {
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
  drawText(45, 768, 'Official Order Receipt & Tax Invoice', 10, false, [0.39, 0.45, 0.55]);

  drawText(370, 790, `Invoice No: ${invoiceNo}`, 10, true);
  drawText(370, 776, `Order ID: #${order._id.toString().slice(-12).toUpperCase()}`, 9, false, [0.28, 0.33, 0.41]);
  drawText(370, 763, `Date: ${orderDate}`, 9, false, [0.28, 0.33, 0.41]);
  drawText(370, 750, `Order Status: ${order.orderStatus || 'Placed'}`, 9, false, [0.28, 0.33, 0.41]);
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
  drawText(45, 671, (addr.street || '').slice(0, 50), 9.5, false, [0.2, 0.25, 0.33]);
  drawText(
    45,
    657,
    `${addr.city || ''}, ${addr.state || ''} - ${addr.postalCode || ''}`,
    9.5,
    false,
    [0.2, 0.25, 0.33]
  );
  drawText(45, 643, `Phone: ${addr.phone || '-'}`, 9.5, false, [0.2, 0.25, 0.33]);

  drawText(370, 700, 'SOLD BY:', 8.5, true, [0.39, 0.45, 0.55]);
  drawText(370, 685, 'ShopEase Retail Pvt. Ltd.', 10.5, true);
  drawText(370, 671, '100 Feet Road, Indiranagar', 9.5, false, [0.2, 0.25, 0.33]);
  drawText(370, 657, 'Bengaluru, Karnataka - 560038', 9.5, false, [0.2, 0.25, 0.33]);
  drawText(370, 643, 'India | support@shopease.com', 9.5, false, [0.2, 0.25, 0.33]);

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
    if (y < 160) return; // Keep within single page bounds
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
    drawText(475, y, `-${formatINR(order.discount)}`, 9.5, true, [0.02, 0.59, 0.41]);
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
  const streamByteLength = Buffer.byteLength(contentStream, 'utf8');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n',
    `6 0 obj\n<< /Length ${streamByteLength} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
};

/**
 * Generates a rich, Gmail-compatible HTML email for Order Confirmation, Payment Receipt,
 * or Order Status Updates, complete with product thumbnails, progress tracker, and bill summary.
 */
export const generateOrderEmailHTML = (order, options = {}) => {
  const shortOrderId = order._id.toString().slice(-8).toUpperCase();
  const invoiceNo = `INV-${shortOrderId}`;
  const customerName =
    options.customerName ||
    order.user?.name ||
    order.shippingAddress?.fullName ||
    'Valued Customer';
  const headline =
    options.headline || 'Thank You for Your Order!';
  const subheadline =
    options.subheadline ||
    `Hi ${customerName}, your ShopEase order #${shortOrderId} has been confirmed and is being prepared.`;

  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );

  const paymentDisplay =
    order.paymentResult?.channel || order.paymentMethod || 'COD';
  const isPaid = Boolean(order.isPaid);
  const currentStatus = order.orderStatus || 'Placed';

  const steps = ['Placed', 'Packed', 'Shipped', 'Delivered'];
  const currentStepIdx = steps.indexOf(currentStatus);

  const trackerHtml =
    currentStatus === 'Cancelled'
      ? `
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:14px 16px;margin-bottom:24px;color:#b91c1c;font-size:13px;font-weight:700;text-align:center;">
          Order Status: Cancelled ${
            order.cancelReason ? `— ${order.cancelReason}` : ''
          }
        </div>
      `
      : `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 10px;">
          <tr>
            ${steps
              .map((step, idx) => {
                const done = idx <= currentStepIdx;
                return `
                  <td width="25%" align="center" style="font-size:12px;font-weight:${
                    done ? '700' : '600'
                  };color:${done ? '#4f46e5' : '#94a3b8'};">
                    <div style="width:26px;height:26px;line-height:26px;border-radius:50%;margin:0 auto 6px;background:${
                      done ? '#4f46e5' : '#e2e8f0'
                    };color:${
                  done ? '#ffffff' : '#64748b'
                };font-size:12px;font-weight:800;">
                      ${done ? '✓' : idx + 1}
                    </div>
                    ${step}
                  </td>
                `;
              })
              .join('')}
          </tr>
        </table>
      `;

  const itemsRowsHtml = (order.orderItems || [])
    .map((item) => {
      const variantText = [item.variant?.size, item.variant?.color]
        .filter(Boolean)
        .join(' • ');
      const lineTotal = Number(item.price || 0) * Number(item.qty || 1);
      const imgUrl =
        item.image && !item.image.includes('1584990347449-a2d4c2c044c9')
          ? item.image
          : 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=200&auto=format&fit=crop&q=80';

      return `
        <tr>
          <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;" width="56">
            <img src="${imgUrl}" alt="${item.name}" width="48" height="48" style="width:48px;height:48px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;display:block;" />
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;">
            <div style="font-weight:700;color:#0f172a;">${item.name}</div>
            ${
              variantText
                ? `<div style="font-size:11px;color:#64748b;margin-top:2px;">Variant: ${variantText}</div>`
                : ''
            }
            <div style="font-size:12px;color:#64748b;margin-top:2px;">₹${Number(
              item.price || 0
            ).toLocaleString('en-IN')} &times; ${item.qty}</div>
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:13px;font-weight:700;color:#0f172a;white-space:nowrap;">
            ₹${lineTotal.toLocaleString('en-IN')}
          </td>
        </tr>
      `;
    })
    .join('');

  const addr = order.shippingAddress || {};

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ShopEase Order #${shortOrderId}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">
          <!-- Top Brand Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#4338ca);padding:28px 28px 24px;color:#ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:24px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">ShopEase</div>
                    <div style="font-size:12px;color:#e0e7ff;margin-top:2px;">Official Order Confirmation &amp; Tax Receipt</div>
                  </td>
                  <td align="right" style="font-size:12px;color:#e0e7ff;">
                    <div style="font-weight:700;color:#ffffff;">Order #${shortOrderId}</div>
                    <div>Invoice: ${invoiceNo}</div>
                    <div>${orderDate}</div>
                  </td>
                </tr>
              </table>
              <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.2);">
                <div style="font-size:20px;font-weight:800;color:#ffffff;">${headline}</div>
                <div style="font-size:13px;color:#e0e7ff;margin-top:4px;line-height:1.5;">${subheadline}</div>
              </div>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:24px 28px;">
              <!-- Order Status Progress Bar -->
              ${trackerHtml}

              <!-- Payment & Status Summary Pills -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 16px;">
                <tr>
                  <td style="font-size:12px;color:#475569;">
                    <div style="color:#64748b;font-size:11px;text-transform:uppercase;font-weight:700;">Payment Method</div>
                    <div style="font-weight:700;color:#0f172a;margin-top:2px;">${paymentDisplay}</div>
                  </td>
                  <td align="right" style="font-size:12px;">
                    <span style="display:inline-block;padding:5px 12px;border-radius:999px;font-weight:700;font-size:11px;background:${
                      isPaid ? '#dcfce7' : '#fef3c7'
                    };color:${isPaid ? '#15803d' : '#b45309'};">
                      ${isPaid ? '✓ PAID' : 'PENDING / COD'}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Ordered Items Table -->
              <div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:8px;">
                Ordered Items (${(order.orderItems || []).length})
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-top:1px solid #e2e8f0;">
                <tbody>
                  ${itemsRowsHtml}
                </tbody>
              </table>

              <!-- Bill Breakdown -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:22px;font-size:13px;">
                <tr>
                  <td style="padding:4px 0;color:#475569;">Items Subtotal</td>
                  <td align="right" style="padding:4px 0;font-weight:600;color:#0f172a;">₹${Number(
                    order.itemsPrice || 0
                  ).toLocaleString('en-IN')}</td>
                </tr>
                ${
                  order.discount > 0
                    ? `
                <tr>
                  <td style="padding:4px 0;color:#059669;">Promo Discount (${
                    order.couponCode || 'COUPON'
                  })</td>
                  <td align="right" style="padding:4px 0;font-weight:700;color:#059669;">-₹${Number(
                    order.discount
                  ).toLocaleString('en-IN')}</td>
                </tr>
                `
                    : ''
                }
                <tr>
                  <td style="padding:4px 0;color:#475569;">Shipping Charges</td>
                  <td align="right" style="padding:4px 0;font-weight:600;color:${
                    order.shippingPrice === 0 ? '#059669' : '#0f172a'
                  };">${
    order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`
  }</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#475569;">Estimated GST (5%)</td>
                  <td align="right" style="padding:4px 0;font-weight:600;color:#0f172a;">₹${Number(
                    order.taxPrice || 0
                  ).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0 2px;border-top:1px solid #cbd5e1;font-size:15px;font-weight:800;color:#0f172a;">Grand Total</td>
                  <td align="right" style="padding:10px 0 2px;border-top:1px solid #cbd5e1;font-size:16px;font-weight:800;color:#4f46e5;">₹${Number(
                    order.totalPrice || 0
                  ).toLocaleString('en-IN')}</td>
                </tr>
              </table>

              <!-- Delivery Address Box -->
              <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;font-size:12px;color:#475569;line-height:1.6;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;margin-bottom:4px;">
                  Delivery Address
                </div>
                <div style="font-weight:700;color:#0f172a;font-size:13px;">${
                  addr.fullName || customerName
                }</div>
                <div>${addr.street || ''}</div>
                <div>${addr.city || ''}, ${addr.state || ''} - ${
    addr.postalCode || ''
  }</div>
                <div>Phone: ${addr.phone || ''}</div>
              </div>

              <div style="margin-top:18px;padding:12px 14px;background:#eef2ff;border-radius:10px;font-size:12px;color:#3730a3;text-align:center;">
                📎 <strong>Official PDF Tax Invoice (${invoiceNo})</strong> is attached to this email for your records. Enjoy 7-day easy returns after delivery!
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 28px;text-align:center;font-size:11px;color:#64748b;">
              Thank you for shopping with <strong>ShopEase</strong>! Need help? Reply directly to this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
