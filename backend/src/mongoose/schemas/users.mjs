import mongoose from 'mongoose';

// ... existing imports
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // 1. Password is no longer 'required' because Google users don't have one
    password: { type: String, required: function() { return !this.googleId; } },
    // 2. Add Google ID for identification
    googleId: { type: String, unique: true, sparse: true },
    isVerified: { type: Boolean, default: false },
}, { timestamps: true });


export const User = mongoose.model('User', userSchema);
