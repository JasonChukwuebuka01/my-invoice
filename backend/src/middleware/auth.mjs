import jwt from 'jsonwebtoken';
import { User } from '../mongoose/schemas/users.mjs';






export const verifyToken = async (req, res, next) => {

    let token = req.cookies.token;


    // Fallback: If no cookie, check the Authorization header (useful for testing)
    if (!token && req.header('Authorization')) {
        token = req.header('Authorization').split(' ')[1];
    }


    // 2. If there is absolutely no token, stop right here
    if (!token) {
        return res.status(401).json({
            message: 'Access Denied: No Token Provided. Please login.'
        });
    }

    try {
        // 3. Verify the token using your secret key
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Find user in the database
        // Use .select('-password') to avoid carrying the hashed password around in 'req.user'
        const foundUser = await User.findById(verified.id).select('-password');

        // console.log("confirming user data in auth middleware:", foundUser);

        if (!foundUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // 5. Store the user info in the request object
        req.user = foundUser;

        // 6. Move to the next function
        next();

    } catch (err) {
      

        // BOSS MOVE: If the token is invalid, clear the cookie immediately 
        // so the frontend middleware kicks them out on the next click.
        res.clearCookie('token');

        res.status(403).json({ message: 'Invalid or Expired Token' });
    }
};