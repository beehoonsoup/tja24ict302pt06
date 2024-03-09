const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

const isLoggedIn = (req, res, next) => {
  if (!req.session.user) {
    // User is not logged in, redirect them to the login page
    res.redirect('/login');
  } else {
    // User is logged in, proceed to the next middleware or route handler
    next();
  }
};

router.get('/profile', isLoggedIn, userController.getProfilePage);
router.get('/profile-edit', isLoggedIn, userController.getEditProfilePage);
router.post('/profile-edit', isLoggedIn, userController.updateUserProfile);

module.exports = router;
