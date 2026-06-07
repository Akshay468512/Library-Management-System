# Smart College Library

**Campus Library Platform** — a full-stack Library Management System built with React, Flask, and Google Cloud Firestore. Engineering capstone project for campus library operations.

Smart College Library helps students browse books, borrow and return titles, pay fines, and get QR exit passes. Librarians manage checkouts and returns; admins view simple usage reports.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Presentation Tier (React)                    │
│  Vite · Tailwind CSS v4 · Axios · Firebase Web SDK              │
│  Perspectives: Member Console · Operations Desk · Analytics     │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP (REST)
┌───────────────────────────▼─────────────────────────────────────┐
│                     Logic Tier (Flask API)                      │
│  CORS-enabled REST router · Firebase Admin SDK                  │
│  QR generation · Transaction orchestration · Analytics          │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Admin SDK
┌───────────────────────────▼─────────────────────────────────────┐
│                  Persistence Tier (Firestore)                   │
│  Collections: books · users · transactions · fines · passes     │
└─────────────────────────────────────────────────────────────────┘
```

| Layer | Technology | Port / Location |
|-------|-----------|-----------------|
| Presentation | React 19 + Vite 8 | `http://localhost:5173` |
| Logic | Python Flask 3 | `http://127.0.0.1:5000` |
| Persistence | Google Cloud Firestore | Firebase project |

---

## Repository Structure

```
library-system/
├── backend/
│   ├── app.py                  # Flask REST API router
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Backend environment template
│   └── serviceAccountKey.json  # (local only — never commit)
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Root dashboard shell
│   │   ├── api.js              # Axios client (env-driven base URL)
│   │   ├── firebase.js         # Firebase Web SDK initialization
│   │   └── components/         # Modular UI segments
│   ├── .env.example            # Frontend environment template
│   └── package.json
└── README.md
```

---

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- A **Firebase project** with Firestore enabled
- A **Firebase service account key** (Admin SDK) for the backend
- A **Firebase web app config** for the frontend

---

## Environment Setup

### 1. Firebase Project

1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Cloud Firestore** (start in test mode for development).
3. Seed the `books` collection with sample documents:

```json
{
  "title": "Distributed Systems Design",
  "author": "Alex Morgan",
  "isbn": "978-0000000001",
  "isAvailable": true
}
```

### 2. Backend Configuration

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

1. Download your service account JSON from **Firebase Console → Project Settings → Service Accounts → Generate new private key**.
2. Save it as `backend/serviceAccountKey.json` (this file is gitignored).
3. Optionally copy `backend/.env.example` to `backend/.env` and adjust parameters.

### 3. Frontend Configuration

```bash
cd frontend
npm install
cp .env.example .env   # Windows: copy .env.example .env
```

Populate `frontend/.env` with your Firebase web app credentials and API base URL:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE=http://127.0.0.1:5000
```

> **Security note:** Never commit `.env`, `serviceAccountKey.json`, or any credential files. All sensitive values are abstracted via environment bindings.

---

## Running the Application

Open two terminals:

**Terminal 1 — Logic Tier:**
```bash
cd backend
venv\Scripts\activate        # or: source venv/bin/activate
python app.py
```

**Terminal 2 — Presentation Tier:**
```bash
cd frontend
npm run dev
```

Navigate to `http://localhost:5173`.

---

## API Reference

Base URL: `http://127.0.0.1:5000` (configurable via `VITE_API_BASE`)

### Catalog

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/books` | Retrieve all catalog assets |

### Authentication & Profiles

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register-profile` | `{ uid, email, name, identifierCode, role }` | Create or update a user profile. Role defaults to `"member"`. Valid roles: `member`, `operator`, `executive`. |

### Transactions

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST` | `/api/transactions/issue` | `{ memberId, assetId }` | Check out an asset (14-day loan period) |
| `POST` | `/api/transactions/return` | `{ transactionId }` | Check in an asset; applies penalty if overdue |
| `GET` | `/api/transactions?status=active` | — | List transactions by status |

### Penalties

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST` | `/api/fines/pay` | `{ fineId }` | Settle an outstanding penalty |
| `GET` | `/api/fines?status=unpaid` | — | List penalty records |

### Access Pass & Verification

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/generate_pass/<member_id>` | Generate Base64 QR access pass (blocked if unpaid penalties exist) |
| `POST` | `/api/verify_pass` | Validate a clearance token → `ACCESS GRANTED` or `ACCESS DENIED` |

**Verify request body:**
```json
{ "token": "uuid-clearance-token" }
```

### Analytics

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/analytics` | System-wide KPIs: utilization, overdue count, outstanding penalties |

---

## Firestore Schema

### `books`
| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Asset title |
| `author` | string | Author or creator |
| `isbn` | string | Standard identifier |
| `isAvailable` | boolean | Availability flag |

### `users`
| Field | Type | Description |
|-------|------|-------------|
| `uid` | string | Document ID (Firebase Auth UID) |
| `email` | string | Contact email |
| `name` | string | Display name |
| `identifierCode` | string | Member identifier |
| `role` | string | `member` · `operator` · `executive` |
| `createdAt` | timestamp | Profile creation time |
| `updatedAt` | timestamp | Last update time |

### `transactions`
| Field | Type | Description |
|-------|------|-------------|
| `memberId` | string | Borrowing member |
| `assetId` | string | Reference to `books` document |
| `issueTimestamp` | timestamp | Check-out time |
| `dueTimestamp` | timestamp | Return deadline (issue + 14 days) |
| `returnTimestamp` | timestamp | Actual check-in time (on return) |
| `status` | string | `active` · `complete` |

### `fines`
| Field | Type | Description |
|-------|------|-------------|
| `memberId` | string | Penalized member |
| `transactionId` | string | Related transaction |
| `penaltyAccumulated` | number | Total penalty units (10/day overdue) |
| `daysOverdue` | number | Days past due |
| `status` | string | `unpaid` · `paid` |
| `createdAt` | timestamp | Record creation time |
| `paidAt` | timestamp | Settlement time |

### `clearance_passes`
| Field | Type | Description |
|-------|------|-------------|
| `memberId` | string | Pass holder |
| `token` | string | UUID embedded in QR code |
| `status` | string | `active` · `used` |
| `createdAt` | timestamp | Issuance time |
| `verifiedAt` | timestamp | Gate scan time |

---

## UI Views

| View | Modules |
|------|---------|
| **Student Portal** | Book catalog · Library exit pass (QR) |
| **Librarian Desk** | Issue / return books · Active loans · Gate scanner |
| **Library Reports** | Checkout stats · Overdue books · Unpaid fines table |

---

## Configuration Parameters

| Variable | Location | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE` | frontend `.env` | `http://127.0.0.1:5000` | Flask API base URL |
| `VITE_FIREBASE_*` | frontend `.env` | — | Firebase web SDK config |
| `GOOGLE_APPLICATION_CREDENTIALS` | backend `.env` | `serviceAccountKey.json` | Admin SDK key path |
| `PORT` | backend `.env` | `5000` | Flask listen port |
| `PENALTY_RATE_PER_DAY` | backend `.env` | `10` | Overdue penalty units per day |
| `LOAN_PERIOD_DAYS` | backend `.env` | `14` | Default loan duration |

---

## Production Considerations

- Replace Firestore test-mode rules with role-based security rules before deployment.
- Deploy the Flask API behind a reverse proxy (e.g., Nginx + Gunicorn).
- Host the React build on a static CDN or container platform.
- Rotate service account keys regularly and use secret managers in production.
- Enable Firebase App Check for client-side hardening.

---

## License

MIT
