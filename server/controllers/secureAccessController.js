import Report from '../models/Report.js';
import Patient from '../models/Patient.js';
import ActivityLog from '../models/ActivityLog.js';
import { validateToken, validatePIN } from '../utils/securityUtils.js';

/**
 * Verify secure access to report via token and PIN
 * Route: POST /api/reports/secure/:token/verify
 */
export const verifySecureAccess = async (req, res) => {
    try {
        const { token } = req.params;
        const { pin } = req.body;

        // Validate token format
        if (!validateToken(token)) {
            return res.status(400).json({ message: 'Invalid token format' });
        }

        // Find report by secure token
        const report = await Report.findOne({ secureToken: token })
            .populate('patient', 'fullName email medicalRecordNumber')
            .populate('uploadedBy', 'name role department')
            .populate('assignedDoctor', 'name specialization');

        if (!report) {
            return res.status(404).json({ message: 'Report not found or link expired' });
        }

        // Check if report is protected
        if (report.isProtected) {
            if (!pin) {
                return res.status(401).json({
                    message: 'PIN required for this report',
                    requiresPIN: true
                });
            }

            // Validate PIN format
            if (!validatePIN(pin)) {
                return res.status(400).json({ message: 'Invalid PIN format. Must be 6 digits.' });
            }

            // Verify PIN
            if (report.accessCode !== pin) {
                // Log failed access attempt
                await ActivityLog.create({
                    user: req.user?._id,
                    action: 'FAILED_PIN_ATTEMPT',
                    details: `Failed PIN attempt for report ${report.title} (Token: ${token})`
                });

                return res.status(401).json({ message: 'Incorrect PIN' });
            }
        }

        // Update access tracking
        report.downloadCount += 1;
        report.lastAccessedAt = new Date();

        // Log successful access
        if (req.user) {
            report.accessLog.push({
                accessedBy: req.user._id,
                action: 'view'
            });
        }

        await report.save();

        // Log activity
        await ActivityLog.create({
            user: req.user?._id,
            action: 'SECURE_ACCESS',
            details: `Accessed report ${report.title} via secure link`
        });

        // Return report details (without exposing sensitive file path)
        res.json({
            message: 'Access granted',
            report: {
                id: report._id,
                title: report.title,
                description: report.description,
                fileCategory: report.fileCategory,
                fileType: report.fileType,
                fileSize: report.fileSize,
                patient: report.patient,
                uploadedBy: report.uploadedBy,
                assignedDoctor: report.assignedDoctor,
                doctorNotes: report.doctorNotes,
                nextVisitDate: report.nextVisitDate,
                createdAt: report.createdAt,
                downloadURL: `/api/reports/secure/${token}/download?pin=${pin}`
            }
        });

    } catch (error) {
        console.error('Secure access verification error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Download report file via secure token (after PIN verification)
 * Route: GET /api/reports/secure/:token/download
 */
export const downloadSecureReport = async (req, res) => {
    try {
        const { token } = req.params;
        const { pin } = req.query;

        // Validate token
        if (!validateToken(token)) {
            return res.status(400).json({ message: 'Invalid token format' });
        }

        // Find report
        const report = await Report.findOne({ secureToken: token });

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Verify PIN if protected
        if (report.isProtected && report.accessCode !== pin) {
            return res.status(401).json({ message: 'Invalid or missing PIN' });
        }

        // Log download
        if (req.user) {
            report.accessLog.push({
                accessedBy: req.user._id,
                action: 'download'
            });
            await report.save();

            await ActivityLog.create({
                user: req.user._id,
                action: 'DOWNLOAD_REPORT',
                details: `Downloaded report ${report.title} via secure link`
            });
        }

        // Send file
        res.download(report.filePath, `${report.title}${report.fileType}`);

    } catch (error) {
        console.error('Secure download error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get report metadata via secure token (no PIN required for metadata)
 * Route: GET /api/reports/secure/:token/metadata
 */
export const getSecureReportMetadata = async (req, res) => {
    try {
        const { token } = req.params;

        if (!validateToken(token)) {
            return res.status(400).json({ message: 'Invalid token format' });
        }

        const report = await Report.findOne({ secureToken: token })
            .populate('patient', 'fullName medicalRecordNumber')
            .populate('uploadedBy', 'name role')
            .select('-filePath -accessCode'); // Don't expose file path or PIN

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        res.json({
            report: {
                title: report.title,
                fileCategory: report.fileCategory,
                fileSize: report.fileSize,
                uploadedBy: report.uploadedBy,
                createdAt: report.createdAt,
                requiresPIN: report.isProtected
            }
        });

    } catch (error) {
        console.error('Metadata fetch error:', error);
        res.status(500).json({ message: error.message });
    }
};
