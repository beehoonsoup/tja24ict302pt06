const bcrypt = require('bcrypt');
const db = require('../config/db');

exports.getHomePage = async (req, res) => {
    if (!req.session.user) {
        // User is not logged in, redirect them to the login page
        res.redirect('/login');
        return;
    }

    //console.log('User object:', req.session.user); // Log the user object
    const user = req.session.user;
    const userId = req.session.user.UserID;
    let message = req.query.message || null;
    let fromProfileEditPage = false;

    const [joinTeamNotifications] = await db.query('SELECT u.UserID, p.ProjectID, CONCAT(u.FirstName, " ", u.LastName) AS UserName, p.ProjectName, t.TeamStatus, t.TeamModifiedDate FROM Team t LEFT JOIN Project p ON p.ProjectID = t.ProjectID LEFT JOIN User u ON u.UserID = t.UserID WHERE t.ProjectID IN (SELECT DISTINCT ProjectID from Team t WHERE UserID = ? AND TeamStatus = "Verified") AND t.TeamStatus = "Requested"', [userId]);

    const [reviewNotifications] = await db.query('SELECT r.ReviewID, r.ReceiverID, r.ReviewerID, u.FirstName, u.LastName, CONCAT(u.FirstName, " ", u.LastName) as ReviewerName, pr.ProjectID, p.ProjectName, r.ReviewStatus, r.ReviewModifiedDate FROM Review r INNER JOIN ProjectReview pr ON r.ReviewID = pr.ReviewID INNER JOIN User u ON u.UserID = r.ReviewerID LEFT JOIN Project p ON p.ProjectID = pr.ProjectID WHERE r.ReceiverID = ? AND r.ReviewStatus = "Created"', [userId]);

    // Combine join team and review notification into a single array
    const notificationsFeed = [...joinTeamNotifications, ...reviewNotifications];

    //console.log('joinTeamNotifications:', joinTeamNotifications);
    //console.log('reviewNotifications:', reviewNotifications);

    // Sort the feed based on creation dates
    notificationsFeed.sort((a, b) => new Date(b.TeamModifiedDate || b.ReviewModifiedDate) - new Date(a.TeamModifiedDate || a.ReviewModifiedDate));

    const [projects] = await db.query('SELECT p.ProjectName, p.ProjectID, CONCAT(u.FirstName, " ", u.LastName) as TeamMember, u.UserID, CONCAT(u1.FirstName, " ", u1.LastName) as CreatedBy, u1.UserID as CreatedByID, p.ProjectCreatedDate FROM Project p INNER JOIN Team t ON t.ProjectID = p.ProjectID INNER JOIN User u ON u.UserID = t.UserID  INNER JOIN User u1 ON u1.UserID = p.ProjectCreatedBy WHERE t.TeamStatus = "Verified" AND p.ProjectStatus = "Enabled" ORDER BY p.ProjectCreatedDate DESC');

    // Create an object to store grouped team members
    const groupedTeamMembers = {};

    // Iterate over each project
    projects.forEach(project => {
        const projectID = project.ProjectID;

        // Check if the project ID exists in the groupedTeamMembers object
        if (!groupedTeamMembers[projectID]) {
            // If the project ID doesn't exist, initialize it with an empty array
            groupedTeamMembers[projectID] = {
                ProjectCreatedByID: project.CreatedByID,
                ProjectID: project.ProjectID,
                ProjectName: project.ProjectName,
                ProjectCreatedDate: project.ProjectCreatedDate,
                ProjectCreatedBy: project.CreatedBy,
                TeamMembers: []
            };
        }

        // Push the current project's team member to the corresponding array
        groupedTeamMembers[projectID].TeamMembers.push({
            TeamMember: project.TeamMember,
            // Add other properties of team members as needed
        });
    });

    // Now 'groupedTeamMembers' contains team members grouped by project ID along with project names
    //console.log(groupedTeamMembers);

    // Check if the message is from the profile edit page
    if (req.headers.referer && req.headers.referer.endsWith('/profile-edit')) {
        fromProfileEditPage = true;
    }

    // User is logged in, render the home page with the user object
    res.render('home', { user, 
                        message, 
                        fromProfileEditPage, 
                        notificationsFeed,
                        projects,
                        groupedTeamMembers });
};

/*
exports.getBiographyPage = async (req, res) => {
    try {
        const userId = req.session.user.UserID;
        const [user] = await db.query('SELECT * FROM User WHERE UserID = ?', [userId]);
        // Fetch reflections for the user
        const [reflections] = await db.query('SELECT r.ReflectionID, r.ReflectionDescription, p.ProjectName as reflectionProjectName, p.ProjectID as reflectionProjectID, r.ReflectionCreatedDate FROM Reflection r INNER JOIN Project p ON r.ProjectID = p.ProjectID WHERE r.UserID = ? ORDER BY r.ReflectionCreatedDate DESC', [userId]);
        // Fetch accepted reviews for the user
        const [acceptedReviews] = await db.query('SELECT r.ReviewID, r.ReviewerID, r.ReviewCreatedDate, r.ReviewDescription, p.ProjectID as reviewProjectID, p.ProjectName as reviewProjectName, CONCAT(u.FirstName, " ", u.LastName) as reviewerName FROM Review r INNER JOIN ProjectReview pr ON r.ReviewID = pr.ReviewID INNER JOIN Project p ON pr.ProjectID = p.ProjectID INNER JOIN User u ON u.UserID = r.ReviewerID WHERE r.ReviewStatus = "Approved" AND r.ReceiverID = ? ORDER BY r.ReviewCreatedDate DESC', [userId]);
        // Fetch rejected reviews for the user
        const [rejectedReviews] = await db.query('SELECT r.ReviewID, r.ReviewStatus, r.ReviewerID, r.ReviewCreatedDate, r.ReviewDescription, p.ProjectID as reviewProjectID, p.ProjectName as reviewProjectName, CONCAT(u.FirstName, " ", u.LastName) as reviewerName FROM Review r INNER JOIN ProjectReview pr ON r.ReviewID = pr.ReviewID INNER JOIN Project p ON pr.ProjectID = p.ProjectID INNER JOIN User u ON u.UserID = r.ReviewerID WHERE r.ReviewStatus = "Rejected" AND r.ReceiverID = ? ORDER BY r.ReviewCreatedDate DESC', [userId]);
        // Fetch reflections for the user
        const [projects] = await db.query('SELECT p.ProjectName, p.ProjectID FROM Project p INNER JOIN Team t ON t.ProjectID = p.ProjectID WHERE t.TeamStatus = "Verified" AND p.ProjectStatus = "Enabled" AND t.UserID = ? ORDER BY p.ProjectCreatedDate DESC', [userId]);
        // Combine reflections, accepted and rejected reviews into a single array
        const feed = [...reflections, ...acceptedReviews, ...rejectedReviews];
        const projectFeed = [...projects];
        // Sort the feed based on creation dates
        feed.sort((a, b) => new Date(b.ReflectionCreatedDate || b.ReviewCreatedDate) - new Date(a.ReflectionCreatedDate || a.ReviewCreatedDate));
        //console logs
        //console.log('user', user);
        res.render('biography', { user, feed, projectFeed });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
};
*/