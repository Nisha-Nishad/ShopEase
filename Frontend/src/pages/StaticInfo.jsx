import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PAGES_CONTENT = {
  about: {
    title: 'About ShopEase',
    subtitle: 'India’s modern destination for authentic electronics, fashion, and lifestyle essentials.',
    sections: [
      {
        heading: 'Our Story',
        body: 'ShopEase was built to bridge the gap between premium quality products and effortless online shopping. Every item in our catalog is sourced directly from verified brands and authorized partners.',
      },
      {
        heading: 'Why Shop With Us?',
        body: 'We offer free express shipping on orders above ₹499, 100% encrypted payments powered by Razorpay, verified buyer reviews, and a hassle-free 7-day replacement guarantee.',
      },
    ],
  },
  contact: {
    title: 'Contact & Customer Support',
    subtitle: 'Have a question about an order or product? Our support team is here 7 days a week.',
    sections: [
      {
        heading: 'Customer Care Email & Phone',
        body: 'Email: support@shopease.com | Phone: +91 80-4567-8900 (Mon–Sun, 9:00 AM – 9:00 PM IST)',
      },
      {
        heading: 'Registered Office',
        body: 'ShopEase Retail Pvt. Ltd., 100 Feet Road, Indiranagar, Bengaluru, Karnataka - 560038, India.',
      },
    ],
  },
  faq: {
    title: 'Frequently Asked Questions (FAQ)',
    subtitle: 'Quick answers to common questions about shipping, payments, and returns.',
    sections: [
      {
        heading: 'How long does delivery take?',
        body: 'Orders are packed within 24 hours and delivered within 2–5 business days across India.',
      },
      {
        heading: 'Can I pay using Cash on Delivery (COD)?',
        body: 'Yes! Both Cash on Delivery (COD) and online payments (UPI, Cards, NetBanking via Razorpay) are supported.',
      },
      {
        heading: 'How do I apply a discount coupon?',
        body: 'On the Checkout page, enter promo codes like WELCOME10 or FLAT500 in the Promo Code box and click Apply.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'How we protect and handle your personal data at ShopEase.',
    sections: [
      {
        heading: 'Data Security',
        body: 'Passwords are encrypted with bcrypt salt hashing, authentication tokens are stored in httpOnly cookies, and payment details are processed directly by PCI-DSS compliant Razorpay servers.',
      },
      {
        heading: 'Information Usage',
        body: 'Your name, email, phone number, and shipping address are used strictly for order fulfillment and transactional notifications.',
      },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    subtitle: 'Terms of service governing the use of the ShopEase platform.',
    sections: [
      {
        heading: 'Pricing & Availability',
        body: 'All product prices are listed in Indian Rupees (INR). Stock is updated atomically at the time of checkout.',
      },
      {
        heading: 'Account Responsibility',
        body: 'Users are responsible for maintaining the confidentiality of their account credentials.',
      },
    ],
  },
  returns: {
    title: 'Return & Refund Policy',
    subtitle: 'Simple, transparent 7-day return and replacement policy.',
    sections: [
      {
        heading: '7-Day Easy Returns',
        body: 'Unused items in original packaging with tags intact can be returned or replaced within 7 days of delivery.',
      },
      {
        heading: 'Order Cancellations & Refunds',
        body: 'Orders in Placed or Packed status can be cancelled directly from your Order Details page with immediate stock restoration.',
      },
    ],
  },
};

const StaticInfo = () => {
  const { pageSlug } = useParams();
  const content = PAGES_CONTENT[pageSlug] || PAGES_CONTENT.about;

  return (
    <div className="py-10 max-w-3xl mx-auto space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Home</span>
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
            {content.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{content.subtitle}</p>
        </div>

        <div className="space-y-5">
          {content.sections.map((sec, idx) => (
            <div key={idx} className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900">
                {sec.heading}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {sec.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaticInfo;
