# 🌱 Sahakara — National Food Rescue Platform for India

> **Zero Landfill Food Rescue Protocol:** Instant matching connecting commercial donors, banquet halls, restaurants, and individuals to shelters, volunteer drivers, gaushalas, and bio-compost centers across India.

Powered by **Supabase (PostgreSQL + Realtime)**, **Leaflet.js + OpenStreetMap**, and an intelligent **4-Tier Last Resort Food Rescue Ladder Engine**.

---

## 🏗️ Architecture & Serverless Design

Sahakara is designed as a **100% serverless single-page web application**. The frontend talks directly to Supabase via `@supabase/supabase-js` (PostgreSQL CRUD, Row Level Security, and Realtime Subscriptions).

- **Frontend (`frontend/`):** Pure HTML5, CSS3, and JavaScript SPA with zero framework lock-in. Works directly when hosted on **Vercel**, GitHub Pages, or any static host.
- **Database & Auth (`supabase/`):** Managed PostgreSQL, Supabase Auth (email/password), RLS policies, triggers, and Realtime websocket subscriptions.
- **Optional Backend (`backend/`):** An optional Node.js Express server (`nodemailer`) for legacy SMTP dispatch or background services. **The platform does NOT require this backend to run; all core flows, admin actions, matching, and live feeds work directly via Supabase.**

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+) *(optional for backend only)*
- Python 3 or `npx serve` (for serving the frontend)
- A free [Supabase](https://supabase.com/) account

---

## 🗄️ Supabase Setup (Step-by-Step)

### Step 1: Create a New Supabase Project
1. Log in to the [Supabase Dashboard](https://app.supabase.com/).
2. Click **New Project**, choose an organization, set a project name (e.g., `sahakara-rescue`), and generate a strong database password.
3. Choose the closest region (e.g., `Central India (Mumbai)`).

---

### Step 2: Run the SQL Schema
1. In your Supabase dashboard, navigate to the **SQL Editor** tab (left sidebar).
2. Click **New Query**.
3. Copy the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) and paste it into the editor.
4. Click **Run** (or press `Cmd + Enter` / `Ctrl + Enter`).
5. This script is **idempotent** and will automatically:
   - Create tables: `cities`, `profiles`, `recipients`, `donations`, `audit_log`.
   - Setup Row Level Security (RLS) policies for public creation/reading and strict admin management.
   - Configure automatic user profile creation on authentication (`on_auth_user_created`).
   - Enable Supabase Realtime replication on `donations`, `recipients`, `cities`, and `audit_log`.
   - Seed 5 Indian cities (Jaipur, Delhi NCR, Bengaluru, Mumbai, Hyderabad).
   - Seed 12 real-world rescue recipient nodes (Human Shelters, Gaushalas, Compost Facilities).

---

### Step 3: Create the First Admin User
1. In your Supabase dashboard, navigate to **Authentication &rarr; Users**.
2. Click **Add User &rarr; Create User**.
3. Enter your admin email (e.g., `admin@sahakara.org`) and a strong password. Confirm user email if auto-confirm is not enabled.
4. Go back to the **SQL Editor** and run the following command to grant the `admin` role:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'admin@sahakara.org';
   ```
5. You can now log in at `/admin/login` (or `http://localhost:8080/admin/login.html`) with these credentials.

---

### Step 4: Configure Environment Variables
1. In Supabase, go to **Project Settings &rarr; API**.
2. Copy your **Project URL** (`https://<project-ref>.supabase.co`) and **anon public key** (`eyJhbGciOi...`).
3. Create your `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
4. Fill in your credentials:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. *(Optional Browser Injection)*: If testing statically without a build step, you can open the browser console and configure:
   ```javascript
   localStorage.setItem('SAHAKARA_SUPABASE_URL', 'https://your-project-id.supabase.co');
   localStorage.setItem('SAHAKARA_SUPABASE_ANON_KEY', 'your-anon-key');
   ```

---

## 💻 Running Locally

### 1. Start the Frontend (Port 8080)
```bash
cd frontend
python3 -m http.server 8080
```
Open **[http://localhost:8080](http://localhost:8080)** in **Brave Browser** or Chrome.

### 2. Access Admin Portal
Open **[http://localhost:8080/admin/login.html](http://localhost:8080/admin/login.html)** to sign in with your admin credentials.

### 3. (Optional) Start the Backend Server (Port 3001)
```bash
cd backend
npm install
npm start
```
*Note: The platform functions completely even if this step is skipped.*

---

## ☁️ Deploying to Vercel

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete Sahakara production deployment"
   git push origin main
   ```
2. Go to the [Vercel Dashboard](https://vercel.com/) and click **Add New &rarr; Project**.
3. Select your GitHub repository.
4. Set the **Root Directory** to `frontend/` (or leave as root `/` since [`vercel.json`](./vercel.json) handles routing).
5. Under **Environment Variables**, add:
   - `SUPABASE_URL` = `https://<your-project>.supabase.co`
   - `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
6. Click **Deploy**. Your national food rescue portal is live with instant realtime synchronization!

---

## 🧠 Core Features & Algorithms

### 1. Geospatial Haversine & 4-Tier Ladder Engine ([`frontend/matching.js`](./frontend/matching.js))
- **Stage 1 (0–25% safe time elapsed):** Local Human Shelter within **3 km**.
- **Stage 2 (25–50% safe time elapsed):** Regional Shelter / Bulk Kitchen within **10 km**.
- **Stage 3 (50–75% safe time elapsed):** Registered Gaushala / Animal Sanctuary within **15 km**.
- **Stage 4 (75–100% safe time elapsed):** Municipal Biomethanation & Bio-Compost within **30 km**.
- **Food Safety Clock Rules:**
  - Cooked Meals (Rice, Dal, Curries): **240 minutes (4 hours)**
  - Dairy & Sweets: **120 minutes (2 hours)**
  - Dry Snacks & Bakery: **1440 minutes (24 hours)**
  - *Zero Human Contamination Rule:* Stages 3 and 4 **never** route food to human shelters, and expired food is permanently excluded from human consumption.

### 2. Admin Portal (`/admin`)
- **Dashboard Overview:** Live KPI counters (Meals rescued, Kg diverted, CO2 avoided, Dumpster: 0), 14-day velocity canvas chart, and city distribution breakdown.
- **Realtime Live Donations:** Searchable, filterable ledger with instant drawer view, timeline steps, OTP status, and Leaflet + OSRM road geometry.
- **Ladder Monitor:** 4-column visual kanban board highlighting high-risk rescues (< 30 min left or Stage 3/4).
- **Recipients Node Manager:** Full CRUD with interactive map pin coordinate picker.
- **Verification Queue:** Review and approve/reject donor nodes and community shelters.
- **Cities Manager:** Enable or schedule city operations ("Live" vs "Coming soon").
- **Reports & Impact Certificate:** Date-range filtering, CSV export, and high-resolution `@media print` donor certificates.
- **Audit Logs:** Immutable chronological trail of all administrative actions.
- **Realtime Audio & Visual Alerts:** Realtime notification bell for critical escalations.
