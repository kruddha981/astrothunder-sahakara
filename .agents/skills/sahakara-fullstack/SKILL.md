---
name: sahakara-fullstack
description: >-
  Use this skill when developing, testing, syncing, or running the Sahakara frontend and backend together. Covers server lifecycle, API testing, database verification, and UI integration.
---

# Sahakara Full-Stack Development Skill

This skill provides step-by-step instructions for developing and syncing the Sahakara frontend (`frontend/`) and backend (`backend/`).

## 1. Running the Full Stack

### Step 1: Start Backend (Port 3001)
```bash
# In backend/
npm start
```
Verify health:
```bash
curl -s http://localhost:3001/api/health
```

### Step 2: Start Frontend Server (Port 8080)
```bash
# In frontend/
python3 -m http.server 8080
```

### Step 3: Launch in Brave Browser
```bash
open -a "Brave Browser" "http://localhost:8080"
```

---

## 2. API Contract & Integration Reference

| Method | Endpoint | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service status | None |
| `GET` | `/api/stats` | Rescued meals, active drivers, CO2 saved | None |
| `GET` | `/api/shelters` | Active shelters list & capacities | None |
| `GET` | `/api/drivers` | Active volunteer driver list & statuses | None |
| `GET` | `/api/donations` | Active & historical donation listings | None |
| `POST` | `/api/donations` | Submit surplus food donation & trigger match engine | `{"foodName":"Dal Baati","foodType":"cooked","quantityKg":25,"donorName":"Raj Palace","donorLat":26.9124,"donorLng":75.7873}` |

---

## 3. Full-Stack Development Checklist

When adding or modifying a feature:
1. **Schema & Backend:** Update `backend/src/db.js` and routes if new fields/endpoints are needed.
2. **Matching Engine:** Verify compatibility in `backend/src/engine.js`.
3. **Frontend API Layer:** In `frontend/script.js`, integrate `fetch('http://localhost:3001/api/...')` with error handling.
4. **UI Updates:** Update `frontend/index.html` and `frontend/styles.css` matching design standards.
5. **Verify End-to-End:** Send test requests and check browser UI reflection.
