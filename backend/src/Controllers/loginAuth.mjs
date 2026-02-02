
import jwt from 'jsonwebtoken';
import { User } from '../mongoose/schemas/users.mjs';
import bcrypt from 'bcryptjs';



export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find the user in the "Vault" (MongoDB)
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid Email. Are you sure you signed up first?" });
        }

        // 2. The Bcrypt Handshake
        // This compares the plain text password with the hashed one in the DB
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid Password. Is password Correct?" });
        }

        // 3. Create the Badge (JWT)
        // We include the ID and the verification status in the badge
        const token = jwt.sign(
            {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                companyName: req.user.companyName,
                isOnboarded: req.user.isOnboarded
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // 4. Send the response back to mayicodes frontend
        res.status(200).json({
            message: "Login successful",
            token,
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
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
};