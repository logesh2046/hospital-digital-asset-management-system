import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail', // Standard configuration
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendShareEmail = async (patientEmail, shareUrl, plainPin) => {
    try {
        console.log(`Sending email to ${patientEmail} with URL ${shareUrl} and PIN ${plainPin}`);

        // If no real email provided in env, just log it to avoid crash
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail({
                from: '"HDAMS Access" <noreply@hospital.com>',
                to: patientEmail,
                subject: 'Your Secure Medical Asset',
                html: `<p>A secure medical report/prescription has been shared with you.</p>
                       <p>Click <a href="${shareUrl}">here</a> to view your document.</p>
                       <p>Your secure access PIN is: <strong>${plainPin}</strong></p>
                       <p>This link will expire in 7 days.</p>`
            });
            console.log('Email sent successfully');
        } else {
            console.log('Email credentials not configured in .env. Skipping actual email send.');
        }
    } catch (error) {
        console.error('Failed to send email:', error);
    }
};

export const sendUploadNotificationEmail = async (patientEmail, patientName) => {
    try {
        // If no real email provided in env, just log it to avoid crash
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail({
                from: `"HDAMS Notifications" <${process.env.EMAIL_USER}>`,
                to: patientEmail,
                subject: 'New Medical Report Uploaded',
                text: `Hello ${patientName},\n\nYour report has been uploaded. Please view in hospital portal.\n\nThank you,\nMediVault Hospital`,
                html: `<div style="font-family: sans-serif; color: #333;">
                    <h2 style="color: #0065a3;">Hello ${patientName},</h2>
                    <p>Your latest medical report has been successfully uploaded to your account.</p>
                    <p><strong>Please log in to the hospital portal to view and download your report securely.</strong></p>
                    <br/>
                    <p>Thank you,</p>
                    <p><strong>MediVault Hospital</strong></p>
                </div>`
            });
            console.log(`Upload notification email sent successfully to ${patientEmail}`);
        } else {
            console.log('Email credentials not configured in .env. Skipping actual upload notification email send.');
        }
    } catch (error) {
        console.error('Failed to send upload notification email:', error);
    }
};
