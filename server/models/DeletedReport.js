import mongoose from 'mongoose';

const deletedReportSchema = new mongoose.Schema({
    originalId: { type: String },
    patientName: { type: String },
    uploadedByName: { type: String },
    title: { type: String },
    fileCategory: { type: String },
    filePath: { type: String }, // optional, for trace
    reportCreatedAt: { type: Date },
    
    // Deletion audit
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deletedByName: { type: String },
    deletedByEmail: { type: String },
    deletionReason: { type: String, required: true },
    deletedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const DeletedReport = mongoose.model('DeletedReport', deletedReportSchema);
export default DeletedReport;
