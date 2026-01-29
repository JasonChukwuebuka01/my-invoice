import { Router } from 'express';
import { User } from '../mongoose/schemas/users.mjs';
import { upload } from '../middleware/upload.mjs';
import { verifyToken } from '../middleware/auth.mjs'; // Your JWT middleware

const router = Router();




// The Onboarding Endpoint
router.post('/onboard', verifyToken, upload.single('signature'), async (req, res) => {
    try {
        const { companyName, address, phone } = req.body;

        // Multer puts the file info in req.file
        const signatureUrl = req.file ? `/uploads/signatures/${req.file.filename}` : '';

        //console.log("signatureUrl:", signatureUrl, "companyName:", companyName, "address:", address, "phone:", phone);
        console.log("req.user:", req.user);

        const findUsers = await User.findById(req.user._id);


        if (!findUsers) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update properties directly on the document
        findUsers.companyName = companyName;
        findUsers.address = address;
        findUsers.phone = phone;
        findUsers.signatureUrl = signatureUrl;
        findUsers.isOnboarded = true;

        const savedUser = await findUsers.save();

        if (!savedUser) {
            return res.status(500).json({ message: "Failed to save user profile" });
        }

        res.status(200).json({
            message: "Profile completed successfully",
            user: savedUser
        });

    } catch (error) {
        console.error("Error during onboarding:", error);
        return res.status(500).json({
            message: "Server error during onboarding"
        })




    }
});

export default router;