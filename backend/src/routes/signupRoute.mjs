
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../mongoose/schemas/users.mjs';
import sendVerificationEmail from '../utils/sendEmailVerification.mjs';
import { Router } from 'express';
import { checkSchema, validationResult, matchedData } from 'express-validator';
import { signupSchema } from '../validationSchema/userSchema.mjs';
import dotenv from 'dotenv';



dotenv.config();


const router = Router();

// POST /api/auth/signup
router.post('/api/auth/signup',
    checkSchema(signupSchema),
    async (req, res) => {
        // 1. Validation Phase
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = matchedData(req);

        try {
            // 2. Check if user already exists
            const existingUser = await User.findOne({ email });

            if (existingUser) {
                if (!existingUser.isVerified) {
                    // FIX: Actually generate a new token and resend the email
                    const token = jwt.sign(
                        { userId: existingUser._id },
                        process.env.JWT_SECRET,
                        { expiresIn: '1h' }
                    );

                    try {
                        await sendVerificationEmail(email, token);
                        return res.status(200).json({ message: 'Check your email to verify (resent)' });
                    } catch (emailErr) {
                        console.error("Resend Email Error:", emailErr);
                        return res.status(500).json({ message: 'User exists, but failed to send email.' });
                    }
                }
                return res.status(400).json({ message: 'Email already registered' });
            }

            // 3. Create New User
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const userCreated = new User({
                name,
                email,
                password: hashedPassword,
                hasPassword: true,
                isVerified: false,
            });

            const userSaved = await userCreated.save();

            // Generate JWT token 
            const token = jwt.sign(
                { userId: userSaved._id },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // 4. Send Initial Verification Email
            // Note: If this fails, the user is saved but the catch block triggers the 500 error
            await sendVerificationEmail(email, token);

            res.status(201).json({ message: 'Signup successful! Check your email to verify.' });

        } catch (error) {
            
            res.status(500).json({ message: 'Failed to complete signup process.' });
        }
    }
);




router.get('/api/auth/verify-email/:token', async (req, res) => {
    const { token } = req.params;
    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // Update user to verified
        const user = await User.findByIdAndUpdate(userId, { isVerified: true }, { new: true });
        if (!user) {
            return res.status(400).json({ message: 'Invalid verification token' });
        }

        res.status(200).json({ message: 'Email verified successfully!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to verify email' });
    }
});




export default router;