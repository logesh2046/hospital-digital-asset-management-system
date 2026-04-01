import Report from '../models/Report.js';
import ActivityLog from '../models/ActivityLog.js';
import Patient from '../models/Patient.js';
import { generateSecureURL } from '../utils/securityUtils.js';
import { sendUploadNotificationEmail } from '../utils/emailService.js';
import jwt from 'jsonwebtoken';

const uploadReport = async (req, res) => {
    try {
        console.log('Starting uploadReport...');
        const { patientId, title, description, fileCategory, visibility, isProtected, doctorNotes, nextVisitDate, assignedDoctorId } = req.body;
        const file = req.file;

        if (!file) {
            console.log('No file uploaded.');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Duplicate File Detection 
        try {
            const duplicate = await Report.findOne({
                patient: patientId,
                fileSize: file.size,
                title: title
            });
            if (duplicate) {
                console.log(`Duplicate detected: ${title}`);
                return res.status(409).json({ message: 'Duplicate file detected.' });
            }
        } catch (dupError) {
            console.error('Duplicate check error:', dupError);
            throw dupError;
        }

        let createdReport;
        try {
            const report = new Report({
                patient: patientId,
                uploadedBy: req.user._id,
                assignedDoctor: assignedDoctorId || req.user.role === 'doctor' ? req.user._id : null,
                title,
                description,
                filePath: file.path.startsWith('http') ? `api/redirect?url=${encodeURIComponent(file.path)}` : file.path,
                fileType: file.mimetype,
                fileSize: file.size,
                fileCategory: fileCategory || 'Other',
                visibility: visibility || 'private',
                isProtected: isProtected !== 'false',
                doctorNotes,
                nextVisitDate
            });
            console.log('Saving report...');
            createdReport = await report.save();
            console.log('Report saved successfully.');
        } catch (saveError) {
            console.error('Report save error:', saveError);
            throw saveError;
        }

        // Check if patient exists to get email for ActivityLog context and Email Notification
        let patient; // Declare patient outside to be accessible for ActivityLog
        try {
            patient = await Patient.findById(patientId);
            if (patient && patient.email) {
                // Instantly notify the patient via email async without blocking the final response
                sendUploadNotificationEmail(patient.email, patient.fullName || 'Patient');
            }
        } catch (patError) {
            console.error('Patient lookup error:', patError);
        }

        try {
            await ActivityLog.create({
                user: req.user._id,
                action: 'UPLOAD_REPORT',
                details: `Uploaded ${fileCategory || 'Other'} report "${createdReport.title}" for patient ${patient?.fullName || patientId}`
            });
        } catch (logError) {
            console.error('ActivityLog error:', logError);
        }

        res.status(201).json({
            ...createdReport.toObject(),
            secureLink: generateSecureURL(createdReport.secureToken)
        });
    } catch (error) {
        console.error('CRITICAL UPLOAD ERROR:', error);
        res.status(500).json({ message: error.message, stack: error.stack });
    }
};

const getReports = async (req, res) => {
    try {
        const reports = await Report.find({ patient: req.params.patientId });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const viewProtectedReport = async (req, res) => {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        if (report.isProtected) {
            if (!token) {
                return res.status(401).json({ message: 'OTP verification required. No temporary token provided.' });
            }
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded.reportId !== req.params.id) {
                    return res.status(403).json({ message: 'Token not valid for this specific report.' });
                }
                res.json({ message: 'Access granted', url: report.filePath });
            } catch (err) {
                return res.status(401).json({ message: 'Invalid or expired OTP token. Please request a new OTP.' });
            }
        } else {
            res.json({ message: 'Public report', url: report.filePath });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllReports = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'doctor') {
            // Find all patients assigned to this doctor
            const assignedPatients = await Patient.find({ assignedDoctor: req.user._id }).select('_id');
            const patientIds = assignedPatients.map(p => p._id);

            query = {
                $or: [
                    { assignedDoctor: req.user._id },
                    { patient: { $in: patientIds } }
                ]
            };
        }

        const reports = await Report.find(query)
            .populate('patient', 'fullName medicalRecordNumber')
            .sort({ createdAt: -1 });

        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateReportStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Only assigned doctor or admin can change status
        if (req.user.role !== 'admin' && report.assignedDoctor?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to change this report status' });
        }

        report.status = status;
        await report.save();

        await ActivityLog.create({
            user: req.user._id,
            action: 'UPDATE_REPORT_STATUS',
            details: `Updated status of report "${report.title}" to ${status}`
        });

        res.json({ message: 'Status updated successfully', status: report.status });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: error.message });
    }
};

export { uploadReport, getReports, getAllReports, viewProtectedReport, updateReportStatus };
