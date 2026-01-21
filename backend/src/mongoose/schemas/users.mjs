import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true
    },
    password: String, // hashed with bcrypt
    isVerified: {
        type: Boolean,
        default: false
    },
    // No need to store token in DB (JWT is stateless & secure)
});

export const User = mongoose.model('User', userSchema);
