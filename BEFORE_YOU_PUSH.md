# ✅ Pre-Push Checklist — Make Sure Everything is Safe!

## 🔍 Step 1: Verify No Credentials Will Be Committed

Run this command:

```bash
cd /Users/utsav/Desktop/nutridash
git status
```

### ✅ You SHOULD See These Files:

- `server/src/email/email.service.ts` (modified)
- `server/package.json` (modified)
- `server/package-lock.json` (modified)
- `server/.gitignore` (modified)
- `server/.env.example` (new/modified)
- Various `.md` documentation files (new)
- `google-apps-script.js` (new)

### ❌ You Should NOT See:

- `server/.env` ← Your actual credentials
- `server/.env.local.backup` ← Backup credentials
- `client/.env.local` ← Frontend credentials

---

## 🔒 Step 2: Double-Check `.env.example`

Run this command:

```bash
cat server/.env.example | grep -i secret
```

**Expected output** (placeholders only):
```
JWT_ACCESS_SECRET=your_jwt_access_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
GOOGLE_CLIENT_SECRET=your_google_client_secret
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
APPS_SCRIPT_SECRET=your_random_secret_key
```

**If you see any REAL credentials**, stop and fix it before pushing!

---

## 📋 Step 3: Review What Changed

```bash
git diff server/.env.example
```

Should show only placeholder values, not your actual secrets.

```bash
git diff server/src/email/email.service.ts
```

Should show the migration from SMTP to HTTP (no credentials in code).

---

## 🚀 Step 4: Safe to Push

If all checks pass, you can safely push:

```bash
git add .
git commit -m "Migrate email from SMTP to Google Apps Script HTTP relay for Render"
git push origin main
```

---

## ⚠️ What NOT to Push

These files are protected by `.gitignore` and won't be pushed:

- ❌ `server/.env` — Your real credentials
- ❌ `server/.env.local.backup` — Backup of credentials
- ❌ `client/.env.local` — Frontend env vars
- ❌ `node_modules/` — Dependencies
- ❌ `.next/` — Build files

---

## 🎯 After Pushing

### Your Local Files (Safe, Not in Git)

✅ `server/.env` — Keep this for local development  
✅ `server/.env.local.backup` — Keep this as backup  
✅ `client/.env.local` — Keep this for frontend

### Your GitHub Repo (Safe, Public)

✅ `server/.env.example` — Template with placeholders  
✅ Code changes — No credentials in source code  
✅ Documentation — Guides for deployment

### Render Deployment

When you deploy to Render, you'll manually add environment variables from your **local** `.env` file in the Render dashboard. Never commit production credentials!

---

## 🔧 Quick Test Before Pushing

```bash
# 1. Check git status
git status

# 2. Check no real secrets in .env.example
grep -E "(SECRET|KEY|PASSWORD)" server/.env.example

# If you see "your_xyz_here" or similar placeholders, you're good!
# If you see actual values like "A5fa58CT1WPGX..." STOP and fix it!

# 3. Check what will be committed
git diff --cached

# Review the changes carefully

# 4. If all looks good
git push origin main
```

---

## 🎉 You're Ready!

✅ `.env` is protected (in `.gitignore`)  
✅ `.env.example` has safe placeholders  
✅ Code has no hardcoded credentials  
✅ Documentation is complete  
✅ Safe to push to GitHub

**Next steps:**
1. Push your changes
2. Deploy Google Apps Script
3. Update your local `.env` with script URL and secret
4. Test locally
5. Deploy to Render with environment variables

**Good luck! 🚀**
