# <%= projectName %> — Frontend

User-facing React application for **<%= projectName %>**, built with **React 18 + Vite + Tailwind CSS**. Includes JWT authentication, encrypted API communication, real-time notifications via Socket.IO, and modules for profile, transactions, feedback, plans, and help content.

## Quick Start

```bash
cp .env.example .env
npm install
npm run dev
```

The app runs at `http://localhost:5173` by default and talks to the API through `VITE_API_BASE_URL`.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API base URL (e.g. `http://localhost:4000`) |

Crypto mode (`CRYPTO_SECURE_ENCRYPTION`, `SECRET_KEY`, `ENCRYPTION_IV`) is **not** configured here — it is fetched at runtime from `GET /settings/crypto` on the API.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build for production (output in `dist/`) |
| `npm run preview` | Preview the production build locally |

## Features

- **Authentication** — Login, Register, Email verification, Auto-login, Forgot/Reset/Change password
- **Home & Plans** — Landing page and plan listing
- **Profile** — View/update your profile
- **Transactions** — View your transactions and download/email invoices
- **Notifications** — Live notification bell, list, read/unread, dismiss (Socket.IO + REST)
- **Feedback** — Public feedback/contact form + "My Feedback" with support replies
- **Help Center** — FAQ listing and help content from the API
- **Legal pages** — Terms of Service, Privacy Policy (content from the API)
- **Encrypted API client** — Axios interceptors transparently encrypt requests and decrypt responses (crypto-secure or AES-CBC, per API config)
- **Real-time** — Socket.IO client with JWT auth for presence and notification events
- **Dark UI** — Tailwind CSS design system

## Pages / Routing

| Route | Page |
|-------|------|
| `/` | Home |
| `/login` | Login |
| `/register` | Signup |
| `/verify-email` | Email verification |
| `/autologin` | Auto-login handler |
| `/forgot-password` | Forgot password |
| `/reset-password` | Reset password |
| `/profile` | Profile (protected) |
| `/change-password` | Change password (protected) |
| `/transactions` | Transactions (protected) |
| `/notifications` | Notifications (protected) |
| `/my-feedback` | My Feedback (protected) |
| `/my-feedback/:id` | Feedback detail (protected) |
| `/help` | Help Center |
| `/privacy-policy` | Privacy Policy |
| `/terms` | Terms of Service |
| `/feedback` | Feedback form |
| `/plans` | Plan listing |

## Project Structure

```
src/
├── App.jsx                          # Routes
├── main.jsx                         # Entry point
├── index.css                        # Tailwind CSS
├── Pages/                           # Route components
│   ├── Login/
│   ├── Signup/
│   ├── Profile/
│   ├── Transactions/
│   ├── Notifications/
│   ├── Feedback/
│   ├── MyFeedback/
│   ├── MyFeedbackDetail/
│   ├── HelpCenter/
│   ├── PlanListing.jsx
│   └── ...
├── components/
│   ├── common/                      # Navbar, ProtectedRoute, Pagination, Toast, ...
│   ├── global/                      # Layout, profile panels
│   └── AuthLayout/
├── context/                         # AuthContext, SocketContext, ConfirmContext
├── methods/api/                     # Axios API modules (auth, feedback, settings, ...)
│   └── apiClient.jsx                # Encrypted axios client + interceptors
├── models/
│   └── encryptDecrypt.js            # AES / crypto-secure client helpers
└── utils/
```

## API Integration & Encryption

All API calls go through the axios client in `src/methods/api/apiClient.jsx`:

1. On startup, the client fetches `GET /settings/crypto` to learn the active encryption mode.
2. Request bodies/params are encrypted before being sent (crypto-secure ECDH/RSA envelope or AES-CBC hex, per config).
3. Response `data` is decrypted transparently by the response interceptor.
4. Every response uses the normalized envelope — the payload is always under `res.data.data`:

```json
{ "success": true, "code": 200, "message": "…", "data": { } }
```

## Tech Stack

| Area | Choice |
|------|--------|
| Framework | React 18 |
| Build tool | Vite 5 |
| Styling | Tailwind CSS |
| Routing | react-router-dom |
| HTTP | axios |
| Encryption | crypto-secure (Web Crypto API) / AES-CBC |
| Real-time | socket.io-client |
| Icons | react-icons |
| Linting / Formatting | ESLint (flat config) + Prettier |