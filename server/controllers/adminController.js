import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Report from '../models/Report.js';
import ActivityLog from '../models/ActivityLog.js';

const getDashboardStats = async (req, res) => {
    try {
        const totalPatients = await Patient.countDocuments();
        const totalStaff = await User.countDocuments({ role: { $in: ['doctor', 'technician', 'receptionist', 'admin'] } });
        const totalReports = await Report.countDocuments();

        // Sum file sizes; ensure fileSize is stored
        const reports = await Report.find({}, 'fileSize');
        const storageInBytes = reports.reduce((acc, report) => acc + (report.fileSize || 0), 0);

        // Convert to readable format for frontend usually, but sending bytes is fine
        const storageUsed = (storageInBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';

        res.json({
            stats: [
                { title: 'Total Patients', value: totalPatients.toString(), change: '+2.5%', isPositive: true },
                { title: 'Total Staff', value: totalStaff.toString(), change: '+1.2%', isPositive: true },
                { title: 'Total Reports', value: totalReports.toString(), change: '+5.4%', isPositive: true },
                { title: 'Storage Used', value: storageUsed, change: 'Stable', isNeutral: true }
            ]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getStaffDashboardData = async (req, res) => {
    try {
        console.log('Fetching Staff Dashboard Data...');
        const [doctorCount, technicianCount, receptionistCount, patientCount] = await Promise.all([
            User.countDocuments({ role: { $regex: /^doctor$/i } }),
            User.countDocuments({ role: { $regex: /^technician$/i } }),
            User.countDocuments({ role: { $regex: /^receptionist$/i } }),
            Patient.countDocuments()
        ]);

        console.log('Counts:', { doctorCount, technicianCount, receptionistCount });

        // Fetch all recent activity logs (including creation by Admin)
        const activityLogs = await ActivityLog.find()
            .sort({ timestamp: -1 })
            .limit(20)
            .populate('user', 'name role email');

        res.json({
            counts: {
                doctors: doctorCount,
                technicians: technicianCount,
                receptionists: receptionistCount,
                patients: patientCount
            },
            activityLogs
        });
    } catch (error) {
        console.error('Error in getStaffDashboardData:', error);
        res.status(500).json({ message: error.message });
    }
};

// Create a new staff member
const createStaffMember = async (req, res) => {
    try {
        const { name, email, password, role, department, contactNumber } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Create new staff member
        const user = await User.create({
            name,
            email,
            password,
            role: (role || 'staff').toLowerCase().trim(),
            department,
            contactNumber,
            isActive: true
        });

        if (user) {
            // Log the activity
            await ActivityLog.create({
                user: req.user._id, // The admin/staff who created the user
                action: 'CREATE_STAFF',
                details: `Created new ${user.role}: ${user.name} (${user.email})`
            });

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                message: 'Staff member created successfully'
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all staff members
const getAllStaff = async (req, res) => {
    try {
        const staff = await User.find({
            role: { $in: ['staff', 'doctor', 'technician', 'receptionist'] }
        }).select('-password');

        res.json({ staff });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cloudinary-style Storage Analytics
// Cloudinary-style Storage Analytics
const getStorageAnalytics = async (req, res) => {
    try {
        const totalReports = await Report.countDocuments();

        // 1. Overview Stats
        const totalSizeAgg = await Report.aggregate([{ $group: { _id: null, total: { $sum: "$fileSize" } } }]);
        const totalSizeBytes = totalSizeAgg.length > 0 ? totalSizeAgg[0].total : 0;
        const totalSizeGB = (totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2);
        const limitGB = 1000; // Mock limit of 1000 GB
        const percentageUsed = Math.min(Math.round((totalSizeGB / limitGB) * 100), 100);

        const storageOverview = {
            total: '1000 GB',
            used: `${totalSizeGB} GB`,
            available: `${(limitGB - totalSizeGB).toFixed(2)} GB`,
            percentage: percentageUsed
        };

        // 2. Storage By Type (Category)
        const typeStatsAgg = await Report.aggregate([
            {
                $group: {
                    _id: "$fileCategory",
                    count: { $sum: 1 },
                    size: { $sum: "$fileSize" }
                }
            }
        ]);

        const storageByType = typeStatsAgg.map(stat => ({
            type: stat._id || 'Other',
            size: (stat.size / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
            files: stat.count,
            percentage: totalReports > 0 ? Math.round((stat.count / totalReports) * 100) : 0,
            color: stat._id === 'MRI' ? 'bg-[#0065a3]' :
                stat._id === 'Blood Test' ? 'bg-indigo-500' :
                    stat._id === 'X-Ray' ? 'bg-amber-500' : 'bg-gray-400',
            trend: '+0% this month' // Placeholder for trend
        }));

        // 3. Storage By Department
        const deptStatsAgg = await Report.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "uploadedBy",
                    foreignField: "_id",
                    as: "uploader"
                }
            },
            { $unwind: "$uploader" },
            {
                $group: {
                    _id: "$uploader.department",
                    size: { $sum: "$fileSize" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const storageByDepartment = deptStatsAgg.map(dept => ({
            department: dept._id || 'General',
            size: (dept.size / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
            percentage: totalSizeBytes > 0 ? Math.round((dept.size / totalSizeBytes) * 100) : 0,
            files: dept.count,
            color: dept._id === 'Radiology' ? 'bg-blue-500' :
                dept._id === 'Laboratory' ? 'bg-purple-500' :
                    dept._id === 'Cardiology' ? 'bg-red-500' : 'bg-green-500'
        }));

        // 4. Monthly Growth (Last 5 Months) - Simplified for now using static months or recent data
        // For accurate monthly growth, we'd need a more complex aggregation by date intervals.
        // We will output placeholder data structure populated with real cumulative if possible, or just real total for current month.
        const monthlyGrowth = [
            { month: 'Current', size: parseFloat(totalSizeGB), growth: 0 } // Real current total
        ];

        // 5. Warnings
        const storageWarnings = [];
        if (percentageUsed > 80) {
            storageWarnings.push({ id: 1, message: `Storage capacity at ${percentageUsed}% - Consider cleanup`, severity: 'warning', icon: 'alert' });
        } else {
            storageWarnings.push({ id: 1, message: `Storage capacity healthy at ${percentageUsed}%`, severity: 'success', icon: 'check' });
        }

        // Check for any department using too much
        const heavyDept = storageByDepartment.find(d => d.percentage > 40);
        if (heavyDept) {
            storageWarnings.push({ id: 2, message: `${heavyDept.department} using ${heavyDept.percentage}% of total storage`, severity: 'info', icon: 'info' });
        }

        res.json({
            storageOverview,
            storageByType,
            storageByDepartment,
            monthlyGrowth,
            storageWarnings
        });

    } catch (error) {
        console.error('Error in getStorageAnalytics:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update a staff member
const updateStaffMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, department, contactNumber, isActive } = req.body;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.role = role || user.role;
        user.department = department || user.department;
        user.contactNumber = contactNumber || user.contactNumber;
        if (isActive !== undefined) user.isActive = isActive;

        // If password is being updated, it should be handled separately or here with hashing if not already handled by pre-save hook
        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        await ActivityLog.create({
            user: req.user._id,
            action: 'UPDATE_STAFF',
            details: `Updated staff member: ${updatedUser.name} (${updatedUser.role})`
        });

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            department: updatedUser.department,
            contactNumber: updatedUser.contactNumber,
            isActive: updatedUser.isActive
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a staff member
const deleteStaffMember = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await User.deleteOne({ _id: id });

        await ActivityLog.create({
            user: req.user._id,
            action: 'DELETE_STAFF',
            details: `Deleted staff member: ${user.name} (${user.role})`
        });

        res.json({ message: 'Staff member removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Upload Statistics
const getUploadStats = async (req, res) => {
    try {
        const totalFiles = await Report.countDocuments();

        // 1. File Type Stats
        const typeStats = await Report.aggregate([
            {
                $group: {
                    _id: "$fileCategory",
                    count: { $sum: 1 },
                    size: { $sum: "$fileSize" },
                    lastUpload: { $max: "$createdAt" } // Get latest upload time for this type
                }
            }
        ]);

        const processedTypeStats = typeStats.map(stat => ({
            type: stat._id || 'Other',
            count: stat.count,
            size: (stat.size / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
            percentage: totalFiles > 0 ? Math.round((stat.count / totalFiles) * 100) : 0,
            avgSize: (stat.size / stat.count / (1024 * 1024)).toFixed(1) + ' MB',
            // Trends would typically require comparing to previous period, mocking trend for now or calculating if needed
            // For simplicity, we'll return a static or calculated "today" count if we had time range queries
            trend: '+0 today',
            color: stat._id === 'MRI' ? 'bg-[#0065a3]' :
                stat._id === 'Blood Test' ? 'bg-indigo-500' :
                    stat._id === 'X-Ray' ? 'bg-amber-500' : 'bg-gray-400',
            lastUpload: stat.lastUpload
        }));

        // 2. Department Stats
        const deptStatsAgg = await Report.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "uploadedBy",
                    foreignField: "_id",
                    as: "uploader"
                }
            },
            { $unwind: "$uploader" },
            {
                $group: {
                    _id: "$uploader.department",
                    uploads: { $sum: 1 }
                }
            }
        ]);

        const processedDeptStats = deptStatsAgg.map(dept => ({
            department: dept._id || 'General',
            uploads: dept.uploads,
            percentage: totalFiles > 0 ? Math.round((dept.uploads / totalFiles) * 100) : 0,
            color: dept._id === 'Radiology' ? 'bg-blue-500' :
                dept._id === 'Laboratory' ? 'bg-purple-500' :
                    dept._id === 'Cardiology' ? 'bg-red-500' : 'bg-green-500'
        }));

        // 3. Recent Uploads
        const recentUploadsData = await Report.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('uploadedBy', 'name department');

        const processedRecentUploads = recentUploadsData.map(upload => ({
            filename: upload.title,
            type: upload.fileCategory,
            size: (upload.fileSize / (1024 * 1024)).toFixed(1) + ' MB',
            uploader: upload.uploadedBy ? upload.uploadedBy.name : 'Unknown',
            department: upload.uploadedBy ? upload.uploadedBy.department : 'General',
            timestamp: upload.createdAt,
            status: upload.status || 'Completed'
        }));

        // Summary Cards Data
        const totalSizeAgg = await Report.aggregate([{ $group: { _id: null, total: { $sum: "$fileSize" } } }]);
        const totalSizeGB = totalSizeAgg.length > 0 ? (totalSizeAgg[0].total / (1024 * 1024 * 1024)).toFixed(2) : '0';

        // Count today's uploads
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todaysUploads = await Report.countDocuments({ createdAt: { $gte: startOfDay } });

        res.json({
            uploadStats: processedTypeStats,
            departmentStats: processedDeptStats,
            recentUploads: processedRecentUploads,
            summary: {
                totalFiles,
                totalStorage: totalSizeGB + ' GB',
                todaysUploads: '+' + todaysUploads,
                avgFileSize: (totalFiles > 0 ? (totalSizeAgg[0].total / totalFiles / (1024 * 1024)).toFixed(1) : '0') + ' MB'
            }
        });

    } catch (error) {
        console.error('Error in getUploadStats:', error);
        res.status(500).json({ message: error.message });
    }
};

export { getDashboardStats, getStaffDashboardData, createStaffMember, getAllStaff, getStorageAnalytics, updateStaffMember, deleteStaffMember, getUploadStats };
