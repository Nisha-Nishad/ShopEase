# 🛍️ ShopEase — Full-Stack MERN E-Commerce Platform

A modern, production-ready **Full-Stack E-Commerce Web Application** built with the **MERN Stack** (MongoDB, Express.js, React 19, Node.js) featuring secure JWT authentication, email OTP verification, interactive UPI/QR & Card checkout, downloadable PDF GST tax invoices, 7-day return/refund workflows, and a complete Admin Control Center.

🔗 **Live Demo:** [https://shopease-jiz6.onrender.com](https://shopease-jiz6.onrender.com)

---

## ✨ Key Features

- **🔐 Authentication & Security:** Email 6-Digit OTP Verification, Forgot/Reset Password via Gmail SMTP, `httpOnly` JWT cookies, role-based access (`Customer`, `Manager`, `Admin`), rate-limiting, and XSS/NoSQL sanitization.
- **🛒 Smart Shopping Experience:** 12 Categories & 78+ Products, live search suggestions, multi-filter catalog (category, price, rating, sort), Similar & Compare Products, Wishlist, and persistent Cart sync.
- **💳 Online Checkout & Tax Invoices:** Cash on Delivery (COD) & Online Payment Gateway (PhonePe, Google Pay, UPI ID, Scan & Pay NPCI QR Code, Debit Card) with instant **Downloadable PDF Tax Invoice** and rich HTML Order Confirmation emails.
- **🔄 Order Tracking & Returns:** Live 4-step order progress tracker, order cancellation with automatic stock restoration, and **7-Day Return / Refund Request** on delivered orders.
- **📊 Admin Control Center:** Real-time sales & revenue charts, low-stock alerts, CRUD for products/categories/coupons, order & refund management, CSV sales report export, and live **Website Visitor & Email Click Tracker**.

---

## 🛠️ Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19, Vite 6, Redux Toolkit, React Router v7, Tailwind CSS v4, Lucide Icons |
| **Backend** | Node.js, Express.js, MongoDB Atlas, Mongoose |
| **Security & Auth** | JSON Web Tokens (`httpOnly` Cookies), `bcryptjs`, Zod Validation, Helmet, Express Rate Limit |
| **Payments & Emails** | Razorpay HMAC-SHA256 / UPI QR Gateway, Nodemailer (Gmail SMTP), HTML/PDF Tax Invoices |
| **Deployment** | Render (Full-Stack Web Service), MongoDB Atlas Cloud |

---

## 📁 Project Structure

```text
ShopEase/
├── Frontend/          # React 19 + Vite + Tailwind CSS v4 + Redux Toolkit
│   ├── public/        # Favicon & SPA routing rules
│   └── src/           # Pages, Components, Redux Slices, API Services & Utils
├── Backend/           # Node.js + Express + MongoDB REST API
│   ├── config/        # Database connection
│   ├── controllers/   # Auth, Product, Order, Payment, Cart & Admin logic
│   ├── middleware/    # JWT Auth, RBAC, Error Handling & Sanitization
│   ├── models/        # User, Product, Category, Order, Coupon & Visitor schemas
│   ├── routes/        # Express API endpoints
│   └── utils/         # PDF/HTML Invoice Generator, SMTP Emailer & DB Seeder
└── package.json       # Root workspace build & start scripts
```

---

## 🚀 Quick Start (Local Setup)

```bash
# 1. Clone the repository
git clone https://github.com/Nisha-Nishad/ShopEase.git
cd ShopEase

# 2. Install dependencies
npm install

# 3. Configure environment variables in Backend/.env
# (See Backend/.env.example for required keys)

# 4. Seed sample categories, products & demo accounts
npm run seed

# 5. Run Backend & Frontend in development mode
npm run dev:backend
npm run dev:frontend
```

---

## 👩‍💻 Developed By

**Nisha Nishad** (`@snishanishad`)  
📍 Gorakhpur, Uttar Pradesh, India  
🔗 **Live Project:** [https://shopease-jiz6.onrender.com](https://shopease-jiz6.onrender.com)
