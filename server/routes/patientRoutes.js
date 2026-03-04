import express from 'express';
import { getPatients, createPatient, getPatientById, updatePatient, deletePatient, getMe, updateMe } from '../controllers/patientController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getPatients)
    .post(protect, authorize('admin', 'receptionist'), createPatient);

router.route('/me')
    .get(protect, getMe)
    .put(protect, updateMe);

router.route('/:id')
    .get(protect, getPatientById)
    .put(protect, authorize('admin', 'receptionist'), updatePatient)
    .delete(protect, authorize('admin', 'receptionist'), deletePatient);

export default router;
