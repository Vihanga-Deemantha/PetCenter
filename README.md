# 🐾 PetCenter

A full-stack web platform for buying, selling, and adopting pets — built with a **React** frontend and **Node.js/Express** backend, backed by **MongoDB** and **Cloudinary** for image management.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Security](#security)
- [Pages & Routes](#pages--routes)

---

## ✨ Features

- 🔐 **Authentication** — JWT-based auth with access & refresh token rotation, secure HTTP-only cookies
- 🐕 **Pet Marketplace** — Browse, search, and filter pet listings (for sale or adoption)
- 📝 **Listing Management** — Authenticated users can create, edit, and delete their own listings with image uploads
- 🛒 **Products Page** — Browse pet-related products by category and brand
- 👤 **User Profiles** — Update personal info and upload a profile photo
- 🛡️ **Admin Dashboard** — Manage users (block/unblock/delete) and moderate listings (approve/reject/remove)
- 🔒 **Security** — Helmet headers, CORS, rate limiting, bcrypt password hashing, and NoSQL sanitization at controller level
- ☁️ **Cloud Image Uploads** — Pet listing and profile images stored via Cloudinary

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + Vite 8 | UI framework & build tool |
| React Router v7 | Client-side routing |
| Tailwind CSS v4 | Utility-first styling |
| Framer Motion | Animations & transitions |
| Lucide React | Icon library |
| Axios | HTTP client |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express v5 | Server & REST API |
| MongoDB + Mongoose 9 | Database & ODM |
| JSON Web Tokens (JWT) | Authentication |
| bcryptjs | Password hashing |
| Cloudinary | Image hosting |
| Multer | Multipart file upload handling |
| Helmet | HTTP security headers |
| express-rate-limit | Rate limiting |
| Nodemailer | Email notifications |
| dotenv | Environment configuration |

---

## 📁 Project Structure

```
PetCenter/
├── Client/                         # React frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── api/                    # Axios API call modules
│   │   ├── assets/                 # Static assets
│   │   ├── components/             # Reusable UI components
│   │   │   └── layout/             # Navbar, Footer
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global auth state (React Context)
│   │   ├── layouts/
│   │   │   └── AdminLayout.jsx     # Admin shell layout
│   │   ├── pages/                  # Page-level components
│   │   │   ├── Home.jsx
│   │   │   ├── Marketplace.jsx
│   │   │   ├── ListingDetails.jsx
│   │   │   ├── CreateListing.jsx
│   │   │   ├── EditListing.jsx
│   │   │   ├── MyListings.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Unauthorized.jsx
│   │   │   └── ComingSoon.jsx
│   │   ├── App.jsx                 # Root component with routing
│   │   ├── main.jsx                # React entry point
│   │   └── index.css               # Global styles
│   ├── index.html
│   └── vite.config.js
│
└── Server/                         # Express backend
    ├── src/
    │   ├── config/
    │   │   └── db.js               # MongoDB connection
    │   ├── controllers/            # Request handler logic
    │   │   ├── auth.controller.js
    │   │   ├── listing.controller.js
    │   │   └── admin.controller.js
    │   ├── middleware/
    │   │   ├── auth.js             # JWT protect middleware
    │   │   ├── admin.js            # Admin-only guard
    │   │   ├── errorHandler.js     # Global error handler
    │   │   └── rateLimit.js        # Rate limit configurations
    │   ├── models/
    │   │   ├── User.js
    │   │   ├── PetListing.js
    │   │   └── Products.js
    │   ├── routes/
    │   │   ├── auth.routes.js
    │   │   ├── listing.routes.js
    │   │   └── admin.routes.js
    │   └── utils/
    │       └── uploadImage.js      # Cloudinary/Multer config
    ├── app.js                      # Express app setup
    └── server.js                   # Server entry point
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- A **MongoDB** instance (local or [Atlas](https://www.mongodb.com/atlas))
- A **Cloudinary** account for image uploads

---

### Environment Variables

#### `Server/.env`
```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/petcenter

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS
CLIENT_URL=http://localhost:5173
```

#### `Client/.env`
```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/PetCenter.git
cd PetCenter

# 2. Install Server dependencies
cd Server
npm install

# 3. Install Client dependencies
cd ../Client
npm install
```

---

### Running the App

Open two terminals:

**Terminal 1 — Backend**
```bash
cd Server
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 — Frontend**
```bash
cd Client
npm run dev
# Client runs on http://localhost:5173
```

---

## 🔌 API Reference

All endpoints are prefixed with `/api/v1`.

### Health Check
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Check if the API is running |

---

### Auth Routes — `/auth`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a new user |
| `POST` | `/auth/login` | Public | Log in and receive tokens |
| `POST` | `/auth/refresh-token` | Public | Rotate access token using refresh token |
| `POST` | `/auth/logout` | 🔒 Private | Invalidate refresh token |
| `GET` | `/auth/me` | 🔒 Private | Get logged-in user's profile |
| `PUT` | `/auth/profile` | 🔒 Private | Update profile details |
| `PUT` | `/auth/profile/photo` | 🔒 Private | Upload/update profile photo |

---

### Listing Routes — `/listings`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/listings` | Public | Get all active pet listings (supports filters) |
| `GET` | `/listings/:id` | Public | Get a single listing by ID |
| `GET` | `/listings/my/listings` | 🔒 Private | Get all listings owned by the logged-in user |
| `POST` | `/listings` | 🔒 Private | Create a new pet listing (with image upload) |
| `PUT` | `/listings/:id` | 🔒 Private | Update a listing (owner only) |
| `PUT` | `/listings/:id/status` | 🔒 Private | Update listing status (e.g., sold/adopted) |
| `DELETE` | `/listings/:id` | 🔒 Private | Delete a listing (owner only) |

---

### Admin Routes — `/admin`
> All routes require authentication and admin role.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/dashboard` | Get platform statistics |
| `GET` | `/admin/users` | Get all registered users |
| `PUT` | `/admin/users/:id/block` | Block a user |
| `PUT` | `/admin/users/:id/unblock` | Unblock a user |
| `DELETE` | `/admin/users/:id` | Soft-delete a user |
| `GET` | `/admin/listings` | Get all listings (any status) |
| `PUT` | `/admin/listings/:id/approve` | Approve a pending listing |
| `PUT` | `/admin/listings/:id/reject` | Reject a listing |
| `PUT` | `/admin/listings/:id/remove` | Remove an active listing |

---

## 🗃️ Data Models

### User
| Field | Type | Notes |
|---|---|---|
| `name` | String | Max 60 chars |
| `email` | String | Unique, lowercase |
| `password` | String | Hashed (bcrypt), min 6 chars |
| `phone` | String | Required |
| `location` | String | Required |
| `role` | String | `user` \| `admin` |
| `profileImage` | String | Cloudinary URL |
| `isBlocked` | Boolean | Admin can block users |
| `isDeleted` | Boolean | Soft delete flag |
| `refreshToken` | String | Hidden from API responses |

### PetListing
| Field | Type | Notes |
|---|---|---|
| `title` | String | Max 100 chars |
| `petType` | String | `dog` \| `cat` \| `bird` \| `fish` \| `reptile` \| `other` |
| `breed` | String | Required |
| `age` | Number | In months |
| `gender` | String | `male` \| `female` \| `unknown` |
| `price` | Number | 0 for free/adoption |
| `location` | String | Required |
| `description` | String | Max 2000 chars |
| `healthInfo` | String | Vaccination/health details |
| `images` | [String] | Array of Cloudinary URLs |
| `listingType` | String | `sale` \| `adoption` |
| `status` | String | `pending` → `active` → `sold` / `adopted` / `removed` |
| `viewCount` | Number | Auto-incremented on view |
| `owner` | ObjectId | Ref to `User` |
| `moderationNote` | String | Admin notes |

### Product
| Field | Type | Notes |
|---|---|---|
| `name` | String | Max 100 chars |
| `description` | String | Max 2000 chars |
| `price` | Number | Required, min 0 |
| `images` | [String] | Cloudinary URLs |
| `stock` | Number | Available quantity |
| `category` | String | `dog` \| `cat` \| `bird` \| `fish` \| `reptile` \| `other` |
| `brand` | String | Required |
| `owner` | ObjectId | Ref to `User` |

---

## 🔒 Security

| Measure | Implementation |
|---|---|
| HTTP Security Headers | `helmet` middleware on all routes |
| CORS | Origin-restricted to `CLIENT_URL` with credentials |
| Rate Limiting | Auth routes: 15 req / 15 min · General API: 100 req / min |
| Password Hashing | `bcryptjs` with salt rounds of 10 |
| JWT Strategy | Short-lived access token (15m) + long-lived refresh token (7d) |
| Sensitive Field Hiding | `password` and `refreshToken` excluded from all API responses |
| Input Validation | `express-validator` on auth and listing inputs |

---

## 🗺️ Pages & Routes

| Path | Page | Access |
|---|---|---|
| `/` | Home | Public |
| `/marketplace` | Browse all pet listings | Public |
| `/marketplace/:id` | Listing detail view | Public |
| `/products` | Pet products catalog | Public |
| `/login` | Login form | Public |
| `/register` | Registration form | Public |
| `/create-listing` | Create a new listing | 🔒 Authenticated |
| `/edit-listing/:id` | Edit an existing listing | 🔒 Authenticated (owner) |
| `/my-listings` | View your own listings | 🔒 Authenticated |
| `/profile` | User profile & settings | 🔒 Authenticated |
| `/admin` | Admin overview dashboard | 🛡️ Admin only |
| `/admin/users` | User management | 🛡️ Admin only |
| `/admin/listings` | Listing moderation | 🛡️ Admin only |
| `/ecosystems` | Ecosystems (coming soon) | Public |
| `/donations` | Donations (coming soon) | Public |
| `/about` | About page (coming soon) | Public |

---

## 📬 Postman Collection

A full Postman collection is available at the root of the repository:

```
PetCenter_Postman_Collection.json
```

Import it into Postman to test all API endpoints with pre-configured request bodies and headers.

---

## 📄 License

This project is licensed under the **ISC License**.
