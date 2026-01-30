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

// Register Controller
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

        // Create user
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: "User registered successfully"
        });

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

