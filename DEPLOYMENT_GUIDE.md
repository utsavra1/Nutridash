# NutriDash Deployment Guide (Render Free Tier)

## 🚀 Overview

This guide walks you through deploying NutriDash on Render's free tier. Since Render blocks SMTP ports, we use Google Apps Script as an HTTP email relay.

---

## 📧 Part 1: Set Up Google Apps Script Email Relay

### Step 1: Create the Script

1. Go to [script.google.com](https://script.google.com)
2. Click **New Project**
3. Paste the following code:

```javascript
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var allowedSecret = PropertiesService.getScriptProperties().getProperty('ALLOWED_SECRET');

    if (!allowedSecret) {
      return jsonResponse({ success: false, error: 'ALLOWED_SECRET is not configured' });
    }

    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: 'Missing request body' });
    }

    var body = JSON.parse(e.postData.contents);

    if (body.secret !== allowedSecret) {
      return jsonResponse({ success: false, error: 'Unauthorized' });
    }

    if (!body.to || !body.subject || !body.html) {
      return jsonResponse({ success: false, error: 'Missing required email fields' });
    }

    MailApp.sendEmail({
      to: body.to,
      subject: body.subject,
      htmlBody: body.html,
      name: body.senderName || 'NutriDash',
    });

    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({
      success: false,
      error: err && err.message ? err.message : String(err),
    });
  }
}

function doGet() {
  return jsonResponse({ success: true, message: 'NutriDash email relay is running' });
}

function testSend() {
  MailApp.sendEmail({
    to: 'your-email@gmail.com',
    subject: 'NutriDash relay test',
    htmlBody: '<h2>NutriDash email relay is working.</h2>',
    name: 'NutriDash',
  });

  Logger.log('Email sent');
}
```

4. Name the project: **NutriDash Email Relay**
5. Save: **File → Save** or `Ctrl+S` / `Cmd+S`

### Step 2: Set the Secret Key

1. Click **⚙️ Project Settings** (left sidebar)
2. Scroll down to **Script Properties**
3. Click **Add script property**
4. Enter:
   - **Property**: `ALLOWED_SECRET`
   - **Value**: Choose a random secret (e.g., `my-super-secret-key-123`)
5. Click **Save script properties**

### Step 3: Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the **⚙️ gear icon** → Select **Web app**
3. Configure:
   - **Description**: `Email relay for NutriDash`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone`
4. Click **Deploy**
5. Review permissions:
   - Click **Authorize access**
   - Choose your Google account
   - Click **Advanced** → **Go to NutriDash Email Relay (unsafe)**
   - Click **Allow**
6. **Copy the Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycbz.../exec
   ```

### Step 4: Test the Script (Optional)

Run the `testSend()` function:
1. Select `testSend` from the dropdown at the top
2. Click **Run**
3. Check your inbox — you should receive a test email

---

## 🗄️ Part 2: Set Up External Database

Since Render free tier doesn't include PostgreSQL, use a free external database:

### Option A: Neon (Recommended)

1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub/Google
3. Create a new project: **NutriDash**
4. Copy the **Connection String**:
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

### Option B: Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings → Database**
4. Copy the **Connection String** (URI format)

---

## 🚢 Part 3: Deploy Backend to Render

### Step 1: Push Code to GitHub

```bash
cd /Users/utsav/Desktop/nutridash
git add .
git commit -m "Prepare for Render deployment with Apps Script email"
git push origin main
```

### Step 2: Create Render Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repo: **nutridash**
4. Configure:
   - **Name**: `nutridash-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm run start:render`
   - **Instance Type**: `Free`

### Step 3: Add Environment Variables

Click **Advanced** → **Add Environment Variable** and add these:

```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
REDIS_URL=redis://red-xxx.render.com:6379

JWT_ACCESS_SECRET=your_jwt_access_secret_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
JWT_REFRESH_EXPIRY=7d
COOKIE_SECURE=true
COOKIE_SAMESITE=none

APP_PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.vercel.app

GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=https://nutridash-backend.onrender.com/api/v1/auth/google/callback

EDAMAM_APP_ID=your_edamam_app_id_here
EDAMAM_APP_KEY=your_edamam_app_key_here

STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here

APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
APPS_SCRIPT_SECRET=your_random_secret_key_here
```

**Important:**
- Replace `DATABASE_URL` with your Neon/Supabase connection string
- Replace `APPS_SCRIPT_URL` with your deployed script URL from Part 1
- Replace `APPS_SCRIPT_SECRET` with the secret you set in Script Properties

### Step 4: Add Redis (Optional but Recommended)

1. Go to Render Dashboard
2. Click **New +** → **Redis**
3. Name: `nutridash-redis`
4. Plan: **Free**
5. Click **Create Redis**
6. Copy the **Internal Redis URL** and update `REDIS_URL` in your web service

### Step 5: Deploy

1. Click **Create Web Service**
2. Wait for the build to complete (~5 minutes)
3. Your backend will be live at: `https://nutridash-backend.onrender.com`

---

## 🌐 Part 4: Deploy Frontend to Vercel

### Step 1: Update Frontend Environment Variables

Edit `client/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=https://nutridash-backend.onrender.com/api/v1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51TtiQkCJlJ3tSJpL...
```

Commit and push:

```bash
git add client/.env.local
git commit -m "Update frontend to use production API"
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your GitHub repo: **nutridash**
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Add environment variables:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://nutridash-backend.onrender.com/api/v1
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
6. Click **Deploy**

### Step 3: Update Backend CORS

Once deployed, update your Render backend environment variables:

```
CORS_ORIGIN=https://your-app.vercel.app
GOOGLE_CALLBACK_URL=https://nutridash-backend.onrender.com/api/v1/auth/google/callback
```

---

## ✅ Verification Checklist

- [ ] Google Apps Script deployed and tested
- [ ] External database (Neon/Supabase) created
- [ ] Backend deployed on Render
- [ ] Redis instance created (optional)
- [ ] All environment variables configured
- [ ] Frontend deployed on Vercel
- [ ] CORS origin updated
- [ ] Test registration (email OTP should work)
- [ ] Test order placement (order receipt should arrive)
- [ ] Test password reset (reset OTP should arrive)

---

## 🐛 Troubleshooting

### Email not sending

1. Check Render logs: `Dashboard → nutridash-backend → Logs`
2. Verify `APPS_SCRIPT_URL` and `APPS_SCRIPT_SECRET` are correct
3. Test the script directly: Open the Apps Script URL in a browser — you should see:
   ```json
   {"success":true,"message":"NutriDash email relay is running"}
   ```

### Database connection errors

1. Ensure `DATABASE_URL` includes `?sslmode=require`
2. Check if your IP is allowed (Neon/Supabase should allow all by default)
3. Verify the database exists

### CORS errors

1. Update `CORS_ORIGIN` in Render to match your Vercel URL exactly
2. Ensure `COOKIE_SECURE=true` and `COOKIE_SAMESITE=none` for production

### Render free tier sleeps after 15 minutes

- The first request after sleep takes ~30 seconds
- Consider upgrading to a paid plan or use a service like [UptimeRobot](https://uptimerobot.com) to ping your API every 14 minutes

---

## 🎉 You're Done!

Your NutriDash app is now live on:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://nutridash-backend.onrender.com

Emails will be sent via Google Apps Script, bypassing Render's SMTP restrictions.
