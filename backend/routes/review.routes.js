const express = require('express');
const router = express.Router({ mergeParams: true });
const { 
    getProductReviews, 
    createReview, 
    updateReview, 
    deleteReview, 
    markHelpful, 
    getMyReviews 
} = require('../controllers/review.controller');
const { protect } = require('../middlewares/auth');

// Note: Using mergeParams: true allows us to access :id from product routes if we mount it there

// Public routes
router.get('/', getProductReviews);

// Protected routes
router.use(protect);

router.post('/', createReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.post('/:id/helpful', markHelpful);

module.exports = router;
