import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Report from '../models/Report.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import ShareLink from '../models/ShareLink.js';
import { generateSecureURL } from '../utils/securityUtils.js';

// @desc    Upload diagnostic report (Lab Technician)
// @route   POST /api/lab/reports/upload
// @access  Private (Technician)
export const uploadReport = async (req, res) => {
    try {
        const { patient_id, report_type, description, test_date, pin } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const patient = await Patient.findById(patient_id);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Build Report Model
        const report = new Report({
            patient: patient_id,
            uploadedBy: req.user._id,
            title: `${report_type} Report - ${patient.fullName}`,
            description,
            filePath: file.path,
            fileType: file.mimetype,
            fileSize: file.size,
            fileCategory: report_type,
            visibility: 'private', // Default strictly private
            isProtected: true,
            testDate: test_date || new Date()
        });

        // 2. System stores file + metadata
        const savedReport = await report.save();

        // 5. Generate secure share link
        // We will generate a dedicated share link mapping
        const token = crypto.randomBytes(32).toString('hex');

        const shareLink = new ShareLink({
            report: savedReport._id, // For backward compat
            assetId: savedReport._id,
            itemType: 'Report',
            patientId: patient._id,
            token: token,
            shareToken: token,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            createdBy: req.user._id
        });
        await shareLink.save();



        // 7. Log activity
        await ActivityLog.create({
            user: req.user._id,
            action: 'UPLOAD_REPORT',
            details: `Technician uploaded ${report_type} report for patient ${patient.fullName}`
        });

        res.status(201).json({
            message: 'Report uploaded successfully',
            report: savedReport,
            shareLink: shareLink.token
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Assign Doctor to a specific Report
// @route   PUT /api/lab/reports/:id/assign-doctor
// @access  Private (Technician, Admin)
export const assignDoctor = async (req, res) => {
    try {
        const { doctor_id } = req.body;

        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Verify rules: Cannot access reports not assigned to them (Technician restriction)
        if (req.user.role === 'technician' && report.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to modify this report' });
        }

        const doctor = await User.findById(doctor_id);
        if (!doctor || doctor.role !== 'doctor') {
            return res.status(400).json({ message: 'Invalid doctor ID provided.' });
        }

        report.assignedDoctor = doctor._id;
        await report.save();

        await ActivityLog.create({
            user: req.user._id,
            action: 'ASSIGN_REPORT_DOCTOR',
            details: `Assigned report ${report._id} to Dr. ${doctor.name}`
        });

        res.json({ message: 'Doctor assigned successfully', report });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate Share Link
// @route   POST /api/lab/reports/:id/share
// @access  Private (Technician, Admin, Doctor)
export const generateShareLink = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        if (req.user.role === 'technician' && report.uploadedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to share this report' });
        }

        const token = crypto.randomBytes(32).toString('hex');

        const shareLink = new ShareLink({
            report: report._id,
            assetId: report._id,
            itemType: 'Report',
            patientId: report.patient,
            token,
            shareToken: token,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            createdBy: req.user._id
        });

        await shareLink.save();

        await ActivityLog.create({
            user: req.user._id,
            action: 'GENERATE_SHARE_LINK',
            details: `Generated new share link for report ${report._id}`
        });

        res.status(201).json({
            message: 'Share link generated',
            link: generateSecureURL(token)
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Technician's Uploaded Reports
// @route   GET /api/lab/reports/my
// @access  Private (Technician)
export const getMyReports = async (req, res) => {
    try {
        const reports = await Report.find({ uploadedBy: req.user._id })
            .populate('patient', 'fullName email medicalRecordNumber')
            .populate('assignedDoctor', 'name')
            .sort({ createdAt: -1 });

        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

