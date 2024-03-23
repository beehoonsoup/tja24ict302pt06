const db = require('../config/db');

exports.getBiographyPage = async (req, res) => {
    try {
        const userId = req.session.user.UserID;

        const [user] = await db.query('SELECT * FROM User WHERE UserID = ?', [userId]);

        const [bio] = await db.query('SELECT * FROM Biography WHERE UserID = ?', [userId]);

        const [projectTotal] = await db.query('SELECT COUNT(*) FROM Project p INNER JOIN Team t ON t.ProjectID = p.ProjectID WHERE t.UserID = ? AND p.ProjectStatus = "Enabled" AND t.TeamStatus = "Verified"', [userId]);
        const projectCount = projectTotal[0]['COUNT(*)'];

        const [feedback] = await db.query('SELECT t.UserID, CONCAT(u.FirstName, " ", u.LastName) as UserName, p.ProjectID, p.ProjectName, p.ProjectCreatedDate, p.ProjectSize, rf.ProjectID as ReflectionProjectID, rf.ReflectionID, rf.UserID, rf.ReflectionDescription, rf.ReflectionCreatedDate, rw.ProjectID as ReviewProjectID, rw.ProjectName as ReviewProjectName, rw.ReviewID, rw.ReviewerID, rw.ReviewerName, rw.ReceiverID, rw.ReceiverName, rw.ReceiverID, rw.ReviewDescription, rw.ReviewStatus, rw.ReviewCreatedDate, se.ProjectID as SEProjectID, se.ProjectName as SEProjectName, se.UserID as SEUserID, CONCAT(se.FirstName, " ", se.LastName) as SEUserName, se.EvaluationCreatedDate, se.SkillID, se.SkillName FROM Project p LEFT JOIN Team t ON t.ProjectID = p.ProjectID LEFT JOIN User u ON u.UserID = t.UserID LEFT JOIN Reflection rf ON rf.UserID = t.UserID AND rf.ProjectID = t.ProjectID LEFT JOIN (SELECT p.ProjectID, p.ProjectName, r.ReviewID, r.ReviewerID, r.ReceiverID, r.ReviewDescription, r.ReviewStatus, r.ReviewCreatedDate, CONCAT(u.FirstName, " ", u.LastName) as ReviewerName, CONCAT(u1.FirstName, " ", u1.LastName) as ReceiverName FROM Project p INNER JOIN ProjectReview pr ON pr.ProjectID = p.ProjectID INNER JOIN Review r ON r.ReviewID = pr.ReviewID INNER JOIN User u ON u.UserID = r.ReviewerID INNER JOIN User u1 ON u1.UserID = r.ReceiverID WHERE p.ProjectStatus = "Enabled" AND (r.ReviewStatus = "Approved" OR r.ReviewStatus = "Rejected") AND r.ReceiverID = ?) rw ON rw.ReceiverID = t.UserID AND rw.ProjectID = p.ProjectID LEFT JOIN (SELECT p.ProjectID, p.ProjectName, se.UserID, u.FirstName, u.LastName, s.SkillID, s.SkillName, se.EvaluationCreatedDate FROM Project p INNER JOIN SelfEvaluation se ON se.ProjectID = p.ProjectID INNER JOIN Skill s ON s.SkillID = se.SkillID INNER JOIN User u ON u.UserID = se.UserID WHERE p.ProjectStatus = "Enabled" AND se.UserID = ?) se ON se.UserID = t.UserID AND se.ProjectID = p.ProjectID WHERE t.TeamStatus = "Verified" AND p.ProjectStatus = "Enabled" AND t.UserID = ?', [userId, userId, userId])

        const [skills] = await db.query('SELECT se.UserID, se.SkillID, s.SkillName, COUNT(*) FROM SelfEvaluation se INNER JOIN Skill s ON s.SkillID = se.SkillID INNER JOIN Project p ON p.ProjectID = se.ProjectID WHERE se.UserID = ? AND p.ProjectStatus = "Enabled" GROUP BY se.UserID, se.SkillID, s.SkillName ORDER BY COUNT(*) DESC', [userId])

        const [project] = await db.query('SELECT p.ProjectID, p.ProjectName, t.TeamRole FROM Project p INNER JOIN Team t ON t.ProjectID = p.ProjectID WHERE t.TeamStatus = "Verified" AND t.UserID = ? AND p.ProjectStatus = "Enabled"', [userId])

        //console logs
        //console.log('user', user);

        //res.render('biography', { user, feed, projectFeed, selfEvaluation });
        res.render(`biography`, { user, 
                                    feedback, 
                                    userId, 
                                    bio, 
                                    skills, 
                                    project, 
                                    projectCount: projectCount });
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

        const [bio] = await db.query('SELECT * FROM Biography WHERE UserID = ?', [reviewerID]);

        const [projectTotal] = await db.query('SELECT COUNT(*) FROM Project p INNER JOIN Team t ON t.ProjectID = p.ProjectID WHERE t.UserID = ? AND p.ProjectStatus = "Enabled" AND t.TeamStatus = "Verified"', [reviewerID]);
        const projectCount = projectTotal[0]['COUNT(*)'];

        const [feedback] = await db.query('SELECT t.UserID, CONCAT(u.FirstName, " ", u.LastName) as UserName, p.ProjectID, p.ProjectName, p.ProjectCreatedDate, p.ProjectSize, rf.ProjectID as ReflectionProjectID, rf.ReflectionID, rf.UserID, rf.ReflectionDescription, rf.ReflectionCreatedDate, rw.ProjectID as ReviewProjectID, rw.ProjectName as ReviewProjectName, rw.ReviewID, rw.ReviewerID, rw.ReviewerName, rw.ReceiverID, rw.ReceiverName, rw.ReceiverID, rw.ReviewDescription, rw.ReviewStatus, rw.ReviewCreatedDate, se.ProjectID as SEProjectID, se.ProjectName as SEProjectName, se.UserID as SEUserID, CONCAT(se.FirstName, " ", se.LastName) as SEUserName, se.EvaluationCreatedDate, se.SkillID, se.SkillName FROM Project p LEFT JOIN Team t ON t.ProjectID = p.ProjectID LEFT JOIN User u ON u.UserID = t.UserID LEFT JOIN Reflection rf ON rf.UserID = t.UserID AND rf.ProjectID = t.ProjectID LEFT JOIN (SELECT p.ProjectID, p.ProjectName, r.ReviewID, r.ReviewerID, r.ReceiverID, r.ReviewDescription, r.ReviewStatus, r.ReviewCreatedDate, CONCAT(u.FirstName, " ", u.LastName) as ReviewerName, CONCAT(u1.FirstName, " ", u1.LastName) as ReceiverName FROM Project p INNER JOIN ProjectReview pr ON pr.ProjectID = p.ProjectID INNER JOIN Review r ON r.ReviewID = pr.ReviewID INNER JOIN User u ON u.UserID = r.ReviewerID INNER JOIN User u1 ON u1.UserID = r.ReceiverID WHERE p.ProjectStatus = "Enabled" AND (r.ReviewStatus = "Approved") AND r.ReceiverID = ?) rw ON rw.ReceiverID = t.UserID AND rw.ProjectID = p.ProjectID LEFT JOIN (SELECT p.ProjectID, p.ProjectName, se.UserID, u.FirstName, u.LastName, s.SkillID, s.SkillName, se.EvaluationCreatedDate FROM Project p INNER JOIN SelfEvaluation se ON se.ProjectID = p.ProjectID INNER JOIN Skill s ON s.SkillID = se.SkillID INNER JOIN User u ON u.UserID = se.UserID WHERE p.ProjectStatus = "Enabled" AND se.UserID = ?) se ON se.UserID = t.UserID AND se.ProjectID = p.ProjectID WHERE t.TeamStatus = "Verified" AND p.ProjectStatus = "Enabled" AND t.UserID = ?', [reviewerID, reviewerID, reviewerID])

        const [skills] = await db.query('SELECT se.UserID, se.SkillID, s.SkillName, COUNT(*) FROM SelfEvaluation se INNER JOIN Skill s ON s.SkillID = se.SkillID INNER JOIN Project p ON p.ProjectID = se.ProjectID WHERE se.UserID = ? AND p.ProjectStatus = "Enabled" GROUP BY se.UserID, se.SkillID, s.SkillName ORDER BY COUNT(*) DESC', [reviewerID])

        const [project] = await db.query('SELECT p.ProjectID, p.ProjectName, t.TeamRole FROM Project p INNER JOIN Team t ON t.ProjectID = p.ProjectID WHERE t.TeamStatus = "Verified" AND t.UserID = ? AND p.ProjectStatus = "Enabled"', [reviewerID])

        //console logs
        //console.log('user', user);

        //res.render('biography', { user, feed, projectFeed, selfEvaluation });
        res.render('biography', { user, 
            feedback, 
            userId, 
            bio, 
            skills, 
            project, 
            projectCount: projectCount });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
};

exports.searchSkill = async (req, res) => {
    const skillId = req.params.skillId;
    try {
        // Query to fetch projects related to the skill grouped by user
        const [rows] = await db.query('SELECT p.ProjectID, p.ProjectName, u.UserID, CONCAT(u.FirstName, " ", u.LastName) as UserName FROM SelfEvaluation se INNER JOIN User u ON se.UserID = u.UserID INNER JOIN Project p ON p.ProjectID = se.ProjectID WHERE se.SkillID = ? AND p.ProjectStatus = "Enabled"', [skillId]);

        // Fetch skills data separately for each project
        const projects = await Promise.all(rows.map(async project => {
            const [skillsRows] = await db.query('SELECT s.SkillID, s.SkillName FROM SelfEvaluation se INNER JOIN Skill s ON s.SkillID = se.SkillID INNER JOIN Project p ON p.ProjectID = se.ProjectID WHERE se.ProjectID = ? AND se.UserID = ? AND p.ProjectStatus = "Enabled"', [project.ProjectID, project.UserID]);
            return {
                ...project,
                skills: skillsRows.map(skill => ({ SkillID: skill.SkillID, SkillName: skill.SkillName }))
            };
        }));

        // Group projects by user
        const usersMap = new Map();
        projects.forEach(project => {
            const { UserID, UserName } = project;
            if (!usersMap.has(UserID)) {
                usersMap.set(UserID, { UserID, UserName, projects: [] });
            }
            usersMap.get(UserID).projects.push(project);
        });
        
        // Convert map values to array
        const users = Array.from(usersMap.values());

        // Render the skill.ejs page with the fetched data
        res.render('skill', { users, selectedSkillId: skillId });
    } catch (error) {
        console.error('Error fetching projects by skill:', error);
        // Handle errors appropriately
        res.status(500).send('Internal Server Error');
    }
};
