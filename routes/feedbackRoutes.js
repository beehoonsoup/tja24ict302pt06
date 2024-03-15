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
router.post('/reflection-delete', isLoggedIn, feedbackController.deleteReflection);
router.get('/review-create', isLoggedIn, feedbackController.getCreateReviewPage);
router.post('/review-create', isLoggedIn, feedbackController.createReview);
router.post('/review/:reviewID', isLoggedIn, feedbackController.getViewReview);
router.get('/review/:reviewID', isLoggedIn, feedbackController.getViewReview);
router.post('/accept-review', isLoggedIn, feedbackController.acceptReview);
router.post('/reject-review', isLoggedIn, feedbackController.rejectReview);
router.post('/unhide-review', isLoggedIn, feedbackController.unhideReview);
router.post('/hide-review', isLoggedIn, feedbackController.hideReview);
//router.post('/selfEvaluation', isLoggedIn, feedbackController.createSelfEvaluation);
//router.get('/selfEvaluation-create', isLoggedIn, feedbackController.getCreateSelfEvaluationPage);

router.get('/selfEvaluation-create', isLoggedIn, feedbackController.getSkills);
router.post('/selfEvaluation', isLoggedIn, feedbackController.createSelfEvaluation);

module.exports = router;
