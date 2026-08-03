// ═══════════════════════════════════════════════════════════════════════════
// NutriDash Email Relay — Google Apps Script
// ═══════════════════════════════════════════════════════════════════════════
//
// DEPLOYMENT INSTRUCTIONS:
//
// 1. Go to https://script.google.com
// 2. Click "New Project"
// 3. Copy-paste this ENTIRE file
// 4. Name it: "NutriDash Email Relay"
// 5. Save (Ctrl+S / Cmd+S)
//
// 6. Set Secret Key:
//    - Click ⚙️ Project Settings (left sidebar)
//    - Scroll to "Script Properties"
//    - Click "Add script property"
//    - Property: ALLOWED_SECRET
//    - Value: choose-a-random-secret-key-123
//    - Click "Save script properties"
//
// 7. Deploy as Web App:
//    - Click "Deploy" → "New deployment"
//    - Click ⚙️ gear icon → Select "Web app"
//    - Description: "Email relay for NutriDash"
//    - Execute as: Me (your-email@gmail.com)
//    - Who has access: Anyone
//    - Click "Deploy"
//    - Authorize access when prompted
//    - Copy the Web App URL (looks like: https://script.google.com/macros/s/AKfycbz.../exec)
//
// 8. Update your backend .env:
//    APPS_SCRIPT_URL=<paste the URL here>
//    APPS_SCRIPT_SECRET=<paste the secret key here>
//
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Helper function to return JSON responses
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests from NutriDash backend
 * 
 * Expected payload:
 * {
 *   secret: "your-secret-key",
 *   to: "customer@example.com",
 *   subject: "Order confirmed",
 *   html: "<html>...</html>",
 *   senderName: "NutriDash"
 * }
 */
function doPost(e) {
  try {
    // Get the secret from Script Properties
    var allowedSecret = PropertiesService.getScriptProperties().getProperty('ALLOWED_SECRET');

    if (!allowedSecret) {
      return jsonResponse({ 
        success: false, 
        error: 'ALLOWED_SECRET is not configured in Script Properties' 
      });
    }

    // Validate request body exists
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ 
        success: false, 
        error: 'Missing request body' 
      });
    }

    // Parse JSON body
    var body = JSON.parse(e.postData.contents);

    // Validate secret
    if (body.secret !== allowedSecret) {
      return jsonResponse({ 
        success: false, 
        error: 'Unauthorized: Invalid secret' 
      });
    }

    // Validate required email fields
    if (!body.to || !body.subject || !body.html) {
      return jsonResponse({ 
        success: false, 
        error: 'Missing required email fields (to, subject, html)' 
      });
    }

    // Send email via Gmail
    MailApp.sendEmail({
      to: body.to,
      subject: body.subject,
      htmlBody: body.html,
      name: body.senderName || 'NutriDash',
    });

    // Return success
    return jsonResponse({ success: true });

  } catch (err) {
    // Return error
    return jsonResponse({
      success: false,
      error: err && err.message ? err.message : String(err),
    });
  }
}

/**
 * Handle GET requests (for testing)
 * Visit your deployed URL in a browser to test
 */
function doGet() {
  return jsonResponse({ 
    success: true, 
    message: 'NutriDash email relay is running ✅' 
  });
}

/**
 * Test function (run manually from the editor)
 * 
 * To test:
 * 1. Update the "to" email to your email address
 * 2. Click "Run" at the top
 * 3. Check your inbox
 */
function testSend() {
  MailApp.sendEmail({
    to: 'your-email@gmail.com', // ⬅️ UPDATE THIS
    subject: 'NutriDash Email Relay Test',
    htmlBody: '<h2 style="color: #10b981;">✅ NutriDash email relay is working!</h2><p>Your Google Apps Script is configured correctly.</p>',
    name: 'NutriDash',
  });

  Logger.log('✅ Test email sent successfully');
}

// ═══════════════════════════════════════════════════════════════════════════
// END OF SCRIPT
// ═══════════════════════════════════════════════════════════════════════════
