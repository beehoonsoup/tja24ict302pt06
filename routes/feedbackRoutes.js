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

//reflection control
router.get('/reflection-create', isLoggedIn, feedbackController.getCreateReflectionPage);
router.post('/reflection-create', isLoggedIn, feedbackController.createReflection);
router.post('/reflection-delete', isLoggedIn, feedbackController.deleteReflection);
router.get('/reflection/:projectId', isLoggedIn, feedbackController.getReflectionPage);
router.get('/reflection/:projectId/:reviewerID', isLoggedIn, feedbackController.viewReflectionPage);

//review control
router.get('/review-create', isLoggedIn, feedbackController.getCreateReviewPage);
router.post('/review-create', isLoggedIn, feedbackController.createReview);
router.post('/review/:reviewID', isLoggedIn, feedbackController.getViewReview);
router.get('/review/:reviewID', isLoggedIn, feedbackController.getViewReview);
router.post('/accept-review', isLoggedIn, feedbackController.acceptReview);
router.post('/reject-review', isLoggedIn, feedbackController.rejectReview);
router.post('/unhide-review', isLoggedIn, feedbackController.unhideReview);
router.post('/hide-review', isLoggedIn, feedbackController.hideReview);
router.post('/unhide-review-home', isLoggedIn, feedbackController.unhideReviewHome);
router.post('/hide-review-home', isLoggedIn, feedbackController.hideReviewHome);
router.post('/unhide-review-bio', isLoggedIn, feedbackController.unhideReviewBio);
router.post('/hide-review-bio', isLoggedIn, feedbackController.hideReviewBio);

//self evaluation control
router.get('/selfEvaluation', isLoggedIn, feedbackController.handleSelfEvaluation);
router.get('/selfEvaluation-create', isLoggedIn, feedbackController.getSkills);
router.get('/selfEvaluation-view', isLoggedIn, feedbackController.getSelectedSkills);
router.get('/skill', isLoggedIn, feedbackController.searchSkills);
router.get('/search-skills', isLoggedIn, feedbackController.searchSkills);
router.post('/submit-skills', isLoggedIn, feedbackController.submitSkills);
router.post('/update-skills', isLoggedIn, feedbackController.updateSkills);
//router.post('/selfEvaluation', isLoggedIn, feedbackController.createSelfEvaluation);

module.exports = router;
