const nodemailer = require("nodemailer");

/**
 * Configure Nodemailer transport with Gmail or custom SMTP
 */
const createTransporter = () => {
  const user = process.env.GMAIL_USER || process.env.EMAIL_USER;
  const pass = process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: user.trim(),
      pass: pass.trim(),
    },
  });
};

/**
 * Send 6-Digit Password Reset OTP via Gmail
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit verification code
 * @param {string} userName - User full name
 * @returns {Promise<{ delivered: boolean, previewOtp?: string }>}
 */
const sendResetPasswordOtpEmail = async (toEmail, otp, userName = "Valued User") => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Job Portal Support" <${process.env.GMAIL_USER || process.env.EMAIL_USER || "noreply.jobportal@gmail.com"}>`,
    to: toEmail,
    subject: "🔐 Job Portal - Password Reset Verification Code",
    text: `Hello ${userName},\n\nYour 6-digit verification code to reset your Job Portal password is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.\n\nJob Portal Security Team`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F1F5F9; padding: 30px 10px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #E2E8F0;">
                
                <!-- Header Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #2563EB, #1D4ED8); padding: 28px 24px; text-align: center;">
                    <div style="font-size: 32px; line-height: 1; margin-bottom: 8px;">💼</div>
                    <h1 style="color: #FFFFFF; font-size: 22px; margin: 0; font-weight: 700; letter-spacing: -0.3px;">Job Portal</h1>
                    <p style="color: #DBEAFE; font-size: 13px; margin: 4px 0 0 0;">Password Reset Verification</p>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 32px 28px;">
                    <p style="font-size: 16px; color: #1E293B; margin: 0 0 14px 0; font-weight: 600;">
                      Hello ${userName},
                    </p>
                    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
                      We received a request to reset the password for your Job Portal account. Use the 6-digit confirmation code below to complete your password update:
                    </p>

                    <!-- OTP Highlight Box -->
                    <div style="background-color: #EFF6FF; border: 2px dashed #93C5FD; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #1E40AF; font-weight: 700; margin-bottom: 6px;">
                        Verification Code
                      </div>
                      <div style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1D4ED8; font-family: monospace;">
                        ${otp}
                      </div>
                      <div style="font-size: 12px; color: #64748B; margin-top: 8px;">
                        ⏱ Valid for <strong>10 minutes</strong>
                      </div>
                    </div>

                    <p style="font-size: 13px; color: #64748B; line-height: 1.5; margin: 0 0 16px 0;">
                      Enter this code in the mobile application to set your new password.
                    </p>

                    <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 14px; border-radius: 6px; margin-top: 20px;">
                      <p style="margin: 0; font-size: 12px; color: #92400E; line-height: 1.4;">
                        <strong>Security Notice:</strong> If you did not initiate this request, someone may have entered your email by mistake. Your password will remain unchanged.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #F8FAFC; padding: 18px 24px; border-top: 1px solid #E2E8F0; text-align: center;">
                    <p style="font-size: 12px; color: #94A3B8; margin: 0;">
                      © ${new Date().getFullYear()} Job Portal Application. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  // Always log OTP prominently in console for developer & testing convenience
  console.log("\n=======================================================");
  console.log(`[JOB PORTAL - GMAIL PASSWORD RESET OTP]`);
  console.log(`To: ${toEmail}`);
  console.log(`OTP Code: ${otp}`);
  console.log(`Expires: 10 minutes (${new Date(Date.now() + 10 * 60 * 1000).toLocaleTimeString()})`);
  console.log("=======================================================\n");

  if (!transporter) {
    console.warn(
      "[Job Portal Email Service] Gmail credentials (GMAIL_USER and GMAIL_APP_PASSWORD) not found in .env. OTP logged above for instant testing."
    );
    return { delivered: false, previewOtp: otp };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Job Portal Email Service] OTP email delivered to ${toEmail}: ${info.messageId}`);
    return { delivered: true };
  } catch (error) {
    console.error("[Job Portal Email Service] Failed to send email via Gmail SMTP:", error.message);
    return { delivered: false, previewOtp: otp };
  }
};

/**
 * Send Confirmation Email After Password is Successfully Changed
 */
const sendPasswordChangedConfirmationEmail = async (toEmail, userName = "Valued User") => {
  const transporter = createTransporter();
  if (!transporter) return;

  const mailOptions = {
    from: `"Job Portal Security" <${process.env.GMAIL_USER || process.env.EMAIL_USER || "noreply.jobportal@gmail.com"}>`,
    to: toEmail,
    subject: "✅ Job Portal - Your Password Has Been Updated",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background-color: #F8FAFC; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px; border: 1px solid #E2E8F0;">
          <h2 style="color: #16A34A; margin-top: 0;">✅ Password Successfully Updated</h2>
          <p>Hello ${userName},</p>
          <p>The password for your Job Portal account (<strong>${toEmail}</strong>) has been changed successfully.</p>
          <p>You can now sign in using your new password on the mobile app.</p>
          <p style="font-size: 12px; color: #64748B; margin-top: 24px; border-top: 1px solid #E2E8F0; padding-top: 12px;">
            If you did not make this change, please contact Job Portal Support immediately.
          </p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.log("[Job Portal Email Service] Confirmation email failed:", err.message);
  }
};

module.exports = {
  sendResetPasswordOtpEmail,
  sendPasswordChangedConfirmationEmail,
};

