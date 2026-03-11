import express from 'express';
import { 
    getDashboardStats, getStaffDashboardData, createStaffMember, getAllStaff, 
    getStorageAnalytics, updateStaffMember, deleteStaffMember, getUploadStats,
    getAdminPatients, updateAdminPatient, deleteAdminPatient,
    getAdminDoctors, updateAdminDoctor, deleteAdminDoctor,
    getAdminLabTechnicians, updateAdminLabTechnician, deleteAdminLabTechnician,
    getAdminReceptionists, updateAdminReceptionist, deleteAdminReceptionist,
    getAdminReports, deleteAdminReport
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, authorize('admin', 'staff', 'doctor', 'technician', 'receptionist'), getDashboardStats); // Allow staff to view stats
router.get('/staff-stats', protect, authorize('admin', 'staff', 'doctor', 'technician', 'receptionist'), getStaffDashboardData);
router.get('/storage', protect, authorize('admin'), getStorageAnalytics);
router.get('/upload-stats', protect, authorize('admin'), getUploadStats);
router.post('/staff', protect, authorize('admin', 'staff'), createStaffMember); // Admin and Staff can create users
router.get('/staff', protect, authorize('admin', 'staff', 'receptionist'), getAllStaff); // Admin, Staff, and Receptionists can view users
router.put('/staff/:id', protect, authorize('admin', 'staff'), updateStaffMember);
router.delete('/staff/:id', protect, authorize('admin', 'staff'), deleteStaffMember);

// --- Specific Admin Management Routes ---
// Patients
router.get('/patients', protect, authorize('admin'), getAdminPatients);
router.put('/patients/:id', protect, authorize('admin'), updateAdminPatient);
router.delete('/patients/:id', protect, authorize('admin'), deleteAdminPatient);

// Doctors
router.get('/doctors', protect, authorize('admin'), getAdminDoctors);
router.put('/doctors/:id', protect, authorize('admin'), updateAdminDoctor);
router.delete('/doctors/:id', protect, authorize('admin'), deleteAdminDoctor);

// Lab Technicians
router.get('/lab-technicians', protect, authorize('admin'), getAdminLabTechnicians);
router.put('/lab-technicians/:id', protect, authorize('admin'), updateAdminLabTechnician);
router.delete('/lab-technicians/:id', protect, authorize('admin'), deleteAdminLabTechnician);

// Receptionists
router.get('/receptionists', protect, authorize('admin'), getAdminReceptionists);
router.put('/receptionists/:id', protect, authorize('admin'), updateAdminReceptionist);
router.delete('/receptionists/:id', protect, authorize('admin'), deleteAdminReceptionist);

// Reports Metadata
router.get('/reports', protect, authorize('admin'), getAdminReports);
router.delete('/reports/:id', protect, authorize('admin'), deleteAdminReport);

export default router;
