import express from 'express';
import { createPrescription, getPatientPrescriptions } from '../controllers/prescriptionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/', protect, authorize('doctor'), upload.single('file'), createPrescription);
router.get('/patient/:id', protect, getPatientPrescriptions);

export default router;
