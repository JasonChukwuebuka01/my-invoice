
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});



const sendVerificationEmail = async (email, token) => {



    const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Email Address',
        html: `
      <h2>Welcome!</h2>
      <p>Please click the link below to verify your email:</p>
      <a href="${verificationLink}">Verify Email</a>
      <p>This link expires in 1 hour.</p>
    `,
    };


    try {

        await transporter.sendMail(mailOptions);

    } catch (err) {
        throw err;
    }

};





export const sendPasswordResetEmail = async (userEmail, resetLink) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'Reset Your Password',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #0f172a;">Password Reset Request</h2>
                    <p style="color: #475569; line-height: 1.6;">
                        We received a request to reset the password for your mayicodes studio account. 
                        If you didn't make this request, you can safely ignore this email.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                        This link will expire in 15 minutes for your security.
                    </p>
                </div>
            `
        };



        await transporter.sendMail(mailOptions);
       

    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw error;
    };
};




export default sendVerificationEmail;