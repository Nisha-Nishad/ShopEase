import nodemailer from 'nodemailer';

/**
 * Sends an email using Nodemailer (supports Gmail SMTP & custom SMTP).
 * In development mode without configured SMTP credentials, logs the email to the console
 * and returns { sent: false, mode: 'dev_preview' }.
 */
const sendEmail = async ({ email, subject, message, html, attachments }) => {
  const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = (process.env.SMTP_USER || '').trim();
  // Remove spaces from Google 16-character App Passwords (e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
  const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

  const isUnconfigured =
    !smtpUser ||
    !smtpPass ||
    smtpUser === 'your_email@gmail.com' ||
    smtpPass === 'your_app_password' ||
    smtpPass === 'your_16_digit_google_app_password';

  if (isUnconfigured) {
    console.log('----------------------------------------------------');
    console.log('[DEV EMAIL PREVIEW - Gmail SMTP not configured in server/.env]');
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message:\n${message}`);
    console.log('----------------------------------------------------');
    return { sent: false, mode: 'dev_preview' };
  }

  const isGmail = smtpHost.toLowerCase().includes('gmail');

  const transporter = nodemailer.createTransport(
    isGmail
      ? {
          service: 'gmail',
          connectionTimeout: 3500,
          greetingTimeout: 3500,
          socketTimeout: 5000,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        }
      : {
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          connectionTimeout: 3500,
          greetingTimeout: 3500,
          socketTimeout: 5000,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        }
  );

  // Gmail strictly requires the "From" address to match the authenticated SMTP_USER
  const fromAddress = isGmail
    ? smtpUser
    : process.env.FROM_EMAIL &&
      process.env.FROM_EMAIL !== 'noreply@shopease.com'
    ? process.env.FROM_EMAIL
    : smtpUser;

  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'ShopEase'}" <${fromAddress}>`,
    replyTo: fromAddress,
    to: email,
    subject,
    text: message,
    html: html || message.replace(/\n/g, '<br/>'),
    ...(Array.isArray(attachments) && attachments.length > 0
      ? { attachments }
      : {}),
  };

  try {
    await transporter.sendMail(mailOptions);
    return { sent: true, mode: 'smtp' };
  } catch (err) {
    console.warn(
      `[SMTP Notice] Outbound SMTP blocked or timed out (${err.message}). Falling back to instant OTP/Reset preview.`
    );
    return { sent: false, mode: 'dev_preview' };
  }
};

export default sendEmail;
