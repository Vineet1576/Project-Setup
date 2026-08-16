# create-project

A CLI tool that scaffolds a **full-stack project** — pick from **API (Express + MongoDB with Repository Pattern)**, **Frontend (React + Vite)**, or **Admin Panel (React + Vite)** — all in one command. Features JWT authentication, hybrid encryption (RSA+AES-GCM or AES-CBC), user & role management, real-time chat & presence via Socket.IO, live notifications, Stripe subscriptions with invoices, and optional GitHub push.

## 🌟 Why This Stands Out

| Feature | What makes it different |
|---------|------------------------|
| **Defense-in-depth security** | Rate limiting (per-IP), strict CORS, Helmet headers, payload size limits — not just JWT |
| **Zero key files on disk** | RSA keypair auto-generated and stored directly in `.env` — no `keys/` directory to leak |
| **Hybrid encryption, zero config** | RSA+AES-GCM or AES-CBC — toggle via the database. Frontend fetches crypto config at runtime |
| **Secret auto-injection** | Run with `CRYPTO_SECURE_ENCRYPTION=true` and missing keys? The server generates them and writes to `.env` for you |
| **Dev-safe rate limiting** | Rate limits automatically disable when `NODE_ENV=development` — no Postman friction |
| **Production-hardened logging** | `combined` format in prod, `dev` format in development — no sensitive data leaked to logs |
| **Conditional seeding** | Default roles and admin user only seed when `RUN_SEED=true` is set. Admin credentials configurable via `.env` |
| **CORS deny-by-default** | If `CORS_ORIGIN` is not set, all cross-origin requests are denied — safe fallback |
| **Stateless JWT Bearer auth** | No cookies, no CSRF surface — immune to CSRF attacks by design |
| **End-to-end encryption** | Frontend encrypts before sending, server decrypts on arrival. Not just transport-level TLS |
| **Repository Pattern** | All database logic isolated behind a repository layer — swap MongoDB for PostgreSQL without touching services |
| **Real-time out of the box** | Socket.IO presence/status, typing indicators, chat messages, and live notification events |
| **Billing ready** | Stripe subscription purchase/cancel/webhook, invoice PDF generation and emailing |

## Usage

```bash
npx @vineet1576/create-project my-app
```

Or install globally:

```bash
npm install -g @vineet1576/create-project
create-project my-app
```

## Interactive Selection

Pick a single platform using arrow keys:

```
? Select a platform to create:
❯ API (Backend)
  Frontend (React + Vite)
  Admin Panel (React + Vite)
```

Based on your choice, the CLI adapts the prompts:

| Platform | Prompts shown |
|----------|-------|
| **API** | .env config (DB, JWT, SMTP), encryption mode, Git, GitHub |
| **Frontend** | Git, GitHub (no DB/JWT prompts) |
| **Admin Panel** | Git, GitHub (no DB/JWT prompts) |

The CLI also asks for a **Node.js version** (18 / 20 LTS / 22 / custom) which is written into each generated `package.json` (`engines`) and a `.nvmrc`.

## What You Get

### API (Express + MongoDB)

- **Repository Pattern** — All database logic in `repositories/` layer. Services never touch ORMs.
- **Polyglot-ready** — Add PostgreSQL or any other database without changing existing services.
- **JWT auth** — Register, login (user/admin), auto-login, logout
- **User module** — Profile, password management, forgot/reset password, email verification (OTP + encrypted one-time "Verify & Login" links)
- **Admin user management** — Paginated listing, search, filter, CRUD, status/approval
- **Role module** — Create, update, list, delete roles
- **Category & Feature modules** — Full CRUD with status toggles
- **Content management** — Site content CRUD (used for terms/privacy/help pages)
- **Feedback module** — Public form submission, admin inbox with replies, status changes (frontend "My Feedback" tracking)
- **FAQ module** — Public listing, categories, and admin CRUD
- **Plans & Subscriptions** — Plan CRUD and Stripe checkout / cancel / webhook
- **Transactions & Invoices** — Paginated listing, invoice PDF generation + email + download
- **Notifications** — Per-user notifications, read/dismiss, unread count, admin broadcast
- **Real-time** — Socket.IO presence, status, chat events, and live notification push
- **Uploads** — Images (multipart + base64), documents, multiple documents, video, audio
- **Admin dashboard stats** — Aggregated counts for the admin panel
- **Encryption** — Crypto-secure (RSA+AES-GCM) or legacy (AES-CBC), env-configurable
- **Email** — Nodemailer with SMTP, ready-to-use HTML templates
- **Security** — Rate limiting, CORS (deny-by-default), Helmet, bcrypt, JWT, payload limits

### Frontend (React + Vite)

- Auth: Login, Register, Email Verification, Auto-login, Forgot/Reset/Change Password
- Home, Plan listing, Profile, Transactions, Notifications
- Feedback form + My Feedback (with support replies)
- Help Center, Terms of Service, Privacy Policy
- Tailwind CSS, dark UI, axios interceptors with transparent request encryption
- Fetches crypto config (`CRYPTO_SECURE_ENCRYPTION`, `SECRET_KEY`, `ENCRYPTION_IV`) from the API at runtime
- Socket.IO client for live notifications

### Admin Panel (React + Vite)

- Admin login, Dashboard with charts and stats
- Users, Roles, Plans, Transactions, Categories, Content Management, Feedback inbox, Features, Notifications (view + broadcast), FAQs, Settings, Profile
- Sidebar navigation, DataTable, filters, modals, recharts
- Fetches crypto config from the API at runtime

## API Response Format

Every API response follows one normalized envelope:

```json
// success — single resource
{ "success": true, "code": 200, "message": "…", "data": { } }

// success — list (pagination inside `data`)
{ "success": true, "code": 200, "message": "…", "data": { "list": [], "total": 0, "page": 1, "count": 10 } }

// success — void / mutation
{ "success": true, "code": 200, "message": "…", "data": null }

// error
{ "success": false, "code": 400, "message": "…", "error": { "code": 400, "message": "…" }, "data": null }
```

When encryption is active the `data` value is encrypted (AES-CBC hex, or a crypto-secure ECDH/RSA envelope) and the clients decrypt it transparently via axios interceptors.

## Security Architecture

### Rate Limiting (Per-IP)
| Endpoint type | Limit | Dev mode |
|---------------|-------|----------|
| Auth (`/login`, `/register`, etc.) | 15 requests/minute | Disabled |
| General (all other routes) | 100 requests/minute | Disabled |

Limits apply per-IP. 100 users from 100 different IPs can each hit login 15 times per minute.

### CORS
- `CORS_ORIGIN` must be explicitly set in production
- **No wildcard fallback** — if unset, all cross-origin requests are denied
- Supports multiple origins via comma: `https://site1.com,https://site2.com`

### Payload Limits
| Content type | Limit | Why |
|-------------|-------|-----|
| JSON | 5MB | Accommodates base64 image uploads |
| URL-encoded | 50MB | Handles encryption overhead (encrypted payloads can be ~2x larger) |

### Key Management
- RSA keypair is **never stored in a file on disk**
- Auto-generated on first run and written directly to `.env`
- Both private and public keys live exclusively in environment variables
- Legacy mode uses a shared `SECRET_KEY` and `ENCRYPTION_IV` fetched from the API (`/settings/crypto`) at runtime

### Logging
- **Production**: `combined` format (Apache-standard, no sensitive data)
- **Development**: `dev` format (colored, detailed for debugging)

## Encryption Options

| Mode | Algorithm | Key storage | Auto-generate |
|------|-----------|-------------|---------------|
| **crypto-secure** (`CRYPTO_SECURE_ENCRYPTION=true`) | ECDH P-256 + AES-256-GCM (RSA-2048 OAEP fallback) | `.env` vars | ✅ First run writes keys to `.env` |
| **Legacy** (`CRYPTO_SECURE_ENCRYPTION=false`) | AES-CBC with shared secret | Database settings (`config` collection) | ❌ Must set in the admin settings UI |

When crypto-secure is enabled, the server automatically generates keys on first run and exposes `/.well-known/encryption-key`. Frontend/admin clients fetch the crypto config from `GET /settings/crypto` at runtime and handle encryption transparently via Axios interceptors.

## Architecture — Repository Pattern

All database logic is isolated behind a **repository layer**. Services never touch ORMs or queries directly. Every repository method returns a **plain JavaScript object** with string IDs — never a Mongoose document.

```js
// Repository output — always a plain object
{ id: "abc123", name: "admin", status: "active" }
```

### Architecture Overview

<img src="https://raw.githubusercontent.com/Vineet1576/Project-Setup/main/docs/diagrams/architecture.svg" alt="Architecture Overview">

### Request Flow

<img src="https://raw.githubusercontent.com/Vineet1576/Project-Setup/main/docs/diagrams/request-flow.svg" alt="Request Flow">

### Services & Repositories Map

| Service | Repository | Database |
|---------|-----------|----------|
| `userService.js` | `userRepository.js` | MongoDB |
| `roleService.js` | `roleRepository.js` | MongoDB |
| `categoryService.js` | `categoryRepository.js` | MongoDB |
| `feedbackService.js` | `feedbackRepository.js` | MongoDB |
| `contentManagementService.js` | `contentManagementRepository.js` | MongoDB |
| `featureService.js` | `featureRepository.js` | MongoDB |
| `planService.js` | `planRepository.js` | MongoDB |
| `subscriptionService.js` | `subscriptionRepository.js` | MongoDB |
| `transactionService.js` | `transactionRepository.js` | MongoDB |
| `notificationService.js` | `notificationRepository.js` | MongoDB |

### Adding a New Database Tomorrow

The repository pattern makes polyglot persistence additive, not invasive.

#### Scenario: Add PostgreSQL for Orders

<img src="https://raw.githubusercontent.com/Vineet1576/Project-Setup/main/docs/diagrams/polyglot-postgres.svg" alt="Add PostgreSQL for Orders">

1. Create `models/postgres/Order.js` — Sequelize model
2. Create `repositories/orderRepository.js` — wraps Sequelize queries
3. Export it from `repositories/index.js`
4. Services import `orderRepo` and use it — zero impact on existing MongoDB code

All 10 MongoDB-based services continue working unchanged.

#### Scenario: Migrate Users from MongoDB to PostgreSQL

Change **1 file** — `repositories/userRepository.js`:

```js
exports.findByEmail = async (email) => {
  if (config.USE_PG_FOR_USERS) {
    return pgUserRepo.findByEmail(email);  // Sequelize query
  }
  return mongoUserRepo.findByEmail(email); // Mongoose query
};
```

All 12 services that call `userRepo.findByEmail()` continue working unchanged.

### Repository Pattern Rules

1. **Methods return plain objects** — `{ id: string, ... }`, never Mongoose documents
2. **null for not-found** — never throw from a repo; let the service decide
3. **lean() on all queries** — no Mongoose document overhead
4. **All ORM-specific syntax inside repos** — `$lookup`, `$match`, `.populate()` never leak to services
5. **Services do business logic** — validation, authorization, email sending, cross-repo orchestration

---

## Generated Project Structure

### If you chose **API**:
```
my-app/
├── src/
│   ├── app.js
│   ├── config/
│   │   └── db.config.js
│   ├── controllers/                  # Route handlers
│   ├── Emails/                       # Email templates
│   ├── middleware/                    # Auth, decrypt, error handler
│   ├── models/                       # Mongoose schemas (MongoDB)
│   ├── repositories/                 # ★ DATABASE LAYER ★
│   │   ├── repositoryUtils.js        # Shared helpers
│   │   ├── index.js                  # Barrel export
│   │   └── ... (one per domain)
│   ├── routes/                       # Express routers
│   ├── services/                     # ★ BUSINESS LOGIC ★
│   ├── utils/                        # Helpers, constants, response
│   ├── validations/                  # Joi schemas
│   └── views/                        # Static HTML
├── public/                           # Uploaded files (img, document, video, audio)
├── .env
├── .env.example
├── ecosystem.config.js
├── package.json
└── seed.js
```

### If you chose **Frontend**:
```
my-app/
├── src/
│   ├── Pages/                        # Route components (Login, Home, Profile, ...)
│   ├── components/
│   ├── context/                      # Auth, Socket, Confirm providers
│   ├── methods/api/                  # Axios API modules + encrypted client
│   ├── models/                       # encryptDecrypt helpers
│   ├── utils/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example
├── .gitignore
├── .prettierrc
├── eslint.config.js
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

### If you chose **Admin Panel**:
```
my-app/
├── src/
│   ├── pages/                        # Dashboard, Users, Roles, Plans, Settings, ...
│   ├── components/
│   ├── context/                      # Auth, Record, Confirm providers
│   ├── methods/api/                  # Axios API modules + encrypted client
│   ├── models/                       # encryptDecrypt helpers
│   ├── utils/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example
├── .gitignore
├── .prettierrc
├── eslint.config.js
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## Backend API Endpoints

All endpoints are mounted at `/api` (configurable). Responses follow the normalized envelope described above.

### User (`/users`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/users/register` | Register new user (sends verify link) |
| POST | `/users/signup` | Register via app |
| POST | `/users/login` | User login |
| POST | `/users/admin/login` | Admin login |
| POST | `/users/app-login` | Mobile app login |
| POST | `/users/auto-login` | Auto-login from token |
| POST | `/users/logout` | Logout |
| GET | `/users/profile` | Get own profile |
| PUT | `/users/edit-profile` | Update profile |
| PUT | `/users/change-password` | Change password |
| PUT | `/users/reset-password` | Reset password with OTP |
| POST | `/users/set-password` | Set initial password |
| POST | `/users/forgot-password` | Send forgot password OTP |
| POST | `/users/admin/forgot-password` | Admin forgot password |
| GET | `/users/verify` | Verify email via link (auto-login) |
| POST | `/users/verify-otp` | Verify OTP |
| PUT | `/users/resend-otp` | Resend verification OTP |
| POST | `/users/add` | Admin — add user |
| GET | `/users/list` | Admin — list users |
| PUT | `/users/change-status` | Admin — activate/deactivate |
| PUT | `/users/change-approval-status` | Admin — approve/reject |
| DELETE | `/users/delete` | Admin — soft-delete user |
| GET | `/users/reset-link-expired` | Expired link info page |

### Role (`/roles`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/roles/add` | Create role |
| GET | `/roles/detail` | Get role by ID |
| PUT | `/roles/update` | Update role |
| GET | `/roles/listing` | List roles (paginated) |
| PUT | `/roles/status/change` | Activate/deactivate role |
| DELETE | `/roles/delete` | Soft-delete role |
| GET | `/roles/frontend-list` | Active roles for dropdowns |

### Category (`/category`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/category/add` | Create category |
| GET | `/category/detail` | Get category by ID |
| PUT | `/category/update` | Update category |
| DELETE | `/category/delete` | Delete category |
| GET | `/category/listing` | List categories (paginated) |
| PUT | `/category/status/change` | Activate/deactivate |
| GET | `/category/sub/listing` | List sub-categories |

### Feedback (`/feedback`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/feedback/add` | Submit feedback / contact form |
| GET | `/feedback/detail` | Get feedback by ID |
| PUT | `/feedback/update` | Update feedback |
| DELETE | `/feedback/delete` | Soft-delete feedback |
| GET | `/feedback/listing` | List feedback (paginated, filterable) |
| PUT | `/feedback/status/change` | Change status (new/read/resolved) |
| POST | `/feedback/reply` | Admin reply to feedback |

### Content Management (`/content-management`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/content-management/add` | Create content |
| GET | `/content-management/detail` | Get content by ID/slug |
| PUT | `/content-management/update` | Update content |
| GET | `/content-management/listing` | List content |
| PUT | `/content-management/status/change` | Activate/deactivate |
| DELETE | `/content-management/delete` | Soft-delete content |

### Feature (`/features`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/features/add` | Create feature |
| PUT | `/features/update` | Update feature |
| PUT | `/features/status/change` | Activate/deactivate |
| GET | `/features/list` | List features |
| GET | `/features/detail` | Get feature by ID |
| DELETE | `/features/delete` | Delete feature |

### Plan (`/plans`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/plans/add` | Create plan |
| PUT | `/plans/update` | Update plan |
| PUT | `/plans/status/change` | Activate/deactivate |
| GET | `/plans/list` | List plans |
| GET | `/plans/detail` | Get plan by ID |
| DELETE | `/plans/delete` | Delete plan |

### Subscription (`/subscriptions`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/subscriptions/purchase` | Yes | Create Stripe checkout session |
| DELETE | `/subscriptions/cancel` | Yes | Cancel subscription |
| GET | `/subscriptions/detail` | Yes | Get own subscription |
| GET | `/subscriptions/list` | Yes | List subscriptions |
| GET | `/subscriptions/customerbalance` | Yes | Retrieve Stripe customer balance |
| POST | `/subscriptions/webhook` | No | Stripe webhook (raw body, signature verified) |

### Notification (`/notifications`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications/list` | Yes | List own notifications (paginated) |
| PUT | `/notifications/read` | Yes | Mark single notification as read |
| PUT | `/notifications/read-all` | Yes | Mark all as read |
| PUT | `/notifications/dismiss` | Yes | Dismiss a notification |
| GET | `/notifications/unread-count` | Yes | Get unread count |
| POST | `/notifications/broadcast` | Admin | Broadcast to all active users |

### Transaction (`/transactions`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/transactions/listing` | Yes | List transactions (paginated) |
| POST | `/transactions/send-invoice` | Yes | Email invoice PDF |
| GET | `/transactions/download` | Yes | Download invoice PDF |

### FAQ (`/faqs`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/faqs/list` | No | Public FAQ listing |
| GET | `/faqs/categories` | No | FAQ categories |
| POST | `/faqs/add` | Admin | Create FAQ |
| GET | `/faqs/detail` | Admin | Get FAQ by ID |
| PUT | `/faqs/update` | Admin | Update FAQ |
| DELETE | `/faqs/delete` | Admin | Delete FAQ |
| GET | `/faqs/listing` | Admin | Admin listing |
| PUT | `/faqs/status/change` | Admin | Activate/deactivate |

### Settings (`/settings`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/settings` | Admin | Get full settings (config, site, SMTP, security) |
| GET | `/settings/public` | No | Public site settings |
| GET | `/settings/crypto` | No | Crypto config (encryption mode + keys for clients) |
| PUT | `/settings` | Admin | Update settings |

### Upload (`/upload`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload/image` | Upload single image (multipart `file`) |
| POST | `/upload/image-base64` | Upload base64 image |
| POST | `/upload/document` | Upload single document |
| POST | `/upload/multiple-images` | Upload multiple images |
| POST | `/upload/video` | Upload video |
| POST | `/upload/audio` | Upload audio |
| POST | `/upload/multiple/documents` | Upload multiple documents |

### Dashboard (`/admin-dashboard`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin-dashboard/stats` | Admin | Aggregated dashboard stats |

## Socket.IO Events

Clients connect with a JWT (`socket.handshake.auth.token`) and join a per-user room.

| Event | Direction | Payload |
|-------|-----------|---------|
| `user_online` | Server → peers | `{ userId }` |
| `user_offline` | Server → peers | `{ userId }` |
| `users_online` | Server → peers | `[userId, ...]` |
| `user_status_change` | Client → server / Server → peers | `{ userId, status }` |
| `chat_join` / `chat_leave` | Client → server | `{ id }` (conversation id) |
| `chat_typing` / `chat_stop_typing` | Client → server / room | `{ userId, conversationId }` |
| `chat_send_message` | Client → server / room | `{ userId, conversationId, message, attachments, timestamp }` |
| `chat_new_message` | Server → room | Message object |
| `chat_message_delivered` / `chat_message_read` | Client → room | `{ userId, conversationId, messageId }` |
| `chat_mark_read` | Client → room | `{ userId, conversationId }` |
| `chat_edit_message` / `chat_delete_message` | Client → room | Message edit/delete payload |
| `send_notification` | Client → server | `{ targetUserId, event, data }` |
| `notification_read` / `notification_dismiss` | Client → server / user room | `{ userId, notificationId }` |

## Tech Stack

| Layer | Backend | Frontend / Admin |
|-------|---------|------------------|
| Framework | Express.js | React 18 + Vite |
| Database | MongoDB + Mongoose | — |
| Database Layer | **Repository Pattern** (repositories/) | — |
| Auth | JWT (`jsonwebtoken`) | Context API + sessionStorage |
| Encryption | `node-forge` / `crypto-secure` | Web Crypto API / Axios interceptors |
| Real-time | Socket.IO | socket.io-client |
| Billing | Stripe + PDF invoices (`html-pdf-node`) | — |
| Rate limiting | `express-rate-limit` | — |
| Security headers | `helmet` | — |
| Validation | Joi | — |
| Email | Nodemailer | — |
| Password hashing | bcryptjs | — |
| File uploads | Multer (+ ExcelJS) | — |
| Styling | — | Tailwind CSS |
| Charts | — | recharts (admin) |
| Linting | ESLint (flat config) | ESLint (flat config) |
| Formatting | Prettier | Prettier |
| Dev server | Nodemon | Vite dev server |
| Process mgmt | PM2 | — |

## License

MIT