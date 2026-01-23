import { Router } from 'express';
import User from '../mongoose/schemas/users.mjs';
import { upload } from '../middleware/upload.mjs';
import { verifyToken } from '../middleware/auth.mjs'; // Your JWT middleware

const router = Router();




// The Onboarding Endpoint
router.post('/onboard', verifyToken, upload.single('signature'), async (req, res) => {
    try {
        const { companyName, address, phone } = req.body;

        // Multer puts the file info in req.file
        const signatureUrl = req.file ? `/uploads/signatures/${req.file.filename}` : '';

        console.log("signatureUrl:", signatureUrl);



        // Update the user's profile in the database
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            {
                companyName,
                address,
                phone,
                signatureUrl,
                isOnboarded: true // The Gate is now OPEN
            },
            { new: true }
        );

        res.status(200).json({
            message: "Profile completed successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during onboarding" });
    }
});

export default router;