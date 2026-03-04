import express from 'express';
import {
    verifySecureAccess,
    downloadSecureReport,
    getSecureReportMetadata
} from '../controllers/secureAccessController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (no auth required for secure links)
router.get('/secure/:token/metadata', getSecureReportMetadata);
router.post('/secure/:token/verify', verifySecureAccess);
router.get('/secure/:token/download', downloadSecureReport);

// Protected routes (require authentication)
// These will be moved from reportRoutes.js
// Keeping them here for now to maintain backward compatibility

export default router;
