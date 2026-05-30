# REWARE CampusCycle

Circular campus platform for **Rajalakshmi Institute of Technology** — reuse marketplace, lost & found, academic sharing, chat, sustainability points, leaderboard, and certificates.

---

## Quick start (run locally)

### 1. Install dependencies

You need **[Node.js](https://nodejs.org/)** (LTS, v18+). Then in the project folder:

```bash
cd "C:\Users\BHAVANANTHAN M\Desktop\REWARE"
npm install
```

### 2. Start the server

```bash
npm start
```

The terminal prints the **exact URL** to open, for example:

```text
http://localhost:4000
```

If port 4000 is busy, the next free port is used automatically (e.g. `4001`).

### 3. Open in the browser

- **Login:** `http://localhost:PORT/` (root)
- **Health check:** `http://localhost:PORT/api/health` → `{"ok":true,...}`

**Important:** Do not open `frontend/index.html` from File Explorer. CSS, API, and uploads only work through the Node server.

### 4. Login rules

- Use your college email: `name.regno@dept.ritchennai.edu.in`
- Fill **phone number** (used for SMS alerts when configured)

### 5. Optional: SMS notifications (Twilio)

Copy `.env.example` to `.env` and add Twilio credentials:

```bash
copy .env.example .env
```

```env
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

Without Twilio, notifications still appear **in the app** (bell icon); SMS text is **printed in the server terminal** for testing.

---

## Tech stack (what each part does)

| Layer | Technology | Purpose (beginner-friendly) |
|--------|------------|-----------------------------|
| **Runtime** | Node.js | Runs JavaScript on your computer (not only in the browser). |
| **Web framework** | Express.js | Handles HTTP routes: `/api/...` for data, serves HTML/CSS/JS files. |
| **Frontend** | HTML, CSS, JavaScript | Pages users see; no React build step — simple and easy to edit. |
| **Auth** | JSON Web Token (JWT) | After login, a signed token is stored in `localStorage` and sent with each API call. |
| **File uploads** | Multer | Saves uploaded images/PDFs to `backend/uploads/` on disk. |
| **Database (current)** | JSON file (`backend/data/db.json`) | All students, listings, chats, points stored in one file — good for college demos. |
| **Database (recommended upgrade)** | MongoDB Atlas (free cloud) | Same data structure, but scalable, backed up, and works on Vercel/Railway. See [Database connection](#easiest-database-upgrade-mongodb-atlas) below. |
| **SMS (optional)** | Twilio REST API | Sends text messages when someone accepts a request, sends a chat message, etc. |
| **Security** | CORS, college-email validation | Only `@*.ritchennai.edu.in` emails can register. |

---

## How photos and files are stored

| Type | Where it lives | URL in browser |
|------|----------------|----------------|
| **Listing / lost-found images** | `backend/uploads/` folder on disk | `/uploads/1734567890-photo.jpg` |
| **Academic PDFs / files** | Same `backend/uploads/` folder | `/uploads/...` |
| **RIT logo / campus photos** | `frontend/assets/images/` (static) | `/assets/images/rit-logo.png` |
| **Student profile data** | `backend/data/db.json` (text JSON, not binary) | Not public — only via `/api` with login |

Files are **not** stored inside the database. The database only stores the **path** (e.g. `/uploads/1234-image.jpeg`). Multer writes the actual bytes to disk when you upload.

---

## Features (unchanged behaviour + new)

- Login with RIT email, phone, department, year, semester  
- ReUse marketplace (list, request, accept, chat, sold items hidden)  
- Lost & Found (same flow + chat)  
- Academic Hub with search  
- **Sustainability points** (marketplace, lost/found, resources, chat)  
- **Leaderboard** (`/leaderboard.html`)  
- **Auto certificate** at **1,000 points** or **#1 on leaderboard** (500+ pts) → `/certificate.html?id=...`  
- **In-app notifications** + optional **SMS**  

### Points (examples)

| Action | Points | CO₂ estimate |
|--------|--------|----------------|
| List item | 50 | 0.5 kg |
| Buy request | 30 | — |
| Sale completed | 120 (seller) / 100 (buyer) | 2.4 kg each |
| Lost / found report | 40 / 60 | — |
| Item recovered | 150 | 1.2 kg |
| Upload resource | 45 | 0.2 kg |
| Chat message | 5 | — |

---

## Easiest database upgrade: MongoDB Atlas

**Why:** JSON file is fine for one laptop demo; MongoDB is free, cloud-hosted, and the standard next step.

1. Create a free account at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)  
2. Create a cluster → **Connect** → get connection string like:  
   `mongodb+srv://user:pass@cluster.mongodb.net/reware`  
3. Install driver: `npm install mongoose`  
4. Replace `readDb` / `writeDb` in `backend/utils/db.js` with Mongoose models (same fields as `db.example.json`).  

Until you migrate, **no extra setup** is required — `npm start` creates `db.json` automatically.

---

## Project structure

```text
REWARE/
├── backend/
│   ├── server.js          # Main server entry
│   ├── routes/            # API endpoints
│   ├── utils/             # db, points, notifications, chat
│   ├── data/db.json       # Database (gitignored)
│   └── uploads/           # Uploaded images/files (gitignored)
├── frontend/
│   ├── index.html         # Login
│   ├── dashboard.html
│   ├── reware.html        # Marketplace
│   ├── leaderboard.html
│   ├── certificate.html
│   └── assets/            # CSS, JS, images
├── package.json
└── .env.example           # Twilio / secrets template
```

---

## API overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | Login / register student |
| `GET /api/marketplace` | Open listings |
| `GET /api/points/me` | Your points, rank, certificates |
| `GET /api/points/leaderboard` | Rankings |
| `GET /api/notifications` | Alerts (requests, chat, accept) |
| `GET /api/chats` | Chat threads |

---

## Terms and conditions (campus use)

1. **College email only** — accounts must use official `@*.ritchennai.edu.in` addresses.  
2. **Accurate listings** — no fraudulent or prohibited items.  
3. **Phone numbers** — used for meet coordination and optional SMS; do not share others’ numbers outside the platform.  
4. **Meet on campus** — use suggested safe meeting points; RIT safety guidelines apply.  
5. **Uploaded content** — you are responsible for images/files you upload; staff may remove inappropriate content.  
6. **Points & certificates** — for motivation only; not official academic credentials unless approved by the institution.  
7. **Data** — demo JSON DB is local; use MongoDB + HTTPS for production deployments.  

---

## Publish to GitHub

See existing steps in this file — do **not** commit `backend/data/db.json` or `backend/uploads/*` (already in `.gitignore`).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank page / no styles | Use the URL from `npm start`, not `file://` |
| Port in use | Use the port shown in the terminal |
| SMS not received | Set Twilio in `.env` or check server console `[REWARE SMS]` logs |
| No certificate | Earn 1,000 points or reach #1 with 500+ points, then open Leaderboard |

---

**CampusCycle · REWARE · SDG 12 — Promoting a circular economy together.**
