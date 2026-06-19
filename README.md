# 🐾 PetCenter

A premium, full-stack web platform for pet adoption, supplies, and custom habitat design — built with a **React** frontend and **Node.js/Express** backend, backed by **MongoDB**, **Stripe** for payment processing, and **Cloudinary** for image management.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Database Seeding](#database-seeding)
- [Demo Credentials](#demo-credentials)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Security & Validation](#security--validation)
- [Pages & Routes](#pages--routes)
- [Known Limitations](#known-limitations)

---

## ✨ Features

- 🔐 **Secure Authentication** — JWT-based auth with access & refresh token rotation, stored in secure HTTP-only cookies.
- 🐕 **Pet Marketplace** — Browse, search, filter, and buy/adopt pets from verified sellers.
- 🛒 **Supplies Store** — A fully featured pet products catalog, paginated and filterable by category and compatible pets.
- 🌿 **Ecosystem Builder (Phase 4)** — Interactive step-by-step wizard to pick a pet (Fish, Snake, Bird), review setup guidelines, select essential/optional matching products, and add the entire setup to the cart at once.
- 🖼️ **Inspiration Gallery (Phase 4)** — Share builds with the community, clone configurations, and track clone counts.
- 💳 **Stripe Checkout & Orders** — Secure one-click checkout, inventory stock checks, and status notifications.
- ❤️ **Favorites / Wishlist (Phase 5)** — Optimistic heart toggle on all pets and products. View saved favorites in a tabbed wishlist dashboard.
- ⭐ **Reviews & Ratings (Phase 5)** — Verified purchasers can rate products (1–5 stars) and write comments. Features a rating distribution breakdown chart, sorting, and editing/deleting within a 48-hour window.
- 🔔 **Notifications (Phase 5)** — Global unread counter with real-time 60-second polling. Users are notified of order status changes, and listing owners are notified of admin approvals/removals.
- 🛡️ **Admin Moderation & Analytics** — Manage users (block/unblock/delete), approve/remove marketplace ads, manage shelters/campaigns, and moderate reviews.

---

## 🛠️ Tech Stack

### Frontend
- **React 19** + **Vite 8** (UI & Bundler)
- **React Router v7** (Client-side routing)
- **Tailwind CSS v4** + **Framer Motion** (Premium aesthetics, micro-animations, and responsive grids)
- **Lucide React** (Icon library)
- **Axios** (REST client)

### Backend
- **Node.js** + **Express v5** (REST API Server)
- **MongoDB** + **Mongoose 9** (Database & Schemas)
- **Stripe SDK** (Payment processing)
- **Cloudinary** + **Multer** (Media management)
- **Helmet** + **CORS** + **express-rate-limit** (Basic security)
- **bcryptjs** (Password cryptography)

---

## 📁 Project Structure

```
PetCenter/
├── Client/                         # React frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── api/                    # Axios API client modules
│   │   ├── assets/                 # Graphics & animation assets
│   │   ├── components/             # Reusable UI components
│   │   │   ├── layout/             # Navbar, Footer
│   │   │   ├── store/              # ProductCard, ProductReviews
│   │   │   └── ui/                 # HeartButton, NotificationBell
│   │   ├── context/                # Global contexts (Auth, Cart, Builder, Favorites, Notifications)
│   │   ├── pages/                  # Route pages (Home, Store, ProductDetail, Marketplace, Listings, Favorites, Builder)
│   │   └── App.jsx                 # Routing and global layout wrapper
│
└── Server/                         # Express backend
    ├── src/
    │   ├── config/                 # DB connection and seedAll script
    │   ├── controllers/            # Controller layers (favorite, review, notification, order, etc.)
    │   ├── middleware/             # Route guards (auth, admin, rateLimit, nosqlSanitize)
    │   ├── models/                 # Mongoose schemas (User, Product, PetListing, Favorite, Review, Notification, Campaign, Shelter)
    │   └── routes/                 # Express router blueprints
    ├── app.js                      # Main express application configuration
    └── server.js                   # Server bootstrapper entry
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **npm** v9+
- A **MongoDB** instance
- **Cloudinary** credentials (for custom image uploads)
- **Stripe** test keys (for checkout)

### Environment Variables

#### `Server/.env`
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/petcenter
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STRIPE_SECRET_KEY=sk_test_...
CLIENT_URL=http://localhost:5173
```

#### `Client/.env`
```env
VITE_API_URL=http://localhost:5000/api/v1
```

### Installation & Launch

1. Clone the project and navigate to the root:
```bash
git clone https://github.com/your-username/PetCenter.git
cd PetCenter
```

2. Open two terminals:

**Terminal 1 — Backend**
```bash
cd Server
npm install
npm run dev
```

**Terminal 2 — Frontend**
```bash
cd Client
npm install
npm run dev
```

---

## 🌱 Database Seeding

To quickly test the platform, a comprehensive seeding script is available. It wipes the database and creates fresh listings, products, shelters, active campaigns, reviews, and test users.

Run this command inside the `Server/` directory:
```bash
npm run seed
```

---

## 👥 Demo Credentials

After seeding the database, you can log in using these demo accounts to test all platform user roles:

| Role | Email | Password | Features to Test |
|---|---|---|---|
| **Super Admin** | `admin@petcenter.com` | `AdminPassword123!` | Moderate ads, unpublish builds, hide reviews, configure campaigns/shelters |
| **Vendor** | `vendor@petcenter.com` | `VendorPassword123!` | Create pet listings, change listing status, write reviews |
| **Customer** | `customer@petcenter.com` | `CustomerPassword123!` | Save favorites, write reviews, use ecosystem builders, buy items |

---

## 🔌 API Reference

### Ecosystem Routes — `/ecosystem`
- `GET /ecosystem/pets` — Returns available pet types config
- `GET /ecosystem/pets/:petType/config` — Returns pet builder guidelines
- `GET /ecosystem/gallery` — Gets public published gallery configurations
- `GET /ecosystem/gallery/:id` — Gets detailed gallery setup
- `POST /ecosystem/gallery/:id/clone` — Clones a setup into user's builds
- `GET /ecosystem/my-builds` — Gets saved setups for logged-in user
- `POST /ecosystem/builds` — Saves a new custom build
- `PUT /ecosystem/builds/:id` — Updates build selections or name
- `DELETE /ecosystem/builds/:id` — Deletes a build
- `PATCH /ecosystem/builds/:id/publish` — Toggles public visibility on gallery

### Favorites Routes — `/favorites` (Protected)
- `GET /favorites` — Gets paginated favorites filtered by `itemType`
- `GET /favorites/check` / `POST /favorites/check` — Batch check saved items list
- `POST /favorites` — Adds a pet or product to wishlist
- `DELETE /favorites/:itemType/:itemId` — Removes an item from wishlist

### Reviews Routes — `/products/:id/reviews`
- `GET /products/:id/reviews` — Gets public reviews & star distribution for a product
- `GET /products/:id/reviews/eligibility` — Checks if user bought and received product (verified purchase check)
- `POST /products/:id/reviews` — Posts a verified review (1-5 stars, max 500 chars)
- `PUT /reviews/:id` — Updates user's own review (allowed within 48h)
- `DELETE /reviews/:id` — Deletes user's own review
- `GET /admin/reviews` — Admins can view all reviews
- `PATCH /admin/reviews/:id/hide` — Admins can hide abusive comments

### Notifications Routes — `/notifications` (Protected)
- `GET /notifications` — Gets paginated list of notifications
- `GET /notifications/unread-count` — Lightweight endpoint for polling unread count
- `PATCH /notifications/:id/read` — Marks a notification as read
- `PATCH /notifications/read-all` — Marks all as read
- `DELETE /notifications/:id` — Deletes a notification

---

## 🔒 Security & Validation

1. **NoSQL Injection Sanitization** — Recursively cleanses input query parameters, route paths, and request bodies of keys starting with `$` or containing `.`.
2. **HTML Sanitization** — Replaces tags and strips event handlers from user-submitted text inputs.
3. **Optimistic UI Reverts** — Heart icons toggle status instantly in the UI for optimal latency, but automatically revert if the API request fails.
4. **Verified Purchase Guard** — Reviews can only be submitted for products that are linked to a completed order marked as `delivered` for that user.

---

## 🗺️ Pages & Routes

All routes are fully implemented and connected:

- `/` — Homepage featuring spotlight categories, features, and emotional call-to-actions.
- `/marketplace` — Active pet listings with search, species selection, and favorite toggles.
- `/products` — Store with responsive category filter sidebar and star ratings.
- `/favorites` — Dedicated user wishlist workspace.
- `/ecosystem` — Interactive pet picker with saved setups banner.
- `/ecosystem/build/:petType` — Main habitat builder featuring real-time warnings for out-of-stock items.

---

## ⚠️ Known Limitations

- **Email Verification / Password Reset** — The SMTP server configuration is left mock for development. Users can reset passwords internally or retrieve credentials from the seeded list.
- **Production Stripe Webhooks** — Webhook signature validation requires a production domain. Stripe webhooks operate locally via Stripe CLI forwarding.
