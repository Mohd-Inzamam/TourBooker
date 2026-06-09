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

Project Overview

- Full-stack MERN marketplace for tours & activities with three roles: Traveller, Tour Operator, Admin.
- Key flows: registration/login (JWT), operator onboarding, booking & payments (Stripe + demo mode), messaging, AI recommendations & chatbot, sentiment analytics, admin audit logs.
- See full architecture & docs: project_documentation.md and client README: client/README.md.

# Live Demo

https://tour-booker.vercel.app/

Features

- Role-based portals (User / Operator / Admin)
- Stripe payments with demo fallback (see [`DemoPaymentIntent`](server/src/models/demoPaymentIntent.model.js))
- Client-side PDF receipts via jsPDF (see client/src/services/receipt.service.js)
- AI recommendations & chatbot (client [`sendChatMessage`](client/src/services/ai.service.js), server [`callGroqAPI`](server/src/services/ai.service.js))
- Messaging system with unread tracking and email notifications
- Admin audit logs, analytics & sentiment dashboards

Tech Stack

- Frontend: React (Vite) — entry: [client/src/main.jsx](client/src/main.jsx)
- Backend: Node.js + Express — entry: [server/server.js](server/server.js) and app config [server/app.js](server/app.js)
- DB: MongoDB (Mongoose)
- Payments: Stripe (with demo mode)
- File uploads: Cloudinary + Multer
- AI: Groq (LLaMA) + HuggingFace sentiment
- PDF: jsPDF
- HTTP client: Axios (central API client in client/api)

Architecture

- Frontend: component + layout structure (see [client/src/layout/MainLayout.jsx](client/src/layout/MainLayout.jsx) and [client/src/layout/DashboardLayout.jsx](client/src/layout/DashboardLayout.jsx)), contexts for Auth/Cart/Notifications, centralized API client.
- Backend: MVC-style controllers and routes under `server/src/` (controllers, routes, services, models, utils). Example controllers: payment & analytics.
- CI/dev helpers: Postman collection included: server/Tours & Activity Booking API.postman_collection.json
- Detailed architecture: project_documentation.md

## Screenshots

Screenshots are included in the repository at: /client/src/assets/screenshots

Example markdown to display one of these images:

![LandingPage](/client/src/assets/screenshots/LandingPage.png)
![AdminPanel](/client/src/assets/screenshots/AdminPanel.png)
![AIChatBot](/client/src/assets/screenshots/AIChatBot.png)
![OperatorDashboard](/client/src/assets/screenshots/OperatorDashboard.png)
![Message&Enquiry](/client/src/assets/screenshots/Message&Enquiry.png)

Installation

1. Clone repo and install server & client:
   - Server:
     ```sh
     cd server
     npm install
     npm run dev   # starts server (nodemon)
     ```
   - Client:
     ```sh
     cd client
     npm install
     npm run dev   # starts Vite dev server
     ```
2. Open two terminals (server + client) or use your preferred process manager.

Environment Variables

- Copy examples and set values:
  - Server example: [.env.example](http://_vscodecontentref_/0) — includes MONGO_URI, JWT_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, DEMO_MODE
  - Client example: [.env.example](http://_vscodecontentref_/1) — VITE_API_BASE_URL, VITE_STRIPE_PUBLISHABLE_KEY, VITE_DEMO_MODE
- Important: DEMO*MODE=true will use demo payment intents (see [DemoPaymentIntent](http://\_vscodecontentref*/2)).

Quick Links (important files)

- Frontend entry: [main.jsx](http://_vscodecontentref_/3)
- Router: [routes.jsx](http://_vscodecontentref_/4)
- Chatbot: [ChatbotWidget.jsx](http://_vscodecontentref_/5)
- AI client service: [ai.service.js](http://_vscodecontentref_/6)
- Receipt generator: [receipt.service.js](http://_vscodecontentref_/7)
- Server entry: [server.js](http://_vscodecontentref_/8)
- App & middleware: [app.js](http://_vscodecontentref_/9)
- Demo payment model: [demoPaymentIntent.model.js](http://_vscodecontentref_/10)

Future Enhancements

- Real-time features via WebSockets (live booking updates, real-time chat)
- Expand AI personalization & on-device caching
- Multi-currency & tax rules extension for pricing engine
- End-to-end tests & CI pipelines
- Docker compose dev environment and deployment manifests
