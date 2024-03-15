const db = require('../config/db');

exports.getCreateReflectionPage = async (req, res) => {
    try {
        const projectId = req.query.projectId;
        const userId = req.session.user.UserID;

        // Fetch project name
        const [projectName] = await db.query('SELECT ProjectID, ProjectName FROM Project WHERE ProjectID = ?', [projectId]);

        // Fetch existing reflection for the given projectId and UserId
        const [existingReflection] = await db.query('SELECT ReflectionDescription FROM Reflection WHERE ProjectID = ? AND UserID = ?', [projectId, userId]);

        //console.log('projectName', projectName);
        //console.log('Userid', UserId);

        res.render('reflection-create', { projectId, userId, projectName, existingReflection });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
};


exports.createReflection = async (req, res) => {
    try {
        const { projectId, reflectionDescription } = req.body;
        const userId = req.session.user.UserID;

        //console.log('UserId:', UserId);
        //console.log('projectId:', projectId);

        // Check if a reflection with the given projectId and UserId already exists
        const [existingReflection] = await db.execute('SELECT * FROM Reflection WHERE ProjectID = ? AND UserID = ?', [projectId, userId]);

        if (existingReflection.length > 0) {
            // If a reflection already exists, update it
            await db.execute('UPDATE Reflection SET ReflectionDescription = ?, ReflectionModifiedDate = NOW() WHERE ProjectID = ? AND UserID = ?', [reflectionDescription, projectId, userId]);
        } else {
            // If no reflection exists, insert a new one
            await db.execute('INSERT INTO Reflection (ProjectID, UserID, ReflectionDescription, ReflectionCreatedDate, ReflectionModifiedDate) VALUES (?, ?, ?, NOW(), NOW())', [projectId, userId, reflectionDescription]);
        }

        // Redirect to a success page or display a success message
        res.redirect(`/project/${projectId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
};

exports.deleteReflection = async (req, res) => {
    try {
        const { projectId } = req.body;
        const userId = req.session.user.UserID;

        //console.log('UserId:', UserId);
        //console.log('projectId:', projectId);

        // Delete reflection 
        await db.query('DELETE FROM Reflection WHERE ProjectID = ? AND UserID = ?', [projectId, userId]);

        // Redirect the User to the project page or any other desired page
        res.redirect(`/project/${projectId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
};

exports.getCreateReviewPage = async (req, res) => {
    try {
        //const { reviewer, projectId, receiver } = req.body;
        const receiverName = req.query.receiverName;
        const projectId = req.query.projectId;
        const reviewerID = req.session.user.UserID;
        const receiverID = req.query.receiverID;

        // Fetch project name
        const [projectName] = await db.query('SELECT ProjectID, ProjectName FROM Project WHERE ProjectID = ?', [projectId]);

        // Fetch existing reflection for the given projectId and UserId
        const [existingReview] = await db.query('SELECT r.ReviewDescription, r.ReviewStatus FROM Review r INNER JOIN ProjectReview pr ON r.ReviewID = pr.ReviewID WHERE pr.ProjectID = ? AND r.ReviewerID = ? AND r.ReceiverID = ?', [projectId, reviewerID, receiverID]);

        //console.log('receiver', receiver);
        //console.log('reviewer', reviewer);
        //console.log('projectId', projectId);

        res.render('review-create', { projectId, reviewerID, receiverID, receiverName, projectName, existingReview });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
};

exports.createReview = async (req, res) => {
    try {
        const { projectId, receiverID, reviewerID, reviewDescription } = req.body;
        //const UserId = req.session.user.UserID;

        //console.log('UserId:', UserId);
        //console.log('projectId:', projectId);

        await db.execute('INSERT INTO Review (ReviewerID, ReceiverID, ReviewDescription, ReviewStatus, ReviewCreatedDate, ReviewModifiedDate) VALUES (?, ?, ?, "Created", NOW(), NOW())', [reviewerID, receiverID, reviewDescription]);

        // Get ReviewID
        const [ReviewID] = await db.query('SELECT MAX(ReviewID) FROM Review');
        const PID = ReviewID[0]['MAX(ReviewID)'];

        await db.execute('INSERT INTO ProjectReview (ReviewID, ProjectID, PRCreatedDate, PRModifiedDate) VALUES (?, ?, NOW(), NOW())', [PID, projectId]);

        // Redirect to a success page or display a success message
        res.redirect(`/project/${projectId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
};

exports.getViewReview = async (req, res) => {
    try {
        const { ReviewerID, ProjectID, ReceiverID, ReviewID } = req.body;
        const receiverName = req.query.receiverName;

        //console.log('ReviewerID', ReviewerID);
        //console.log('ReceiverID', ReceiverID);
        //console.log('ReviewID', ReviewID);

        // Fetch project name
        const [projectName] = await db.query('SELECT ProjectID, ProjectName FROM Project WHERE ProjectID = ?', [ProjectID]);

        // Fetch existing review for the given ReviewID
        const [existingReview] = await db.query('SELECT r.ReviewID, r.ReviewerID, r.ReceiverID, r.ReviewDescription, r.ReviewStatus FROM Review r INNER JOIN ProjectReview pr ON r.ReviewID = pr.ReviewID WHERE r.ReviewID = ?', [ReviewID]);

        // Fetch ReviewerName
        const [reviewerName] = await db.query('SELECT r.ReviewDescription, r.ReviewStatus, CONCAT(u.FirstName, " ", u.LastName) as ReviewerName FROM Review r INNER JOIN User u ON u.UserID = r.ReviewerID WHERE r.ReviewID = ?', [ReviewID]);

        res.render('review', { ReviewID, ProjectID, ReviewerID, ReceiverID, receiverName, projectName, existingReview, reviewerName });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
};

exports.acceptReview = async (req, res) => {
    try {
        // Extract ReviewID from the request body
        const { ReviewID } = req.body;

        //console.log('ReviewID:', ReviewID);
        //console.log('projectId:', projectId);

        // Update the review table to mark the created as approved
        await db.query('UPDATE Review SET ReviewStatus = "Approved", ReviewModifiedDate = NOW() WHERE ReviewID = ? AND ReviewStatus = "Created"', [ReviewID]);

        // Update the projectreview table to mark the created as approved
        await db.query('UPDATE ProjectReview SET PRModifiedDate = NOW() WHERE ReviewID = ?', [ReviewID]);

        // Redirect the User to the notifications page or any other desired page
        res.redirect('/notifications');
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
}

exports.rejectReview = async (req, res) => {
    try {
        // Extract ReviewID from the request body
        const { ReviewID } = req.body;

        //console.log('ReviewID:', ReviewID);
        //console.log('projectId:', projectId);

        // Update the review table to mark the created as rejected
        await db.query('UPDATE Review SET ReviewStatus = "Rejected", ReviewModifiedDate = NOW() WHERE ReviewID = ? AND ReviewStatus = "Created"', [ReviewID]);

        // Update the projectreview table to mark the created as approved
        await db.query('UPDATE ProjectReview SET PRModifiedDate = NOW() WHERE ReviewID = ?', [ReviewID]);

        // Redirect the User to the notifications page or any other desired page
        res.redirect('/notifications');
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
}

exports.unhideReview = async (req, res) => {
    try {
        // Extract ReviewID from the request body
        const { ReviewID } = req.body;

        //console.log('ReviewID:', ReviewID);
        //console.log('projectId:', projectId);

        // Update the review table to mark the created as approved
        await db.query('UPDATE Review SET ReviewStatus = "Approved", ReviewModifiedDate = NOW() WHERE ReviewID = ? AND ReviewStatus = "Rejected"', [ReviewID]);

        // Update the projectreview table to mark the created as approved
        await db.query('UPDATE ProjectReview SET PRModifiedDate = NOW() WHERE ReviewID = ?', [ReviewID]);

        // Redirect the User to the notifications page or any other desired page
        res.redirect('/biography');
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
}

exports.hideReview = async (req, res) => {
    try {
        // Extract ReviewID from the request body
        const { ReviewID } = req.body;

        //console.log('ReviewID:', ReviewID);
        //console.log('projectId:', projectId);

        // Update the review table to mark the created as approved
        await db.query('UPDATE Review SET ReviewStatus = "Rejected", ReviewModifiedDate = NOW() WHERE ReviewID = ? AND ReviewStatus = "Approved"', [ReviewID]);

        // Update the projectreview table to mark the created as approved
        await db.query('UPDATE ProjectReview SET PRModifiedDate = NOW() WHERE ReviewID = ?', [ReviewID]);

        // Redirect the User to the notifications page or any other desired page
        res.redirect('/biography');
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
}

exports.handleSelfEvaluation = async (req, res) => {
    try {
        const projectId = req.query.projectId;
        const userId = req.session.user.UserID;

        // Check if there are entries in the database for the specified project and user
        // Replace this query with your actual query to check for entries in the database
        const entriesExist = await db.query('SELECT COUNT(*) AS count FROM SelfEvaluation WHERE ProjectID = ? AND UserID = ?', [projectId, userId]);

        // If entries exist, redirect to /selfEvaluation-view
        if (entriesExist[0][0].count > 0) {
            res.redirect('/selfEvaluation-view?projectId=' + projectId + '&userId=' + userId);
        } else {
            // If no entries exist, redirect to /selfEvaluation-create
            res.redirect('/selfEvaluation-create?projectId=' + projectId + '&userId=' + userId);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to handle self evaluation');
    }
};

exports.getSkills = async (req, res) => {
    try {
        const projectId = req.query.projectId;
        const userId = req.session.user.UserID;

        const skills = await db.query('SELECT SkillID, SkillName FROM Skill');

        const project = await db.query('SELECT ProjectName FROM Project WHERE ProjectID = ?', [projectId]);
        const projectName = project[0][0].ProjectName;

        res.render('selfEvaluation-create', { projectId, userId, skills, projectName });
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to fetch skills');
    }
};

exports.getSelectedSkills = async (req, res) => {
    try {
        const projectId = req.query.projectId;
        const userId = req.session.user.UserID;

        const project = await db.query('SELECT ProjectName FROM Project WHERE ProjectID = ?', [projectId]);
        const projectName = project[0][0].ProjectName;

        // Fetch selected skills from the database for the specified project and user
        // Replace this query with your actual query to fetch selected skills
        const selectedSkillsData = await db.query('SELECT s.SkillName FROM SelfEvaluation se LEFT JOIN Skill s ON s.SkillID = se.SkillID WHERE se.ProjectID = ? AND se.UserID = ?', [projectId, userId]);

        // Extract skill names from the retrieved data
        const selectedSkills = selectedSkillsData[0].map(skill => skill.SkillName);
        
        console.log('selectedSkillsData', selectedSkillsData);
        console.log('selectedSkills', selectedSkills);

        res.render('selfEvaluation-view', { 
            projectId: projectId, 
            userId: userId,
            projectName: projectName,
            selectedSkills: selectedSkills  });
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to fetch selected skills');
    }
};

exports.searchSkills = async (req, res) => {
    try {
        const query = req.query.query; // Get the search query from the request
        // Query the database to fetch project names matching the search query
        const [skills] = await db.query('SELECT SkillName, SkillID FROM Skill WHERE SkillName LIKE ?', [`%${query}%`]);
        res.json(skills); // Send the project names as JSON response
      } catch (error) {
        console.error('Error fetching project suggestions:', error);
        res.status(500).json({ error: 'An error occurred while fetching project suggestions' });
      }
  };

exports.submitSkills = async (req, res) => {
    try {
        const selectedSkillIds = req.body.selectedSkillIds.split(',').filter(id => id !== ''); 
        const userId = req.session.user.UserID;
        const { projectId } = req.body;

        // Insert selected skills into the database
        for (const skillId of selectedSkillIds) {
            await db.query('INSERT INTO SelfEvaluation (UserID, ProjectID, SkillID, EvaluationCreatedDate, EvaluationModifiedDate) VALUES (?, ?, ?, NOW(), NOW())', [userId, projectId, skillId]);
        }

        res.redirect('/selfEvaluation-view?projectId=' + projectId + '&userId=' + userId + 'message=' + encodeURIComponent('Skills inserted successfully'));
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to insert skills');
    }
  };

/*exports.createSelfEvaluation = async (req, res) => {
    try {
        const { projectId, selectedSkills } = req.body;
        const userId = req.session.user.UserID;

        // Assuming skills is an array of skill IDs
        const skillValues = selectedSkills.map(skill => [userId, projectId, skill, new Date(), new Date()]);

        await db.query('INSERT INTO SelfEvaluation (UserID, ProjectID, SkillID, EvaluationCreatedDate, EvaluationModifiedDate) VALUES ?', [skillValues]);

        res.redirect(`/project/${projectId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to add skills to project');
    }
};

exports.getCreateSelfEvaluationPage = async (req, res) => {
    try {
        const projectId = req.query.projectId;
        const userId = req.session.user.UserID;

        const skills = await db.query('SELECT SkillID, SkillName FROM Skill');

        const project = await db.query('SELECT ProjectName FROM Project WHERE ProjectID = ?', [projectId]);
        const projectName = project[0][0].ProjectName;

        const existingSelfEvaluation = await db.query('SELECT * FROM SelfEvaluation WHERE UserID = ? AND ProjectID = ?', [userId, projectId]);
        
        const { query } = req.query; // Get the search query from the request query parameters
        
        // Query the database to search for skills matching the query
        //const skills = await db.query('SELECT * FROM Skill WHERE SkillName LIKE ?', [`%${query}%`]);

        // Console logs
        //console.log('projectId:', projectId);
        //console.log('Project Name:', projectName);
        //console.log('userID:', userId);
        //console.log('skill:', skills);

        res.render('selfEvaluation-create', { projectId, userId, skills, projectName, existingSelfEvaluation });
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to fetch skills');
    }
};

exports.createSelfEvaluation = async (req, res) => {
    try {
        const { projectId, skills } = req.body;
        const userId = req.session.user.UserID;

        // Assuming skills is an array of skill IDs
        const skillValues = skills.map(skill => [userId, projectId, skill, new Date(), new Date()]);

        await db.query('INSERT INTO SelfEvaluation (UserID, ProjectID, SkillID, EvaluationCreatedDate, EvaluationModifiedDate) VALUES ?', [skillValues]);

        res.redirect(`/project/${projectId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to add skills to project');
    }
};
*/