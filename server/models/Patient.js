import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional link to a user account

    // Hospital Identification
    medicalRecordNumber: {
        type: String,
        unique: true,
        uppercase: true
    }, // Unique hospital patient ID (e.g., MRN2024001234)

    // Personal Information
    fullName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    address: { type: String },
    contactNumber: { type: String, required: true },
    email: { type: String },

    // Medical Information
    bloodGroup: { type: String },
    allergies: { type: String },
    medicalHistory: { type: String },

    // Doctor Assignment for Hospital Workflow
    assignedDoctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }, // Primary care physician assigned to this patient
    doctorName: { type: String }, // Raw name for quick display

    assignedTechnician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }, // Technician assigned to this patient
    technicianName: { type: String }, // Raw name for quick display
    requestedReport: { type: String }, // Type of report requested (e.g. MRI Scan, Blood Test)

    nextVisitDate: { type: Date },

    // created by tracking
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Admission & Status
    admissionStatus: { type: String, enum: ['In-Patient', 'Out-Patient', 'Discharged'], default: 'Out-Patient' },
    status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
    lastVisit: { type: Date }
}, {
    timestamps: true
});

// Auto-generate medical record number if not provided
patientSchema.pre('save', async function () {
    if (!this.medicalRecordNumber) {
        const year = new Date().getFullYear();
        const count = await mongoose.model('Patient').countDocuments();
        this.medicalRecordNumber = `MRN${year}${String(count + 1).padStart(6, '0')}`;
    }
});

// Index for faster lookups

patientSchema.index({ assignedDoctor: 1 });
patientSchema.index({ email: 1 });

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;
