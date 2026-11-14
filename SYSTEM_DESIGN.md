# 🏗️ ShopEase — Complete System Design & Architecture

**Project:** ShopEase — Full-Stack MERN E-Commerce Platform  
**Live Deployment:** [https://shopease-jiz6.onrender.com](https://shopease-jiz6.onrender.com)  
**Author:** Nisha Nishad (`@snishanishad`)

---

## 1. High-Level System Architecture (HLD)

ShopEase follows a **3-Tier Layered Client-Server Architecture** deployed as a unified Cloud Web Service on **Render** connected to a distributed **MongoDB Atlas** cluster.

```mermaid
flowchart TB
    subgraph ClientLayer["1. Client Presentation Layer (Frontend/)"]
        Browser["Web / Mobile Browser"]
        ReactApp["React 19 + Vite 6 SPA"]
        Redux["Redux Toolkit Store (auth, cart, wishlist, products)"]
        LocalStore["localStorage & sessionStorage (Guest Cart & Visitor ID)"]
    end

    subgraph SecurityLayer["2. API Gateway & Security Middleware (Backend/)"]
        HelmetMW["Helmet Security Headers & Trust Proxy"]
        RateLimit["Express Rate Limiter (API: 300/15m, Auth: 20/15m)"]
        Sanitizer["XSS & NoSQL Injection Sanitizer + Zod Validator"]
        JWTAuth["JWT Cookie Auth & Role Guard (Customer / Manager / Admin)"]
    end

    subgraph ServiceLayer["3. Core Application & Business Logic Controllers"]
        AuthCtrl["Auth & OTP Controller"]
        CatalogCtrl["Product, Search & Category Controller"]
        CartCtrl["Cart & Wishlist Merge Controller"]
        OrderCtrl["Order, Stock & 7-Day Return Controller"]
        PaymentCtrl["Payment & HMAC-SHA256 Verification Controller"]
        AdminCtrl["Admin Analytics, CSV Export & Visitor Tracker"]
    end

    subgraph ExternalServices["4. External & Utility Services"]
        SMTP["Nodemailer Gmail SMTP (OTP, Reset Link, HTML Order Emails)"]
        PaymentGW["Razorpay / NPCI UPI QR & Card Gateway"]
        PDFEngine["PDF & GST Tax Invoice Generator"]
    end

    subgraph DataLayer["5. Persistence Layer (MongoDB Atlas Cloud)"]
        MongoDB[("MongoDB Atlas Cluster (Users, Products, Categories, Orders, Carts, Wishlists, Coupons, Visitors)")]
    end

    Browser --> ReactApp
    ReactApp <--> Redux
    Redux <--> LocalStore
    ReactApp -- "HTTPS REST API (/api/* + httpOnly Cookie)" --> HelmetMW
    HelmetMW --> RateLimit --> Sanitizer --> JWTAuth
    JWTAuth --> AuthCtrl & CatalogCtrl & CartCtrl & OrderCtrl & PaymentCtrl & AdminCtrl
    AuthCtrl & OrderCtrl & PaymentCtrl --> SMTP
    OrderCtrl & PaymentCtrl --> PDFEngine
    PaymentCtrl <--> PaymentGW
    AuthCtrl & CatalogCtrl & CartCtrl & OrderCtrl & PaymentCtrl & AdminCtrl <--> MongoDB
```

---

## 2. Database Schema & Entity-Relationship (ER) Diagram

MongoDB schemas are designed using **normalized references (`ObjectId`)** for high-cardinality entities (`Users`, `Products`, `Categories`) and **embedded subdocuments** for immutable snapshots (`orderItems`, `shippingAddress`, `reviews`, `returnRequest`).

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER ||--o| CART : owns
    USER ||--o| WISHLIST : saves
    USER ||--o{ VISITOR : linked_to
    CATEGORY ||--o{ PRODUCT : categorizes
    PRODUCT ||--o{ ORDER_ITEM : snapshot_in
    COUPON ||--o{ ORDER : discounts

    USER {
        ObjectId _id PK
        string name
        string email UK
        string password "bcrypt hashed"
        string role "customer | manager | admin"
        boolean isVerified
        boolean isBlocked
        string emailVerificationOTP "SHA-256 hashed"
        array addresses "Embedded shipping addresses"
    }

    CATEGORY {
        ObjectId _id PK
        string name UK
        string slug UK
        string description
        string image
    }

    PRODUCT {
        ObjectId _id PK
        string name
        string description
        number price
        number discountPrice
        ObjectId category FK
        string brand
        number stock
        array images
        array specifications
        array reviews "Embedded verified buyer reviews"
        number ratings
        number numReviews
    }

    ORDER {
        ObjectId _id PK
        ObjectId user FK
        array orderItems "Embedded product snapshots"
        object shippingAddress
        string paymentMethod "COD | Online"
        object paymentResult "Gateway ID, Signature, Status"
        number itemsPrice
        number taxPrice "18% GST"
        number shippingPrice
        number discountAmount
        number totalPrice
        boolean isPaid
        string orderStatus "Processing | Confirmed | Shipped | Delivered | Cancelled"
        object returnRequest "status, reason, bank/UPI refund status"
        string invoiceNumber UK
    }

    COUPON {
        ObjectId _id PK
        string code UK
        string discountType "percentage | flat"
        number discountValue
        number minOrderAmount
        date expiryDate
        boolean isActive
    }

    VISITOR {
        ObjectId _id PK
        string visitorId UK
        ObjectId user FK
        string email
        string name
        number visitCount
        string deviceType "Mobile | Desktop | Tablet"
        string lastPath
        date lastVisitedAt
    }
```

---

## 3. Core Workflow Sequence Diagrams

### 3.1 Registration with 6-Digit Email OTP & JWT Cookie Authentication

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer
    participant UI as React Frontend (/register)
    participant API as Express Auth Controller
    participant DB as MongoDB Atlas
    participant Mail as Gmail SMTP Server

    User->>UI: Enters Name, Email, Phone & Password
    UI->>API: POST /api/auth/register
    API->>DB: Create/Update User (isVerified: false, SHA-256 OTP hash)
    API->>Mail: Send 6-Digit Verification OTP Email
    Mail-->>User: Receives OTP in Gmail Inbox
    API-->>UI: 200 OK (requiresOtp: true)
    User->>UI: Enters 6-Digit OTP
    UI->>API: POST /api/auth/verify-otp { email, otp }
    API->>DB: Verify OTP Hash & Expiry -> Set isVerified: true
    API-->>UI: 200 OK + Set httpOnly JWT Cookie
    UI->>API: POST /api/cart/sync (Merge guest localStorage cart into MongoDB)
```

---

### 3.2 Checkout, Online Payment (UPI / QR / Card) & Rich HTML + PDF Invoice Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer
    participant UI as Checkout & Payment Modal
    participant OrderAPI as Order Controller
    participant PayAPI as Payment Controller
    participant DB as MongoDB Atlas
    participant Mail as Gmail SMTP + PDF Engine

    User->>UI: Selects Shipping Address, Coupon & Payment Method (Online / COD)
    UI->>OrderAPI: POST /api/orders
    OrderAPI->>DB: Verify Stock -> Deduct Product Stock -> Create Order (INV-XXXXXXXX)
    OrderAPI-->>UI: 201 Created (Order ID)

    alt Online Payment (PhonePe / GPay / UPI QR / Debit Card)
        UI->>PayAPI: POST /api/payment/create-order { orderId }
        PayAPI-->>UI: Payment Order Session + NPCI UPI QR Payload
        User->>UI: Completes UPI / QR / Card Payment
        UI->>PayAPI: POST /api/payment/verify { razorpay_order_id, razorpay_payment_id, razorpay_signature }
        PayAPI->>PayAPI: Verify HMAC-SHA256 Signature
        PayAPI->>DB: Mark Order isPaid: true, orderStatus: "Confirmed"
        PayAPI->>Mail: Generate HTML Email + Attach Tax Invoice PDF
        Mail-->>User: Delivers Order Confirmation Email + PDF Receipt
        PayAPI-->>UI: 200 OK (Payment Verified)
    else Cash on Delivery (COD)
        OrderAPI->>Mail: Generate HTML Email + Attach Tax Invoice PDF
        Mail-->>User: Delivers COD Order Confirmation Email + PDF Receipt
    end
```

---

## 4. Order & 7-Day Return/Refund State Machine

```mermaid
stateDiagram-v2
    [*] --> Processing: Order Created (Stock Deducted)
    Processing --> Confirmed: Online Payment Verified / Admin Confirms
    Processing --> Cancelled: Customer or Admin Cancels (Stock Restored)
    Confirmed --> Shipped: Admin Dispatches Order
    Confirmed --> Cancelled: Customer or Admin Cancels (Stock Restored)
    Shipped --> Delivered: Order Delivered (`deliveredAt` Recorded)
    Delivered --> ReturnRequested: Customer Requests Return within 7 Days
    ReturnRequested --> ReturnApproved: Admin Approves Return (Stock Restored)
    ReturnRequested --> ReturnRejected: Admin Rejects Return
    ReturnApproved --> Refunded: Admin Marks Refund Completed
```

---

## 5. Key Architectural & Engineering Decisions (Interview Highlights)

| Area | Design Choice | Why It Matters |
| :--- | :--- | :--- |
| **Authentication** | `httpOnly`, `Secure`, `SameSite` JWT Cookies | Prevents JavaScript XSS token theft compared to storing raw JWTs in `localStorage`. |
| **Hybrid Cart Architecture** | Guest `localStorage` + Authenticated MongoDB Merge (`/api/cart/sync`) | Allows unauthenticated visitors to shop without friction and merges their cart automatically upon login. |
| **Inventory Consistency** | Atomic Stock Validation & Automatic Stock Restoration | Deducts stock at order creation and automatically restores stock if an order is cancelled or a return is approved. |
| **Verified Buyer Reviews** | Order-History Verification (`orderStatus !== 'Cancelled'`) | Only customers who actually purchased the product can submit a rating/review, preventing fake reviews. |
| **Security Defense-in-Depth** | Zod Schema Validation + Custom NoSQL/XSS Sanitizer + Rate Limiting | Blocks malformed payloads, `$gt`/`$ne` MongoDB operator injection, `<script>` injection, and brute-force attacks. |
| **Performance Optimization** | React `lazy()` + `Suspense` Code Splitting & MongoDB Compound Indexes | Splits route bundles (Admin, Checkout, ProductDetail) for fast initial load and fast catalog filtering. |
