# REWARE CampusCycle

Circular campus ecosystem for Rajalakshmi Institute of Technogy.

## Run

```bash
npm install
npm start
```

After `npm start`, read the **exact URL** printed in the terminal (for example `http://localhost:4000`). If port 4000 is already in use, the server **automatically picks the next free port** (e.g. 4001) — always use the URL shown there.

Do **not** open `frontend/index.html` from File Explorer — CSS and `/api` calls only work through the server.

Quick check: open `http://localhost:PORT/api/health` — you should see `{"ok":true,...}`.

### If the browser still shows “cannot connect”

1. Confirm the terminal stayed open and shows the banner with the URL.
2. Paste that full URL (including the port number) into the address bar.
3. Login requires a Rajalakshmi email (`@*.ritchennai.edu.in`). Wrong email shows an error on the form, not a blank browser.

## Publish to GitHub

This repo ignores `backend/data/db.json` and `backend/uploads/*` so student data and files are not pushed. After clone, run `npm start` once; a fresh `db.json` is created automatically (or copy `backend/data/db.example.json` to `backend/data/db.json`).

1. Create a **new empty repository** on GitHub (no README/license if you want a clean first push).
2. In this folder:

```bash
git init
git add -A
git commit -m "Initial commit: REWARE CampusCycle"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Use your real GitHub username and repo name in `origin`. If GitHub asks for a password, use a **Personal Access Token** (not your account password).

## Features

- Student login with profile onboarding fields (email, name, reg no, dept, year, sem)
- Profile edit page
- Dashboard with sustainability and activity metrics
- REWARE marketplace (upload and browse used items)
- Smart Lost & Found (report lost/found items)
- Academic Hub (upload and share study resources)
- Smooth liquid-style page transitions
