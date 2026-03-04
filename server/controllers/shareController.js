import ShareLink from '../models/ShareLink.js';
import Report from '../models/Report.js';
import Prescription from '../models/Prescription.js';
import ActivityLog from '../models/ActivityLog.js';
import Patient from '../models/Patient.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendShareEmail } from '../utils/emailService.js';

// @desc    Generate a secure share link for an asset
// @route   POST /api/share/generate
// @access  Private (Doctor)
export const generateShareLink = async (req, res) => {
    try {
        const { patientId, assetId, itemType, pin } = req.body;

        let asset;
        if (itemType === 'Report') {
            asset = await Report.findById(assetId);
        } else if (itemType === 'Prescription') {
            asset = await Prescription.findById(assetId);
        } else {
            return res.status(400).json({ message: 'Invalid itemType. Must be Report or Prescription' });
        }

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        const patient = await Patient.findById(patientId || asset.patient);
        if (!patient || !patient.email) {
            return res.status(400).json({ message: 'Patient email required to send share link' });
        }

        // Generate token and hash pin
        const shareToken = crypto.randomUUID();
        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(pin.toString(), salt);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Default 7 days

        const shareLink = new ShareLink({
            patientId: patient._id,
            assetId: assetId,
            itemType,
            shareToken,
            hashedPin,
            createdBy: req.user._id,
            expiresAt
        });

        await shareLink.save();

        await ActivityLog.create({
            user: req.user._id,
            action: 'CREATE_LINK',
            details: `Created secure share link for ${itemType} (Expires: ${expiresAt.toLocaleDateString()})`
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const shareUrl = `${frontendUrl}/share/${shareToken}`;

        // Send Email
        await sendShareEmail(patient.email, shareUrl, pin);

        res.status(201).json({
            message: 'Share link generated and sent to patient email successfully',
            shareToken,
            expiresAt
        });
    } catch (error) {
        console.error('Error generating share link:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify share link and PIN
// @route   POST /api/share/verify
// @access  Public
export const verifyShareLink = async (req, res) => {
    try {
        const { shareToken, pin } = req.body;

        const shareLink = await ShareLink.findOne({ shareToken });
        if (!shareLink) {
            return res.status(404).json({ message: 'Invalid or expired share link' });
        }

        if (new Date() > shareLink.expiresAt) {
            return res.status(410).json({ message: 'Link has expired' });
        }

        const isMatch = await bcrypt.compare(pin.toString(), shareLink.hashedPin);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect PIN' });
        }

        shareLink.accessCount += 1;
        await shareLink.save();

        // Generate a temporary JWT valid for 1 hour to download the asset
        const tempToken = jwt.sign(
            { assetId: shareLink.assetId, itemType: shareLink.itemType },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '1h' }
        );

        res.json({ tempToken, message: 'Verification successful' });

    } catch (error) {
        console.error('Error verifying share link:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get the shared asset
// @route   GET /api/share/asset
// @access  Public (Requires temp JWT as query or header)
export const getSharedAsset = async (req, res) => {
    try {
        const token = req.query.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No access token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        const { assetId, itemType } = decoded;

        let asset;
        let filePath;

        if (itemType === 'Report') {
            asset = await Report.findById(assetId);
            filePath = asset?.filePath;
        } else if (itemType === 'Prescription') {
            asset = await Prescription.findById(assetId);
            filePath = asset?.filePath;
        }

        if (!asset || !filePath) {
            return res.status(404).json({ message: 'Asset file not found' });
        }

        // Ideally serve the file
        res.download(filePath);
    } catch (error) {
        console.error('Error getting shared asset:', error);
        res.status(401).json({ message: 'Invalid or expired access token' });
    }
};
