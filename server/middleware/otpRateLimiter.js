import rateLimit from 'express-rate-limit';

export const otpRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 30, // limit each IP to 30 requests per windowMs
    message: { message: 'Too many OTP requests from this IP, please try again after 5 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
