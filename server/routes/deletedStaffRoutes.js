import express from 'express';
import DeletedStaff from '../models/DeletedStaff.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all deleted staff (admin and staff can view)
router.get('/', protect, authorize('admin', 'staff'), async (req, res) => {
    try {
        const records = await DeletedStaff.find().sort({ deletedAt: -1 });
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
