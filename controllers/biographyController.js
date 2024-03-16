const db = require('../config/db');

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

exports.viewBiography = async (req, res) => {
    try {
        const userId = req.session.user.UserID;
        const reviewerID = req.params.reviewerID;

        // Fetch user details from the database based on userId
        const [user] = await db.query('SELECT * FROM User WHERE UserID = ?', [reviewerID]);

        // Fetch reflections for the user
        const [reflections] = await db.query('SELECT r.ReflectionID, r.ReflectionDescription, p.ProjectName as reflectionProjectName, p.ProjectID as reflectionProjectID, r.ReflectionCreatedDate FROM Reflection r INNER JOIN Project p ON r.ProjectID = p.ProjectID WHERE r.UserID = ? ORDER BY r.ReflectionCreatedDate DESC', [reviewerID]);

        // Fetch accepted reviews for the user
        const [acceptedReviews] = await db.query('SELECT r.ReviewerID, r.ReceiverID, r.ReviewCreatedDate, r.ReviewDescription, p.ProjectID as reviewProjectID, p.ProjectName as reviewProjectName, CONCAT(u.FirstName, " ", u.LastName) as reviewerName FROM Review r INNER JOIN ProjectReview pr ON r.ReviewID = pr.ReviewID INNER JOIN Project p ON pr.ProjectID = p.ProjectID INNER JOIN User u ON u.UserID = r.ReviewerID WHERE r.ReviewStatus = "Approved" AND r.ReceiverID = ? ORDER BY r.ReviewCreatedDate DESC', [reviewerID]);

        // Fetch reflections for the user
        const [projects] = await db.query('SELECT p.ProjectName, p.ProjectID FROM Project p INNER JOIN Team t ON t.ProjectID = p.ProjectID WHERE t.TeamStatus = "Verified" AND p.ProjectStatus = "Enabled" AND t.UserID = ? ORDER BY p.ProjectCreatedDate DESC', [reviewerID]);

        // Combine reflections and accepted reviews into a single array
        const feed = [...reflections, ...acceptedReviews];

        const projectFeed = [...projects];

        // Sort the feed based on creation dates
        feed.sort((a, b) => new Date(b.ReflectionCreatedDate || b.ReviewCreatedDate) - new Date(a.ReflectionCreatedDate || a.ReviewCreatedDate));

        //console logs
        //console.log('userId', userId);

        // Render the biography page with user details
        res.render('biography', { user, feed, projectFeed, userId });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
};