const bcrypt = require('bcrypt');
const db = require('../config/db');

exports.getHomePage = async (req, res) => {
    if (!req.session.user) {
        // User is not logged in, redirect them to the login page
        res.redirect('/login');
        return;
    }

    //console.log('User object:', req.session.user); // Log the user object
    const userId = req.session.user.UserID;
    let message = req.query.message || null;
    let fromProfileEditPage = false;

    const [bio] = await db.query('SELECT * FROM Biography WHERE UserID = ?', [userId]);

    const [projectTotal] = await db.query('SELECT COUNT(*) FROM Project p INNER JOIN Team t ON t.ProjectID = p.ProjectID WHERE t.UserID = ? AND p.ProjectStatus = "Enabled"', [userId]);
    const projectCount = projectTotal[0]['COUNT(*)'];

    const [reflectionTotal] = await db.query('SELECT COUNT(*) FROM Reflection WHERE UserID = ?', [userId]);
    const reflectionCount = reflectionTotal[0]['COUNT(*)'];

    const [evaluationTotal] = await db.query('SELECT COUNT(*) FROM (SELECT DISTINCT UserID, ProjectID FROM SelfEvaluation WHERE UserID = ?) a', [userId]);
    const evaluationCount = evaluationTotal[0]['COUNT(*)'];

    const [skillTotal] = await db.query('SELECT COUNT(*) FROM (SELECT DISTINCT SkillID FROM SelfEvaluation WHERE UserID = ?) a ', [userId]);
    const skillCount = skillTotal[0]['COUNT(*)'];

    const [reviewApprovedTotal] = await db.query('SELECT COUNT(*) FROM Review WHERE ReceiverID = ? AND ReviewStatus = "Approved"', [userId]);
    const reviewApprovedCount = reviewApprovedTotal[0]['COUNT(*)'];

    const [reviewRejecteddTotal] = await db.query('SELECT COUNT(*) FROM Review WHERE ReceiverID = ? AND ReviewStatus = "Rejected"', [userId]);
    const reviewRejectedCount = reviewRejecteddTotal[0]['COUNT(*)'];

    const [reviewCreatedTotal] = await db.query('SELECT COUNT(*) FROM Review WHERE ReceiverID = ? AND ReviewStatus = "Created"', [userId]);
    const reviewCreatedCount = reviewCreatedTotal[0]['COUNT(*)'];

    const [joinTeamNotifications] = await db.query('SELECT u.UserID, p.ProjectID, CONCAT(u.FirstName, " ", u.LastName) AS UserName, p.ProjectName, t.TeamStatus, t.TeamModifiedDate FROM Team t LEFT JOIN Project p ON p.ProjectID = t.ProjectID LEFT JOIN User u ON u.UserID = t.UserID WHERE t.ProjectID IN (SELECT DISTINCT ProjectID from Team t WHERE UserID = ? AND TeamStatus = "Verified") AND t.TeamStatus = "Requested" AND p.ProjectStatus = "Enabled"', [userId]);

    const [reviewNotifications] = await db.query('SELECT r.ReviewID, r.ReceiverID, r.ReviewerID, u.FirstName, u.LastName, CONCAT(u.FirstName, " ", u.LastName) as ReviewerName, pr.ProjectID, p.ProjectName, r.ReviewStatus, r.ReviewModifiedDate FROM Review r INNER JOIN ProjectReview pr ON r.ReviewID = pr.ReviewID INNER JOIN User u ON u.UserID = r.ReviewerID LEFT JOIN Project p ON p.ProjectID = pr.ProjectID WHERE r.ReceiverID = ? AND r.ReviewStatus = "Created" AND p.ProjectStatus = "Enabled"', [userId]);

    // Combine join team and review notification into a single array
    const notificationsFeed = [...joinTeamNotifications, ...reviewNotifications];

    //console.log('joinTeamNotifications:', joinTeamNotifications);
    //console.log('reviewNotifications:', reviewNotifications);

    // Sort the feed based on creation dates
    notificationsFeed.sort((a, b) => new Date(b.TeamModifiedDate || b.ReviewModifiedDate) - new Date(a.TeamModifiedDate || a.ReviewModifiedDate));

    const [projects] = await db.query('SELECT p.ProjectName, p.ProjectID, CONCAT(u.FirstName, " ", u.LastName) as TeamMember, u.UserID, CONCAT(u1.FirstName, " ", u1.LastName) as CreatedBy, p.ProjectCreatedDate FROM Project p INNER JOIN Team t ON t.ProjectID = p.ProjectID INNER JOIN User u ON u.UserID = t.UserID INNER JOIN User u1 ON u1.UserID = p.ProjectCreatedBy WHERE t.TeamStatus = "Verified" AND p.ProjectStatus = "Enabled" ORDER BY p.ProjectCreatedDate DESC');

    // Fetch reflections for the user
    const [reflections] = await db.query('SELECT r.ReflectionID, r.ReflectionDescription, p.ProjectName as reflectionProjectName, p.ProjectID as reflectionProjectID, r.ReflectionCreatedDate, u.UserID, CONCAT(u.FirstName, " ", u.LastName) as UserName FROM Reflection r INNER JOIN Project p ON r.ProjectID = p.ProjectID INNER JOIN User u ON u.UserID = r.UserID ORDER BY r.ReflectionCreatedDate DESC');

    // Fetch accepted reviews for the user
    const [acceptedReviews] = await db.query('SELECT r.ReviewID, r.ReviewerID, r.ReceiverID, r.ReviewCreatedDate, r.ReviewDescription, p.ProjectID as reviewProjectID, p.ProjectName as reviewProjectName, CONCAT(u.FirstName, " ", u.LastName) as reviewerName, CONCAT(u1.FirstName, " ", u1.LastName) as receiverName FROM Review r INNER JOIN ProjectReview pr ON r.ReviewID = pr.ReviewID INNER JOIN Project p ON pr.ProjectID = p.ProjectID INNER JOIN User u ON u.UserID = r.ReviewerID INNER JOIN User u1 ON u1.UserID = r.ReceiverID WHERE r.ReviewStatus = "Approved" ORDER BY r.ReviewCreatedDate DESC');

    const [user] = await db.query('SELECT * FROM User WHERE UserID = ?', [userId]);

    const [feedback] = await db.query('SELECT t.UserID, CONCAT(u.FirstName, " ", u.LastName) as UserName, p.ProjectID, p.ProjectName, p.ProjectCreatedDate, p.ProjectSize, rf.ProjectID as ReflectionProjectID, rf.ReflectionID, rf.UserID, rf.ReflectionDescription, rf.ReflectionCreatedDate, rw.ProjectID as ReviewProjectID, rw.ProjectName as ReviewProjectName, rw.ReviewID, rw.ReviewerID, rw.ReviewerName, rw.ReceiverID, rw.ReceiverName, rw.ReceiverID, rw.ReviewDescription, rw.ReviewStatus, rw.ReviewCreatedDate, se.ProjectID as SEProjectID, se.ProjectName as SEProjectName, se.UserID as SEUserID, CONCAT(se.FirstName, " ", se.LastName) as SEUserName, se.EvaluationCreatedDate, se.SkillID, se.SkillName FROM Project p LEFT JOIN Team t ON t.ProjectID = p.ProjectID LEFT JOIN User u ON u.UserID = t.UserID LEFT JOIN Reflection rf ON rf.UserID = t.UserID AND rf.ProjectID = t.ProjectID LEFT JOIN (SELECT p.ProjectID, p.ProjectName, r.ReviewID, r.ReviewerID, r.ReceiverID, r.ReviewDescription, r.ReviewStatus, r.ReviewCreatedDate, CONCAT(u.FirstName, " ", u.LastName) as ReviewerName, CONCAT(u1.FirstName, " ", u1.LastName) as ReceiverName FROM Project p INNER JOIN ProjectReview pr ON pr.ProjectID = p.ProjectID INNER JOIN Review r ON r.ReviewID = pr.ReviewID INNER JOIN User u ON u.UserID = r.ReviewerID INNER JOIN User u1 ON u1.UserID = r.ReceiverID WHERE p.ProjectStatus = "Enabled" AND (r.ReviewStatus = "Approved" OR r.ReviewStatus = "Rejected")) rw ON rw.ReceiverID = t.UserID AND rw.ProjectID = p.ProjectID LEFT JOIN (SELECT p.ProjectID, p.ProjectName, se.UserID, u.FirstName, u.LastName, s.SkillID, s.SkillName, se.EvaluationCreatedDate FROM Project p INNER JOIN SelfEvaluation se ON se.ProjectID = p.ProjectID INNER JOIN Skill s ON s.SkillID = se.SkillID INNER JOIN User u ON u.UserID = se.UserID WHERE p.ProjectStatus = "Enabled") se ON se.UserID = t.UserID AND se.ProjectID = p.ProjectID WHERE t.TeamStatus = "Verified" AND p.ProjectStatus = "Enabled"')

    // Combine reflections and accepted reviews into a single array
    const feedbackFeed = [...reflections, ...acceptedReviews, ...projects];

    // Sort the feed based on creation dates
    feedbackFeed.sort((a, b) => new Date(b.ReflectionCreatedDate || b.ReviewCreatedDate || b.ProjectCreatedDate) - new Date(a.ReflectionCreatedDate || a.ReviewCreatedDate || a.ProjectCreatedDate));

    // Create an object to store grouped team members
    const groupedTeamMembers = {};

// Iterate over each project
projects.forEach(project => {
    const projectID = project.ProjectID;

    // Check if the project ID exists in the groupedTeamMembers object
    if (!groupedTeamMembers[projectID]) {
        // If the project ID doesn't exist, initialize it with an empty array
        groupedTeamMembers[projectID] = { 
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

// Now you can use `feedbackFeed` to display the combined feed and `groupedTeamMembers` to display team members by project in your EJS template.

    // Check if the message is from the profile edit page
    if (req.headers.referer && req.headers.referer.endsWith('/profile-edit')) {
        fromProfileEditPage = true;
    }

    //console.log("projects", projects);

    // User is logged in, render the home page with the user object
    res.render('home', { user, 
                        feedback,
                        message, 
                        fromProfileEditPage, 
                        notificationsFeed,
                        projects,
                        bio,
                        feedbackFeed,
                        groupedTeamMembers,
                        projectCount: projectCount,
                        reflectionCount: reflectionCount,
                        evaluationCount: evaluationCount,
                        reviewApprovedCount: reviewApprovedCount,
                        reviewRejectedCount: reviewRejectedCount,
                        reviewCreatedCount: reviewCreatedCount,
                        skillCount: skillCount});
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