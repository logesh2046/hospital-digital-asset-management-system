import mongoose from 'mongoose';
import crypto from 'crypto';

const shareLinkSchema = mongoose.Schema({
    // Original fields for BC
    report: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
        // removed required: true to support polymorphism
    },
    token: {
        type: String,
        // removed required/unique safely
    },
    pinHash: {
        type: String
    },

    // New fields directly matching the requirement
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    assetId: { type: mongoose.Schema.Types.ObjectId }, // Can be Report ID or Prescription ID
    itemType: { type: String, enum: ['Report', 'Prescription'] },
    shareToken: { type: String }, // Actually should be unique, but to avoid collision with 'token' if null, let's keep it sparse or not unique at db level initially to be safe from dup key error on existing docs
    hashedPin: { type: String }, // hashed PIN
    accessCount: { type: Number, default: 0 },

    expiresAt: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    views: {
        type: Number,
        default: 0
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Method to verify if link is valid
shareLinkSchema.methods.isValid = function () {
    return this.active && this.expiresAt > new Date();
};

// Method to verify PIN
shareLinkSchema.methods.verifyPin = async function (enteredPin) {
    if (!this.pinHash && !this.hashedPin) return true;

    // Check both legacy pinHash (if plaintext or whatever) and hashedPin
    // But per requirements, it should be bcrypt hashed. Let's assume pinHash stores a bcrypt hash.
    try {
        const hashToCompare = this.pinHash || this.hashedPin;
        // If it's not a valid bcrypt hash format, it might fail, fallback to plain
        if (hashToCompare && !hashToCompare.startsWith('$2')) {
            return hashToCompare === enteredPin;
        }

        let bcrypt = await import('bcryptjs');
        return await bcrypt.default.compare(enteredPin, hashToCompare);
    } catch (e) {
        console.error("PIN verification error", e);
        return false;
    }
};

const ShareLink = mongoose.model('ShareLink', shareLinkSchema);

export default ShareLink;
