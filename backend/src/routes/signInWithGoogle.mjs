
import passport from 'passport';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Router } from 'express';
import "../strategy/google-strategy.mjs"




const router = Router();
dotenv.config();



// 1. Trigger the Google Popup
router.get('/api/google', passport.authenticate('google', { session: false, prompt: 'select_account' }));



// 2. The Callback (Where Google sends the user back)
router.get('/api/auth/google/callback',
    passport.authenticate('google', { session: false }),

    (req, res) => {

        console.log('User authenticated via Google:', req.user);
        // 3. Success! Generate a JWT just like your regular login
        const token = jwt.sign(
            {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                phone: req.user.phone,
                companyName: req.user.companyName,
                isOnboarded: req.user.isOnboarded
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // 4. Send the token to the frontend via URL parameters
        // We redirect back to a "success" page on your Next.js app
        res.redirect(`http://localhost:3001/auth-success?token=${token}&name=${encodeURIComponent(req.user.name)}&email=${req.user.email}&id=${req.user._id}&isOnboarded=${req.user.isOnboarded}`);
    }
);

export default router;