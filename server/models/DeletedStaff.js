import mongoose from 'mongoose';

const deletedStaffSchema = new mongoose.Schema({
    originalId: { type: String },
    name: { type: String },
    email: { type: String },
    role: { type: String },
    department: { type: String },
    contactNumber: { type: String },
    employeeId: { type: String },
    isActive: { type: Boolean },
    staffCreatedAt: { type: Date },

    // Deletion audit
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deletedByName: { type: String },
    deletedByEmail: { type: String },
    deletionReason: { type: String, required: true },
    deletedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const DeletedStaff = mongoose.model('DeletedStaff', deletedStaffSchema);
export default DeletedStaff;
