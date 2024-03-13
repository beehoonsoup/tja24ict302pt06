const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

const isLoggedIn = (req, res, next) => {
  if (!req.session.user) {
    // User is not logged in, redirect them to the login page
    res.redirect('/login');
  } else {
    // User is logged in, proceed to the next middleware or route handler
    next();
  }
};

router.get('/reflection-create', isLoggedIn, feedbackController.getCreateReflectionPage);
router.post('/reflection-create', isLoggedIn, feedbackController.createReflection);
router.get('/review-create', isLoggedIn, feedbackController.getCreateReviewPage);
router.post('/review-create', isLoggedIn, feedbackController.createReview);
router.post('/review/:reviewID', isLoggedIn, feedbackController.getViewReview);
router.get('/review/:reviewID', isLoggedIn, feedbackController.getViewReview);
router.post('/accept-review', isLoggedIn, feedbackController.acceptReview);
router.post('/reject-review', isLoggedIn, feedbackController.rejectReview);
router.post('/selfEvaluation', isLoggedIn, feedbackController.createSelfEvaluation);
router.post('/selfEvaluation', isLoggedIn, feedbackController.addSelfEvaluation);
router.get('/selfEvaluation-create', isLoggedIn, feedbackController.getSkills);
router.get('/biography/:userId', isLoggedIn, feedbackController.getBiographyPage);

module.exports = router;
