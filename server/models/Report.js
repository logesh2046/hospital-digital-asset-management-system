import mongoose from 'mongoose';
import crypto from 'crypto';

const reportSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Doctor assigned to this report

    // File Information
    title: { type: String, required: true },
    description: { type: String },
    filePath: { type: String, required: true },
    fileType: { type: String }, // e.g. .pdf, .jpg, .dcm
    fileSize: { type: Number }, // in bytes

    // Hospital-Specific Category (NO public files, only medical categories)
    fileCategory: {
        type: String,
        enum: ['Blood Test', 'MRI', 'CT Scan', 'X-Ray', 'Ultrasound', 'Prescription', 'Lab Report', 'Pathology', 'Other'],
        default: 'Other'
    },

    // Privacy & Security (Only PRIVATE or SHARED - NO PUBLIC)
    visibility: {
        type: String,
        enum: ['private', 'shared'], // Hospital files are NEVER public
        default: 'private'
    },
    isProtected: { type: Boolean, default: true }, // All hospital files protected by default
    secureToken: { type: String, unique: true }, // Unique token for secure link generation

    // Medical Context
    doctorNotes: { type: String },
    nextVisitDate: { type: Date },
    testDate: { type: Date }, // added for lab modules

    // Sharing & Access Management
    sharedWith: [{ type: String }], // Emails of people the report is shared with

    // Audit & Analytics
    downloadCount: { type: Number, default: 0 },
    lastAccessedAt: { type: Date },
    accessLog: [{
        accessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        accessedAt: { type: Date, default: Date.now },
        action: { type: String, enum: ['view', 'download', 'share'] }
    }],

    // Status Management
    status: { type: String, enum: ['Pending Review', 'Reviewed', 'Draft', 'Final', 'Archived'], default: 'Pending Review' },
    expiryDate: { type: Date }
}, {
    timestamps: true
});

// Generate secure token before saving (if not already set)
reportSchema.pre('save', function () {
    if (!this.secureToken) {
        this.secureToken = crypto.randomBytes(32).toString('hex');
    }
});

// Index for faster secure token lookups

reportSchema.index({ patient: 1, createdAt: -1 });
reportSchema.index({ assignedDoctor: 1 });

const Report = mongoose.model('Report', reportSchema);
export default Report;
