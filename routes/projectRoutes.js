const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

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

router.get('/project',isLoggedIn, projectController.getProjectsPage);
router.get('/project/:projectId', isLoggedIn, projectController.viewProject);
router.get('/project-create', isLoggedIn, projectController.getCreateProjectPage);
router.post('/project-create', isLoggedIn, projectController.createProject);
router.get('/project-edit',isLoggedIn, projectController.getProjectsPage);
router.get('/project-edit/:projectId', isLoggedIn, projectController.getEditProjectPage);
router.post('/project-edit/:projectId', isLoggedIn, projectController.updateProject);
router.get('/project-member-add/:projectId', isLoggedIn, projectController.getAddMemberPage);
router.post('/project-member-add/:projectId', isLoggedIn, projectController.addMemberToProject);
router.get('/project-join-request/:projectId', isLoggedIn, projectController.requestToJoin);
router.post('/project-join-request/:projectId', isLoggedIn, projectController.requestToJoin);
router.get('/search-projects', isLoggedIn, projectController.searchProject);
router.post('/accept-join-request', isLoggedIn, projectController.acceptJoinRequest);
router.post('/reject-join-request', isLoggedIn, projectController.rejectJoinRequest);
router.post('/project-delete', isLoggedIn, projectController.deleteProject);

module.exports = router;
