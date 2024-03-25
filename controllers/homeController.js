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

    const [projectTotal] = await db.query('SELECT COUNT(*) FROM Project WHERE ProjectID IN (SELECT ProjectID FROM Team WHERE TeamStatus = "Verified" AND UserID = ?) AND ProjectStatus = "Enabled"', [userId]);
    const projectCount = projectTotal[0]['COUNT(*)'];

    const [reflectionTotal] = await db.query('SELECT COUNT(*) FROM Reflection WHERE ProjectID IN (SELECT ProjectID FROM Project WHERE ProjectStatus = "Enabled") AND UserID = ?', [userId]);
    const reflectionCount = reflectionTotal[0]['COUNT(*)'];

    const [evaluationTotal] = await db.query('SELECT COUNT(*) FROM (SELECT DISTINCT se.UserID, se.ProjectID FROM SelfEvaluation se INNER JOIN Project p ON p.ProjectID = se.ProjectID WHERE p.ProjectStatus = "Enabled" AND se.UserID = ?) a', [userId]);
    const evaluationCount = evaluationTotal[0]['COUNT(*)'];

    const [skillTotal] = await db.query('SELECT COUNT(*) FROM (SELECT DISTINCT se.SkillID FROM SelfEvaluation se INNER JOIN Project p ON p.ProjectID = se.ProjectID WHERE p.ProjectStatus = "Enabled" AND se.UserID = ?) a ', [userId]);
    const skillCount = skillTotal[0]['COUNT(*)'];

    const [reviewApprovedTotal] = await db.query('SELECT COUNT(*) FROM Review r LEFT JOIN ProjectReview pr ON pr.ReviewID = r.ReviewID LEFT JOIN Project p ON p.ProjectID = pr.ProjectID WHERE p.ProjectStatus = "Enabled" AND r.ReceiverID = ? AND r.ReviewStatus = "Approved"', [userId]);
    const reviewApprovedCount = reviewApprovedTotal[0]['COUNT(*)'];

    const [reviewRejecteddTotal] = await db.query('SELECT COUNT(*) FROM Review r LEFT JOIN ProjectReview pr ON pr.ReviewID = r.ReviewID LEFT JOIN Project p ON p.ProjectID = pr.ProjectID WHERE p.ProjectStatus = "Enabled" AND r.ReceiverID = ? AND r.ReviewStatus = "Rejected"', [userId]);
    const reviewRejectedCount = reviewRejecteddTotal[0]['COUNT(*)'];

    const [reviewCreatedTotal] = await db.query('SELECT COUNT(*) FROM Review r LEFT JOIN ProjectReview pr ON pr.ReviewID = r.ReviewID LEFT JOIN Project p ON p.ProjectID = pr.ProjectID WHERE p.ProjectStatus = "Enabled" AND r.ReceiverID = ? AND r.ReviewStatus = "Created"', [userId]);
    const reviewCreatedCount = reviewCreatedTotal[0]['COUNT(*)'];

     //---------------------------------------------------------------------------------

    const [joinTeamNotifications] = await db.query('SELECT u.UserID, p.ProjectID, CONCAT(u.FirstName, " ", u.LastName) AS UserName, p.ProjectName, t.TeamStatus, t.TeamModifiedDate FROM Team t LEFT JOIN Project p ON p.ProjectID = t.ProjectID LEFT JOIN User u ON u.UserID = t.UserID WHERE t.ProjectID IN (SELECT DISTINCT ProjectID from Team t WHERE UserID = ? AND TeamStatus = "Verified") AND t.TeamStatus = "Requested" AND p.ProjectStatus = "Enabled"', [userId]);

    const [reviewNotifications] = await db.query('SELECT r.ReviewID, r.ReceiverID, r.ReviewerID, u.FirstName, u.LastName, CONCAT(u.FirstName, " ", u.LastName) as ReviewerName, pr.ProjectID, p.ProjectName, r.ReviewStatus, r.ReviewModifiedDate FROM Review r INNER JOIN ProjectReview pr ON r.ReviewID = pr.ReviewID INNER JOIN User u ON u.UserID = r.ReviewerID LEFT JOIN Project p ON p.ProjectID = pr.ProjectID WHERE r.ReceiverID = ? AND r.ReviewStatus = "Created" AND p.ProjectStatus = "Enabled"', [userId]);

    // Combine join team and review notification into a single array
    const notificationsFeed = [...joinTeamNotifications, ...reviewNotifications];

    //console.log('joinTeamNotifications:', joinTeamNotifications);
    //console.log('reviewNotifications:', reviewNotifications);

    // Sort the feed based on creation dates
    notificationsFeed.sort((a, b) => new Date(b.TeamModifiedDate || b.ReviewModifiedDate) - new Date(a.TeamModifiedDate || a.ReviewModifiedDate));

    //----------------------------------------------------------------------------------

    const [projects] = await db.query('SELECT p.ProjectID, p.ProjectName, p.ProjectCreatedDate, p.ProjectCreatedBy, CONCAT(u.FirstName, " ", u.LastName) as ProjectCreatedByName, CONCAT(u1.FirstName, " ", u1.LastName) as TeamMemberName, u1.UserID as TeamMemberID, t.TeamRole, t.TeamModifiedDate FROM Project p INNER JOIN Team t ON t.ProjectID = p.ProjectID INNER JOIN User u ON u.UserID = p.ProjectCreatedBy INNER JOIN User u1 ON u1.UserID = t.UserID WHERE p.ProjectStatus = "Enabled" AND t.TeamStatus = "Verified"')

    const [selfEvaluation] = await db.query('SELECT DISTINCT se.EvaluationCreatedDate, se.UserID as SEUserID, CONCAT(u.FirstName, " ", u.LastName) as SEUserName, se.SkillID, s.SkillName, se.ProjectID as SEProjectID, p.ProjectName as SEProjectName, se.EvaluationModifiedDate FROM SelfEvaluation se INNER JOIN Skill s ON s.SkillID = se.SkillID INNER JOIN Project p ON p.ProjectID = se.ProjectID INNER JOIN User u ON u.UserID = se.UserID INNER JOIN Team t ON t.UserID = u.UserID WHERE p.ProjectStatus = "Enabled" AND t.TeamStatus = "Verified" ORDER BY se.EvaluationModifiedDate DESC');

    const [reflection] = await db.query('SELECT DISTINCT r.ReflectionDescription, r.UserID as RFUserID, CONCAT(u.FirstName, " ", u.LastName) as RFUserName, r.ProjectID as RFProjectID, p.ProjectName as RFProjectName, r.ReflectionCreatedDate FROM Reflection r INNER JOIN User u ON u.UserID = r.UserID INNER JOIN Project p ON p.ProjectID = r.ProjectID INNER JOIN Team t ON t.UserID = u.UserID WHERE p.ProjectStatus = "Enabled" AND t.TeamStatus = "Verified"');

    // Fetch accepted reviews for the user
    const [review] = await db.query('SELECT DISTINCT r.ReviewID, r.ReviewDescription, r.ReviewCreatedDate, r.ReviewerID, CONCAT(u.FirstName, " ", u.LastName) as ReviewerName, r.ReceiverID, CONCAT(u1.FirstName, " ", u1.LastName) as ReceiverName, p.ProjectID as RProjectID, p.ProjectName as RProjectName, r.ReviewStatus FROM Review r INNER JOIN ProjectReview pr ON pr.ReviewID = r. ReviewID INNER JOIN User u ON u.UserID = r.ReviewerID INNER JOIN User u1 ON u1.UserID = r.ReceiverID INNER JOIN Project p ON p.ProjectID = pr.ProjectID INNER JOIN Team t ON t.UserID = u.UserID WHERE p.ProjectStatus = "Enabled" AND t.TeamStatus = "Verified" AND r.ReviewStatus = "Approved" UNION SELECT DISTINCT r.ReviewID, r.ReviewDescription, r.ReviewCreatedDate, r.ReviewerID, CONCAT(u.FirstName, " ", u.LastName) as ReviewerName, r.ReceiverID, CONCAT(u1.FirstName, " ", u1.LastName) as ReceiverName, p.ProjectID as RProjectID, p.ProjectName as RProjectName, r.ReviewStatus FROM Review r INNER JOIN ProjectReview pr ON pr.ReviewID = r. ReviewID INNER JOIN User u ON u.UserID = r.ReviewerID INNER JOIN User u1 ON u1.UserID = r.ReceiverID INNER JOIN Project p ON p.ProjectID = pr.ProjectID INNER JOIN Team t ON t.UserID = u.UserID WHERE p.ProjectStatus = "Enabled" AND t.TeamStatus = "Verified" AND r.ReviewStatus = "Rejected" AND r.ReceiverID = ?', [userId]);

    const [team] = await db.query('SELECT CONCAT(u.FirstName, " ", u.LastName) as TeamMember, t.UserID as TeamMemberID, p.ProjectID as TeamProjectID, p.ProjectName as TeamProjectName, p.ProjectCreatedDate as TeamProjectCreatedDate FROM Team t INNER JOIN Project p ON p.ProjectID = t.ProjectID INNER JOIN User u ON u.UserID = t.UserID WHERE p.ProjectID IN (SELECT ProjectID FROM Project WHERE ProjectStatus = "Enabled") AND t.TeamStatus = "Verified"')

    const [user] = await db.query('SELECT * FROM User WHERE UserID = ?', [userId]);

    // Initialize an empty object to store the grouped skills
    const groupedSkills = {};

    const feedbackFeed = [...reflection, ...review, ...projects];

    // Loop through the feedbackFeed to group skills by SEUserID, SEProjectID, and EvaluationCreatedDate
    selfEvaluation.forEach(entry => {
        const { EvaluationModifiedDate, SEUserID, SEUserName, SkillID, SkillName, SEProjectID, SEProjectName } = entry;

        // Create a key based on SEUserID, SEProjectID, and EvaluationCreatedDate
        const key = `${SEUserID}-${SEProjectID}`;

        // Check if the key exists in the groupedSkills object
        if (!groupedSkills[key]) {
            // If the key doesn't exist, initialize an empty object to store the information
            groupedSkills[key] = {
                SEUserID,
                SEUserName,
                SEProjectID,
                EvaluationModifiedDate,
                SEProjectName,
                skills: []
            };
        }

        // Push an object containing SkillID and SkillName into the skills array for the corresponding key
        groupedSkills[key].skills.push({
            SkillID, SkillName
        });
    });

    // Combine feedbackFeed and groupedSkills
    const combinedFeed = [...feedbackFeed, ...Object.values(groupedSkills)];

    // Sort the combined feed based on creation dates
    combinedFeed.sort((a, b) => {
        // Determine the creation date for each entry
        const getDate = entry => entry.EvaluationModifiedDate || entry.ReflectionCreatedDate || entry.ReviewCreatedDate || entry.TeamModifiedDate || entry.skills[0]?.EvaluationModifiedDate;

        // Compare the creation dates
        return new Date(getDate(b)) - new Date(getDate(a));
    });


    //----------------------------------------------------------------------------------


    //const [feedback] = await db.query('SELECT t.UserID, CONCAT(u.FirstName, " ", u.LastName) as UserName, p.ProjectID, p.ProjectName, p.ProjectCreatedDate, p.ProjectSize, rf.ProjectID as ReflectionProjectID, rf.ReflectionID, rf.UserID, rf.ReflectionDescription, rf.ReflectionCreatedDate, rw.ProjectID as ReviewProjectID, rw.ProjectName as ReviewProjectName, rw.ReviewID, rw.ReviewerID, rw.ReviewerName, rw.ReceiverID, rw.ReceiverName, rw.ReceiverID, rw.ReviewDescription, rw.ReviewStatus, rw.ReviewCreatedDate, se.ProjectID as SEProjectID, se.ProjectName as SEProjectName, se.UserID as SEUserID, CONCAT(se.FirstName, " ", se.LastName) as SEUserName, se.EvaluationCreatedDate, se.SkillID, se.SkillName FROM Project p LEFT JOIN Team t ON t.ProjectID = p.ProjectID LEFT JOIN User u ON u.UserID = t.UserID LEFT JOIN Reflection rf ON rf.UserID = t.UserID AND rf.ProjectID = t.ProjectID LEFT JOIN (SELECT p.ProjectID, p.ProjectName, r.ReviewID, r.ReviewerID, r.ReceiverID, r.ReviewDescription, r.ReviewStatus, r.ReviewCreatedDate, CONCAT(u.FirstName, " ", u.LastName) as ReviewerName, CONCAT(u1.FirstName, " ", u1.LastName) as ReceiverName FROM Project p INNER JOIN ProjectReview pr ON pr.ProjectID = p.ProjectID INNER JOIN Review r ON r.ReviewID = pr.ReviewID INNER JOIN User u ON u.UserID = r.ReviewerID INNER JOIN User u1 ON u1.UserID = r.ReceiverID WHERE p.ProjectStatus = "Enabled" AND (r.ReviewStatus = "Approved" OR r.ReviewStatus = "Rejected")) rw ON rw.ReceiverID = t.UserID AND rw.ProjectID = p.ProjectID LEFT JOIN (SELECT p.ProjectID, p.ProjectName, se.UserID, u.FirstName, u.LastName, s.SkillID, s.SkillName, se.EvaluationCreatedDate FROM Project p INNER JOIN SelfEvaluation se ON se.ProjectID = p.ProjectID INNER JOIN Skill s ON s.SkillID = se.SkillID INNER JOIN User u ON u.UserID = se.UserID WHERE p.ProjectStatus = "Enabled") se ON se.UserID = t.UserID AND se.ProjectID = p.ProjectID WHERE t.TeamStatus = "Verified" AND p.ProjectStatus = "Enabled"')

    // Check if the message is from the profile edit page
    if (req.headers.referer && req.headers.referer.endsWith('/profile-edit')) {
        fromProfileEditPage = true;
    }

    res.render('home', {
        user,
        message,
        fromProfileEditPage,
        notificationsFeed,
        projects,
        bio,
        combinedFeed,
        projectCount: projectCount,
        reflectionCount: reflectionCount,
        evaluationCount: evaluationCount,
        reviewApprovedCount: reviewApprovedCount,
        reviewRejectedCount: reviewRejectedCount,
        reviewCreatedCount: reviewCreatedCount,
        skillCount: skillCount
    });
};