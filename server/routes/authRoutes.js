import express from 'express';
import { registerUser, loginUser, updateAvailability } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/availability', protect, updateAvailability);

export default router;
