
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../mongoose/schemas/users.mjs';
import sendVerificationEmail from '../utils/sendEmailVerification.mjs';
import { Router } from 'express';
import { checkSchema, validationResult, matchedData } from 'express-validator';
import { signupSchema } from '../validationSchema/userSchema.mjs';
import dotenv from 'dotenv';
import { verifyToken } from '../middleware/auth.mjs';


dotenv.config();


const router = Router();

// POST /api/auth/signup
router.post('/api/auth/signup',
    checkSchema(signupSchema),
    async (req, res) => {

        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }


        const { name, email, password } = matchedData(req);


        // Check if email already exists
        // If it does, return error
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            if (!existingUser.isVerified) {
                // Optional: resend verification
                return res.status(400).json({ message: 'Check your email to verify (resent)' });
            }
            return res.status(400).json({ message: 'Email already registered' });
        }

        try {
            // Hash password

            const salt = await bcrypt.genSalt(12);

            const hashedPassword = await bcrypt.hash(password, salt);

            // Create user (unverified)
            const userCreated = new User({
                name,
                email,
                password: hashedPassword,
                isVerified: false,
            });

            const userSaved = await userCreated.save();

            if (!userSaved) {
                return res.status(500).json({ message: 'Failed to create user' });
            }
            // Generate JWT token (payload: user id, expires 1h)
            const token = jwt.sign({ userId: userSaved._id }, process.env.JWT_SECRET, { expiresIn: '1h' });


            // Send verification email
            await sendVerificationEmail(email, token);
            res.status(201).json({ message: 'Signup successful! Check your email to verify.', token });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to create user or send verification email' });
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