// emailService.js
// Handles free transactional OTP emails using nodemailer.
// If SMTP credentials (SMTP_USER, SMTP_PASS) are provided in environment,
// it sends genuine emails (e.g. Gmail App Password, Brevo, SendGrid, Mailgun).
// Otherwise, it generates the OTP and outputs it clearly to server console + returns devOtp.

const nodemailer = require('nodemailer');

// Configure transporter from environment variables or ethereal fallback
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

  if (smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    console.log(`[Email Service] Configured with SMTP account: ${smtpUser}`);
  } else {
    console.log(`[Email Service] No SMTP_USER/SMTP_PASS found. Running in Dev/Demo mode with automatic console preview & auto-fill.`);
  }
  return transporter;
}

/**
 * Sends a modern, branded 6-digit OTP email for Sahakara
 */
async function sendOtpEmail({ toEmail, otpCode, purpose = 'Verification', userName = 'Sahakara Member' }) {
  const mailTransporter = getTransporter();

  const title = purpose === 'signup' ? 'Verify your Sahakara Account' : 'Your One-Time Login Code';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d1117; color: #e6edf3; margin: 0; padding: 24px; }
        .container { max-width: 540px; margin: 0 auto; background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 32px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
        .logo { font-size: 24px; font-weight: 800; color: #2ea043; letter-spacing: -0.5px; margin-bottom: 20px; display: inline-block; }
        h1 { font-size: 20px; margin-top: 0; color: #ffffff; }
        p { color: #8b949e; line-height: 1.6; font-size: 15px; }
        .otp-box { background: #0d1117; border: 2px dashed #2ea043; border-radius: 8px; text-align: center; padding: 20px; margin: 28px 0; }
        .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #3fb950; font-family: monospace; }
        .footer { font-size: 12px; color: #484f58; margin-top: 24px; border-top: 1px solid #21262d; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🌱 Sahakara</div>
        <h1>${title}</h1>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>Use the following 6-digit verification code to complete your Sahakara authentication. This code expires in <strong>10 minutes</strong>.</p>
        
        <div class="otp-box">
          <div class="otp-code">${otpCode}</div>
        </div>

        <p>If you did not request this code, you can safely ignore this email.</p>
        
        <div class="footer">
          Sahakara — National Surplus-to-Shelter Food Rescue Platform.<br>
          Operating live in Jaipur cluster.
        </div>
      </div>
    </body>
    </html>
  `;

  console.log(`\n======================================================`);
  console.log(`🔑 [SAHAKARA AUTH OTP] -> ${toEmail}`);
  console.log(`🔑 CODE: ${otpCode} (Purpose: ${purpose})`);
  console.log(`======================================================\n`);

  if (mailTransporter) {
    try {
      const info = await mailTransporter.sendMail({
        from: `"Sahakara Platform" <${process.env.SMTP_USER || 'no-reply@sahakara.org'}>`,
        to: toEmail,
        subject: `Your Sahakara Verification Code: ${otpCode}`,
        text: `Your Sahakara verification code is: ${otpCode}. It expires in 10 minutes.`,
        html: htmlContent,
      });
      console.log(`[Email Service] OTP successfully sent to ${toEmail} (MessageId: ${info.messageId})`);
      return { sent: true, mode: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.error(`[Email Service] Failed to send email via SMTP:`, err.message);
      return { sent: false, mode: 'dev-fallback', devOtp: otpCode, error: err.message };
    }
  }

  return { sent: true, mode: 'dev-preview', devOtp: otpCode };
}

module.exports = { sendOtpEmail };
