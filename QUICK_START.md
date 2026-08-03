# 🚀 Quick Start Guide

## You have Google Apps Script ready? Here's what to do:

### 1️⃣ Get Your Script URL

After deploying your Apps Script as a Web App, you'll get a URL like:
```
https://script.google.com/macros/s/AKfycbz.../exec
```

### 2️⃣ Set Your Secret

In your Apps Script:
- Click **⚙️ Project Settings**
- Scroll to **Script Properties**
- Add property: `ALLOWED_SECRET` = `your-secret-key-123`

### 3️⃣ Update Server `.env`

Edit `/server/.env` and replace these lines:

```env
# OLD (REMOVE THESE):
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=Utsavrail13@gmail.com
EMAIL_PASS=lpbiramkjqafqkwy
EMAIL_FROM=NutriDash <Utsavrail13@gmail.com>

# NEW (ADD THESE):
APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbz.../exec
APPS_SCRIPT_SECRET=your-secret-key-123
```

### 4️⃣ Test Locally

```bash
cd server
npm run start:dev
```

Try registering a new user — you should receive an OTP email!

### 5️⃣ Deploy to Render

Add these two environment variables in Render:
```
APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
APPS_SCRIPT_SECRET=your-secret-key-123
```

**Done!** Emails will now work on Render 🎉

---

## 📋 For Render Environment Variables

Copy-paste this into Render's environment variables section (update the values):

```
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
REDIS_URL=redis://red-xxx.render.com:6379

JWT_ACCESS_SECRET=your_jwt_access_secret_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
JWT_REFRESH_EXPIRY=7d
COOKIE_SECURE=true
COOKIE_SAMESITE=none

APP_PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.vercel.app

GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=https://your-backend.onrender.com/api/v1/auth/google/callback

EDAMAM_APP_ID=your_edamam_app_id_here
EDAMAM_APP_KEY=your_edamam_app_key_here

STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here

APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
APPS_SCRIPT_SECRET=your_secret_key_here
```

---

## 🔍 Check if Apps Script is Working

Open this URL in your browser:
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

You should see:
```json
{"success":true,"message":"NutriDash email relay is running"}
```

If you see an error page, your script isn't deployed correctly.

---

## 📝 Full Documentation

- **Deployment Guide**: `DEPLOYMENT_GUIDE.md` — Step-by-step deployment instructions
- **Email Migration**: `EMAIL_MIGRATION_SUMMARY.md` — Technical details about the email changes
- **This File**: Quick reference for getting started

---

**Need Help?** 

Check the logs:
- **Local**: Terminal where you ran `npm run start:dev`
- **Render**: Dashboard → Your Service → Logs tab
