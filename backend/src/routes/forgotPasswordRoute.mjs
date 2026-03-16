import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { Router } from 'express';
import { User } from '../mongoose/schemas/users.mjs';
import { sendPasswordResetEmail } from '../utils/sendEmailVerification.mjs';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();


const router = Router();




router.post('/api/auth/forgot-password',

    body('email').isEmail().withMessage('Please provide a valid email'),
    async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        };

        const { email } = req.body;


        try {
            // 2. Check if the user exists
            const user = await User.findOne({ email });


            if (!user) {
                return res.status(200).json({
                    message: "If that email is registered, a reset link has been sent."
                });
            };

            const secret = process.env.JWT_SECRET + user.password;
            const token = jwt.sign({ email: user.email, id: user._id }, secret, { expiresIn: '15m' });


            const resetLink = `http://localhost:3001/reset-password/${user._id}/${token}`;


            await sendPasswordResetEmail(user.email, resetLink);

            return res.status(200).json({
                message: "If that email is registered, a reset link has been sent."
            });

        } catch (error) {

            res.status(500).json({ message: "Failed to process password reset request." });
        }
    }
);









router.patch('/api/auth/reset-password', async (req, res) => {
    const { userId, token, password } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // We verify using the same secret logic we used to create it
        const secret = process.env.JWT_SECRET + user.password;

        try {
            jwt.verify(token, secret);
        } catch (err) {
            return res.status(400).json({ message: "Invalid or expired link" });
        }


        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Save the user (this also changes the 'secret' for future tokens!)
        try {
            const savedUser = await user.save();

            res.status(200).json({ message: "Password updated successfully" });

        } catch (err) {

            throw new Error("Error hashing password: " + err.message);
        };


    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;