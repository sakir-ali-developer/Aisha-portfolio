# Portfolio Dashboard: Complete Setup & Guide

Your dashboard lives at `/wp-admin` (e.g. `http://localhost:3000/wp-admin` locally or `https://your-domain.vercel.app/wp-admin` on Vercel).

---

## ⚡ Quick Start: Running Locally

You can test and run this entire project locally immediately:

```bash
npm install
npm run seed       # Seeds Neon DB with initial site content & dummy leads
npm run dev        # Starts the development server at http://localhost:3000
```

Then open in your browser:
- **Portfolio Website:** [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard:** [http://localhost:3000/wp-admin](http://localhost:3000/wp-admin)

### 🔑 Default Dummy Credentials

| Field | Default Value | Alternative |
|---|---|---|
| **Username** | `admin` | `aisha` |
| **Password** | `password123` | `admin123` |

> [!TIP]
> The login screen at `/wp-admin` automatically pre-fills these credentials and includes a one-click **"Auto-fill"** button!

---

## 🗄️ Database & Storage Configuration

### 1. Neon PostgreSQL Database
- Configured in `.env` via `DATABASE_URL`:
  ```env
  DATABASE_URL=postgresql://neondb_owner:npg_PQGdgT0Fv6jR@ep-wandering-hill-bee8vjmv-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
  ```
- To seed or re-seed initial content and dummy leads:
  ```bash
  npm run seed
  ```

### 2. S3 Object Storage Bucket
- Supports AWS S3, Cloudflare R2, MinIO, or S3-compatible buckets for uploads.
- Configured in `.env`:
  ```env
  STORAGE_PROVIDER=s3
  S3_BUCKET=assets
  AWS_REGION=us-east-2
  AWS_ACCESS_KEY_ID=your-aws-access-key-id
  AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
  S3_FORCE_PATH_STYLE=true
  ```
- To test your S3 connection and bucket uploads:
  ```bash
  npm run test:s3
  ```
- If AWS credentials are not set, the app gracefully falls back to local disk storage (`uploads/`) so dashboard uploads always succeed without crashing!

---

## 🚀 How It Works (100% Out-of-the-Box)

- **Zero-Config Fallback Storage:** If `DATABASE_URL` is not set, the dashboard automatically stores content and leads in `data/db.json` (or in memory).
- **Zero-Config Uploads:** If `BLOB_READ_WRITE_TOKEN` is not set, uploads are saved locally to `uploads/` (or served as data URIs).
- **Production Ready:** As soon as you add Neon (`DATABASE_URL`) and Vercel Blob (`BLOB_READ_WRITE_TOKEN`) in Vercel settings, the app seamlessly switches to PostgreSQL and cloud object storage!

---

## 🌐 Deploying to Vercel

### 1. Push your code to GitHub / Vercel
Deploy the project to Vercel.

### 2. Connect Database (Neon)
- **In Vercel:** Go to **Storage > Create Database > Neon**, then click **Connect to Project**. Vercel will set `DATABASE_URL` automatically.
- The tables (`site_content` and `leads`) are automatically created on the first request.

### 3. Connect File Storage (Vercel Blob)
- **In Vercel:** Go to **Storage > Create Database > Blob**, create it, and click **Connect to Project**. Vercel adds `BLOB_READ_WRITE_TOKEN` automatically.

### 4. Custom Login Credentials (Optional)
If you want to replace the dummy credentials with your own private login in Vercel, go to **Settings > Environment Variables** and add:

| Name | Description | Example |
|---|---|---|
| `ADMIN_USERNAME` | Custom login username | `aisha` |
| `ADMIN_PASSWORD` | Custom secure password | *Your secret password* |
| `SESSION_SECRET` | Secret key for signing cookies | Any string of **at least 32 characters** |
| `FORMSPREE_ID` *(optional)* | Formspree Form ID | For instant email alerts when leads arrive |

*(If you don't set these, the default dummy credentials `admin` / `password123` continue to work.)*

---

## 🎨 Dashboard Features

- **General Settings:** Location, experience years, team size, status, email, phone, CV, hero portrait.
- **Dynamic Placeholders:** Use `{{experience}}`, `{{teamSize}}`, `{{location}}`, and `{{email}}` in any text to update everywhere dynamically.
- **Color Highlighting:** Wrap any title word in `[square brackets]` (e.g. `[delivered]`) to highlight it in violet.
- **Section Editors:** Hero, Ticker, About, Services accordion, Expertise tabs, Selected Projects, Process timeline, Why Me cards, Closing CTA, Footer links.
- **Drag-and-Drop & Reordering:** Reorder list items, projects, and tabs with easy handles or arrow controls.
- **Leads Inbox:** View incoming contact submissions, mark read/unread, delete, and export all leads to CSV.
