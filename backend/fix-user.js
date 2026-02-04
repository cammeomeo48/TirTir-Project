/**
 * 🚨 EMERGENCY USER FIX SCRIPT
 * 
 * This script manually fixes a user account by:
 * 1. Connecting to MongoDB
 * 2. Finding user by email
 * 3. Hashing a new password with bcrypt
 * 4. Forcing update: password + isEmailVerified = true
 * 
 * Usage: node fix-user.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Configuration - EDIT THESE VALUES
const USER_EMAIL = 'test@example.com';  // ← Change this to your test email
const NEW_PASSWORD = '123456';          // ← Change this to desired password

// ANSI color codes for pretty output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    step: (msg) => console.log(`${colors.cyan}→${colors.reset} ${msg}`)
};

async function fixUser() {
    try {
        console.log('\n' + '='.repeat(60));
        console.log(`${colors.bright}🚨 EMERGENCY USER FIX SCRIPT${colors.reset}`);
        console.log('='.repeat(60) + '\n');

        // Step 1: Verify environment variables
        log.step('Step 1: Verifying environment variables...');
        if (!process.env.MONGO_URI) {
            log.error('MONGO_URI not found in .env file!');
            log.warning('Make sure .env file exists in the backend directory');
            process.exit(1);
        }
        log.success('Environment variables loaded');

        // Step 2: Connect to MongoDB
        log.step('Step 2: Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        log.success('Connected to MongoDB');

        // Step 3: Find user
        log.step(`Step 3: Finding user with email: ${colors.bright}${USER_EMAIL}${colors.reset}...`);
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const user = await User.findOne({ email: USER_EMAIL });

        if (!user) {
            log.error(`User not found with email: ${USER_EMAIL}`);
            log.warning('Please check the email address and try again');
            await mongoose.connection.close();
            process.exit(1);
        }
        log.success(`User found: ${user.name} (${user.email})`);

        // Display current user status
        console.log('\n' + '-'.repeat(60));
        log.info('Current User Status:');
        console.log(`  Name:              ${user.name}`);
        console.log(`  Email:             ${user.email}`);
        console.log(`  Email Verified:    ${user.isEmailVerified ? colors.green + '✓ YES' : colors.red + '✗ NO'}${colors.reset}`);
        console.log(`  Current Password:  ${user.password.substring(0, 30)}...`);
        console.log(`  Is Hashed:         ${user.password.startsWith('$2') ? colors.green + '✓ YES' : colors.red + '✗ NO (PLAIN TEXT!)'}${colors.reset}`);
        console.log('-'.repeat(60) + '\n');

        // Step 4: Hash new password
        log.step(`Step 4: Hashing new password: ${colors.bright}${NEW_PASSWORD}${colors.reset}...`);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(NEW_PASSWORD, salt);
        log.success('Password hashed successfully');
        log.info(`Hash: ${hashedPassword.substring(0, 30)}...`);

        // Step 5: Verify hash works (sanity check)
        log.step('Step 5: Verifying hash integrity...');
        const isValid = await bcrypt.compare(NEW_PASSWORD, hashedPassword);
        if (!isValid) {
            log.error('Hash verification failed! Something went wrong with bcrypt.');
            await mongoose.connection.close();
            process.exit(1);
        }
        log.success('Hash verification passed');

        // Step 6: Update user
        log.step('Step 6: Updating user in database...');
        const result = await User.updateOne(
            { email: USER_EMAIL },
            {
                $set: {
                    password: hashedPassword,
                    isEmailVerified: true,
                    emailVerificationToken: undefined // Clear any pending verification token
                }
            }
        );

        if (result.modifiedCount === 0) {
            log.warning('No changes were made (user might already be in this state)');
        } else {
            log.success('User updated successfully!');
        }

        // Final status
        console.log('\n' + '='.repeat(60));
        console.log(`${colors.green}${colors.bright}🎉 USER FIXED SUCCESSFULLY!${colors.reset}`);
        console.log('='.repeat(60));
        console.log(`\n${colors.bright}Login Credentials:${colors.reset}`);
        console.log(`  Email:    ${colors.cyan}${USER_EMAIL}${colors.reset}`);
        console.log(`  Password: ${colors.cyan}${NEW_PASSWORD}${colors.reset}`);
        console.log(`\n${colors.yellow}Try logging in now!${colors.reset}\n`);

        // Cleanup
        await mongoose.connection.close();
        log.success('MongoDB connection closed');
        process.exit(0);

    } catch (error) {
        log.error('Script failed with error:');
        console.error(error);

        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }

        process.exit(1);
    }
}

// Run the script
fixUser();
