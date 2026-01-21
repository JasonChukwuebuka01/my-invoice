// Validation schemas for user-related endpoints (express-validator checkSchema format)

export const signupSchema = {
    name: {
        in: ['body'],
        exists: { errorMessage: 'Name is required' },
        isString: { errorMessage: 'Name must be a string' },
        trim: true,
        isLength: { options: { min: 2 }, errorMessage: 'Name must be at least 2 characters' }
    },
    email: {
        in: ['body'],
        exists: { errorMessage: 'Email is required' },
        isEmail: { errorMessage: 'Please provide a valid email address' },
        normalizeEmail: true
    },
    password: {
        in: ['body'],
        exists: { errorMessage: 'Password is required' },
        isLength: { options: { min: 8 }, errorMessage: 'Password must be at least 8 characters long' },
        matches: {
            options: [/^(?=.*[A-Za-z])(?=.*\d).+$/],
            errorMessage: 'Password must contain at least one letter and one number'
        }
    },
    confirmPassword: {
        in: ['body'],
        optional: { options: { nullable: true } },
        custom: {
            options: (value, { req }) => {
                // Only validate when confirmPassword is present
                if (req.body.confirmPassword && value !== req.body.password) {
                    throw new Error('Passwords do not match');
                }
                return true;
            }
        }
    }
};

export default signupSchema;

