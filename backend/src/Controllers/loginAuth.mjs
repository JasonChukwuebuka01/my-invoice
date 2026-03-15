import jwt from 'jsonwebtoken';
import { User } from '../mongoose/schemas/users.mjs';
import bcrypt from 'bcryptjs';



export const login = async (req, res) => {

    try {
        
        const { email, password } = req.body;

        // 1. Find the user in the "Vault" (MongoDB)
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid Email. Are you sure you signed up first?"
            });
        }

        // 2. Verify Password
        const isMatch = bcrypt.compareSync(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid Password. Is password Correct?"
            });
        }


      
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 4. SET THE HTTP-ONLY COOKIE 
        // This is the key change. The browser will handle this automatically.
        res.cookie('token', token, {
            httpOnly: true,                                  // Security: JS cannot read this
            secure: process.env.NODE_ENV === 'production',   // HTTPS only in production
            sameSite: 'lax',                                 // CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000,                 // 7 days in milliseconds
            path: '/',                                       // Available to all routes
        });

        // 5. Send the response WITHOUT the token in the JSON body
        res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isOnboarded: user.isOnboarded,
                companyName: user.companyName,
                address: user.address,
                phone: user.phone,
                signatureUrl: user.signatureUrl,
                createdAt: user.createdAt,
                hasPassword: user.hasPassword,
                isVerified:user.isVerified  
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
};