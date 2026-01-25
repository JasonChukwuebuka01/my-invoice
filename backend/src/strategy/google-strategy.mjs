import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import {User} from '../mongoose/schemas/users.mjs';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email']
},
    async (accessToken, refreshToken, profile, done) => {
        
        try {
            // 1. Check if user already exists in our 'Vault'
            let user = await User.findOne({
                $or: [{ googleId: profile.id }, { email: profile.emails[0].value }]
            });

            if (user) {
                // 2. If user exists but doesn't have a googleId, link them!
                if (!user.googleId) {
                    user.googleId = profile.id;
                    user.isVerified = true; // Mark as verified since Google verified the email 
                    await user.save();
                }
                return done(null, user);
            }
        } catch (err) {
            return done(err, null);
        }




        try {

            // 3. If no user exists, create a new 'Establishment'
            const user = await new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                isVerified: true // Google emails are pre-verified
            });

            const savedUser = await user.save();
            return done(null, savedUser);


        } catch (err) {
            return done(err, null);
        };


    }
));

// We are using JWT, so we don't need sessions, 
// but Passport requires these to be defined.
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));