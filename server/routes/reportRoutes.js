import express from 'express';
import { uploadReport, getReports, getAllReports, viewProtectedReport, updateReportStatus } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/upload', protect, authorize('admin', 'doctor', 'technician'), upload.single('file'), uploadReport);
router.get('/', protect, getAllReports);
router.get('/:patientId', protect, getReports);
router.get('/view/:id', viewProtectedReport);
router.put('/:id/status', protect, authorize('admin', 'doctor'), updateReportStatus);

export default router;
