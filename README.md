# EnergyAudit AI — Deployment Guide

## What this is
AI-powered energy bill auditing for commercial and industrial facilities.
Built with React + Vite. API calls proxied through a Vercel serverless function
so your Anthropic API key never touches the browser.

---

## Deploy to Vercel (15 minutes, free tier)

### Step 1 — Get your Anthropic API key
1. Go to https://console.anthropic.com/settings/keys
2. Click "Create Key"
3. Copy it — you'll need it in Step 4

### Step 2 — Push this project to GitHub
1. Create a free account at github.com if you don't have one
2. Create a new repository (click the + icon → New repository)
3. Name it "energy-audit-ai", leave it Private, click Create
4. On your computer, open Terminal (Mac) or Command Prompt (Windows)
5. Run these commands one at a time:
   ```
   cd path/to/this/folder
   git init
   git add .
   git commit -m "Initial deploy"
   git remote add origin https://github.com/YOUR_USERNAME/energy-audit-ai.git
   git push -u origin main
   ```

### Step 3 — Connect to Vercel
1. Go to https://vercel.com and sign up with your GitHub account
2. Click "Add New Project"
3. Import your "energy-audit-ai" repository
4. Framework Preset: select "Vite"
5. Click Deploy (it will fail — that's expected, you need the API key first)

### Step 4 — Add your API key to Vercel
1. In Vercel, go to your project → Settings → Environment Variables
2. Add a new variable:
   - Name: ANTHROPIC_API_KEY
   - Value: paste your key from Step 1
   - Environments: check Production, Preview, Development
3. Click Save

### Step 5 — Redeploy
1. Go to Deployments tab in Vercel
2. Click the three dots on the latest deployment → Redeploy
3. Wait ~60 seconds
4. Your app is live at: https://energy-audit-ai.vercel.app (or similar)

---

## Local development

```bash
npm install
cp .env.example .env.local
# Add your API key to .env.local
npx vercel dev   # runs both the React app and the /api/chat function locally
```

---

## Project structure

```
energy-audit/
├── api/
│   └── chat.js          ← Serverless proxy (keeps API key secret)
├── src/
│   ├── main.jsx         ← React entry point
│   └── App.jsx          ← Main application
├── public/
│   └── favicon.svg
├── index.html
├── package.json
├── vite.config.js
└── vercel.json          ← Routing config
```

---

## Updating the app
Any changes you push to GitHub will automatically redeploy on Vercel.
Edit `src/App.jsx`, commit, push — live in 60 seconds.

---

## Custom domain (optional)
In Vercel → Project → Settings → Domains, add your own domain (e.g. energyauditai.com).
Vercel handles SSL automatically.
