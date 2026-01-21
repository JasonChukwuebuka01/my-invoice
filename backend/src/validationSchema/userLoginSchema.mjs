
export const loginSchema = {
  email: {
    isEmail: {
      errorMessage: 'Please provide a valid email address',
    },
    normalizeEmail: true, // Sanitizes email (e.g., lowercase)
  },
  password: {
    notEmpty: {
      errorMessage: 'Password is required',
    },
    isLength: {
      options: { min: 6 },
      errorMessage: 'Password should be at least 6 chars',
    },
  },
}