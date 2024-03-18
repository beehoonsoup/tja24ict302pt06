const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

const isLoggedIn = (req, res, next) => {
    if (!req.session.user) {
      // User is not logged in, redirect them to the login page
      res.redirect('/login');
    } else {
      // User is logged in, proceed to the next middleware or route handler
      next();
    }
  };

router.get('/home', isLoggedIn, homeController.getHomePage);

module.exports = router;
