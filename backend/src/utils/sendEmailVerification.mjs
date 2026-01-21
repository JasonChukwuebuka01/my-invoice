
import nodemailer from 'nodemailer';





const sendVerificationEmail = async (email, token) => {


    const transporter = nodemailer.createTransport({
        service: 'gmail', // or 'hotmail', etc.
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const verificationLink = `${process.env.BASE_URL}/api/auth/verify-email/${token}`;

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

export default sendVerificationEmail;