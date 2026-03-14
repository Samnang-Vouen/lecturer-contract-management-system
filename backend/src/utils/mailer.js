import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(toEmail, resetLink) {
  await transporter.sendMail({
    from: `"LCMS - CADT" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #1d4ed8; margin-bottom: 8px;">Password Reset Request</h2>
        <p style="color: #374151;">You requested to reset your password for the <strong>Lecturer Contract Management System</strong>.</p>
        <p style="color: #374151;">Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" style="background-color: #1d4ed8; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #6b7280; font-size: 13px;">If the button does not work, copy and paste this link into your browser:</p>
        <p style="color: #1d4ed8; font-size: 13px; word-break: break-all;">${resetLink}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">If you did not request a password reset, you can safely ignore this email. Your password will not be changed.</p>
      </div>
    `,
  });
}
