import mongoose from 'mongoose';

const deletedPatientSchema = new mongoose.Schema({
    // Original patient ID (before deletion)
    originalId: { type: String },

    // All patient data preserved at time of deletion
    medicalRecordNumber: { type: String },
    fullName: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String },
    address: { type: String },
    contactNumber: { type: String },
    email: { type: String },
    bloodGroup: { type: String },
    allergies: { type: String },
    medicalHistory: { type: String },
    doctorName: { type: String },
    department: { type: String },
    technicianName: { type: String },
    requestedReport: { type: String },
    nextVisitDate: { type: Date },
    admissionStatus: { type: String },
    status: { type: String },
    lastVisit: { type: Date },
    patientCreatedAt: { type: Date },

    // Who created this patient originally
    createdBy: {
        name: { type: String },
        email: { type: String },
        role: { type: String }
    },

    // Deletion audit
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deletedByName: { type: String },
    deletedByEmail: { type: String },
    deletionReason: { type: String, required: true },
    deletedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const DeletedPatient = mongoose.model('DeletedPatient', deletedPatientSchema);
export default DeletedPatient;
