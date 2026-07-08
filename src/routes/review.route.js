const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/review.controller');

// Reviews and Q&A routes
router.get('/products/:productId/reviews-qa', ReviewController.getReviewsAndQA);
router.get('/products/:productId/review-eligibility', ReviewController.checkEligibility);
router.post('/products/:productId/reviews', ReviewController.addReview);
router.post('/products/:productId/qa', ReviewController.addQA);
router.post('/reviews/:reviewId/replies', ReviewController.addReply);

module.exports = router;
