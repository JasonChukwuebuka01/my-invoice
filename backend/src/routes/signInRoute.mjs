import Router from 'express'
import { login } from '../Controllers/loginAuth.mjs'
import { verifyToken } from '../middleware/auth.mjs';





const router = Router();




router.post('/api/auth/login', login);


router.post('/api/auth/logout', async (req, res) => {

    try {
      
        res.clearCookie('token', {
            httpOnly: true,
            secure: false, // Set to true in production
            sameSite: 'lax',
            path: '/',
        });

        return res.status(200).json({ message: "Logged out successfully" });

    } catch (error) {
        
        res.status(500).json({ message: "Error during logout" });
    }
})


export default router;


