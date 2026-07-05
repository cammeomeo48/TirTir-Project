const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/user.model');
const Order = require('../models/order.model');
const Coupon = require('../models/coupon.model');
const DailyStats = require('../models/daily.stats.model');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/tirtir';

async function seedData() {
    try {
        console.log('Connecting to DB...', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected!');

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 61 * 24 * 60 * 60 * 1000);

        // 1. Seed At Risk Users (Last Active > 30 days)
        console.log('Seeding At-Risk Users...');
        await User.insertMany([
            {
                name: 'Nguyễn Văn A',
                email: `atrisk_${Date.now()}@test.com`,
                password: 'Password123!',
                role: 'user',
                lastActiveDate: thirtyDaysAgo,
                totalSpent: 1500000
            },
            {
                name: 'Trần Thị B',
                email: `slipping_${Date.now()}@test.com`,
                password: 'Password123!',
                role: 'user',
                lastActiveDate: sixtyDaysAgo,
                totalSpent: 3000000
            },
            {
                name: 'Active User',
                email: `active_${Date.now()}@test.com`,
                password: 'Password123!',
                role: 'user',
                lastActiveDate: now,
                totalSpent: 500000
            }
        ]);

        // 2. Seed Coupons (Active Campaigns)
        console.log('Seeding Campaigns...');
        const newCoupon = await Coupon.create({
            code: `SUMMER_${Math.floor(Math.random() * 1000)}`,
            discountType: 'percentage',
            discountValue: 15,
            active: true,
            validTo: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // Valid for next 30 days
            usedCount: 45
        });

        // 3. Seed some recent DailyStats for Conversion Rate
        console.log('Seeding Daily Stats for Conversion Rate...');
        const todayStr = now.toISOString().split('T')[0];
        await DailyStats.findOneAndUpdate(
            { date: todayStr },
            { $inc: { views: 500, visitors: 200 } },
            { upsert: true }
        );

        console.log('✅ Marketing Data Seeded Successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding Error:', err);
        process.exit(1);
    }
}

seedData();
