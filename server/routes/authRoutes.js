import express from 'express';
import {
  registerUser,
  verifyEmailOtp,
  resendEmailOtp,
  loginUser,
  logoutUser,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/securityMiddleware.js';
import {
  validate,
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/authValidator.js';

const router = express.Router();

// Public Auth Routes (Protected with strict authLimiter & Zod validation)
router.post('/register', authLimiter, validate(registerSchema), registerUser);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), verifyEmailOtp);
router.post('/resend-otp', authLimiter, validate(resendOtpSchema), resendEmailOtp);
router.post('/login', authLimiter, validate(loginSchema), loginUser);
router.post('/logout', logoutUser);
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPassword
);
router.put(
  '/reset-password/:token',
  authLimiter,
  validate(resetPasswordSchema),
  resetPassword
);

// Protected Customer/Admin Routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

export default router;
