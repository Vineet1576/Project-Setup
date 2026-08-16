# <%= projectName %> — Admin Panel

Administration dashboard for **<%= projectName %>**, built with **React 18 + Vite + Tailwind CSS**. Manage users, roles, plans, transactions, categories, content, feedback, features, notifications, FAQs, and site settings with charts, tables, filters, and encrypted API communication.

## Quick Start

```bash
cp .env.example .env
npm install
npm run dev
```

The app runs at `http://localhost:5174` by default and talks to the API through `VITE_API_BASE_URL`. Log in with the seeded admin credentials (see `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in the API `.env`, e.g. `admin@test.com` / `Admin@123`).

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

- **Login** — Admin login against the API
- **Dashboard** — Stats + charts (recharts) from `/admin-dashboard/stats`
- **Users** — List, search, filter, paginate, add, view, edit, delete, status & approval toggles
- **Roles** — List, add, view, edit, delete roles
- **Plans** — List, add, view, edit, delete plans, status toggles
- **Transactions** — List and view transactions, send/download invoice PDFs
- **Categories** — List, add, edit, delete, status toggles
- **Content Management** — List, add, view, edit, delete site content (help/terms/privacy pages)
- **Feedback Inbox** — List, view details, reply to users, change status, delete
- **Features** — List, add, edit, delete, status toggles
- **Notifications** — List/view notifications and broadcast to all users
- **FAQs** — List, add, view, edit, delete, status toggles
- **Settings** — Edit site, contact, crypto/config, SMTP and security settings
- **Profile & Password** — Admin profile and change password
- **Encrypted API client** — Axios interceptors transparently encrypt requests and decrypt responses
- **Real-time** — Socket.IO client for live notification events

## Pages / Routing

| Route | Page |
|-------|------|
| `/login` | Login |
| `/` | Dashboard |
| `/users` | Users list |
| `/users/add` · `/users/view` · `/users/edit` | User add/view/edit |
| `/roles` | Roles list |
| `/roles/add` · `/roles/view` · `/roles/edit` | Role add/view/edit |
| `/plans` | Plans list |
| `/plans/add` · `/plans/view` · `/plans/edit` | Plan add/view/edit |
| `/transactions` | Transactions list |
| `/transactions/view` | Transaction detail |
| `/categories` | Categories list |
| `/categories/add` · `/categories/edit` | Category add/edit |
| `/content-management` | Content list |
| `/content-management/add` · `/view` · `/edit` | Content add/view/edit |
| `/feedback` | Feedback inbox |
| `/feedback/view` | Feedback detail + reply |
| `/features` | Features list |
| `/features/add` · `/features/edit` | Feature add/edit |
| `/notifications` | Notifications list |
| `/notifications/view` | Notification detail |
| `/notifications/broadcast` | Broadcast to users |
| `/faqs` | FAQs list |
| `/faqs/add` · `/faqs/view` · `/faqs/edit` | FAQ add/view/edit |
| `/settings` | Site settings |
| `/profile` | Admin profile |
| `/change-password` | Change password |

## Project Structure

```
src/
├── App.jsx                          # Routes
├── main.jsx                         # Entry point
├── index.css                        # Tailwind CSS
├── pages/                           # Route components
│   ├── Dashboard/
│   ├── users/
│   ├── roles/
│   ├── Plans/
│   ├── Transactions/
│   ├── Categories/
│   ├── ContentManagement/
│   ├── Feedback/
│   ├── Features/
│   ├── Notifications/
│   ├── Faqs/
│   ├── Settings/
│   ├── Login/
│   ├── Profile/
│   └── ChangePassword/
├── components/
│   ├── common/                      # DataTable, TableFilters, Pagination, Skeleton, ...
│   ├── global/                      # Sidebar layout
│   └── ...
├── context/                         # AuthContext, RecordContext, ConfirmContext
├── methods/api/                     # Axios API modules (users, roles, plans, ...)
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
| Charts | recharts |
| Encryption | crypto-secure (Web Crypto API) / AES-CBC |
| Real-time | socket.io-client |
| Icons | react-icons |
| Linting / Formatting | ESLint (flat config) + Prettier |