const nodemailer = require('nodemailer');

/**
 * Send Email Utility
 * @param {Object} options - Email options (email, subject, message, html)
 */
const sendEmail = async (options) => {
    // Create transporter
    // For development, you can use Gmail or Mailtrap
    // For production, use services like SendGrid, Mailgun, AWS SES, etc.

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USERNAME, // Your email
            pass: process.env.EMAIL_PASSWORD  // Your email password or app password
        },
        // For Gmail, you might need to enable "Less secure app access"
        // Or use App Password if 2FA is enabled
    });

    // Message options
    const message = {
        from: `${process.env.EMAIL_FROM_NAME || 'TirTir Shop'} <${process.env.EMAIL_FROM || process.env.EMAIL_USERNAME}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html || options.message
    };

    // Send email
    const info = await transporter.sendMail(message);

    console.log('Email sent: %s', info.messageId);
    return info;
};

module.exports = sendEmail;
