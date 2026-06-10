![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Backend-3C873A?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-REST_API-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-00ED64?style=for-the-badge&logo=mongodb&logoColor=black)
![JWT](https://img.shields.io/badge/Auth-JWT-FB015B?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Storage-Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Groq](https://img.shields.io/badge/AI-Groq_LLaMA-F55036?style=for-the-badge)
![HuggingFace](https://img.shields.io/badge/NLP-HuggingFace-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)
![Multer](https://img.shields.io/badge/Uploads-Multer-888888?style=for-the-badge)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
[![Live Demo](https://img.shields.io/badge/🔴_Live-Demo-00C853?style=for-the-badge)](https://tour-booker.vercel.app/)

# TourBooker — Tours & Activity Booking Platform

TourBooker is a full-stack MERN marketplace for discovering, booking, and managing tours and activities. It supports three distinct user roles — Traveller, Tour Operator, and Admin — each with dedicated portals, workflows, and dashboards. Built with production-grade features including Stripe payments, AI-powered recommendations, sentiment analytics, and a dynamic pricing engine.

---

## Live Demo

🔴 [https://tour-booker.vercel.app/](https://tour-booker.vercel.app/)

---

## Screenshots

![LandingPage](/client/src/assets/screenshots/LandingPage.png)
![AdminPanel](/client/src/assets/screenshots/AdminPanel.png)
![AIChatBot](/client/src/assets/screenshots/AIChatBot.png)
![OperatorDashboard](/client/src/assets/screenshots/OperatorDashboard.png)
![Message&Enquiry](/client/src/assets/screenshots/Message&Enquiry.png)

---

## Features

### Authentication & Role-Based Access

- Register, login, and password reset for all user types
- JWT-based authentication with role-based access control
- Three roles: **Traveller** (customer), **Tour Operator**, and **Admin**
- Protected routes enforced on both frontend and backend

### Tour Listings & Discovery

- Browse, filter, and search tours and activities with images and rich metadata
- Large tour photo thumbnails with prominent booking CTAs
- Detail pages with pricing, availability, reviews, and operator info

### Operator Portal

- Operators can list and manage tours, set availability, and view incoming bookings
- Full operator onboarding flow with profile and media management
- Operator-specific dashboard with booking and revenue overview

### Booking Flow & Cart

- Add tours to cart and complete a multi-step checkout flow
- Concurrency-safe slot booking to prevent overbooking
- Booking history and status tracking for travellers

### Payments

- **Stripe** integration for live payments via PaymentIntents
- **Demo payment mode** for local testing without real charges — toggle via `DEMO_MODE` env flag
- Server-side webhook handling for booking fulfillment and payment confirmation
- Client-side **PDF receipts** generated via jsPDF for every completed booking

### Dynamic Pricing Engine

- Configurable pricing rules supporting discounts, fees, and taxes
- Pricing calculated server-side for consistency and security

### Reviews & Ratings

- Travellers can submit reviews and star ratings after booking
- Review data feeds directly into the sentiment analytics dashboard

### Messaging & Enquiries

- Internal messaging system between travellers and operators
- Unread message tracking with real-time badge indicators
- Email notifications via **Nodemailer** for new messages, bookings, and OTPs

### AI-Assisted Features

- **Groq LLaMA 3.3 70B** powers personalized tour recommendations and a context-aware chatbot
- **HuggingFace Transformers** performs sentiment analysis on reviews, surfaced in the admin analytics dashboard

### Admin Dashboard

- Audit logs for key platform events
- Analytics overview: bookings, revenue, and user activity
- Full management endpoints for users, tours, and operators

### Media & File Handling

- Image uploads via **Cloudinary** and **Multer**
- Client-side PDF receipt generation via jsPDF

---

## Tech Stack

### Frontend

- React.js (Vite)
- React Router DOM
- Context API (Auth, Cart, Notifications)
- Axios — centralized API client with auth interceptors
- jsPDF — client-side PDF receipt generation

### Backend

- Node.js + Express.js
- MongoDB + Mongoose
- MVC architecture — controllers, routes, services, models, utils

### Authentication & Security

- JWT (access + refresh tokens)
- Bcrypt password hashing
- Role-based middleware

### Payments

- Stripe PaymentIntents + Webhooks
- DemoPaymentIntent model for safe local testing

### AI & Integrations

- Groq API (LLaMA 3.3 70B) — chatbot & recommendations
- HuggingFace Transformers — review sentiment analysis
- Nodemailer — transactional email

### File & Media

- Cloudinary — cloud image storage
- Multer — file upload middleware

---

## Architecture

```text
TourBooker
│
├── client
│   ├── src
│   │   ├── pages
│   │   ├── components
│   │   ├── layout
│   │   │   ├── MainLayout.jsx
│   │   │   └── DashboardLayout.jsx
│   │   ├── context         # Auth, Cart, Notifications
│   │   ├── services        # ai.service.js, receipt.service.js
│   │   └── api             # Centralized Axios client
│
└── server
    └── src
        ├── controllers     # payment, analytics, bookings, etc.
        ├── routes
        ├── services        # ai.service.js, email, pricing
        ├── models          # Mongoose schemas + DemoPaymentIntent
        └── utils
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Stripe account (or use demo mode)
- Cloudinary account
- Groq API key

### Installation

```bash
git clone https://github.com/Mohd-Inzamam/TourBooker.git
```

**Server:**

```bash
cd server
npm install
npm run dev
```

**Client:**

```bash
cd client
npm install
npm run dev
```

Open two terminals — one for the server, one for the client.

---

## Environment Variables

**Server** — copy `.env.example` and fill in values:

```env
MONGO_URI=
JWT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
DEMO_MODE=true

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

GROQ_API_KEY=
HUGGINGFACE_API_KEY=
```

**Client** — copy `.env.example` and fill in values:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_DEMO_MODE=true
```

> Set `DEMO_MODE=true` to use `DemoPaymentIntent` — no real Stripe charges.

---

## Future Enhancements

- Real-time features via WebSockets (live booking updates, instant chat)
- Multi-currency and international tax rules
- Expanded AI personalization with on-device caching
- End-to-end tests and CI/CD pipelines
- Docker Compose dev environment and deployment manifests

---

## Author

**Mohd Injmam** — Full Stack MERN Developer
