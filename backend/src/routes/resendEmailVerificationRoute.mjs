import jwt from 'jsonwebtoken';
import sendVerificationEmail from '../utils/sendEmailVerification.mjs';
import { User } from '../mongoose/schemas/users.mjs';
import { Router } from 'express';
import dotenv from 'dotenv';
import { verifyToken } from '../middleware/auth.mjs';

dotenv.config();

const router = Router();





router.post('/api/auth/resend-verification', verifyToken, async (req, res) => {
    const { email } = req.body;

    try {
        // 1. Find the user by the email sent from the frontend
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        };



        if (user.isVerified) {
            return res.status(400).json({ message: "Account is already verified." });
        };


        const verificationToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );



        await sendVerificationEmail(user.email, verificationToken);


        return res.status(200).json({ message: "Verification email sent successfully!" });

    } catch (error) {
        console.error("Resend Verification Error:", error);

        res.status(500).json({ message: "Failed to resend verification email." });
    }
});






// GET /api/auth/verify-email/:token
router.get('/verify-email/:token', async (req, res) => {
    const { token } = req.params;

    try {


        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        const user = await User.findById(decoded.id);


        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // 3. Check if already verified (prevents unnecessary database writes)
        if (user.isVerified) {
            return res.status(200).json({ message: "Email is already verified." });
        }


        user.isVerified = true;

        await user.save();

        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });

        return res.status(200).json({ message: "Email verified successfully!" });

    } catch (error) {
        console.error("Verification Error:", error);

        // Handle specific JWT errors for better frontend messages
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ message: "Verification link has expired. Please request a new one." });
        }

        return res.status(400).json({ message: "Invalid verification link." });
    }
});











export default router;