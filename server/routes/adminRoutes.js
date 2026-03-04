import express from 'express';
import { getDashboardStats, createStaffMember, getAllStaff, getStaffDashboardData, getStorageAnalytics, updateStaffMember, deleteStaffMember, getUploadStats } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, authorize('admin', 'staff', 'doctor', 'technician', 'receptionist'), getDashboardStats); // Allow staff to view stats
router.get('/staff-stats', protect, authorize('admin', 'staff', 'doctor', 'technician', 'receptionist'), getStaffDashboardData);
router.get('/storage', protect, authorize('admin'), getStorageAnalytics);
router.get('/upload-stats', protect, authorize('admin'), getUploadStats);
router.post('/staff', protect, authorize('admin', 'staff'), createStaffMember); // Admin and Staff can create users
router.get('/staff', protect, authorize('admin', 'staff'), getAllStaff); // Admin and Staff can view users
router.put('/staff/:id', protect, authorize('admin', 'staff'), updateStaffMember);
router.delete('/staff/:id', protect, authorize('admin', 'staff'), deleteStaffMember);

export default router;
