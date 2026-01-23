import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure 'uploads/signatures' folder exists
const uploadDir = 'uploads/signatures';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Rename file to: userID-timestamp.png (to avoid name clashes)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `sig-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// Filter to only allow images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

export const upload = multer({ storage, fileFilter });