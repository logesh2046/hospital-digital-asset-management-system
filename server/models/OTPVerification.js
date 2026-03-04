import mongoose from 'mongoose';

const otpVerificationSchema = new mongoose.Schema({
    email: { type: String, required: true },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 }
}, {
    timestamps: true
});

otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-delete after expiry

const OTPVerification = mongoose.model('OTPVerification', otpVerificationSchema);
export default OTPVerification;
