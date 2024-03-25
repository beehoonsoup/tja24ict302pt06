const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.js'); // Import Multer middleware
const adminController = require('../controllers/adminController');

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
    res.status(403).send('Forbidden'); 
  }
};

router.get('/user-profile/:userId', isAdmin, adminController.adminGetEditProfilePage);
router.post('/user-profile/:userId', isAdmin, adminController.adminUpdateUserProfile);
router.get('/user', isAdmin, adminController.getUserPage);
router.post('/user/update-status/:userId', isAdmin, adminController.updateUserStatus);
router.post('/user/update-role/:userId', isAdmin, adminController.updateUserRole);
router.get('/project-adm', isAdmin, adminController.getProject);
router.post('/project/update-status/:projectId', isAdmin, adminController.updateProjectStatus);
router.get('/upload', isAdmin, adminController.getUploadPage);
router.post('/upload', upload, isAdmin, adminController.uploadUserCSV);
router.get('/download/upload_user.csv', isAdmin, adminController.downloadFile);

module.exports = router;