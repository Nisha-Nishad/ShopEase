import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Checks whether real Razorpay API keys are configured in .env
 */
export const isRazorpayConfigured = () => {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id' &&
      process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_key_secret'
  );
};

/**
 * Returns an initialized Razorpay SDK instance when keys are present,
 * or null when running in local simulated test mode.
 */
export const getRazorpayInstance = () => {
  if (!isRazorpayConfigured()) {
    return null;
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};
