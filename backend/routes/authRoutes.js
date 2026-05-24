const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerification,
  verifyEmailOtp,
  sendPhoneOtp,
  verifyPhoneOtp,
  getGoogleClientId,
  googleAuth,
  getMe,
  getUsers,
  updateUserBlockStatus,
  verifyNgo,
} = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { createRateLimiter } = require('../middlewares/rateLimitMiddleware');

const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 25, keyPrefix: 'auth' });
const otpLimiter = createRateLimiter({ windowMs: 5 * 60 * 1000, max: 8, keyPrefix: 'otp' });

router.post('/register', authLimiter, registerUser);
router.post('/signup', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/google', authLimiter, googleAuth);
router.post('/resend-verification', otpLimiter, resendVerification);
router.post('/resend-otp', otpLimiter, resendVerification);
router.post('/send-email-otp', otpLimiter, resendVerification);
router.post('/verify-email-otp', otpLimiter, verifyEmailOtp);
router.post('/send-phone-otp', otpLimiter, sendPhoneOtp);
router.post('/verify-phone-otp', otpLimiter, verifyPhoneOtp);
router.get('/google-client-id', getGoogleClientId);
router.get('/verify-email/:token', verifyEmail);
router.get('/me', protect, getMe);
router.get('/users', protect, authorize('admin'), getUsers);
router.put('/users/:id/block', protect, authorize('admin'), updateUserBlockStatus);
router.put('/users/:id/verify-ngo', protect, authorize('admin'), verifyNgo);

module.exports = router;
