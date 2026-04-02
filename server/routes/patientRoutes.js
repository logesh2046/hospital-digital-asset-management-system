import express from 'express';
import { getPatients, createPatient, getPatientById, updatePatient, deletePatient, getMe, updateMe } from '../controllers/patientController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, authorize('admin', 'staff', 'receptionist', 'doctor', 'technician'), getPatients)
    .post(protect, authorize('admin', 'staff', 'receptionist', 'patient_admin'), createPatient);

router.route('/me')
    .get(protect, getMe)
    .put(protect, updateMe);

router.route('/:id')
    .get(protect, authorize('admin', 'staff', 'receptionist', 'doctor', 'technician'), getPatientById)
    .put(protect, authorize('admin', 'staff', 'receptionist', 'doctor', 'patient_admin'), updatePatient)
    .delete(protect, authorize('admin', 'staff', 'receptionist', 'patient_admin'), deletePatient);

export default router;
