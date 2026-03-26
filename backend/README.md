# J&P Banquet – Backend Setup & Deployment Guide

## Overview

This backend is a **Node.js/Express** API that:
- Authenticates the admin via JWT
- Reads/writes to a **Google Sheet** that acts as the database
- Exposes REST endpoints for **Gallery** and **Packages**

---

## 1. Google Sheets Setup

1. Go to [Google Sheets](https://sheets.google.com) → Create a new spreadsheet
2. Rename it **"J&P Banquet Data"**
3. Create **two tabs** (sheets) with these exact names:

### Tab: `Gallery`
Add this header row in row 1:
```
id | title | category | photoUrl | description | status
```

### Tab: `Packages`
Add this header row in row 1:
```
id | name | price | icon | per | status | description | inclusions | exclusions
```

4. Copy the **Spreadsheet ID** from the URL:
   - URL: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`

---

## 2. Google Service Account Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Enable **Google Sheets API**:
   - APIs & Services → Library → Search "Google Sheets API" → Enable
4. Create a **Service Account**:
   - APIs & Services → Credentials → Create Credentials → Service Account
   - Name it `jandp-banquet-admin`
   - Role: **Editor** (or Viewer+Editor)
5. Create a JSON Key:
   - Click the service account → Keys tab → Add Key → Create new key → JSON
   - Download the `.json` file
6. **Share the Google Sheet** with the service account email:
   - Open the sheet → Share → paste the service account email (e.g. `jandp-banquet-admin@your-project.iam.gserviceaccount.com`)
   - Give **Editor** access

---

## 3. Google Drive Photo URL Format (for Gallery)

When uploading photos for the gallery:

1. Upload your photo to Google Drive
2. Right-click → Share → Change to "Anyone with the link" → Copy link
3. The link looks like: `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`
4. Convert it to a **direct image URL**:
   ```
   https://drive.google.com/uc?export=view&id=FILE_ID
   ```
5. Paste this URL into the **Photo URL** field in the admin panel

### Optional: Google Apps Script for Auto-URL Generation

Add this Apps Script to your Drive to auto-generate direct links:

```javascript
function getDirectUrl(fileId) {
  return 'https://drive.google.com/uc?export=view&id=' + fileId;
}
```

---

## 4. Local Development

```bash
cd backend
npm install

# Copy .env.example to .env and fill it in
cp .env.example .env

# Start the server
npm run dev
# → API running at http://localhost:3000
```

Test the login:
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"jandp@2025"}'
```

---

## 5. Deploy to Render

1. Push this entire project to a **GitHub repository**
2. Go to [Render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment**: Node
5. Add these **Environment Variables** in Render dashboard:

| Key | Value |
|-----|-------|
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | Your secure password |
| `JWT_SECRET` | A long random string |
| `GOOGLE_SHEET_ID` | Your spreadsheet ID |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | The entire contents of your JSON key file (as a single line) |

6. Deploy → Render gives you a URL like `https://jandp-banquet-api.onrender.com`

---

## 6. Connect Admin Panel to Backend

After deploying, update the `API_BASE` URL in:
- `admin/index.html`
- `admin/js/admin.js`

Change:
```js
: 'https://jandp-banquet-api.onrender.com'
```
to your actual Render URL.

---

## 7. Deploy Frontend to Vercel

1. Go to [Vercel.com](https://vercel.com) → Import your GitHub repo
2. **Root Directory**: Leave empty (root of project)
3. **Build Command**: Leave empty (static site)
4. **Output Directory**: `.` (root)
5. Deploy → Your site is live!

The `vercel.json` is already configured for SPA routing.

---

## API Reference

### Auth
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/login` | `{ username, password }` | Returns JWT token |

### Gallery (requires Bearer token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gallery` | List all gallery items |
| POST | `/api/gallery` | Add new item |
| PUT | `/api/gallery/:id` | Update item |
| DELETE | `/api/gallery/:id` | Delete item |

### Packages (requires Bearer token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/packages` | List all packages |
| POST | `/api/packages` | Add new package |
| PUT | `/api/packages/:id` | Update package |
| DELETE | `/api/packages/:id` | Delete package |

---

## Default Admin Credentials
- Username: `admin`
- Password: `jandp@2025`

> ⚠️ **Change these in `.env` before deploying to production!**
