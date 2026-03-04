import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' }, // Optional: Link to a specific report

    // Core Prescription Data
    medicalNotes: { type: String, required: true },
    notes: { type: String },
    digitalSignatureUrl: { type: String },

    // Kept for backward compatibility
    medicines: [{
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        instructions: { type: String }
    }],

    medications: [{
        name: String,
        dosage: String,
        frequency: String,
        duration: String
    }],

    // File Attachment (Optional - e.g. handwritten note scan)
    filePath: { type: String },

    // Follow-up
    nextVisitDate: { type: Date },

    status: { type: String, enum: ['Active', 'Completed', 'Cancelled'], default: 'Active' }
}, {
    timestamps: true
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);
export default Prescription;
