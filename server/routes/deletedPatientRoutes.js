import express from 'express';
import { getDeletedPatients } from '../controllers/deletedPatientController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('admin', 'patient_admin'), getDeletedPatients);

export default router;
