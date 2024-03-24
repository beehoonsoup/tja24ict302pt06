const bcrypt = require('bcrypt');
const db = require('../config/db');

exports.getTestPage = async (req, res) => {
    try {
        const userId = req.session.user.UserID;

        const [user] = await db.query('SELECT * FROM User WHERE UserID = ?', [userId]);

        const [bio] = await db.query('SELECT * FROM Biography WHERE UserID = ?', [userId]);

        const [projectTotal] = await db.query('SELECT COUNT(*) FROM Project p INNER JOIN Team t ON t.ProjectID = p.ProjectID WHERE t.UserID = ? AND p.ProjectStatus = "Enabled" AND t.TeamStatus = "Verified"', [userId]);
        const projectCount = projectTotal[0]['COUNT(*)'];

        //------------------------------------------------------------------------------------------     

        const [selfEvaluation] = await db.query('SELECT DISTINCT se.EvaluationCreatedDate, se.UserID as SEUserID, CONCAT(u.FirstName, " ", u.LastName) as SEUserName, se.SkillID, s.SkillName, se.ProjectID as SEProjectID, p.ProjectName as SEProjectName, se.EvaluationModifiedDate FROM SelfEvaluation se INNER JOIN Skill s ON s.SkillID = se.SkillID INNER JOIN Project p ON p.ProjectID = se.ProjectID INNER JOIN User u ON u.UserID = se.UserID INNER JOIN Team t ON t.UserID = u.UserID WHERE p.ProjectStatus = "Enabled" AND t.TeamStatus = "Verified" AND se.UserID = ? ORDER BY se.EvaluationCreatedDate DESC', [userId]);

        const [reflection] = await db.query('SELECT DISTINCT r.ReflectionDescription, r.UserID as RFUserID, CONCAT(u.FirstName, " ", u.LastName) as RFUserName, r.ProjectID as RFProjectID, p.ProjectName as RFProjectName, r.ReflectionCreatedDate FROM Reflection r INNER JOIN User u ON u.UserID = r.UserID INNER JOIN Project p ON p.ProjectID = r.ProjectID INNER JOIN Team t ON t.UserID = u.UserID WHERE p.ProjectStatus = "Enabled" AND t.TeamStatus = "Verified" AND r.UserID = ?', [userId]);

        const [review] = await db.query('SELECT DISTINCT r.ReviewDescription, r.ReviewCreatedDate, r.ReviewerID, CONCAT(u.FirstName, " ", u.LastName) as ReviewerName, r.ReceiverID, CONCAT(u1.FirstName, " ", u1.LastName) as ReceiverName, p.ProjectID as RProjectID, p.ProjectName as RProjectName, r.ReviewStatus FROM Review r INNER JOIN ProjectReview pr ON pr.ReviewID = r. ReviewID INNER JOIN User u ON u.UserID = r.ReviewerID INNER JOIN User u1 ON u1.UserID = r.ReceiverID INNER JOIN Project p ON p.ProjectID = pr.ProjectID INNER JOIN Team t ON t.UserID = u.UserID WHERE p.ProjectStatus = "Enabled" AND t.TeamStatus = "Verified" AND (r.ReviewStatus = "Approved" OR r.ReviewStatus = "Rejected") AND r.ReceiverID = ?', [userId]);

        const [projects] = await db.query('SELECT p.ProjectID, p.ProjectName, p.ProjectCreatedDate, p.ProjectCreatedBy, CONCAT(u.FirstName, " ", u.LastName) as ProjectCreatedByName, t.TeamRole, t.TeamCreatedDate FROM Project p INNER JOIN Team t ON t.ProjectID = p.ProjectID INNER JOIN User u ON u.UserID = p.ProjectCreatedBy WHERE p.ProjectStatus = "Enabled" AND t.TeamStatus = "Verified" AND t.UserID = ?', [userId])

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
            const getDate = entry => entry.EvaluationModifiedDate || entry.ReflectionCreatedDate || entry.ReviewCreatedDate || entry.TeamCreatedDate || entry.skills[0]?.EvaluationModifiedDate;

            // Compare the creation dates
            return new Date(getDate(b)) - new Date(getDate(a));
        });


        //-------------------------------------------------------------------------------------------------
        
        //const [feedback] = await db.query('SELECT t.UserID, CONCAT(u.FirstName, " ", u.LastName) as UserName, p.ProjectID, p.ProjectName, p.ProjectCreatedDate, p.ProjectSize, rf.ProjectID as ReflectionProjectID, rf.ReflectionID, rf.UserID, rf.ReflectionDescription, rf.ReflectionCreatedDate, rw.ProjectID as ReviewProjectID, rw.ProjectName as ReviewProjectName, rw.ReviewID, rw.ReviewerID, rw.ReviewerName, rw.ReceiverID, rw.ReceiverName, rw.ReceiverID, rw.ReviewDescription, rw.ReviewStatus, rw.ReviewCreatedDate, se.ProjectID as SEProjectID, se.ProjectName as SEProjectName, se.UserID as SEUserID, CONCAT(se.FirstName, " ", se.LastName) as SEUserName, se.EvaluationCreatedDate, se.SkillID, se.SkillName FROM Project p LEFT JOIN Team t ON t.ProjectID = p.ProjectID LEFT JOIN User u ON u.UserID = t.UserID LEFT JOIN Reflection rf ON rf.UserID = t.UserID AND rf.ProjectID = t.ProjectID LEFT JOIN (SELECT p.ProjectID, p.ProjectName, r.ReviewID, r.ReviewerID, r.ReceiverID, r.ReviewDescription, r.ReviewStatus, r.ReviewCreatedDate, CONCAT(u.FirstName, " ", u.LastName) as ReviewerName, CONCAT(u1.FirstName, " ", u1.LastName) as ReceiverName FROM Project p INNER JOIN ProjectReview pr ON pr.ProjectID = p.ProjectID INNER JOIN Review r ON r.ReviewID = pr.ReviewID INNER JOIN User u ON u.UserID = r.ReviewerID INNER JOIN User u1 ON u1.UserID = r.ReceiverID WHERE p.ProjectStatus = "Enabled" AND (r.ReviewStatus = "Approved" OR r.ReviewStatus = "Rejected") AND r.ReceiverID = ?) rw ON rw.ReceiverID = t.UserID AND rw.ProjectID = p.ProjectID LEFT JOIN (SELECT p.ProjectID, p.ProjectName, se.UserID, u.FirstName, u.LastName, s.SkillID, s.SkillName, se.EvaluationCreatedDate FROM Project p INNER JOIN SelfEvaluation se ON se.ProjectID = p.ProjectID INNER JOIN Skill s ON s.SkillID = se.SkillID INNER JOIN User u ON u.UserID = se.UserID WHERE p.ProjectStatus = "Enabled" AND se.UserID = ?) se ON se.UserID = t.UserID AND se.ProjectID = p.ProjectID WHERE t.TeamStatus = "Verified" AND p.ProjectStatus = "Enabled" AND t.UserID = ?', [userId, userId, userId])

        const [skills] = await db.query('SELECT se.UserID, se.SkillID, s.SkillName, COUNT(*) FROM SelfEvaluation se INNER JOIN Skill s ON s.SkillID = se.SkillID INNER JOIN Project p ON p.ProjectID = se.ProjectID WHERE se.UserID = ? AND p.ProjectStatus = "Enabled" GROUP BY se.UserID, se.SkillID, s.SkillName ORDER BY COUNT(*) DESC', [userId])

        const [project] = await db.query('SELECT p.ProjectID, p.ProjectName, t.TeamRole FROM Project p INNER JOIN Team t ON t.ProjectID = p.ProjectID WHERE t.TeamStatus = "Verified" AND t.UserID = ? AND p.ProjectStatus = "Enabled" ORDER BY p.ProjectID DESC', [userId])

        //console logs
        //console.log('combinedFeed', combinedFeed);

        res.render(`test`, {
            user,
            userId,
            bio,
            skills,
            project,
            projectCount: projectCount,
            combinedFeed
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
};