import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly appsScriptUrl = process.env.APPS_SCRIPT_URL;
  private readonly appsScriptSecret = process.env.APPS_SCRIPT_SECRET;

  /**
   * Send email via Google Apps Script HTTP relay
   */
  private async sendViaAppsScript(to: string, subject: string, html: string): Promise<void> {
    if (!this.appsScriptUrl || !this.appsScriptSecret) {
      this.logger.error('❌ APPS_SCRIPT_URL or APPS_SCRIPT_SECRET not configured');
      throw new Error('Email service not configured');
    }

    try {
      const response = await fetch(this.appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: this.appsScriptSecret,
          to,
          subject,
          html,
          senderName: 'NutriDash',
        }),
      });

      const result = await response.json();

      if (!result.success) {
        this.logger.error(`Apps Script error: ${result.error}`);
        throw new Error(`Failed to send email: ${result.error}`);
      }

      this.logger.log(`✅ Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email via Apps Script: ${error.message}`);
      throw error;
    }
  }

  // ── OTP email ─────────────────────────────────────────────────────────────
  async sendOtp(to: string, otp: string): Promise<void> {
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#10b981;margin-bottom:8px;">Verify your email</h2>
        <p style="color:#374151;margin-bottom:24px;">
          Use the code below to complete your NutriDash registration.
          It expires in <strong>10 minutes</strong>.
        </p>
        <div style="background:#ffffff;border:2px solid #10b981;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px;">
          <span style="font-size:2.5rem;font-weight:800;letter-spacing:0.25em;color:#111827;">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:0.875rem;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `;
    await this.sendViaAppsScript(to, 'Your NutriDash verification code', html);
  }

  // ── Password reset OTP email ──────────────────────────────────────────────
  async sendPasswordResetOtp(to: string, otp: string): Promise<void> {
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#10b981;margin-bottom:8px;">Reset your password</h2>
        <p style="color:#374151;margin-bottom:24px;">
          We received a request to reset your NutriDash password.
          Use the code below — it expires in <strong>10 minutes</strong>.
        </p>
        <div style="background:#ffffff;border:2px solid #10b981;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px;">
          <span style="font-size:2.5rem;font-weight:800;letter-spacing:0.25em;color:#111827;">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:0.875rem;">
          If you didn't request a password reset, you can safely ignore this email.
          Your password will not be changed.
        </p>
      </div>
    `;
    await this.sendViaAppsScript(to, 'Reset your NutriDash password', html);
  }

  // ── Order receipt email ───────────────────────────────────────────────────
  async sendOrderReceipt(opts: {
    to: string;
    customerName: string;
    orderId: string;
    restaurantName: string;
    items: Array<{ name: string; quantity: number; unitPriceRs: number }>;
    totalPriceRs: number;
    deliveryAddress: string;
    createdAt: Date;
  }): Promise<void> {
    const shortId = opts.orderId.slice(0, 8).toUpperCase();
    const dateStr = opts.createdAt.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const itemRows = opts.items
      .map(
        (item) => `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;color:#374151;">
            ${item.name}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center;color:#374151;">
            ${item.quantity}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;color:#374151;">
            Rs. ${(item.unitPriceRs * item.quantity).toFixed(2)}
          </td>
        </tr>`,
      )
      .join('');

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <div style="text-align:center;margin-bottom:28px;">
          <span style="font-size:2.5rem;">🎉</span>
          <h1 style="color:#10b981;margin:8px 0 4px;">Order Confirmed!</h1>
          <p style="color:#6b7280;margin:0;">Hi ${opts.customerName}, your order is being prepared.</p>
        </div>

        <div style="background:#ffffff;border-radius:10px;padding:20px;margin-bottom:20px;border:1px solid #e5e7eb;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="color:#6b7280;font-size:0.875rem;">Order ID</span>
            <span style="font-weight:700;color:#111827;">#${shortId}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="color:#6b7280;font-size:0.875rem;">Restaurant</span>
            <span style="font-weight:600;color:#111827;">${opts.restaurantName}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#6b7280;font-size:0.875rem;">Placed at</span>
            <span style="color:#374151;">${dateStr}</span>
          </div>
        </div>

        <div style="background:#ffffff;border-radius:10px;padding:20px;margin-bottom:20px;border:1px solid #e5e7eb;">
          <h3 style="margin:0 0 14px;color:#111827;font-size:1rem;">Items</h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:8px;text-align:left;font-size:0.75rem;color:#6b7280;text-transform:uppercase;">Item</th>
                <th style="padding:8px;text-align:center;font-size:0.75rem;color:#6b7280;text-transform:uppercase;">Qty</th>
                <th style="padding:8px;text-align:right;font-size:0.75rem;color:#6b7280;text-transform:uppercase;">Price</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
          <div style="text-align:right;margin-top:14px;padding-top:14px;border-top:2px solid #e5e7eb;">
            <span style="font-size:1.125rem;font-weight:800;color:#10b981;">
              Total: Rs. ${opts.totalPriceRs.toFixed(2)}
            </span>
          </div>
        </div>

        <div style="background:#ffffff;border-radius:10px;padding:20px;margin-bottom:28px;border:1px solid #e5e7eb;">
          <h3 style="margin:0 0 8px;color:#111827;font-size:1rem;">📍 Delivery Address</h3>
          <p style="color:#374151;margin:0;">${opts.deliveryAddress}</p>
        </div>

        <p style="color:#9ca3af;font-size:0.8rem;text-align:center;margin:0;">
          Thank you for ordering with NutriDash 🥗
        </p>
      </div>
    `;

    await this.sendViaAppsScript(opts.to, `Order confirmed — #${shortId} | NutriDash`, html);
  }
}
