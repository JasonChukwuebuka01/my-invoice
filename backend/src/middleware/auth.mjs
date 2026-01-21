import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    // 1. Grab the 'Authorization' header from the request
    const authHeader = req.header('Authorization');

    // 2. If there is no header, stop right here
    if (!authHeader) {
        return res.status(401).json({ message: 'Access Denied: No Token Provided' });
    }

    try {
        // 3. The header usually looks like "Bearer 12345...", so we split it to get just the token
        const token = authHeader.split(' ')[1];


        // 4. Verify the token using your secret key from .env
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        // 5. Store the user info in the request so other functions can use it
        req.user = { ...req.user, verified };

        console.log('Token verified for user:', req.user);

        // 6. Tell Express to move on to the next function (the PDF generator)
        next();

    } catch (err) {
        // If the token is fake or expired, send an error
        res.status(403).json({ message: 'Invalid or Expired Token' });
    }
};