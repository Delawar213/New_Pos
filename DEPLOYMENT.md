# POS System - Deployment Guide

## Deploy to Vercel

### Prerequisites
- GitHub account with the repo pushed (✓ Already done)
- Vercel account (https://vercel.com/signup)

### Step 1: Connect GitHub to Vercel
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Search for `Delawar213/New_Pos`
4. Click "Import"

### Step 2: Configure Project
- **Project name**: `pos-system` (or your choice)
- **Root directory**: `frontend/` ← **IMPORTANT**
- **Framework preset**: Next.js
- **Environment variables**: Add these:
  ```
  NEXT_PUBLIC_API_BASE_URL=https://YOUR_API_DOMAIN/api
  ```

### Step 3: Deploy
- Click "Deploy"
- Wait for build to complete (should take 2-3 minutes)

---

## Local Testing Before Deploy

```bash
cd frontend

# Build
npm run build

# Test production build locally
npm start
```

Then visit: `http://localhost:3000`

---

## Common Issues

### ❌ 404 Error on Vercel
**Cause**: Root directory isn't set to `frontend/`

**Fix**: 
1. Go to Vercel dashboard → Project Settings
2. Under "Build & Development Settings"
3. Set "Root Directory" to `frontend/`
4. Redeploy

### ❌ Build Fails
**Cause**: TypeScript errors or missing dependencies

**Fix**: Check build logs in Vercel and run locally:
```bash
cd frontend
npm install
npm run build
```

### ❌ Environment Variables Not Working
**Cause**: Variables need `NEXT_PUBLIC_` prefix to be available in browser

**Status**: ✓ Already configured correctly in `.env.local`

---

## Environment Variables Needed

| Variable | Value | Example |
|----------|-------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Your .NET Core API URL | `https://api.yourdomain.com/api` |
| `NEXT_PUBLIC_APP_NAME` | App display name | `POS System` |
| `NEXT_PUBLIC_APP_VERSION` | Version | `1.0.0` |

---

## After Deployment

1. **Update API URL** if needed
2. **Test all routes**: `/dashboard`, `/products`, `/pos`, `/sales`, etc.
3. **Check console** for any client-side errors (F12 → Console)
4. **Test API calls** when your .NET backend is ready

---

## Next Steps: .NET Core Backend

When you're ready, set up your .NET Core API:
- API base URL: `NEXT_PUBLIC_API_BASE_URL`
- All endpoints in [src/store/api/](frontend/src/store/api/) expect this base URL
- Example: `GET {BASE_URL}/categories`
