import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';

dotenv.config();

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL ?? process.env.FROM_EMAIL;
const fromName = process.env.SENDGRID_FROM_NAME ?? 'AccounTech';
const toEmail = process.env.SENDGRID_TO_EMAIL;

if (!apiKey) {
  throw new Error('Missing SENDGRID_API_KEY');
}

if (!fromEmail) {
  throw new Error('Missing SENDGRID_FROM_EMAIL');
}

if (!toEmail) {
  throw new Error('Missing SENDGRID_TO_EMAIL');
}

sgMail.setApiKey(apiKey);

const msg = {
  to: toEmail,
  from: {
    name: fromName,
    email: fromEmail,
  },
  subject: 'AccounTech SendGrid Test',
  text: 'This is a SendGrid connectivity test for AccounTech OTP delivery.',
  html: '<strong>This is a SendGrid connectivity test for AccounTech OTP delivery.</strong>',
};

try {
  await sgMail.send(msg);
  console.log(`SendGrid test email sent to ${toEmail}`);
} catch (error) {
  console.error('SendGrid test failed:', error);

  if (error && typeof error === 'object' && 'response' in error) {
    console.error(error.response?.body);
  }
}
