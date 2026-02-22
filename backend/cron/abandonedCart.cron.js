const cron = require('node-cron');
const Cart = require('../models/cart.model');
const sendEmail = require('../utils/sendEmail');
const logger = require('../utils/logger'); // Assuming a logger exists, or use console

/**
 * Abandoned Cart Recovery Cron Job
 * Runs every 10 minutes
 * Finds carts updated > 24 hours ago with abandonedEmailSent: false
 */
const abandonedCartJob = cron.schedule('*/10 * * * *', async () => {
    logger.info('Running Abandoned Cart Check...');

    try {
        // Calculate timestamp for 24 hours ago
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Find abandoned carts
        // Criteria:
        // 1. updatedAt is older than 24 hours
        // 2. abandonedEmailSent is false (haven't been emailed yet)
        // 3. User is populated (needed for email)
        const abandonedCarts = await Cart.find({
            updatedAt: { $lt: twentyFourHoursAgo },
            abandonedEmailSent: false
        }).populate('user', 'email name');

        if (abandonedCarts.length === 0) {
            logger.info('No abandoned carts found.');
            return;
        }

        logger.info(`Found ${abandonedCarts.length} abandoned carts. Sending emails...`);

        // Process each cart
        for (const cart of abandonedCarts) {
            if (!cart.user || !cart.user.email) {
                logger.warn(`Cart ${cart._id} has no valid user/email. Skipping.`);
                continue;
            }

            const emailOptions = {
                email: cart.user.email,
                subject: 'You left something behind! 🛒',
                message: `Hi ${cart.user.name || 'there'},\n\nWe noticed you left some items in your cart. Come back and complete your purchase before they run out!`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h2>You left something behind! 🛒</h2>
                        <p>Hi ${cart.user.name || 'there'},</p>
                        <p>We noticed you left <strong>${cart.items.length} items</strong> in your cart.</p>
                        <p>Come back and complete your purchase before they run out!</p>
                        <br>
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/cart" style="background-color: #ff4d4f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Return to Cart</a>
                    </div>
                `
            };

            try {
                await sendEmail(emailOptions);

                // Mark as sent
                cart.abandonedEmailSent = true;
                await cart.save();

                logger.info(`Recovery email sent to ${cart.user.email} (Cart: ${cart._id})`);
            } catch (emailError) {
                logger.error(`Failed to send email to ${cart.user.email}: ${emailError.message}`);
            }
        }

    } catch (error) {
        logger.error('Error in Abandoned Cart Cron Job:', error);
    }
});

module.exports = abandonedCartJob;
