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

exports.getBiographyPage = async (req, res) => {
    try {
      const userId = req.session.user.UserID;
  
      // Fetch reflections for the user
      const [reflections] = await db.query('SELECT * FROM Reflection WHERE UserID = ? ORDER BY ReflectionCreatedDate DESC', [userId]);
  
      // Fetch accepted reviews for the user
      const [acceptedReviews] = await db.query('SELECT r.*, p.ProjectID, p.ProjectName FROM Review r INNER JOIN ProjectReview pr ON r.ReviewID = pr.ReviewID INNER JOIN Project p ON pr.ProjectID = p.ProjectID WHERE r.ReviewStatus = "Accepted" AND r.ReviewerID = ? ORDER BY r.ReviewCreatedDate DESC', [userId]);
  
      // Combine reflections and accepted reviews into a single array
      const feed = [...reflections, ...acceptedReviews];
  
      // Sort the feed based on creation dates
      feed.sort((a, b) => new Date(b.ReflectionCreatedDate || b.ReviewCreatedDate) - new Date(a.ReflectionCreatedDate || a.ReviewCreatedDate));
  
      res.render('biography', { feed });
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred');
    }
  };

exports.createSelfEvaluation = async (req, res) => {
    try {
        const { projectId, userId } = req.body;

        const skills = await db.query('SELECT SkillID, SkillName FROM Skill');

        // Console logs
        console.log('projectId:', projectId);
        console.log('userID:', userId);
        console.log('skill:', skills);

        res.render('selfEvaluation', { projectId, userId, skills });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
};

exports.addSelfEvaluation = async (req, res) => {
    try {
        const { projectId, userId } = req.body;

        const skills = await db.query('SELECT SkillID, SkillName FROM Skill');

        // Console logs
        console.log('projectId:', projectId);
        console.log('userID:', userId);
        console.log('skill:', skills);

        res.render('selfEvaluation-create', { projectId, userId, skills });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
};

exports.getSkills = async (req, res) => {
    try {
        const { projectId, userId } = req.body;

        const skills = await db.query('SELECT SkillID, SkillName FROM Skill');

        const projectName = await db.query('SELECT ProjectName FROM Project WHERE ProjectID = ?', [projectId]);

        // Console logs
        console.log('projectId:', projectId);
        console.log('userID:', userId);
        console.log('skill:', skills);

        res.render('selfEvaluation-create', { projectId, userId, skills, projectName });
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to fetch skills');
    }
}

exports.viewSkills = async (req, res) => {
    const userId = req.params.userId;

    try {
        // Retrieve the skills associated with the user from the database
        const [skills] = await db.query('SELECT SkillID FROM SelfEvaluation WHERE UserID = ?', [userId]);

        // Render the view with the skills data
        res.render('biography', { skills });
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to retrieve skills');
    }
};