# Email Migration: SMTP → Google Apps Script HTTP Relay

## ✅ Changes Made

### 1. **Backend Email Service Refactored**

**File**: `server/src/email/email.service.ts`

- **Removed**: `nodemailer` SMTP transport
- **Added**: HTTP-based email sending via Google Apps Script
- **New method**: `sendViaAppsScript()` — sends POST requests to your deployed script

**How it works**:
```typescript
// POST to your Apps Script URL with:
{
  secret: "your-secret-key",
  to: "customer@example.com",
  subject: "Order confirmed",
  html: "<html>...</html>",
  senderName: "NutriDash"
}

// Apps Script validates the secret and sends via MailApp.sendEmail()
```

### 2. **Environment Variables Updated**

**File**: `server/.env`

**Removed** (old SMTP config):
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=Utsavrail13@gmail.com
EMAIL_PASS=lpbiramkjqafqkwy
EMAIL_FROM=NutriDash <Utsavrail13@gmail.com>
```

**Added** (new HTTP config):
```env
APPS_SCRIPT_URL=YOUR_DEPLOYED_APPS_SCRIPT_URL_HERE
APPS_SCRIPT_SECRET=YOUR_SECRET_KEY_HERE
```

### 3. **Documentation Added**

- `server/.env.example` — Template with all required environment variables
- `DEPLOYMENT_GUIDE.md` — Step-by-step guide for Render deployment
- `EMAIL_MIGRATION_SUMMARY.md` — This file

---

## 🔧 What You Need to Do

### Step 1: Deploy Your Google Apps Script

1. Go to [script.google.com](https://script.google.com)
2. Create a new project
3. Paste your email relay code (the one you provided)
4. **Set Script Property**:
   - Click **⚙️ Project Settings**
   - Add Script Property: `ALLOWED_SECRET` = `your-random-secret`
5. **Deploy as Web App**:
   - Click **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**
   - **Copy the Web App URL**

### Step 2: Update Your `.env` File

Edit `server/.env`:

```env
# Replace with your actual deployed script URL
APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbz.../exec

# Replace with the secret you set in Script Properties
APPS_SCRIPT_SECRET=your-random-secret
```

### Step 3: Test Locally

```bash
cd server
npm run start:dev
```

Try:
- Register a new user → Should receive OTP email
- Reset password → Should receive reset OTP
- Place an order → Should receive order confirmation

### Step 4: Deploy to Render

When you deploy to Render, add these environment variables:

```
APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
APPS_SCRIPT_SECRET=your-secret-key-here
```

**That's it!** Emails will now work on Render without SMTP.

---

## 📧 Emails Supported

All three email types are migrated:

1. **OTP Email** (`sendOtp`) — Registration verification
2. **Password Reset OTP** (`sendPasswordResetOtp`) — Forgot password flow
3. **Order Receipt** (`sendOrderReceipt`) — Post-purchase confirmation

---

## 🎯 Post-Purchase Redirect

The checkout page already has the correct redirect logic:

```typescript
onSuccess: (data) => {
  router.push(`/orders/confirmation?id=${data.id}`);
  setTimeout(() => clearCart(), 300);
}
```

**This should redirect to**: `/orders/confirmation?id=ORDER_ID`

**If it's not working**, check:

1. **Console errors** — Open browser DevTools → Console
2. **Network tab** — Verify the order creation request succeeds
3. **Order ID** — Make sure `data.id` exists in the API response

The confirmation page exists at:
- `client/src/app/orders/confirmation/page.tsx`

---

## 🔍 Troubleshooting

### Emails Not Sending

**Error**: `Email service not configured`

**Fix**: Ensure `APPS_SCRIPT_URL` and `APPS_SCRIPT_SECRET` are set in `.env`

---

**Error**: `Apps Script error: Unauthorized`

**Fix**: The `APPS_SCRIPT_SECRET` in your `.env` doesn't match the `ALLOWED_SECRET` in Script Properties

---

**Error**: `Failed to send email: Missing required email fields`

**Fix**: This is a code bug — ensure the email service is passing `to`, `subject`, and `html`

---

### Redirect Not Working

1. Open browser DevTools → Console
2. Try placing an order
3. Check for:
   - API errors in Network tab
   - JavaScript errors in Console
   - Verify the order was created: `/orders` page should show it

---

## ✨ Benefits of This Approach

✅ **No SMTP required** — Works on Render free tier  
✅ **Reliable** — Uses Gmail's infrastructure via MailApp  
✅ **Secure** — Secret key validation prevents abuse  
✅ **Simple** — Just two environment variables  
✅ **Free** — No email service costs (SendGrid, etc.)

---

## 📚 Next Steps

1. Deploy the Apps Script
2. Update your `.env` with the URL and secret
3. Test locally
4. Deploy to Render with the same environment variables
5. Celebrate! 🎉

Need help? Check the full `DEPLOYMENT_GUIDE.md` for detailed instructions.
