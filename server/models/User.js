import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'doctor', 'technician', 'receptionist', 'staff', 'patient'],
        default: 'staff'
    },
    department: { type: String }, // For staff (e.g., Radiology, Pathology, Cardiology)
    specialization: { type: String }, // For doctors (e.g., Cardiology, Neurology)
    contactNumber: { type: String },

    // Doctor-Patient Relationship Tracking
    patientsUnderCare: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient'
    }], // For doctors: array of patient IDs they're responsible for

    // Account Status
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date }
}, {
    timestamps: true
});

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Index for faster lookups
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

const User = mongoose.model('User', userSchema);
export default User;
