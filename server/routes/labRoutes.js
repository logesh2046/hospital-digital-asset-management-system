import express from 'express';
import {
    uploadReport,
    assignDoctor,
    generateShareLink,
    getMyReports
} from '../controllers/labController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Base route is /api/lab/reports

// GET routes
router.get('/my', protect, authorize('technician'), getMyReports);

// POST/PUT upload & modification routes
router.post('/upload', protect, authorize('technician'), upload.single('file'), uploadReport);
router.put('/:id/assign-doctor', protect, authorize('technician', 'admin'), assignDoctor);
router.post('/:id/share', protect, authorize('technician', 'admin', 'doctor'), generateShareLink);

export default router;
