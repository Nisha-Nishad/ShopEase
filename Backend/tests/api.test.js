import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cleanObject } from '../middleware/securityMiddleware.js';
import {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
} from '../validators/authValidator.js';
import {
  productSchema,
  reviewSchema,
  orderCreateSchema,
} from '../validators/productOrderValidator.js';
import {
  generateInvoiceHTML,
  generateInvoicePDF,
  generateOrderEmailHTML,
} from '../utils/invoiceGenerator.js';

describe('ShopEase Security, Validation & Business Logic Test Suite', () => {
  it('1. Sanitizes NoSQL injection operators ($gt, $ne) and XSS <script> tags', () => {
    const maliciousPayload = {
      email: { $gt: '' },
      name: 'Nisha <script>alert("xss")</script>',
      'nested.key': 'blocked',
    };

    const cleaned = cleanObject(maliciousPayload);
    assert.deepEqual(cleaned.email, {});
    assert.equal(cleaned.name, 'Nisha ');
    assert.equal(cleaned['nested.key'], undefined);
  });

  it('2. Hashes and verifies user passwords accurately with bcrypt', async () => {
    const plain = 'ShopEaseSecret123';
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(plain, salt);

    assert.notEqual(hashed, plain);
    const isMatch = await bcrypt.compare(plain, hashed);
    const isWrong = await bcrypt.compare('WrongPass', hashed);
    assert.equal(isMatch, true);
    assert.equal(isWrong, false);
  });

  it('3. Validates registration and login payloads using Zod schemas', () => {
    const validReg = registerSchema.safeParse({
      name: 'Nisha Nishad',
      email: 'nisha@example.com',
      password: 'password123',
    });
    assert.equal(validReg.success, true);

    const invalidReg = registerSchema.safeParse({
      name: 'N',
      email: 'not-an-email',
      password: '123',
    });
    assert.equal(invalidReg.success, false);

    const validLogin = loginSchema.safeParse({
      email: 'nisha@example.com',
      password: 'password123',
    });
    assert.equal(validLogin.success, true);

    const validOtp = verifyOtpSchema.safeParse({
      email: 'nisha@example.com',
      otp: '482910',
    });
    assert.equal(validOtp.success, true);

    const invalidOtp = verifyOtpSchema.safeParse({
      email: 'nisha@example.com',
      otp: '12ab',
    });
    assert.equal(invalidOtp.success, false);

    const validResend = resendOtpSchema.safeParse({
      email: 'nisha@example.com',
    });
    assert.equal(validResend.success, true);
  });

  it('4. Validates product, review, and order creation schemas', () => {
    const validProd = productSchema.safeParse({
      name: 'Wireless Headphones',
      brand: 'Sony',
      category: '65f1a2b3c4d5e6f7a8b9c0d1',
      price: '24990',
      stock: '15',
      description: 'Premium noise cancelling wireless headphones',
    });
    assert.equal(validProd.success, true);
    assert.equal(validProd.data.price, 24990);

    const invalidReview = reviewSchema.safeParse({
      rating: 6,
      comment: 'No',
    });
    assert.equal(invalidReview.success, false);

    const validOrder = orderCreateSchema.safeParse({
      orderItems: [{ product: '65f1a2b3c4d5e6f7a8b9c0d1', qty: 2 }],
      shippingAddress: {
        fullName: 'Nisha Nishad',
        phone: '+91 9876543210',
        street: '42 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
      },
      paymentMethod: 'Razorpay',
    });
    assert.equal(validOrder.success, true);
  });

  it('5. Verifies Razorpay HMAC-SHA256 cryptographic payment signatures', () => {
    const secret = 'test_razorpay_secret';
    const orderId = 'order_test_12345';
    const paymentId = 'pay_test_67890';

    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const recomputed = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    assert.equal(validSignature, recomputed);
    assert.notEqual(validSignature, 'tampered_signature');
  });

  it('6. Generates complete Tax Invoice HTML with itemized totals', () => {
    const sampleOrder = {
      _id: '6732a9f1b2c3d4e5f6a7b8c9',
      createdAt: new Date().toISOString(),
      paymentMethod: 'Razorpay',
      isPaid: true,
      itemsPrice: 24990,
      discount: 1000,
      couponCode: 'WELCOME10',
      shippingPrice: 0,
      taxPrice: 1200,
      totalPrice: 25190,
      shippingAddress: {
        fullName: 'Nisha Nishad',
        street: '42 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
        phone: '+91 9876543210',
      },
      orderItems: [
        {
          name: 'Sony WH-1000XM5 Headphones',
          qty: 1,
          price: 24990,
          variant: { size: 'Standard', color: 'Black' },
        },
      ],
    };

    const html = generateInvoiceHTML(sampleOrder);
    assert.ok(html.includes('INV-F6A7B8C9'));
    assert.ok(html.includes('Sony WH-1000XM5 Headphones'));
    assert.ok(html.includes('WELCOME10'));

    const pdfBuf = generateInvoicePDF(sampleOrder);
    assert.ok(Buffer.isBuffer(pdfBuf));
    assert.ok(pdfBuf.toString('utf8').startsWith('%PDF-1.4'));
    assert.ok(pdfBuf.toString('utf8').includes('INV-F6A7B8C9'));

    const emailHtml = generateOrderEmailHTML(sampleOrder, {
      customerName: 'Nisha Nishad',
      headline: 'Thank You for Your Order!',
    });
    assert.ok(emailHtml.includes('INV-F6A7B8C9'));
    assert.ok(emailHtml.includes('Sony WH-1000XM5 Headphones'));
    assert.ok(emailHtml.includes('✓ PAID'));
  });
});
