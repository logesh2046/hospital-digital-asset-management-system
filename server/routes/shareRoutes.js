import express from 'express';
import { generateShareLink, verifyShareLink, getSharedAsset } from '../controllers/shareController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate', protect, authorize('doctor', 'admin'), generateShareLink);
router.post('/verify', verifyShareLink);
router.get('/asset', getSharedAsset);

export default router;
