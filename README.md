# ShopEase — Full-Stack MERN E-Commerce Platform (Step-by-Step Learning Guide)

Welcome to **ShopEase**! This `README.md` serves both as your **Upwork/GitHub Project Documentation** and a **Step-by-Step Learning Notebook** where every single phase, file, and concept is explained in detail.

---

## 1. Project Overview & Tech Stack

| Layer | Technology | Why We Use It |
| :--- | :--- | :--- |
| **Frontend** | React.js (Vite) + React Router | Fast HMR bundling + client-side routing |
| **Styling** | Tailwind CSS + Lucide Icons | Utility-first responsive CSS + modern icons |
| **State Management** | Redux Toolkit (`@reduxjs/toolkit`) | Global state for Auth, Cart, and Products |
| **Backend** | Node.js + Express.js | Fast, scalable REST API architecture |
| **Database** | MongoDB + Mongoose | Schema-based NoSQL document storage |
| **Authentication** | JWT (in `httpOnly` cookies) + `bcryptjs` | Protects tokens from XSS & hashes passwords |
| **Security & Validation** | `helmet`, `cors`, `express-rate-limit`, `zod` | Secures HTTP headers, prevents brute-force, validates inputs |
| **Payments & Media** | Razorpay + Cloudinary | Online payments (UPI/Cards) + cloud image uploads |

---

## 2. Complete Project Folder Structure

```text
ShopEase/
├── client/                      # React Frontend (Vite)
│   ├── public/                  # Static files
│   ├── src/
│   │   ├── assets/              # Images, logos, static illustrations
│   │   ├── components/          # Reusable UI components (Navbar, Footer, ProductCard...)
│   │   ├── pages/               # Customer pages (Home, Products, Cart, Checkout...)
│   │   ├── pages/admin/         # Admin dashboard pages (Dashboard, ManageProducts...)
│   │   ├── redux/               # Redux Toolkit store & slices (auth, cart, product)
│   │   ├── services/            # Axios instance & API call services
│   │   ├── hooks/               # Custom React hooks
│   │   ├── utils/               # Helper functions (currency formatter, date formatter)
│   │   ├── routes/              # ProtectedRoute & AdminRoute wrappers
│   │   ├── App.jsx              # Main application layout & route definitions
│   │   ├── main.jsx             # React DOM entry point + Redux Provider
│   │   └── index.css            # Tailwind CSS entry file
│   ├── index.html               # HTML template
│   ├── vite.config.js           # Vite bundler + /api proxy configuration
│   └── package.json             # Frontend dependencies & scripts
│
├── server/                      # Node.js + Express Backend
│   ├── config/                  # Database (db.js), Cloudinary, and Razorpay setup
│   ├── controllers/             # Business logic for each route (auth, products, orders...)
│   ├── models/                  # Mongoose schemas (User, Product, Category, Order...)
│   ├── routes/                  # Express API route definitions
│   ├── middleware/              # Auth check, Admin RBAC check, Error handler, Multer upload
│   ├── utils/                   # Token generator, Email sender, PDF invoice generator
│   ├── validators/              # Zod request validation schemas
│   ├── tests/                   # Automated API tests
│   ├── .env                     # Private environment variables (ignored by Git)
│   ├── .env.example             # Template showing required environment variables
│   ├── server.js                # Express app entry point
│   └── package.json             # Backend dependencies & scripts
│
├── docs/                        # API documentation, ER diagrams, screenshots
├── .gitignore                   # Tells Git which files/folders NOT to upload to GitHub
└── README.md                    # Complete project documentation & step-by-step learning guide
```

---

## 3. Step-by-Step Learning Log

### Phase 1: Project Setup (Git, Folder Structure, Express Server & React Frontend)

#### Step 1.1: Initialize Git & `.gitignore`
- **What we did:** Ran `git init` and created `.gitignore`.
- **Why (Learning Note):**
  - `node_modules/` contains thousands of downloaded package files and should never be uploaded to GitHub (anyone can recreate it using `npm install`).
  - `.env` holds secret keys (database password, JWT secret, Razorpay secret). Pushing `.env` to GitHub is a major security risk! Instead, we commit `.env.example` with placeholder values so other developers know which variables are needed.

#### Step 1.2: Backend Setup (`server/`)
1. **`server/package.json`**:
   - Configured `"type": "module"` so we can use modern ES6 `import / export` syntax instead of older `require()` syntax in Node.js.
   - Added scripts:
     - `"dev": "node --watch server.js"` — Uses Node's built-in file watcher to automatically restart the server whenever you save a file.
     - `"start": "node server.js"` — Used in production deployment (Render/Railway).
2. **`server/config/db.js`**:
   - Uses `mongoose.connect(process.env.MONGO_URI)` inside an `async/await` `try...catch` block.
   - If the database connection fails, `process.exit(1)` stops the server immediately so we know right away that the DB URI or network is misconfigured.
3. **`server/middleware/errorMiddleware.js`**:
   - **`notFound` middleware**: Catches any request to a URL that doesn't exist (e.g., `/api/unknown`) and forwards a `404` error.
   - **`errorHandler` middleware**: Catches all errors thrown anywhere in the backend and formats them into a clean JSON response: `{ success: false, message: "..." }`. It also automatically translates Mongoose errors (`CastError` for invalid IDs, `11000` for duplicate emails, `ValidationError` for missing required fields) into friendly messages.
4. **`server/server.js`**:
   - **`helmet()`**: Automatically sets secure HTTP headers to protect against common web vulnerabilities.
   - **`cors({ origin: process.env.CLIENT_URL, credentials: true })`**: Allows our React frontend (`http://localhost:5173`) to talk to our Express backend (`http://localhost:5000`) and pass `httpOnly` authentication cookies back and forth.
   - **`express-rate-limit`**: Limits each IP to 200 requests per 15 minutes on `/api` routes so bots cannot overload the server.
   - **`express.json()` & `cookieParser()`**: Parses incoming JSON request bodies (`req.body`) and browser cookies (`req.cookies`).
   - **`GET /api/health`**: A test route to verify the server is alive and responding.

#### Step 1.3: Frontend Setup (`client/`)
1. **`client/vite.config.js`**:
   - Configured `@vitejs/plugin-react` and `@tailwindcss/vite`.
   - Added a development proxy: any frontend request to `/api/...` is automatically forwarded to `http://localhost:5000/api/...`.
2. **`client/src/services/api.js`**:
   - Created a single reusable `axios` instance with `withCredentials: true`.
   - **Why:** Instead of repeating `http://localhost:5000/api` and cookie settings in every file, we import `api` everywhere.
3. **`client/src/redux/store.js` & `client/src/main.jsx`**:
   - Created the central Redux Toolkit store and wrapped `<App />` inside `<Provider store={store}>` so every React component can access global state.
4. **`client/src/App.jsx`, `Navbar.jsx`, `Footer.jsx`, `Home.jsx`**:
   - Set up `react-router-dom` with a responsive Navbar, Footer, and Hero landing page styled with Tailwind CSS.

---

### Phase 2: Authentication (User Model, JWT `httpOnly` Cookies, Auth Middleware & UI)

#### Step 2.1: Mongoose User Model (`server/models/User.js`)
- **What we did:** Created the `User` schema with `name`, `email`, `password` (`select: false`), `role` (`customer`, `manager`, `admin`), `phone`, `addresses[]` sub-schema, `isVerified`, `isBlocked`, `resetPasswordToken`, and `resetPasswordExpire`.
- **Why (Learning Note):**
  - **`select: false` on password:** Ensures that whenever we run `User.findById()` or `User.find()`, Mongoose never sends the hashed password back in API responses unless we explicitly ask for `.select('+password')` during login.
  - **Pre-save hook (`userSchema.pre('save')`):** Automatically runs before saving a user document. If the password was created or changed (`this.isModified('password')`), it generates a cryptographic salt (`bcrypt.genSalt(10)`) and hashes the password. Even if someone steals your database, they cannot read plain-text passwords!
  - **`matchPassword` method:** Uses `bcrypt.compare(enteredPassword, this.password)` to verify a user's login password against the stored hash.
  - **`getResetPasswordToken` method:** Uses Node's built-in `crypto.randomBytes(20)` to generate a one-time token, hashes it with `SHA-256` before storing in MongoDB (`resetPasswordToken`), and sets a 15-minute expiry (`resetPasswordExpire`). We send the unhashed token to the user's email—so even a read-only database leak cannot be used to hijack password resets.

#### Step 2.2: JWT Token & `httpOnly` Cookie Helper (`server/utils/generateToken.js`)
- **What we did:** Created `sendTokenResponse(user, statusCode, res, message)` which signs a JWT (`jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET)`) and attaches it to `res.cookie('token', token, cookieOptions)`.
- **Why (Learning Note — Interview Favorite!):**
  - Many beginners store JWT tokens in `localStorage`. However, any malicious JavaScript (XSS attack) on the page can read `localStorage.getItem('token')` and steal the user's session.
  - By storing the JWT in an **`httpOnly: true` cookie**, JavaScript (`document.cookie`) is completely blocked from reading it! The browser automatically attaches the cookie on every request to our backend (`withCredentials: true`).

#### Step 2.3: Email Utility with Dev Fallback (`server/utils/sendEmail.js`)
- **What we did:** Built a Nodemailer email sender that sends real emails when `SMTP_HOST` and `SMTP_USER` are configured in `.env`, and automatically prints a `[DEV EMAIL PREVIEW]` box in your terminal (and returns `devResetUrl` in development mode) when SMTP isn't configured yet.
- **Why:** Allows you to test the entire Forgot/Reset Password flow on `localhost` right away without getting blocked by SMTP setup.

#### Step 2.4: Input Validation with Zod (`server/validators/authValidator.js`)
- **What we did:** Created `registerSchema`, `loginSchema`, `forgotPasswordSchema`, and `resetPasswordSchema` along with a reusable `validate(schema)` middleware.
- **Why:** Never trust frontend validation alone—anyone can send invalid or malicious requests directly via Postman or `curl`. Zod validates and trims `req.body` before the request ever reaches our controller.

#### Step 2.5: Auth & RBAC Middleware (`server/middleware/authMiddleware.js`)
- **What we did:**
  - **`protect` middleware:** Reads the JWT from `req.cookies.token` (or `Authorization: Bearer <token>`), verifies the signature with `jwt.verify()`, loads the user from MongoDB, checks if the user is blocked (`user.isBlocked`), and attaches `req.user = currentUser`.
  - **`authorize(...roles)` middleware:** Checks if `req.user.role` is included in the allowed roles (e.g. `authorize('admin', 'manager')`). If a regular `customer` tries to call an admin API, it returns `403 Forbidden`.

#### Step 2.6: Auth Controllers & Routes (`server/controllers/authController.js` & `server/routes/authRoutes.js`)
- **Endpoints implemented:**
  - `POST /api/auth/register` — Creates user account & logs them in with an `httpOnly` cookie.
  - `POST /api/auth/login` — Verifies email + password & sets `httpOnly` cookie.
  - `POST /api/auth/logout` — Clears the `token` cookie by expiring it immediately (`new Date(0)`).
  - `GET /api/auth/me` — Protected route that returns the currently logged-in user's profile.
  - `POST /api/auth/forgot-password` — Generates a 15-minute reset token and sends the reset link.
  - `PUT /api/auth/reset-password/:token` — Verifies the token hash & expiry and sets the new password.
  - `PUT /api/auth/profile` — Updates user name, phone, and saved shipping addresses (`addresses[]`).
  - `PUT /api/auth/password` — Verifies current password and updates to a new password.

#### Step 2.7: Frontend Redux Auth State & Pages (`client/src/`)
1. **`client/src/redux/slices/authSlice.js`**:
   - Uses `createAsyncThunk` for async API calls (`fetchCurrentUser`, `register`, `login`, `logout`, `updateUserProfile`).
   - Tracks `user`, `isAuthenticated`, `loading`, `initializing` (while checking `/api/auth/me` on page refresh), and `error`.
2. **`client/src/routes/ProtectedRoute.jsx` & `AdminRoute.jsx`**:
   - Waits for `initializing` to finish so refreshing a protected page doesn't prematurely redirect you to `/login`.
   - Redirects unauthenticated users to `/login` and saves the page they tried to visit (`state={{ from: location }}`).
3. **Auth Pages (`Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `Profile.jsx`)**:
   - Complete responsive forms with error alerts, loading states, saved address management, and password change.

---

### Phase 3: Products & Categories (Models, Search/Filter/Pagination APIs, Cloudinary Upload & UI)

#### Step 3.1: Category & Product Models (`server/models/Category.js` & `Product.js`)
- **What we did:** Created `Category` (`name`, `slug`, `image`, `description`, `parentCategory`) and `Product` (`name`, `slug`, `description`, `price`, `discountPrice`, `category`, `brand`, `images[]`, `variants[]`, `stock`, `ratings`, `numReviews`, `isFeatured`).
- **Why (Learning Note):**
  - **SEO-Friendly Slugs (`pre('validate')` hook):** Instead of ugly URLs like `/products/6732a9f...`, our pre-validate hook automatically turns `"Sony WH-1000XM5 Headphones"` into a readable URL slug like `/products/sony-wh-1000xm5-headphones-8a1b2`. Our backend `getProductById` accepts **either** an ObjectId or a slug!
  - **Sub-documents (`variants[]`):** Real e-commerce products come in multiple sizes and colors (`{ size: 'UK 8', color: 'Crimson Red', stock: 12 }`), each with its own stock count.
  - **Compound Text Index (`productSchema.index`):** We indexed `name`, `brand`, and `description` with weights (`name: 5, brand: 3, description: 1`) and also added indexes on `category`, `brand`, and `isFeatured` so database queries stay fast even with thousands of products.

#### Step 3.2: Secure Image Upload (`server/config/cloudinary.js` & `middleware/uploadMiddleware.js`)
- **What we did:** Configured `multer.memoryStorage()` with a `fileFilter` allowing only `jpeg`, `jpg`, `png`, and `webp` images and a `5MB` maximum file size limit, paired with `uploadBufferToCloudinary()`.
- **Why (Learning Note — Security Checklist #8):**
  - Never allow unrestricted file uploads! Without `fileFilter` and `limits.fileSize`, an attacker could upload a `.exe` / `.js` script or a 2GB file to crash your server.
  - Using `memoryStorage()` keeps uploaded files in RAM buffers and streams them directly to Cloudinary without leaving temporary junk files on your server's disk.

#### Step 3.3: Advanced Search, Filter, Sort & Pagination (`server/controllers/productController.js`)
- **What we did:** Built `GET /api/products` supporting:
  - Keyword search (`?search=sony`) using case-insensitive RegExp across `name`, `brand`, and `description`.
  - Category filter (`?category=electronics`) supporting both Category ObjectId and Category slug.
  - Brand filter (`?brand=Sony`), Price range (`?minPrice=1000&maxPrice=20000`), Minimum rating (`?minRating=4`), and Featured flag (`?featured=true`).
  - Sorting (`?sort=newest | price_asc | price_desc | rating`).
  - Pagination (`?page=1&limit=8`) using `.skip((page - 1) * limit).limit(limit)`.
- **Why (`Promise.all` optimization):**
  - Instead of awaiting `countDocuments()`, `find()`, and `distinct('brand')` one after another (sequentially), we run all 3 queries in parallel using `await Promise.all([...])`, cutting API response time in half!

#### Step 3.4: Database Seeder (`server/utils/seeder.js`)
- **What we did:** Created a sample database seeder and linked it to `npm run seed`.
- **Why:** Populates your MongoDB database with 5 Categories, 8 realistic Products (with images, variants, and discounts), a Demo Admin (`admin@shopease.com` / `password123`), and a Demo Customer (`customer@shopease.com` / `password123`) so you can test and demo the app on Upwork immediately.

#### Step 3.5: Frontend Catalog, URL Filters & Live Search (`client/src/`)
1. **Debounced Live Search (`client/src/components/Navbar.jsx`)**:
   - Waits `250ms` after the user stops typing (`setTimeout` + cleanup in `useEffect`) before calling `GET /api/products/suggestions?q=...`. This prevents spamming the backend on every single keystroke!
2. **URL-Driven Filters (`client/src/pages/Products.jsx`)**:
   - Uses React Router's `useSearchParams()` to store active filters in the URL (e.g., `/products?category=footwear&brand=Nike&sort=price_asc`).
   - **Why:** If a customer refreshes the page or shares the link with a friend, all their selected filters, sort order, and page number are preserved!
3. **Interactive Product Detail Page (`client/src/pages/ProductDetail.jsx`)**:
   - Features an image thumbnail switcher, dynamic stock badge per selected variant (`size`/`color`), discount percentage calculator (`formatPrice.js`), quantity selector, and a Related Products section.

---

### Phase 4: Cart & Wishlist (Server-Side Pricing, Guest Cart `localStorage` Merge & UI)

#### Step 4.1: Cart & Wishlist Models (`server/models/Cart.js` & `Wishlist.js`)
- **What we did:**
  - `Cart`: One-to-one document per user (`user: { unique: true }`), storing an `items[]` array (`product`, `quantity`, `variant: { size, color }`) and `totalPrice`.
  - `Wishlist`: Stores a `products[]` array of `Product` ObjectIds for each user.
- **Why (Learning Note):**
  - Why store `variant: { size, color }` on each cart item? Because if a customer buys a Nike shoe in `UK 7` and another in `UK 9`, those are two separate line items in the cart, whereas adding `UK 7` twice should increment the quantity of that single line item to `2`.

#### Step 4.2: Server-Side Price Calculation (`server/controllers/cartController.js`)
- **What we did:** Created the helper `populateAndCalculateCart(cart)` which populates `items.product` from MongoDB and recalculates `cart.totalPrice` on the server using the database's `discountPrice || price`.
- **Why (Learning Note — Security Checklist #4!):**
  - **Never trust prices sent from the frontend!** A malicious user could open Chrome DevTools and send `{ productId: "...", price: 1 }` in a POST request. By only accepting `productId`, `quantity`, and `variant` from the client and looking up the real price from the `Product` collection on the server, price tampering is 100% impossible.

#### Step 4.3: Guest Cart (`localStorage`) + Automatic Login Merge (`POST /api/cart/merge` & `cartSlice.js`)
- **What we did:**
  - When a visitor is **not logged in (Guest)**, `addItemToCart`, `updateItemQuantity`, and `removeItemFromCart` in `client/src/redux/slices/cartSlice.js` read and write to `localStorage` (`shopease_guest_cart`).
  - The moment the user **logs in or registers**, `App.jsx` triggers `dispatch(syncAndMergeCart())`.
  - If `shopease_guest_cart` has items, `syncAndMergeCart` sends them to `POST /api/cart/merge`, which merges them into the user's MongoDB cart (capping quantities at available stock), clears `localStorage`, and returns the unified cart!
- **Why (Upwork Client Favorite):**
  - Real shoppers browse and add items to their cart *before* signing in. If logging in wiped out the items they just picked, they would abandon the store!

#### Step 4.4: Single-Endpoint Wishlist Toggle (`server/controllers/wishlistController.js` & `wishlistSlice.js`)
- **What we did:** Built `POST /api/wishlist/toggle` which checks if `productId` is already in `wishlist.products`—removing it if present, or pushing it if absent. Also supported Guest wishlist in `localStorage` (`shopease_guest_wishlist`).
- **Why:** Makes the heart button on `ProductCard.jsx` and `ProductDetail.jsx` effortless to wire up with a single `dispatch(toggleWishlist(product))`.

#### Step 4.5: Cart & Wishlist Pages (`client/src/pages/Cart.jsx` & `Wishlist.jsx`)
- **What we did:**
  - Added live badge counters on the Navbar for both **Wishlist** and **Cart** (`totalCartQty`).
  - Built `Cart.jsx` with item quantity `+ / -` steppers, variant labels, item removal, free shipping threshold logic (`FREE` delivery on orders `≥ ₹499`, otherwise `₹49`), and a login-aware **Proceed to Checkout** button (`navigate('/login', { state: { from: { pathname: '/checkout' } } })`).
  - Built `Wishlist.jsx` displaying all saved products with instant **Add to Cart** and **Remove** actions.

---

### Phase 5: Checkout, Coupons & Orders (Atomic Stock Updates, Order Snapshots & Tracking UI)

#### Step 5.1: Order & Coupon Mongoose Models (`server/models/Order.js` & `Coupon.js`)
- **What we did:**
  - Created `Coupon` with `code` (`WELCOME10`, `FLAT500`), `discountType` (`percent` or `flat`), `value`, `minOrderValue`, `maxDiscount`, `expiryDate`, `usageLimit`, and `usedCount`.
  - Created `Order` with `user`, `orderItems[]`, `shippingAddress`, `paymentMethod`, `itemsPrice`, `shippingPrice`, `taxPrice`, `discount`, `couponCode`, `totalPrice`, and `orderStatus` (`Placed`, `Packed`, `Shipped`, `Delivered`, `Cancelled`).
- **Why we snapshot `name`, `price`, and `image` inside `orderItems[]` (Learning Note — Interview Favorite!):**
  - Suppose a customer buys a headphone today for `₹24,990`, and next week the Admin changes that product's price to `₹29,990`. If `Order` only stored a reference to `Product`, the customer's past invoice would suddenly change to `₹29,990`!
  - By storing a **snapshot** (`name`, `price`, `qty`, `image`, `variant`) inside `orderItems[]` at the exact moment of purchase, historical orders and invoices remain 100% accurate forever.

#### Step 5.2: Atomic Stock Deduction & Rollback (`server/controllers/orderController.js`)
- **What we did:** When creating an order (`POST /api/orders`), we loop through each item and execute:
  ```js
  const updatedProduct = await Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: qty } },
    { $inc: { stock: -qty } },
    { new: true }
  );
  ```
- **Why (Learning Note — Security Checklist #5: Prevent Overselling!):**
  - If only `1` MacBook is left in stock and two customers click "Place Order" at the exact same millisecond, a naive `findById()` followed by `product.stock -= 1; product.save()` suffers from a **race condition** and sells 2 MacBooks!
  - `findOneAndUpdate` with `{ stock: { $gte: qty } }` and `{ $inc: { stock: -qty } }` is **atomic** in MongoDB: the database locks the document, checks `stock >= qty`, and decrements in one indivisible operation. The second customer immediately receives a clean `400 Insufficient stock` error, and any previously deducted items in that order are rolled back in our `catch` block!

#### Step 5.3: Server-Side Coupon Engine (`server/controllers/couponController.js`)
- **What we did:** Created `verifyAndCalculateCoupon(code, itemsPrice)` which checks:
  1. Is the coupon active and matching?
  2. Has `expiryDate` passed?
  3. Has `usedCount` reached `usageLimit`?
  4. Is `itemsPrice >= minOrderValue`?
  5. Computes percentage discount (capped by `maxDiscount` if set) or flat discount.
- **Why:** Both `POST /api/coupons/apply` (previewing discount on the Checkout page) and `POST /api/orders` (finalizing the order) call this exact same server helper.

#### Step 5.4: Order Cancellation & Stock Restoration (`PUT /api/orders/:id/cancel`)
- **What we did:** Allows a customer to cancel an order while its status is `Placed` or `Packed` (before it is `Shipped` or `Delivered`), and atomically restores every item's quantity back to the `Product` stock (`$inc: { stock: item.qty }`).

#### Step 5.5: Frontend Checkout & Order Tracking UI (`client/src/pages/`)
1. **`Checkout.jsx`**:
   - One-click selector for saved addresses from the user's profile + form to enter a new shipping address (with a checkbox to save it to the profile).
   - Promo Code box (`WELCOME10` for 10% off or `FLAT500` for ₹500 off) with live discount breakdown.
   - Payment method selector (`Cash on Delivery` or `Online Payment via Razorpay`).
2. **`Orders.jsx` & `OrderDetail.jsx`**:
   - Displays all past orders with color-coded status badges.
   - `OrderDetail.jsx` renders a 4-step visual progress tracker (`Placed` → `Packed` → `Shipped` → `Delivered`), itemized bill summary, delivery address card, and a **Cancel Order** button.

---

### Phase 6: Payments (Razorpay SDK, HMAC-SHA256 Signature Verification & Webhooks)

#### Step 6.1: Creating a Razorpay Payment Order (`server/config/razorpay.js` & `paymentController.js`)
- **What we did:** Created `POST /api/payment/create-order` which reads the ShopEase `Order` from MongoDB, converts `order.totalPrice` into **paise** (`Math.round(order.totalPrice * 100)`), and creates a Razorpay order via `razorpay.orders.create()`.
- **Why amounts are multiplied by 100 (Learning Note):**
  - Payment gateways (`Razorpay` and `Stripe`) never accept floating-point numbers like `₹249.50` because floating-point math in computers can have rounding bugs (`0.1 + 0.2 = 0.30000000000000004`). Instead, they always work in the smallest currency subunit (**paise** for INR, **cents** for USD), so `₹249.50` is sent as the integer `24950`.
- **Smart Simulated Test Mode:**
  - If you haven't added your `RAZORPAY_KEY_ID` to `server/.env` yet, `createPaymentOrder` automatically runs in **Simulated Test Mode**, generating a valid test order and HMAC-SHA256 signature so you can test the entire online payment flow on `localhost` immediately! Once you paste your Razorpay Test keys in `.env`, it switches to the live Razorpay Checkout popup automatically.

#### Step 6.2: Backend HMAC-SHA256 Signature Verification (`POST /api/payment/verify`)
- **What we did:** After payment completes, Razorpay returns three values to the frontend: `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`. Our backend recomputes the hash using our secret key:
  ```js
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
  ```
- **Why (Learning Note — Security Checklist #3!):**
  - If your backend simply had an endpoint like `POST /api/orders/:id/mark-paid` without cryptographic signature verification, anyone could call it in Postman and get free products without paying!
  - Because only Razorpay and our backend know `RAZORPAY_KEY_SECRET`, nobody can forge `razorpay_signature`. Only when `expectedSignature === razorpay_signature` do we set `order.isPaid = true` and `order.paidAt = new Date()`.

#### Step 6.3: Payment Webhook (`POST /api/payment/webhook`)
- **What we did:** Built `handleRazorpayWebhook` which verifies the `x-razorpay-signature` header using `RAZORPAY_WEBHOOK_SECRET` and listens for the `payment.captured` event.
- **Why Webhooks Matter in Production (Interview Favorite!):**
  - What happens if a customer pays via UPI on their phone, money is deducted, and their internet disconnects or browser tab closes *before* the browser can call `/api/payment/verify`?
  - Razorpay's server independently sends a server-to-server `POST /api/payment/webhook` event to our backend, ensuring the order is still marked as `Paid` even if the customer's browser crashed!

#### Step 6.4: Frontend Razorpay Modal & Pay-Later Recovery (`client/src/utils/razorpayCheckout.js`)
- **What we did:**
  - Dynamically injects `https://checkout.razorpay.com/v1/checkout.js` only when needed.
  - Integrated into `Checkout.jsx` (when "Online Payment (Razorpay)" is selected) AND added a **"Pay Online Now"** button on `OrderDetail.jsx` so customers who initially chose `COD` (or closed the payment popup) can pay online anytime before delivery.

---

### Phase 7: Admin Panel (MongoDB Aggregation Analytics, Inventory/Order/User/Coupon Management & CSV Reports)

#### Step 7.1: MongoDB Aggregation Pipelines for Dashboard Analytics (`server/controllers/adminController.js`)
- **What we did:** Built `GET /api/admin/stats` using `Order.aggregate([...])` alongside `Promise.all` to compute:
  1. `totalRevenue` and `paidRevenue` (filtering out cancelled orders with `{ $match: { orderStatus: { $ne: 'Cancelled' } } }`).
  2. `monthlyRevenue`: Groups orders by `{ year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }` and sums `$totalPrice` and order counts for the last 6 months.
  3. `lowStockProducts`: Queries products where `{ stock: { $lte: 10 } }` sorted by lowest stock first.
- **Why use `.aggregate()` instead of `.find()` (Learning Note — Interview Favorite!):**
  - If your store has 50,000 orders, loading all 50,000 documents into Node.js memory and summing them with JavaScript `.reduce()` will crash your server's RAM.
  - MongoDB's **Aggregation Pipeline** (`$match` → `$group` → `$sort`) computes the sums directly inside the C++ database engine and sends back only the final summary numbers!

#### Step 7.2: Admin User Management & Self-Lockout Protection (`PUT /api/admin/users/:id`)
- **What we did:** Allows an Admin to change any user's `role` (`customer`, `manager`, `admin`) or suspend/unblock their account (`isBlocked: true / false`).
- **Why we added `if (user._id.toString() === req.user._id.toString())` check:**
  - Prevents an Admin from accidentally blocking or demoting their own account and locking themselves out of the Admin Panel!

#### Step 7.3: Sales Report CSV Export (`GET /api/admin/reports/sales`)
- **What we did:** Formats all orders into comma-separated rows (`Order ID, Date, Customer Name, Email, Items Count, Payment Method, Paid Status, Order Status, Discount, Total Amount`) and sets HTTP headers:
  ```js
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="shopease_sales_report.csv"');
  ```
- **Why:** Allows store owners and accountants to download `shopease_sales_report.csv` with one click and open it directly in Microsoft Excel or Google Sheets.

#### Step 7.4: Frontend Admin Control Center (`client/src/pages/admin/`)
- **What we did:** Created 4 modular admin views protected by `<AdminRoute>`:
  1. **`AdminDashboard.jsx`**: KPI cards (`Total Sales Revenue`, `Total Orders`, `Catalog Products`, `Registered Users`), Monthly Revenue bar chart, Low-Stock alert panel, and CSV export button.
  2. **`ManageProducts.jsx`**: Create/Edit/Delete products, upload images to `/api/products/upload`, toggle `isFeatured`, and create/delete Categories.
  3. **`ManageOrders.jsx`**: Filter orders by status and update any order's live status (`Placed` → `Packed` → `Shipped` → `Delivered` / `Cancelled`).
  4. **`ManageUsersAndCoupons.jsx`**: Create/delete promo codes (`percent` or `flat`) and change user roles or block/unblock accounts.

---

### Phase 8: Extras (Verified Buyer Reviews, Review Moderation, Emails, Tax Invoice & Static Pages)

#### Step 8.1: Review Model & Automatic Average Rating Calculation (`server/models/Review.js`)
- **What we did:**
  - Created `Review` (`user`, `product`, `rating` 1–5, `comment`, `isVerifiedPurchase`).
  - Added a compound unique index: `reviewSchema.index({ product: 1, user: 1 }, { unique: true })` so a user cannot spam 10 separate reviews on the same product.
  - Added a Mongoose **Static Method** `reviewSchema.statics.calcAverageRatings(productId)` that runs an aggregation pipeline (`$match` → `$group` with `$avg: '$rating'` and `$sum: 1`) and updates `Product.ratings` and `Product.numReviews` automatically whenever a review is created, updated, or deleted!

#### Step 8.2: Verified Buyer Check & Review Moderation (`server/controllers/reviewController.js`)
- **What we did:**
  - Before saving a review in `POST /api/products/:id/reviews`, we query the `Order` collection:
    ```js
    const hasPurchased = await Order.findOne({
      user: req.user._id,
      'orderItems.product': productId,
      orderStatus: { $ne: 'Cancelled' },
    });
    ```
  - **Why (Customer Feature #12):** Fake reviews ruin trust in e-commerce stores. By checking `Order.findOne()`, only customers who actually ordered the product can submit a review, earning the `"Verified Buyer"` badge!
  - Added `DELETE /api/products/:id/reviews/:reviewId` so either the review author or an Admin/Manager can delete a review, immediately recalculating the product's star rating.

#### Step 8.3: Transactional Email Notifications (`server/controllers/orderController.js`)
- **What we did:**
  - Integrated `sendEmail()` into `createOrder` (sends **Order Confirmation Email** with Order ID and total amount) and `updateOrderStatus` (sends **Order Status / Shipping Update Email** whenever an Admin updates the status to `Packed`, `Shipped`, or `Delivered`).
  - Notice we call `sendEmail(...).catch(() => {})` non-blockingly so a slow SMTP server never delays the customer's checkout response!

#### Step 8.4: Printable / Save-as-PDF Tax Invoice (`server/utils/invoiceGenerator.js`)
- **What we did:** Created `GET /api/orders/:id/invoice` which renders a clean, print-styled Tax Invoice (`INV-XXXXXXXX`) with `@media print` CSS and a one-click **"Print / Save as PDF"** button, linked directly from `OrderDetail.jsx`.

#### Step 8.5: Static Legal & Support Pages (`client/src/pages/StaticInfo.jsx` & `Footer.jsx`)
- **What we did:** Built `/info/:pageSlug` covering all 6 essential e-commerce static pages (`About Us`, `Contact`, `FAQ`, `Privacy Policy`, `Terms of Service`, and `Return Policy`) and linked them in the site Footer.

---

### Phase 9: Security Hardening, Performance Optimization & Automated Testing

#### Step 9.1: NoSQL Injection & XSS Request Sanitizer (`server/middleware/securityMiddleware.js`)
- **What we did:** Created `cleanObject()` and `sanitizeRequest` middleware that recursively strips any object keys starting with `$` or containing `.` from `req.body` and `req.params`, and strips `<script>...</script>` tags from strings. Also added a strict `authLimiter` (max 25 attempts per 15 mins) on `/api/auth/login`, `/api/auth/register`, and `/api/auth/forgot-password`.
- **Why (Learning Note — What is NoSQL Injection?):**
  - Suppose a login controller ran `User.findOne({ email: req.body.email })` without validating or sanitizing `req.body`. If a hacker sent JSON `{"email": {"$gt": ""}}`, MongoDB would match the first user whose email is greater than an empty string (often the Admin!).
  - Combining **Zod schema validation** (`z.string().email()`) with **`sanitizeRequest` (`$` key stripping)** blocks NoSQL injection completely.

#### Step 9.2: Route-Level Code Splitting with `React.lazy()` & `<Suspense>` (`client/src/App.jsx`)
- **What we did:** Converted static page imports into dynamic imports (`const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))`) wrapped inside `<Suspense fallback={<PageLoader />}>`.
- **Why (Performance Optimization):**
  - Without lazy loading, Vite bundles all customer pages and all Admin Dashboard pages into one large JavaScript file (`>500 KB`). Every mobile shopper would have to download the Admin Dashboard code even though they will never visit `/admin`!
  - With `React.lazy()`, Vite automatically splits each page into its own lightweight `.js` chunk that is downloaded on demand only when the user navigates to that route.

#### Step 9.3: Automated Unit & Security Test Suite (`server/tests/api.test.js`)
- **What we did:** Wrote 6 automated tests using Node's built-in `node:test` and `node:assert/strict` modules (`npm test`):
  1. Verifies NoSQL injection (`$gt`) and XSS (`<script>`) sanitization.
  2. Verifies `bcryptjs` password salting, hashing, and comparison.
  3. Verifies `registerSchema` and `loginSchema` Zod validation.
  4. Verifies `productSchema`, `reviewSchema`, and `orderCreateSchema` validation.
  5. Verifies Razorpay `HMAC-SHA256` signature generation and tamper detection.
  6. Verifies `generateInvoiceHTML` Tax Invoice rendering.

---

### Phase 10 & 11: Production Deployment & Upwork Portfolio Guide

#### Step 10.1: How to Deploy ShopEase to Production
1. **Database (MongoDB Atlas):**
   - Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/atlas), whitelist `0.0.0.0/0` in Network Access, and copy your connection string (`mongodb+srv://...`).
2. **Backend (Render or Railway):**
   - Connect your GitHub repo to Render/Railway, set the Root Directory to `server`, Build Command to `npm install`, and Start Command to `npm start`.
   - Add your Environment Variables (`NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL=https://your-shopease.vercel.app`, `CLOUDINARY_*`, `RAZORPAY_*`).
3. **Frontend (Vercel):**
   - Import the repo into Vercel, set Root Directory to `client`, Build Command to `npm run build`, Output Directory to `dist`, and add Environment Variable `VITE_API_URL=https://your-backend.onrender.com/api`.

#### Step 11.1: How to Showcase ShopEase on Upwork
- **Live Demo Credentials (Include in your Upwork Portfolio & Proposals):**
  - **Demo Admin:** `admin@shopease.com` | `password123`
  - **Demo Manager:** `manager@shopease.com` | `password123`
  - **Demo Customer:** `customer@shopease.com` | `password123`
  - **Demo Promo Codes:** `WELCOME10` (10% OFF) | `FLAT500` (₹500 OFF)
- **Upwork Project Catalog Packages:**
  - **Starter Package:** Responsive Storefront + Product Catalog + Cart + Cash on Delivery.
  - **Standard Package:** Full Storefront + Razorpay/Stripe Payment Gateway + Admin Dashboard.
  - **Premium Package:** Complete Custom E-Commerce + Coupons + Analytics + CSV Reports + Cloud Deployment.

---

## 4. How to Run Phase 1 Locally

We also configured a root `package.json` using **npm workspaces** (`client` and `server`), which means a single `npm install` in the root `ShopEase` directory installs packages for both frontend and backend!

### 1. Start the Backend Server
From the root `ShopEase` folder:
```bash
npm run dev:server
```
*(Or `cd server && npm run dev`)*
- Test the backend in your browser or Postman: `http://localhost:5000/api/health`

### 2. Start the React Frontend
Open a second terminal in the root `ShopEase` folder:
```bash
npm run dev:client
```
*(Or `cd client && npm run dev`)*
- Open `http://localhost:5173` in your browser to view the ShopEase frontend.

### 3. Seed Sample Categories, Products & Demo Accounts (Optional but Recommended)
Once MongoDB is running, run this command from the root `ShopEase` folder:
```bash
npm run seed
```
This creates:
- **Demo Admin:** `admin@shopease.com` (Password: `password123`)
- **Demo Manager:** `manager@shopease.com` (Password: `password123`)
- **Demo Customer:** `customer@shopease.com` (Password: `password123`)
- **Demo Coupons:** `WELCOME10` (10% OFF above ₹999) & `FLAT500` (₹500 OFF above ₹4999)
- **5 Categories & 8 Products** with images, sizes/colors, and discounts.

### 4. Step-by-Step Guide to Test Backend Features & Admin Panel
1. **Make sure both terminals are running:**
   - Terminal 1 (Backend on port `5000`): `npm run dev:server`
   - Terminal 2 (Frontend on port `5173`): `npm run dev:client`
2. **Test the Admin Panel (`/admin`):**
   - Go to `http://localhost:5173/login` and sign in with:
     - **Email:** `admin@shopease.com`
     - **Password:** `password123`
   - Once logged in as Admin, an amber **"Admin"** button appears in the top Navbar (or visit `http://localhost:5173/admin`).
   - Inside the Admin Control Center, test all 4 tabs:
     - **Dashboard Overview:** Check Total Revenue, Orders, Users, Low-Stock Alerts, Monthly Revenue bars, and click **Export Sales Report (CSV)** to download `shopease_sales_report.csv`.
     - **Products & Categories:** Add a new product (upload an image file or paste an image URL), edit an existing product's price/stock, or add a new category.
     - **Orders:** Change any order's status dropdown (`Placed` → `Packed` → `Shipped` → `Delivered`).
     - **Users & Coupons:** Create a new coupon (e.g., `SAVE20`), change a user's role, or test Blocking/Unblocking a user.
3. **Test Checkout, Coupons, Razorpay Payment, Tax Invoice & Verified Reviews:**
   - Add any product to the Cart and go to `/checkout`.
   - Enter coupon code `WELCOME10` or `FLAT500` and click **Apply** to test backend coupon validation.
   - Select **Online Payment (Razorpay)** or **Cash on Delivery (COD)** and click **Place Order**.
   - On the Order Details page (`/orders/:id`), click **Tax Invoice (PDF)** to open the printable invoice, or click **Cancel Order** to test atomic stock restoration.
   - After placing an order for a product, visit that product's page (`/products/:slug`) and submit a **Verified Buyer Review** at the bottom!
4. **Test Backend APIs Directly (Browser / Postman / Thunder Client):**
   - Health Check: `http://localhost:5000/api/health`
   - Products API (with filters): `http://localhost:5000/api/products?sort=price_asc`
   - Live Search Suggestions: `http://localhost:5000/api/products/suggestions?q=sony`
   - Categories API: `http://localhost:5000/api/categories`

---

## 5. Development Roadmap Progress

- [x] **Phase 1: Setup** — Git repo, folder structure, Express server, DB config, error middleware, React + Vite + Tailwind + Redux setup.
- [x] **Phase 2: Authentication** — User model, Register/Login/Logout APIs, JWT + `httpOnly` cookies, Auth middleware (`protect` & `authorize`), Forgot/Reset password, Profile & Address management, Frontend Login/Register/Profile pages & Redux `authSlice`.
- [x] **Phase 3: Products & Categories** — Product & Category models, CRUD APIs, Cloudinary image upload (`multer` 5MB + MIME filter), search/filter/sort/pagination, live search suggestions, database seeder (`npm run seed`), and Home/Products/ProductDetail UI.
- [x] **Phase 4: Cart & Wishlist** — Cart & Wishlist models and APIs, server-side price calculation, Redux `cartSlice` & `wishlistSlice`, guest cart (`localStorage`) + automatic merge on login, and Cart/Wishlist UI pages.
- [x] **Phase 5: Checkout & Orders** — Order & Coupon models, atomic stock deduction (`$inc` with `$gte` guard), coupon validation engine (`WELCOME10`, `FLAT500`), order cancellation with stock restoration, and Checkout/Orders/OrderDetail UI.
- [x] **Phase 6: Payments** — Razorpay order creation, HMAC-SHA256 cryptographic signature verification, webhook handler, simulated local test mode, Cash on Delivery (COD), and retry payment button on Order Details.
- [x] **Phase 7: Admin Panel** — Admin dashboard stats (MongoDB aggregation), monthly revenue chart, low-stock alerts, CSV sales report export, and Product/Category/Order/User/Coupon management UI.
- [x] **Phase 8: Extras** — Verified buyer reviews & auto-recalculated product ratings, review moderation, order & shipping email notifications, printable/PDF tax invoice, and static pages.
- [x] **Phase 9: Security & Testing** — Input validation (Zod), NoSQL/XSS request sanitization, strict auth rate limiting, `React.lazy()` code-splitting, SEO meta tags, and automated test suite (`npm test`).
- [x] **Phase 10 & 11: Deployment & Portfolio** — ER Diagram & API Reference in [docs/API_AND_ER_DIAGRAM.md](docs/API_AND_ER_DIAGRAM.md), production deployment guide, and Upwork showcase instructions.
