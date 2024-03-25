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

const isAdmin = (req, res, next) => {
  const user = req.session.user;
  if (!req.session.user) {
    // User is not logged in, redirect them to the login page
    res.redirect('/login');
    return;
} else if (user && user.RoleID === 1) {
    // User is admin, allow access to the next middleware or route handler
    next();
  } else {
    // User is not admin, redirect to an error page or another route
    res.status(403).send('Forbidden'); // You can customize the response as needed
  }
};

router.get('/profile', isLoggedIn, userController.getProfilePage);
router.get('/profile-edit', isLoggedIn, userController.getEditProfilePage);
router.post('/profile-edit', isLoggedIn, userController.updateUserProfile);

module.exports = router;
