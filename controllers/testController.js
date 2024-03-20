const db = require('../config/db');

exports.getTestPage = async (req, res) => {
    try {
        const userId = req.session.user.UserID;

        const [user] = await db.query('SELECT * FROM User WHERE UserID = ?', [userId]);

        // Fetch reflections for the user
        const [reflections] = await db.query('SELECT r.ReflectionID, r.ReflectionDescription, p.ProjectName as reflectionProjectName, p.ProjectID as reflectionProjectID, r.ReflectionCreatedDate FROM Reflection r INNER JOIN Project p ON r.ProjectID = p.ProjectID WHERE r.UserID = ? ORDER BY r.ReflectionCreatedDate DESC', [userId]);

        // Fetch accepted reviews for the user
        const [acceptedReviews] = await db.query('SELECT r.ReviewerID, r.ReviewCreatedDate, r.ReviewDescription, p.ProjectID as reviewProjectID, p.ProjectName as reviewProjectName, CONCAT(u.FirstName, " ", u.LastName) as reviewerName FROM Review r INNER JOIN ProjectReview pr ON r.ReviewID = pr.ReviewID INNER JOIN Project p ON pr.ProjectID = p.ProjectID INNER JOIN User u ON u.UserID = r.ReviewerID WHERE r.ReviewStatus = "Approved" AND r.ReceiverID = ? ORDER BY r.ReviewCreatedDate DESC', [userId]);

        // Fetch reflections for the user
        const [projects] = await db.query('SELECT p.ProjectName, p.ProjectID FROM Project p INNER JOIN Team t ON t.ProjectID = p.ProjectID WHERE t.TeamStatus = "Verified" AND p.ProjectStatus = "Enabled" AND t.UserID = ? ORDER BY p.ProjectCreatedDate DESC', [userId]);

        // Combine reflections and accepted reviews into a single array
        const feed = [...reflections, ...acceptedReviews];

        const projectFeed = [...projects];

        // Sort the feed based on creation dates
        feed.sort((a, b) => new Date(b.ReflectionCreatedDate || b.ReviewCreatedDate) - new Date(a.ReflectionCreatedDate || a.ReviewCreatedDate));

        res.render('test', { user, feed, projectFeed });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
};