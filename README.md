# Drape AI — Setup & Run Guide

## Prerequisites

- **Node.js** ≥ 18  
- **npm** ≥ 9 (comes with Node.js)

---

## 1. Clone the repository

```bash
git clone https://github.com/Sasireka3019/DrapeAI.git
cd "Drape AI"
```

## 2. Install dependencies

```bash
npm install
```

## 3. Environment variables

The YouCam API key is already hardcoded server-side in youcam-client.ts — no `.env` file is required to run locally.

If you ever want to move it to an env var, add a .env.local:

```env
YOUCAM_API_KEY=<key>
```

## 4. Run in development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Build for production

```bash
npm run build
npm start
```

---

## App flow

1. **`/`** — Landing page  
2. **`/onboarding`** — Upload photo + select occasion, style, outfit type, budget  
3. **`/profile`** — AI skin tone & Fitzpatrick analysis (YouCam API)  
4. **`/looks`** — 3 AI-curated outfit looks with accessory scoring  
5. **`/tryon`** — Virtual outfit try-on (YouCam Cloth VTO)  
6. **`/enhance`** — Lip colour try-on + hairstyle try-on  
7. **`/complete`** — Final styled look summary  

---

## Key files

| Path | Purpose |
|---|---|
| catalog.json | All outfits, accessories, hairstyles, lipsticks |
| youcam-client.ts | YouCam API calls (server-only) |
| recommendation.ts | Scoring engine — picks 3 looks |
| styling-engine.ts | Skin tone → profile builder |
| api | Next.js API routes (recommend, styling-profile, youcam VTO) |

---

## Useful commands

```bash
npm run dev      # Start dev server (hot reload)
```
