const User = require('../models/user.model');

// GET /api/v1/admin/users
// List all users with pagination & search
exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search; // Name or Email

        let query = { role: 'user' }; // Only list regular users, not admins (optional choice)

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-password') // Exclude password
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            users,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/v1/admin/users/:id
exports.getUserDetail = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/v1/admin/users/:id/status
// Ban/Unban user
exports.updateUserStatus = async (req, res) => {
    try {
        const { isBlocked } = req.body; // Expect boolean
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent blocking other admins
        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Cannot block an admin' });
        }

        user.isBlocked = isBlocked;
        await user.save();

        res.json({ 
            success: true, 
            message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
            user 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
