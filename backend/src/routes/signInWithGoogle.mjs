
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
    passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:3001/sign-in' }),
    (req, res) => {
        try {
            // 1. Generate the JWT (using the user object from Passport)
            const token = jwt.sign(
                { id: req.user._id },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // 2. BAKE THE COOKIE 
            // This happens before the redirect
            res.cookie('token', token, {
                httpOnly: true,
                secure: false, // Set to true only in production (HTTPS)
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                path: '/',
            });

           
            const name = encodeURIComponent(req.user.name);
            const email = req.user.email;
            const id = req.user._id;
            const onboarded = req.user.isOnboarded;

            // Redirect to a clean success URL
            res.redirect(`http://localhost:3001/auth-success?name=${name}&email=${email}&id=${id}&isOnboarded=${onboarded}`);

        } catch (error) {
            console.error("Google Auth Error:", error);
            res.redirect('http://localhost:3001/sign-in?error=auth_failed');
        }
    }
);

export default router;