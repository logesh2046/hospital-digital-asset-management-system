import express from 'express';
import { sendOTP, verifyOTP } from '../controllers/otpController.js';
import { otpRateLimiter } from '../middleware/otpRateLimiter.js';

const router = express.Router();

router.post('/send', otpRateLimiter, sendOTP);
router.post('/verify', verifyOTP);

export default router;
