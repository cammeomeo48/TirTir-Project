const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Helper function to get JWT_SECRET (no fallback for security)
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return secret;
};

// Register Controller - WITH EMAIL VERIFICATION
exports.register = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ message: "Request body is empty" });
        }
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Password strength validation
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user with isEmailVerified = false (default)
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        // Generate email verification token
        const verificationToken = newUser.getEmailVerificationToken();

        // Save user (with hashed verification token)
        await newUser.save({ validateBeforeSave: false });

        // Create verification URL
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
        const verificationUrl = `${frontendUrl}/verify-email/${verificationToken}`;

        // Email content
        const message = `Welcome to TirTir Shop!\n\nPlease verify your email address by clicking the link below:\n\n${verificationUrl}\n\nIf you did not create this account, please ignore this email.`;

        const htmlMessage = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #FF6B9D;">Welcome to TirTir Shop! 🎉</h2>
                <p>Thank you for registering with us. Please verify your email address to activate your account.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" 
                       style="display: inline-block; padding: 12px 30px; background-color: #FF6B9D; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Verify Email Address
                    </a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">If you did not create this account, please ignore this email.</p>
            </div>
        `;

        try {
            await sendEmail({
                email: newUser.email,
                subject: 'Verify Your Email - TirTir Shop',
                message,
                html: htmlMessage
            });

            res.status(200).json({
                success: true,
                message: 'Registration successful! Please check your email to verify your account.'
            });
        } catch (err) {
            console.error('Email send error:', err);

            // If email fails, delete the user
            await User.findByIdAndDelete(newUser._id);

            return res.status(500).json({
                success: false,
                message: 'Email could not be sent. Please try registering again.'
            });
        }

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Login Controller
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in. Check your inbox for verification link."
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Create JWT Token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            getJwtSecret(),
            { expiresIn: '7d' } // Token valid for 7 days
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get current logged in user
exports.getMe = async (req, res) => {
    try {
        // req.user is set by protect middleware
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error("Get Me Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Verify Email
exports.verifyEmail = async (req, res) => {
    try {
        // Get token from params
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token is required'
            });
        }

        // Hash the token to match the one in database
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with this verification token
        const user = await User.findOne({
            emailVerificationToken: hashedToken
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        // Check if already verified
        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified. You can login now.'
            });
        }

        // Verify the user
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined; // Clear the token
        await user.save();

        // Generate JWT token for immediate login
        const jwtToken = jwt.sign(
            { id: user._id, role: user.role },
            getJwtSecret(),
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: 'Email verified successfully! You are now logged in.',
            token: jwtToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Verify Email Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during email verification'
        });
    }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
    try {
        // Safety check for undefined req.body
        if (!req.body) {
            return res.status(400).json({
                success: false,
                message: 'Request body is missing. Please send JSON data with Content-Type: application/json header'
            });
        }

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an email address'
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No user found with that email'
            });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset URL
        // In production, this should be your frontend URL
        const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;

        // Or for frontend:
        // const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested to reset your password.\n\nPlease click on the following link, or paste it into your browser to complete the process:\n\n${resetUrl}\n\nThis link will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`;

        const htmlMessage = `
            <h2>Password Reset Request</h2>
            <p>You are receiving this email because you (or someone else) has requested to reset your password.</p>
            <p>Please click the button below to reset your password:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #FF6B9D; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p>${resetUrl}</p>
            <p><strong>This link will expire in 10 minutes.</strong></p>
            <p>If you did not request this, please ignore this email.</p>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Request - TirTir Shop',
                message,
                html: htmlMessage
            });

            res.status(200).json({
                success: true,
                message: 'Password reset email sent successfully'
            });
        } catch (err) {
            console.error('Email send error:', err);

            // Clear reset token if email fails
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });

            return res.status(500).json({
                success: false,
                message: 'Email could not be sent. Please try again later.'
            });
        }

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a new password'
            });
        }

        // Password strength validation
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Set new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Clear reset token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        // Create new JWT token for immediate login
        const token = jwt.sign(
            { id: user._id, role: user.role },
            getJwtSecret(),
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: 'Password reset successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Logout (Client-side token clearing, but we can also implement token blacklist later)
exports.logout = async (req, res) => {
    try {
        // For now, logout is handled on client-side by clearing the token
        // In the future, you can implement token blacklisting using Redis

        res.status(200).json({
            success: true,
            message: 'Logged out successfully. Please clear your token from storage.'
        });
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Placeholder for Refresh Token (To be implemented with refresh token strategy)
exports.refreshToken = async (req, res) => {
    try {
        res.status(501).json({
            success: false,
            message: 'Refresh token functionality not yet implemented. Coming soon!'
        });
    } catch (error) {
        console.error("Refresh Token Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

