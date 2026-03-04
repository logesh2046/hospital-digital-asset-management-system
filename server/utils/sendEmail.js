import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // Create transporter (mock or real)
    const transporter = nodemailer.createTransport({
        service: 'gmail', // or configured service
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent');
    } catch (error) {
        console.error('Email send failed:', error);
    }
};

export default sendEmail;
