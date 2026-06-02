# TourBooker — Tours & Activity Booking Platform
### Comprehensive Technical Documentation

---

## 📌 Project Overview

**TourBooker** is a full-stack, multi-role tours and activity booking marketplace that connects travellers with tour operators. The platform supports three distinct user roles — **Traveller (User)**, **Tour Operator**, and **Admin** — each with dedicated dashboards, workflows, and permissions.

---

## 🛠️ Tech Stack

### Backend (Server)
| Category | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js v5 |
| Database | MongoDB (via Mongoose v9) |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| Payment Gateway | Stripe |
| File Uploads | Multer + Cloudinary |
| Email Service | Nodemailer |
| AI / LLM | Groq API (LLaMA 3.3 70B) |
| Sentiment Analysis | HuggingFace Inference API (RoBERTa) |
| Geocoding | OpenStreetMap Nominatim API |
| HTTP Client | Axios |
| Input Validation | express-validator |
| Dev Tools | Nodemon, Morgan |

### Frontend (Client)
| Category | Technology |
|---|---|
| Framework | React 19 (Vite) |
| Routing | React Router DOM v7 |
| Payment UI | @stripe/react-stripe-js, @stripe/stripe-js |
| Maps | Leaflet + React-Leaflet + React-Leaflet-Cluster |
| Icons | Lucide React |
| PDF Generation | jsPDF |
| Styling | Vanilla CSS (custom design system) |
| Build Tool | Vite v8 |

---

## 🏗️ Architecture

### Backend Structure
```
server/
├── app.js               # Express app config, middleware, route mounting, global error handler
├── server.js            # HTTP server entry point + MongoDB connection
└── src/
    ├── config/          # DB, Cloudinary, Mailer, Stripe configs
    ├── controllers/     # 15 feature controllers
    ├── middlewares/     # Auth, Role, Upload, Validation middlewares
    ├── models/          # 19 Mongoose models
    ├── routes/          # 15 route files
    ├── services/        # AI, Geocoding, Pricing, Demo Payment services
    └── utils/           # JWT helper, Email templates (7 templates)
```

### Frontend Structure
```
client/src/
├── App.jsx             # Root component
├── routes.jsx          # Centralized route config (React Router v7)
├── api/                # Axios API client with interceptors
├── components/         # 19 reusable UI components
├── context/            # 4 React Context providers
├── hooks/              # Custom React hooks
├── layout/             # MainLayout, DashboardLayout, AuthLayout
├── pages/              # All page components
│   ├── admin/          # 7 admin pages
│   ├── operator/       # 8 operator pages
│   └── (user pages)    # 12 user/public pages
├── services/           # 12 API service modules
├── styles/             # CSS style files
└── utils/              # Utility helpers
```

---

## 🔐 Authentication & Authorization

### Authentication Flow
- **JWT-based** stateless authentication — tokens are issued on login/register and sent via `Authorization: Bearer <token>` headers
- **Password hashing** with `bcryptjs` (salt rounds: 10) via Mongoose `pre('save')` hook
- **Token payload** contains `userId` and `role`
- **Protected middleware** (`auth.middleware.js`) verifies token, checks user existence, and attaches `req.user`
- **Role middleware** (`role.middleware.js`) enforces RBAC at the route level

### User Roles & Access
| Role | Description | Access Level |
|---|---|---|
| `user` | Regular traveller | Public pages + booking/cart/profile |
| `operator` | Tour operator | Operator dashboard (requires admin approval) |
| `admin` | Platform administrator | Full admin dashboard |

### Route Guards (Frontend)
- **`ProtectedRoute`** — Redirects unauthenticated users to `/login`; optionally checks role
- **`GuestRoute`** — Redirects already-authenticated users away from auth pages

### Registration Flows
- **User Registration**: Immediate JWT issued; welcome email sent
- **Operator Registration**: Account created with `isApproved: false`; no JWT issued; operator must await admin approval before logging in
- **Admin Elevation**: Only admins can promote users to admin role via admin panel

### Password Security
- Forgot Password: Generates a secure `crypto.randomBytes(32)` token, SHA-256 hashed before DB storage; raw token sent via email link; expires in **1 hour**
- Reset Password: Verifies hashed token against DB; clears token on success
- Change Password: Verifies current password before allowing update

---

## 🗃️ Data Models (19 Mongoose Models)

### Core Models

#### `User`
- Fields: `name`, `email` (unique, lowercase), `password` (bcrypt-hashed, hidden by default), `role` (user/operator/admin), `isActive`, `isApproved`, `passwordResetToken`, `passwordResetExpires`
- Methods: `matchPassword(candidatePassword)` — bcrypt comparison

#### `Tour`
- Fields: `operatorId` (ref: User), `title`, `description`, `price`, `ratingAverage`, `ratingCount`, `categoryId`, `locationId`, `coordinates` (lat/lng), `city`, `country`, `images[]`, `inclusions[]`, `exclusions[]`, `itinerary[]`, `isActive`
- **Indexes**: `price (asc)`, `ratingAverage (desc)`, `locationId`, `categoryId`

#### `Booking`
- Fields: `userId`, `tourId`, `availabilityId`, `bookingDate`, `slotsBooked`, `totalPrice`, `status` (confirmed/cancelled), `paymentIntentId`, `basePricePerSlot`, `finalPricePerSlot`, `appliedPricingRule`, `promoCodeUsed`, `promoDiscount`
- **Indexes**: `userId`, `tourId`

#### `Review`
- Fields: `userId`, `tourId`, `bookingId`, `rating` (1–5), `reviewText`, `sentiment` (positive/neutral/negative/pending), `sentimentScore`, `sentimentConfidence`, `sentimentAnalyzedAt`
- **Index**: `tourId`

#### `Availability`
- Tracks per-date slot availability for each tour: `tourId`, `date`, `totalSlots`, `availableSlots`, `bookedSlots`, `priceOverride`, `isActive`
- Uses `$inc` atomic updates to prevent double-booking concurrency issues

#### `Operator`
- Extended operator profile: `userId`, `companyName`, `phone`, `address`, `isApproved`

#### `Location`
- Geocoded location data: `name`, `address`, `city`, `state`, `country`, `coordinates` (GeoJSON Point), `placeId`, `displayName`

### Pricing & Promotions Models

#### `PricingRule`
- Dynamic pricing rule: `tourId`, `name`, `type` (dayofweek/seasonal/earlybird/lastminute/demand), `adjustmentType` (percentage/fixed), `adjustmentValue`, `conditions` (JSON), `priority`, `isActive`

#### `Promotion`
- Promo codes: `code` (unique, uppercase), `description`, `discountType` (percentage/fixed), `discountValue`, `minOrderAmount`, `maxDiscountAmount`, `validFrom`, `validTo`, `usageLimit`, `usedCount`, `applicableTours[]`, `isActive`, `createdBy`

### Messaging Models

#### `Conversation`
- `participants[]` (ref: User), `tourId`, `lastMessage`, `lastMessageAt`, `lastMessageBy`, `isReadBy[]`, `status` (open/closed)

#### `Message`
- `conversationId`, `senderId`, `content`, `messageType` (text/system/inquiry), `isRead`, `readAt`

### AI Models

#### `RecommendationCache`
- `userId`, `recommendedTours[]` — caches AI-generated tour recommendations per user

#### `ChatbotConversation`
- `userId`, `message`, `reply` — persists chatbot interaction logs

#### `SentimentResult`
- `tourId`, `positiveCount`, `neutralCount`, `negativeCount`, `averageSentimentScore`
- Has a static method `recalculateForTour(tourId)` — recomputes aggregate sentiment after every new review

### Admin & System Models

#### `AdminLog`
- `adminId`, `action`, `targetType` (user/operator/tour), `targetId`, `createdAt` — full audit trail of admin actions

#### `Cart`
- `userId`, `items[]` — each item: `tourId`, `availabilityId`, `slotsBooked`, `basePricePerSlot`, `pricePerSlot`

#### `DemoPaymentIntent`
- Simulates Stripe payment intents when Stripe keys are unavailable: `paymentIntentId`, `clientSecret`, `amount`, `currency`, `metadata`

---

## 🌐 API Endpoints (14 Route Groups)

### Auth Routes — `/api/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register a new user |
| POST | `/register/operator` | Register a new operator (pending approval) |
| POST | `/login` | Login and receive JWT |
| GET | `/me` | Get current user profile + cart count + unread messages |
| PUT | `/profile` | Update name/email |
| PUT | `/change-password` | Change password (requires current password) |
| POST | `/forgot-password` | Send password reset email |
| POST | `/reset-password` | Reset password via token |

### Tour Routes — `/api/tours`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get all tours (with filters: city, minPrice, maxPrice, rating, category, date, minSlots, nearLat/Lng, sort, pagination) |
| GET | `/:tourId` | Get single tour details (with category, location, operator populated) |
| GET | `/:tourId/availability` | Get future available dates (with spotsLeft, isAlmostFull) |
| POST | `/` | Create new tour (operator only) |
| PUT | `/:tourId` | Update tour (owner operator only) |
| DELETE | `/:tourId` | Delete tour (owner operator only) |
| GET | `/my/tours` | Get operator's own tours |
| POST | `/:tourId/availability` | Add availability slot |
| POST | `/:tourId/geocode` | Trigger manual geocoding |

### Booking Routes — `/api/bookings`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get user's bookings |
| PUT | `/:id/cancel` | Cancel a booking |

### Review Routes — `/api/reviews`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Submit a review (requires completed booking) |
| GET | `/:tourId` | Get all reviews for a tour |
| GET | `/:tourId/sentiment` | Get AI sentiment summary for a tour |

### Payment Routes — `/api/payment`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/create-intent` | Create Stripe/Demo payment intent with dynamic pricing |
| POST | `/webhook` | Stripe webhook handler (booking fulfillment) |
| GET | `/verify/:paymentIntentId` | Verify payment and retrieve booking |
| GET | `/history` | Get user's payment history |

### Cart Routes — `/api/cart`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get cart contents |
| POST | `/add` | Add item to cart |
| DELETE | `/remove/:itemId` | Remove item from cart |
| DELETE | `/clear` | Clear entire cart |
| POST | `/checkout-intent` | Create cart-level payment intent |

### Pricing Routes — `/api/pricing`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/rules` | Get operator's pricing rules |
| POST | `/rules` | Create a pricing rule |
| PUT | `/rules/:id` | Update a pricing rule |
| DELETE | `/rules/:id` | Delete a pricing rule |
| POST | `/calculate` | Calculate dynamic price for a booking |
| POST | `/validate-promo` | Validate a promo code |
| GET | `/promotions` | Get all promotions (admin) |
| POST | `/promotions` | Create a promotion (admin) |
| PUT | `/promotions/:id` | Update a promotion (admin) |
| DELETE | `/promotions/:id` | Delete a promotion (admin) |
| GET | `/promotions/operator` | Get promotions applicable to operator's tours |

### Admin Routes — `/api/admin`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | Get all users |
| GET | `/users/:id` | Get user detail with bookings & reviews |
| PUT | `/users/:id/deactivate` | Deactivate a user account |
| PUT | `/users/:id/promote` | Promote user to admin |
| GET | `/operators` | Get all operators |
| GET | `/operators/:id` | Get operator detail with tours, bookings, reviews |
| PUT | `/operators/:id/approve` | Approve or reject an operator |
| GET | `/tours` | Get all tours |
| PUT | `/tours/:id/deactivate` | Deactivate a tour |
| GET | `/logs` | Get admin action logs |

### Analytics Routes — `/api/analytics`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/operator/stats` | Operator stats (total tours, bookings, revenue, avg rating) |
| GET | `/operator/activity` | Recent bookings + reviews activity feed |
| GET | `/operator/sentiment` | Sentiment analytics for operator's tours |
| GET | `/operator/users/:id` | Details of a user who booked operator's tours |
| GET | `/platform/stats` | Platform-wide stats (users, operators, tours, bookings, top tours) |
| GET | `/platform/sentiment` | Platform-wide sentiment overview |

### AI Routes — `/api/ai`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/recommendations` | Get personalized tour recommendations (cached) |
| POST | `/chat` | Chat with AI travel assistant |

### Messaging Routes — `/api/messages`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/conversations` | Get all conversations for current user |
| POST | `/conversations` | Get or create a conversation with a recipient |
| GET | `/conversations/:id/messages` | Get paginated messages for a conversation |
| POST | `/conversations/:id/messages` | Send a message |
| POST | `/conversations/:id/close` | Close a conversation (operator/admin) |
| POST | `/inquiry` | Send an inquiry to a tour operator |
| GET | `/unread-count` | Get total unread conversation count |

### Other Routes
- **`/api/upload`** — Cloudinary file uploads via Multer
- **`/api/locations`** — Location search and geocoding
- **`/api/notifications`** — Notification retrieval

---

## 🤖 AI & Machine Learning Features

### 1. AI-Powered Tour Recommendations
- **Model**: LLaMA 3.3 70B (via Groq API)
- **Flow**: Builds a user profile from booking history → sends profile + active tours catalog to LLM → LLM returns top 5 tour IDs as JSON
- **Caching**: Recommendations are cached in MongoDB (`RecommendationCache`) to avoid redundant API calls
- **Frontend**: Displayed as a recommendations carousel on the homepage

### 2. AI Chatbot (Travel Assistant)
- **Model**: LLaMA 3.3 70B (via Groq API)
- **Grounded on real data**: System prompt injects the current active tours catalog, preventing hallucinations
- **Conversation history**: Full multi-turn conversation history is passed with each request
- **Frontend widget**: Floating chat bubble with quick-chip suggestions, typing indicator, auto-scroll, and conversation logging

### 3. Sentiment Analysis on Reviews
- **Model**: `cardiffnlp/twitter-roberta-base-sentiment-latest` (HuggingFace)
- **Non-blocking**: Triggered asynchronously after a review is submitted, so it doesn't delay the API response
- **Labels**: positive / neutral / negative (with confidence score and sentiment score computed as `positive - negative`)
- **Aggregation**: `SentimentResult` is recalculated for the tour after each new review
- **Analytics**: Operators can view per-tour sentiment ratios; admins see platform-wide sentiment overview with top positive and negative tours

---

## 💳 Payment System

### Stripe Integration
- **Payment Intents**: Created server-side; `client_secret` returned to frontend for Stripe Elements to handle PCI-compliant card input
- **Webhook Handler**: Listens to `payment_intent.succeeded` — atomically decrements `availableSlots`, creates `Booking` document, sends confirmation emails, and auto-creates a messaging thread between user and operator
- **Currency**: INR (₹)
- **Payment History**: Paginated list of past payments for the user

### Demo Mode
- When Stripe keys are unavailable, the system switches to a **Demo Payment Service** that creates fake payment intents stored in `DemoPaymentIntent`
- The checkout UI skips real card input in demo mode, allowing full end-to-end testing without a live Stripe key

### Cart Checkout
- Users can add multiple tours to a cart and check out all at once
- A single cart-level payment intent is created; on webhook success, all cart items are fulfilled simultaneously, the cart is cleared, and confirmation emails are sent for each booking

---

## 🧮 Dynamic Pricing Engine

The server-side pricing service applies configurable pricing rules **before** creating a payment intent.

### Pricing Rule Types
| Type | Logic |
|---|---|
| `dayofweek` | Matches specific days of the week (e.g., weekends) |
| `seasonal` | Matches a date range (e.g., festive season) |
| `earlybird` | Matches if booking date is X+ days in the future |
| `lastminute` | Matches if booking date is within X days |
| `demand` | Matches if current bookings for the date exceed a threshold |

- Rules are sorted by **priority** (highest first); the first matching rule wins
- Adjustments can be **percentage-based** or **fixed amount** (positive or negative)

### Promo Code System
- Admin-created promo codes stored in `Promotion` model
- Validation checks: code exists, is active, within validity dates, usage limit not exceeded, minimum order amount met, tour applicability
- Supports **percentage** and **fixed** discount types with optional `maxDiscountAmount` cap
- Usage count is incremented atomically via `$inc` on successful payment

---

## 🗺️ Geolocation & Maps

### Server-side Geocoding
- Uses **OpenStreetMap Nominatim API** with a 1 req/sec rate-limit delay for compliance
- Three operations: `geocodeAddress`, `reverseGeocode`, `searchPlaces`
- On tour creation: geocoding fires **asynchronously (non-blocking)** in the background; coordinates stored in `Location` model and denormalized on `Tour`
- Supports **proximity search**: `?nearLat=&nearLng=&radiusKm=` uses MongoDB `$near` geospatial operator

### Frontend Maps
- **Leaflet** + **React-Leaflet** renders interactive maps on the Tour Detail page
- **React-Leaflet-Cluster** clusters nearby tour markers for performance
- Marker click-throughs link to individual tour pages

---

## 📤 File Uploads

- **Multer** handles multipart form data; **Multer-Storage-Cloudinary** streams directly to Cloudinary (no local disk storage)
- **Cloudinary** stores and serves all tour images
- Images are stored as an array of URLs on the Tour model
- Upload endpoint protected; only authenticated operators can upload

---

## 📧 Email Notification System

**7 transactional email templates** built in responsive HTML, sent via Nodemailer:

| Template | Trigger |
|---|---|
| Welcome Email | User/operator registration |
| Booking Confirmation | Successful payment (sent to traveller) |
| New Booking Alert | Successful payment (sent to operator) |
| Booking Cancellation | Booking cancelled |
| Password Reset | Forgot password flow |
| Operator Approved | Admin approves operator |
| Operator Rejected | Admin rejects operator (with optional reason) |

- Emails are sent **asynchronously** (`.catch(console.error)`) to avoid blocking API responses

---

## 💬 Messaging System

- **Conversation-based** messaging between travellers and operators, linked to specific tours
- Conversations are auto-created when a booking is confirmed (**system message** with booking details is auto-sent)
- Users can also initiate **inquiry** messages before booking
- **Unread tracking**: `isReadBy[]` array on Conversation; messages marked read when the conversation is opened
- **Email notifications**: A preview of new messages is emailed to the recipient asynchronously
- Operators can **close** conversations
- Unread message count surfaced in the navbar and `getMe` response

---

## 👤 User-Facing Features

### Public Pages
- **Home Page** — Hero section, featured tours, category filters, AI recommendations carousel
- **Tours Page** — Full tour listing with filters (city, price range, rating, category, date, slots) and sorting
- **Tour Detail Page** — Image gallery, description, inclusions/exclusions, itinerary, interactive map, availability calendar, reviews with sentiment display, inquiry form

### Authenticated User Features
- **Booking Flow** — Select date + slots → dynamic price calculation with promo code → Stripe checkout → confirmation page
- **Cart** — Add multiple tours, view cart total, proceed to cart checkout
- **My Bookings** — View all bookings, cancel bookings, download PDF receipt (jsPDF)
- **Profile Page** — Update name/email, change password, view booking/payment history
- **Messages Page** — View all conversations, send/receive messages
- **AI Chatbot** — Floating widget available to authenticated users only, with quick chips, typing indicator, conversation memory

---

## 🏢 Operator Dashboard Features

| Page | Features |
|---|---|
| Dashboard Home | Stats (tours, bookings, revenue, avg rating), recent activity feed |
| My Tours | List all tours, toggle active/inactive, quick links to edit/availability/pricing |
| Create Tour | Multi-section form: basic info, images, location, itinerary, inclusions/exclusions |
| Edit Tour | Same form pre-populated with existing data |
| Availability Management | Add date slots with total capacity and optional price overrides; view existing slots |
| Bookings | View all bookings for operator's tours, with user details and tour info |
| Pricing Rules | Create/edit/delete dynamic pricing rules per tour; all 5 rule types supported |
| User Detail | View a specific user's profile and their booking history with the operator |

---

## 🛡️ Admin Dashboard Features

| Page | Features |
|---|---|
| Dashboard Home | Platform-wide stats (users, operators, tours, bookings, top 5 most-booked tours), sentiment overview |
| Operators | List all operators with approval status; link to detail page |
| Operator Detail | View company info, tours, recent bookings, reviews, revenue stats; **approve/reject** with email notification |
| Users | List all users; link to detail page |
| User Detail | View user profile, all bookings, all reviews; **deactivate** account |
| Tours | List all tours; **deactivate** individual tours |
| Promotions | Full CRUD for promo codes with all configuration options |

---

## 🔒 Security Implementations

- **JWT verification** on every protected route — token expiry, user existence check
- **Role-based access control (RBAC)** enforced at middleware level for all sensitive routes
- **Operator approval gate** — unapproved operators cannot create tours, activate tours, or log in
- **HTML injection prevention** — tour creation/update rejects any field containing HTML tags via regex
- **Email enumeration prevention** — Forgot password returns the same message whether or not the email exists
- **Secure password reset** — Tokens are SHA-256 hashed before storage; raw token only in email link
- **Duplicate review prevention** — One review per user per tour enforced at DB query level
- **Review eligibility** — Users can only review tours they have a completed booking for (booking date in the past)
- **Operator isolation** — Operators can only edit/delete their own tours; ownership is verified on every mutation
- **Admin log** — All admin actions (approve/reject/deactivate/promote) are recorded with timestamps
- **Body size limit** — JSON body capped at 10kb
- **Webhook security** — Stripe webhook signature verified using `STRIPE_WEBHOOK_SECRET`
- **Concurrency-safe slot booking** — `findOneAndUpdate` with `availableSlots: { $gte: slotsBooked }` condition prevents race conditions

---

## 🎨 Frontend Architecture Highlights

### State Management
- **AuthContext** — User session, login/logout, token persistence
- **CartContext** — Cart items, add/remove/clear, cart count in navbar
- **NotificationContext** — Notification state
- **TourFilterContext** — Shared filter state across Tours page

### API Layer
- Centralized **Axios API client** (`apiClient.js`) with request interceptors (auto-attach JWT from localStorage) and response interceptors (handle 401 → redirect to login)
- 12 dedicated service modules (one per backend feature) to keep API calls organized

### Reusable Components (19 components)
- `Navbar` — Dynamic links based on role, cart count badge, message badge, mobile responsive
- `ChatbotWidget` — Floating AI chat panel
- `TourCard` — Tour listing card with image, price, rating
- `ReviewCard` + `ReviewsSection` + `WriteReviewForm` — Full review flow
- `StarRating` — Interactive star rating input
- `RecommendationsCarousel` — AI-powered tour slider
- `MapComponent` — Leaflet map wrapper
- `ImageUploader` — Drag-and-drop image upload
- `DataTable` — Reusable admin table
- `FilterChips` — Category filter chips
- `AdminSidebar` + `OperatorSidebar` — Role-specific navigation
- `FormInput` + `FormError` + `Button` — Consistent form UI components

### Layouts
- **MainLayout** — Public/user-facing shell (Navbar + Outlet + ChatbotWidget)
- **DashboardLayout** — Sidebar + content area for operator/admin dashboards
- **AuthLayout** — Clean centered layout for login/register/forgot-password pages

### Client-Side PDF Generation
- **jsPDF** used on the My Bookings page to generate and download a formatted booking receipt PDF directly in the browser

---

## 📊 Analytics & Reporting

### Operator Analytics
- Total tours, total bookings, total revenue, average rating — via MongoDB aggregation pipelines
- Recent activity feed combining bookings + reviews (merged and sorted by date)
- Per-tour sentiment ratio analysis

### Admin / Platform Analytics
- Parallel DB counts using `Promise.all()` for performance
- Top 5 most-booked tours via `$group` aggregation
- Platform-wide sentiment overview: total positive/neutral/negative reviews, overall sentiment score, top 5 most positive and most negative tours

---

## 🔧 Development Features

- **Postman Collection** included (`Tours & Activity Booking API.postman_collection.json`) with all API endpoints pre-configured
- **`.env.example`** files provided for both client and server documenting all required environment variables
- **Morgan** request logging (development mode only, password reset routes suppressed for security)
- **Demo Payment Mode** — system auto-detects missing Stripe keys and falls back to demo mode for development
- **Global Error Handler** — Centralized Express error middleware handles Mongoose validation errors, duplicate key errors, CastErrors, JWT errors, and generic 500 errors with structured JSON responses

---

## 📋 Environment Variables Required

### Server
```
MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS
GROQ_API_KEY, HUGGINGFACE_API_KEY
CLIENT_URL, NODE_ENV
```

### Client
```
VITE_API_URL, VITE_STRIPE_PUBLISHABLE_KEY
```

---

## 🌟 Key Technical Achievements (Resume Highlights)

1. **Built a full-stack MERN marketplace** with three distinct role-based portals (User, Operator, Admin) and 40+ API endpoints
2. **Integrated Groq LLaMA 3.3 70B** for AI-powered tour recommendations (with MongoDB caching) and a context-aware travel chatbot
3. **Implemented HuggingFace NLP sentiment analysis** on user reviews with non-blocking async processing and aggregate analytics dashboards
4. **Built a dynamic pricing engine** supporting 5 rule types (day-of-week, seasonal, early-bird, last-minute, demand-based) with promo code validation
5. **Integrated Stripe Payments** with server-side payment intent creation, webhook-based booking fulfillment, and a built-in demo mode for development
6. **Implemented real-time geolocation features** using OpenStreetMap Nominatim for tour geocoding and Leaflet maps with clustered markers
7. **Designed a complete messaging system** with conversation threads, unread tracking, system-generated messages on booking, and email notifications
8. **Built 7 transactional HTML email templates** triggered across the booking, authentication, and admin workflows
9. **Engineered concurrency-safe slot booking** using MongoDB atomic `findOneAndUpdate` with slot count conditions
10. **Implemented admin audit logging** tracking all admin actions with timestamps for full traceability
11. **Generated client-side PDF receipts** using jsPDF in the browser without any server-side rendering
