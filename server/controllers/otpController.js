import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import Report from '../models/Report.js';
import OTPVerification from '../models/OTPVerification.js';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail', // Standard configuration
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendOTP = async (req, res) => {
    try {
        const { reportId, email: providedEmail } = req.body;

        if (!reportId || !providedEmail) {
            return res.status(400).json({ message: 'reportId and email are required.' });
        }

        const report = await Report.findById(reportId).populate('patient');
        if (!report) {
            return res.status(404).json({ message: 'Report not found.' });
        }

        const patient = report.patient;

        if (patient && patient.email && patient.email.toLowerCase() !== providedEmail.toLowerCase()) {
            return res.status(400).json({ message: 'Entered email does not match the registered patient email.' });
        }

        const email = providedEmail;

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otp, salt);

        // Expire in 5 mins
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await OTPVerification.deleteMany({ email, reportId });

        const otpVerification = new OTPVerification({
            email,
            reportId,
            otpHash,
            expiresAt,
            attempts: 0
        });

        await otpVerification.save();

        console.log(`[SIMULATED EMAIL/NATIVE CONSOLE] OTP for ${email} is: ${otp}`);

        try {
            if (process.env.GOOGLE_SCRIPT_URL) {
                // Bypass Render's SMTP port block by using a free Google Apps Script Web App (HTTPS)
                const axios = (await import('axios')).default;
                await axios.post(process.env.GOOGLE_SCRIPT_URL, JSON.stringify({
                    to: email,
                    subject: 'HDAMS - Secure Report Access OTP',
                    text: `Your OTP for accessing the report "${report.title}" is ${otp}. It is valid for 5 minutes.`
                }), { headers: { 'Content-Type': 'text/plain;charset=utf-8' } }); // Google apps script prefers text/plain for postData
                console.log('Email dispatched successfully via Google Apps Script API!');
            } else {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'HDAMS - Secure Report Access OTP',
                    text: `Your OTP for accessing the report "${report.title}" is ${otp}. It is valid for 5 minutes.`
                });
                console.log('Email dispatched successfully via nodemailer!');
            }
        } catch (mailError) {
            console.log('Email sending failed.', mailError.message);
            // Return a 500 error here so the frontend knows the email failed to send
            return res.status(500).json({ message: `Failed to send email: ${mailError.message}` });
        }

        res.status(200).json({
            message: 'OTP sent to email.',
            email: email.replace(/(.{2})(.*)(?=@)/,
                (gp1, gp2, gp3) => {
                    return gp2 + gp3.replace(/./g, '*');
                }) // Return properly masked email back dynamically
        });
    } catch (error) {
        console.error('sendOTP error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const verifyOTP = async (req, res) => {
    try {
        const { reportId, email, otp } = req.body;

        if (!reportId || !email || !otp) {
            return res.status(400).json({ message: 'reportId, email, and otp are required.' });
        }

        const record = await OTPVerification.findOne({ email, reportId });

        if (!record) {
            return res.status(400).json({ message: 'OTP record not found.' });
        }

        if (record.attempts >= 3) {
            await OTPVerification.deleteOne({ _id: record._id });
            return res.status(400).json({ message: 'Maximum attempts reached. Please request a new OTP.' });
        }

        if (record.expiresAt < new Date()) {
            await OTPVerification.deleteOne({ _id: record._id });
            return res.status(400).json({ message: 'OTP has expired.' });
        }

        const isMatch = await bcrypt.compare(otp, record.otpHash);
        if (!isMatch) {
            record.attempts += 1;
            await record.save();
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        const tempToken = jwt.sign(
            { reportId: reportId.toString(), email },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        await OTPVerification.deleteOne({ _id: record._id });

        res.status(200).json({ message: 'OTP verified successfully.', tempToken });
    } catch (error) {
        console.error('verifyOTP error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
