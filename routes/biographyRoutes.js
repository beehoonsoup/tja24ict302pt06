const express = require('express');
const router = express.Router();
const biographyController = require('../controllers/biographyController');

const isLoggedIn = (req, res, next) => {
    if (!req.session.user) {
      // User is not logged in, redirect them to the login page
      res.redirect('/login');
    } else {
      // User is logged in, proceed to the next middleware or route handler
      next();
    }
  };

router.get('/biography/', isLoggedIn, biographyController.getBiographyPage);
router.get('/biography/:reviewerID', isLoggedIn, biographyController.viewBiography);
router.post('/biography/:reviewerID', isLoggedIn, biographyController.viewBiography);
router.get('/skill/:skillId', isLoggedIn, biographyController.searchSkill);

module.exports = router;
