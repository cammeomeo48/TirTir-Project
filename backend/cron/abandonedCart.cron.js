const cron = require('node-cron');
const Cart = require('../models/cart.model');
const sendEmail = require('../utils/sendEmail');
const logger = require('../utils/logger');
const Sentry = require('@sentry/node');

/**
 * Abandoned Cart Recovery Cron Job
 * Runs every 10 minutes
 * Finds carts updated between 30 mins and 24 hours ago with abandonedEmailSent: false
 */
const abandonedCartJob = cron.schedule('*/10 * * * *', async () => {
    logger.info('Running Abandoned Cart Check...');

    try {
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Find abandoned carts
        // Criteria:
        // 1. updatedAt is older than 30 mins but newer than 24 hours
        // 2. abandonedEmailSent is false (haven't been emailed yet)
        // 3. items array is not empty
        const abandonedCarts = await Cart.find({
            updatedAt: { $lt: thirtyMinsAgo, $gt: twentyFourHoursAgo },
            abandonedEmailSent: false,
            'items.0': { $exists: true }
        })
            .populate('user', 'email name')
            .populate('items.product', 'Name Price');

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

            // Create product list HTML
            let productsHtml = '<ul>';
            let productsText = '';
            cart.items.forEach(item => {
                const productName = item.product ? item.product.Name : 'Product';
                productsHtml += `<li>${productName} (Qty: ${item.quantity}) - $${item.price}</li>`;
                productsText += `- ${productName} (Qty: ${item.quantity}) - $${item.price}\n`;
            });
            productsHtml += '</ul>';

            const emailOptions = {
                email: cart.user.email,
                subject: 'You left something behind! 🛒',
                message: `Hey ${cart.user.name || 'there'}, your beauty favorites are waiting! ✨\n\nWe noticed you left the following items in your cart:\n${productsText}\nCome back and complete your purchase before they run out!`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h2>Hey ${cart.user.name || 'there'}, your beauty favorites are waiting! ✨</h2>
                        <p>We noticed you left the following items in your cart:</p>
                        ${productsHtml}
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
                Sentry.captureException(emailError);
            }
        }

    } catch (error) {
        logger.error('Error in Abandoned Cart Cron Job:', error);
        Sentry.captureException(error);
    }
});

module.exports = abandonedCartJob;
