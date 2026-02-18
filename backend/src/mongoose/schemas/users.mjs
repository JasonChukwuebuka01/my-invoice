import mongoose from 'mongoose';

// ... existing imports
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: function () { return !this.googleId; } },
    googleId: { type: String, unique: true, sparse: true },
    isVerified: { type: Boolean, default: false },

    // --- NEW ONBOARDING FIELDS ---
    isOnboarded: { type: Boolean, default: false }, // The "Gatekeeper"
    companyName: { type: String, default: "" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    currency: { type: String, default: "" },
    defaultTax: { type: Number, default: 0 },
    bankDetails: { type: String, default: "" },
    signatureUrl: { type: String, default: "" }, // We will store the file URL here
    // -----------------------------

}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
