# 🛒 QuickCart — Full-Stack Grocery E-Commerce App

QuickCart is a Blinkit/Zepto style online grocery store built with **HTML, CSS, vanilla JavaScript** on the frontend and **Node.js, Express & MongoDB** on the backend. This is the enhanced v2.0 edition with a professional UI, dark mode, wishlist, coupons, saved addresses, order tracking and a full admin dashboard.

## ✨ Features

### Customer-facing
- 🔐 JWT-based signup / login with password visibility toggle
- 🛍️ Product catalog with category filters, search, sorting (price/rating/newest) and pagination
- 🧡 Wishlist — save products for later
- 🛒 Cart with live quantity steppers and item removal
- 🏷️ Coupon codes with automatic validation and savings display
- 📍 Multiple saved delivery addresses (add / edit / delete / set default)
- 💳 Payment method selection (COD / UPI / Card — simulated)
- 📦 Order history with a visual status timeline (Placed → Packed → Out for Delivery → Delivered)
- ❌ Order cancellation while still "Placed"
- 👤 Profile management (edit name/phone, change password)
- 🌗 Light / dark theme toggle (persisted)
- 🔔 Toast notifications instead of browser alerts
- 📱 Fully responsive layout with a mobile drawer menu

### Admin dashboard (`/admin.html`)
- 📊 Overview stats: total products, orders, revenue, pending orders
- 🛒 Full product CRUD (add / edit / delete)
- 📦 View all orders and update their status
- Protected by an `isAdmin` flag on the user account

### Backend / engineering
- Helmet, compression & morgan for security, performance and logging
- Rate limiting on auth endpoints
- Centralized error handling + custom 404 page
- Mongoose schemas with validation, virtuals (discount %) and text search index
- Clean REST API under `/api/*`

## 🗂️ Tech Stack
- **Frontend:** HTML5, CSS3 (custom design system, CSS variables, no framework), vanilla JS (fetch API)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcrypt password hashing

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- [MongoDB](https://www.mongodb.com/try/download/community) running locally, **or** a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

### 2. Install dependencies
```bash
cd quickcart
npm install
```

### 3. Configure environment variables
The project already includes a working `.env` for local development. To use your own settings, copy `.env.example`:
```bash
cp .env.example .env
```
Then edit `.env`:
```
MONGO_URI=mongodb://127.0.0.1:27017/quickcart
JWT_SECRET=change_this_to_a_long_random_string
PORT=5000
```
If you're using MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string.

### 4. Seed the database
This creates sample products, coupon codes and a demo admin account:
```bash
npm run seed
```
Demo admin login: **admin@quickcart.com** / **admin123**

### 5. Run the app
```bash
npm run dev     # with auto-restart (nodemon)
# or
npm start       # plain node
```
Visit **http://localhost:5000** in your browser.

## 📖 Usage Guide
1. **Sign up** for a new account (or log in as the demo admin).
2. Browse products, use the category chips / search bar / sort dropdown.
3. Add items to your cart, then go to **Cart**.
4. Try a coupon code — `WELCOME50`, `SAVE10`, or `BIGCART20` (see suggestions on the cart page).
5. Add a delivery address and place the order.
6. Check **My Orders** to see the live status timeline.
7. Log in as the admin account and open **Admin Dashboard** to manage products and update order statuses.

## 🔑 Demo Coupons (seeded)
| Code | Discount | Minimum Order |
|---|---|---|
| WELCOME50 | ₹50 flat off | ₹200 |
| SAVE10 | 10% off (max ₹100) | ₹300 |
| BIGCART20 | 20% off (max ₹250) | ₹800 |

## 📁 Project Structure
```
quickcart/
├── server.js              # Express app entry point
├── seed.js                 # Seeds products, coupons & demo admin
├── models/                 # Mongoose schemas (User, Product, Cart, Order, Coupon)
├── routes/                 # REST API routes (auth, products, cart, orders, wishlist, coupons)
├── middleware/              # JWT auth guard + admin guard
└── public/                 # Frontend (HTML/CSS/JS) — served statically by Express
    ├── css/style.css
    ├── js/                  # api.js, app.js, auth.js, cart.js, orders.js, profile.js, admin.js, nav.js, toast.js, theme.js
    ├── index.html, login.html, signup.html, cart.html, orders.html, profile.html, wishlist.html, admin.html, 404.html
```

## 🔒 Notes
- Payment is **simulated** — no real payment gateway is integrated (this is fine for a college/portfolio project). Extending it with Razorpay/Stripe test mode would be a natural next step.
- Product images are represented with emoji icons to keep the project dependency-free — swap the `icon` field for real image URLs if you'd like.
- Change `JWT_SECRET` before deploying anywhere public.

## 📝 License
MIT — free to use for learning and portfolio purposes.
