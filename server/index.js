import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import secureAccessRoutes from './routes/secureAccessRoutes.js';
import shareRoutes from './routes/shareRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import labRoutes from './routes/labRoutes.js';
import otpRoutes from './routes/otpRoutes.js';
import deletedPatientRoutes from './routes/deletedPatientRoutes.js';
import deletedStaffRoutes from './routes/deletedStaffRoutes.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in .env file');
    process.exit(1);
}

connectDB();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Prevents CSP from blocking cross-origin framing/display of PDFs
    crossOriginResourcePolicy: false, // Handled below
    xFrameOptions: false, // REQUIRED to allow the frontend React app (localhost:5173) to put the PDF inside an <iframe>
}));
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // Allow resource loading from different origins (e.g., localhost)

app.use(cors({
    origin: '*', // Allow all origins (or specify your frontend URL)
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Explicitly allow these methods
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', secureAccessRoutes); // Secure access routes
app.use('/api/share', shareRoutes); // New share routes

// Cloudinary URL Redirector and Proxy (bypasses Cloudinary inline PDF restrictions)
app.get('/api/redirect', async (req, res) => {
    if (!req.query.url) {
        return res.status(404).json({ message: 'URL not provided' });
    }

    try {
        const targetUrl = req.query.url;

        // If it's a Cloudinary PDF, we proxy it to allow inline viewing and bypass strict 401s
        if (targetUrl.includes('cloudinary.com') && targetUrl.toLowerCase().endsWith('.pdf')) {
            // Configure Cloudinary just in case it wasn't
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
                secure: true
            });

            // Extract public_id from URL (e.g. upload/v1234/folder/file.pdf -> folder/file)
            let fetchUrl = targetUrl;
            const publicIdMatch = targetUrl.match(/upload\/(?:v\d+\/)?(.+?)\.pdf$/i);
            
            if (publicIdMatch) {
                const publicId = publicIdMatch[1];
                // Generate a signed URL for an image attachment (Cloudinary classifies PDFs as image/raw)
                fetchUrl = cloudinary.url(`${publicId}.pdf`, {
                    resource_type: 'image', // try image, as auto usually defaults here for pdfs
                    type: 'upload',
                    sign_url: true,
                    flags: 'attachment'
                });
            } else if (!fetchUrl.includes('fl_attachment')) {
                fetchUrl = fetchUrl.replace('/upload/', '/upload/fl_attachment/');
            }

            const axios = (await import('axios')).default;
            const response = await axios({
                method: 'get',
                url: fetchUrl,
                responseType: 'stream'
            });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
            
            return response.data.pipe(res);
        }

        // Default behavior for other URLs
        return res.redirect(targetUrl);
    } catch (error) {
        console.error('Redirect proxy error:', error.message);
        // Fallback to direct redirect if proxy fetching fails
        return res.redirect(req.query.url);
    }
});

app.use('/api/prescriptions', prescriptionRoutes); // Blueprint Strictly Requested
app.use('/api/otp', otpRoutes);
app.use('/api/deleted-patients', deletedPatientRoutes);
app.use('/api/deleted-staff', deletedStaffRoutes);

// Serve static assets from uploads (Ensure uploads folder exists)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

