const db = require('../config/db');

exports.getCreateProjectPage = (req, res) => {
  // Render the create project form
  res.render('project-create');
};

exports.viewProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const currentUser = req.session.user.UserID;

    // Fetch project details from the database based on project ID
    const [project] = await db.query('SELECT p.*, u.FirstName AS CreatedByFirstName, u.LastName AS CreatedByLastName FROM Project p INNER JOIN User u on p.ProjectCreatedBy = u.UserID WHERE p.ProjectID = ? AND p.ProjectStatus = "Enabled"', [projectId]);

    const [memberCount] = await db.execute('SELECT p.*, CASE WHEN t.MemberCount IS NULL THEN 0 ELSE t.MemberCount END AS MemberCount, u.FirstName AS CreatedByFirstName, u.LastName AS CreatedByLastName, u.UserID FROM Project p INNER JOIN User u on p.ProjectCreatedBy = u.UserID LEFT JOIN (SELECT ProjectID, COUNT(*) as MemberCount FROM Team WHERE TeamStatus = "Verified" GROUP BY ProjectID) t ON t.ProjectID = p.ProjectID WHERE p.ProjectID = ? AND p.ProjectStatus = "Enabled"', [projectId]);

    const [memberRows] = await db.query('select CONCAT(u.FirstName, " ", u.LastName) AS UserName, t.TeamRole, u.UserID from Team t INNER JOIN Project p ON p.ProjectID = t.ProjectID INNER JOIN User u ON u.UserID = t.UserID WHERE p.ProjectID = ? AND t.TeamStatus = "Verified" AND p.ProjectStatus = "Enabled" ORDER BY t.TeamRole ASC', [projectId]);

    const [teamMember] = await db.query('SELECT COUNT(*) FROM Team WHERE ProjectID = ? AND UserID = ? AND TeamStatus = "Verified"', [projectId, currentUser]);
    const teamMemberCount = teamMember[0]['COUNT(*)'];

    const [teamRequest] = await db.query('SELECT COUNT(*) FROM Team WHERE TeamStatus = "Requested" AND ProjectID = ? AND UserID = ?', [projectId, currentUser]);
    const teamRequestCount = teamRequest[0]['COUNT(*)'];

    const [teamLeader] = await db.query('SELECT COUNT(*) FROM Team WHERE ProjectID = ? AND TeamRole = "Leader"', [projectId]);
    const teamLeaderCount = teamLeader[0]['COUNT(*)'];

    const [reflection] = await db.query('SELECT COUNT(*) FROM Reflection WHERE ProjectID = ? AND UserID = ?', [projectId, currentUser]);
    const reflectionCount = reflection[0]['COUNT(*)'];

    const [evaluation] = await db.query('SELECT COUNT(*) FROM SelfEvaluation WHERE ProjectID = ? AND UserID = ?', [projectId, currentUser]);
    const evaluationCount = evaluation[0]['COUNT(*)'];

    // Log details to the console
    //console.log('reflectionCount:', reflectionCount);
    //console.log('evaluationCount:', evaluationCount);

    // Render the project view page with project details
    res.render('project-view', {
      project: project[0],
      memberRows: memberRows,
      memberCount: memberCount[0],
      user: req.session.user,
      teamMemberCount: teamMemberCount,
      teamRequest: teamRequest[0],
      teamRequestCount: teamRequestCount,
      teamLeaderCount: teamLeaderCount,
      reflectionCount: reflectionCount,
      evaluationCount: evaluationCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};

exports.createProject = async (req, res) => {
  try {
    const { projectName, projectDescription, projectStartDate, projectEndDate, projectGrade, projectSize, teamRole } = req.body;

    // Convert start date to MySQL DATETIME format
    const formattedStartDate = new Date(projectStartDate).toISOString().slice(0, 19).replace('T', ' ');

    // Convert end date to MySQL DATETIME format or insert null if not provided
    const formattedEndDate = projectEndDate ?
      new Date(projectEndDate).toISOString().slice(0, 19).replace('T', ' ') :
      null;

    // Check if projectGrade is provided, insert null if not
    const formattedProjectGrade = projectGrade || null;

    // Insert project details into the project database
    const [result] = await db.execute(
      'INSERT INTO Project (ProjectName, ProjectDescription, ProjectStartDate, ProjectEndDate, ProjectGrade, ProjectSize, ProjectStatus, ProjectCreatedBy, ProjectCreatedDate, ProjectModifiedDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [projectName, projectDescription, formattedStartDate, formattedEndDate, formattedProjectGrade, projectSize, 'Enabled', req.session.user.UserID]
    );

    // Get ProjectID
    const [projectID] = await db.query('SELECT MAX(ProjectID) FROM Project p');
    const PID = projectID[0]['MAX(ProjectID)'];

    // Insert project details into the team database
    const [team] = await db.execute(
      'INSERT INTO Team (UserID, ProjectID, TeamRole, TeamStatus, TeamCreatedDate, TeamModifiedDate) VALUES (?, ?, ?, "Verified", NOW(), NOW())',
      [req.session.user.UserID, PID, teamRole]
    );

    // Redirect to a success page or display a success message
    res.redirect('/project');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};


exports.getProjectsPage = async (req, res) => {
  try {
    // Fetch projects from the database
    const [projects] = await db.execute('SELECT p.*, CASE WHEN t.MemberCount IS NULL THEN 0 ELSE t.MemberCount END AS MemberCount, u.FirstName AS CreatedByFirstName, u.LastName AS CreatedByLastName FROM Project p INNER JOIN User u on p.ProjectCreatedBy = u.UserID LEFT JOIN (SELECT ProjectID, COUNT(*) as MemberCount FROM Team WHERE TeamStatus = "Verified" GROUP BY ProjectID) t ON t.ProjectID = p.ProjectID WHERE p.ProjectStatus = "Enabled"');

    // Format the StartDate and EndDate in short date format
    projects.forEach(project => {
      project.ProjectStartDate = new Date(project.ProjectStartDate).toLocaleDateString('en-US');
      project.ProjectEndDate = new Date(project.ProjectEndDate).toLocaleDateString('en-US');
      project.ProjectCreatedDate = new Date(project.ProjectCreatedDate).toLocaleDateString('en-US');
    });

    // Render the projects page with the formatted project data
    res.render('project', {
      projects,
      user: req.session.user
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};

exports.updateProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const { projectName, projectDescription, projectStartDate, projectEndDate, projectGrade, projectSize } = req.body;

    // Convert start date to MySQL DATETIME format
    const formattedStartDate = new Date(projectStartDate).toISOString().slice(0, 19).replace('T', ' ');

    // Convert end date to MySQL DATETIME format or insert null if not provided
    const formattedEndDate = projectEndDate ?
      new Date(projectEndDate).toISOString().slice(0, 19).replace('T', ' ') :
      null;

    // Update project details in the database
    await db.execute(
      'UPDATE Project SET ProjectName = ?, ProjectDescription = ?, ProjectStartDate = ?, ProjectEndDate = ?, ProjectGrade = ?, ProjectSize = ?, ProjectModifiedDate = NOW() WHERE ProjectID = ?',
      [projectName, projectDescription, formattedStartDate, formattedEndDate, projectGrade || null, projectSize, projectId]
    );

    res.redirect('/project');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};

exports.getEditProjectPage = async (req, res) => {
  try {
    const projectId = req.params.projectId;

    // Fetch project details from the database based on project ID
    const [project] = await db.execute('SELECT * FROM Project WHERE ProjectID = ?', [projectId]);

    // Render the project-edit.ejs template with project details
    res.render('project-edit', {
      project: project[0]
    }); // Ensure project is an object
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};

exports.getAddMemberPage = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const currentUser = req.session.user.UserID;

    const [teamMember] = await db.query('SELECT COUNT(*) FROM Team WHERE ProjectID = ? AND UserID = ? AND TeamStatus = "Verified"', [projectId, currentUser]);
    const teamMemberCount = teamMember[0]['COUNT(*)'];
    const [project] = await db.query('SELECT * FROM Project WHERE ProjectID = ?', [projectId]);

    const users = await db.query('SELECT DISTINCT u.UserID, CONCAT(u.FirstName, " ", u.LastName) AS UserName FROM User u LEFT JOIN Team t ON t.UserID = u.UserID WHERE u.UserID NOT IN (SELECT u.UserID FROM User u LEFT JOIN Team t ON t.UserID = u.UserID WHERE t.ProjectID = ?) OR u.UserID IN (SELECT u.UserID FROM User u LEFT JOIN Team t ON t.UserID = u.UserID WHERE t.ProjectID = ? AND t.TeamStatus = "Rejected")', [projectId,projectId]);

    const [memberCount] = await db.execute('SELECT p.*, CASE WHEN t.MemberCount IS NULL THEN 0 ELSE t.MemberCount END AS MemberCount, u.FirstName AS CreatedByFirstName, u.LastName AS CreatedByLastName FROM Project p INNER JOIN User u on p.ProjectCreatedBy = u.UserID LEFT JOIN (SELECT ProjectID, COUNT(*) as MemberCount FROM Team GROUP BY ProjectID) t ON t.ProjectID = p.ProjectID WHERE p.ProjectID = ?', [projectId]);

    // Console logs
    //console.log('users:', currentUser);
    //console.log('Project:', projectId);
    //console.log('teamMember:', teamMemberCount);

    // Check if member count equals project size
    if (memberCount[0].ProjectSize === memberCount[0].MemberCount && teamMemberCount == 0 && project[0].ProjectCreatedBy !== currentUser) {
      // Redirect to the project page
      res.redirect(`/project/${projectId}`);
    } else {
      // Render the project-member-add page
      res.render('project-member-add', { project: project[0], users });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};

exports.addMemberToProject = async (req, res) => {
  try {
    const { user, role } = req.body;
    const projectId = req.params.projectId;

    // Check if adding the User will exceed the project size

    // Check if userid + projectid and TeamStatus = "Rejected" exist in the database
    const [existingRejectedTeam] = await db.query('SELECT * FROM Team WHERE UserID = ? AND ProjectID = ? AND TeamStatus = "Rejected"', [user, projectId]);

    if (existingRejectedTeam.length > 0) {
      // Update TeamStatus to "Verified" if the condition is met
      await db.query('UPDATE Team SET TeamStatus = "Verified", TeamModifiedDate = NOW() WHERE UserID = ? AND ProjectID = ?', [user, projectId]);
    } else {
      // Insert the new member into the team table
      await db.query('INSERT INTO Team (UserID, ProjectID, TeamRole, TeamStatus, TeamCreatedDate, TeamModifiedDate) VALUES (?, ?, ?, "Verified", NOW(), NOW())', [user, projectId, role]);
    }

    res.redirect(`/project/${projectId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};


exports.searchProject = async (req, res) => {
  try {
    const query = req.query.query; // Get the search query from the request
    // Query the database to fetch project names matching the search query
    const [projects] = await db.query('SELECT ProjectName, ProjectID FROM Project WHERE ProjectName LIKE ? AND ProjectStatus = "Enabled"', [`%${query}%`]);
    res.json(projects); // Send the project names as JSON response
  } catch (error) {
    console.error('Error fetching project suggestions:', error);
    res.status(500).json({ error: 'An error occurred while fetching project suggestions' });
  }
};

exports.requestToJoin = async (req, res) => {
  try {
    const { teamRole } = req.body;
    const { projectId } = req.params;
    const userId = req.session.user.UserID;

    // Insert the request to join into the team table
    await db.execute('INSERT INTO Team (UserID, ProjectID, TeamRole, TeamStatus, TeamCreatedDate, TeamModifiedDate) VALUES (?, ?, ?, "Requested", NOW(), NOW())', [userId, projectId, teamRole]);

    console.log("teamRole", teamRole);

    res.redirect(`/project/${projectId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};

exports.acceptJoinRequest = async (req, res) => {
  try {
    // Extract UserId and projectId from the request body
    const { userId, projectId } = req.body;

    //console.log('userId:', userId);
    //console.log('projectId:', projectId);

    // Update the team table to mark the request as accepted
    await db.query('UPDATE Team SET TeamStatus = "Verified", TeamModifiedDate = NOW() WHERE UserID = ? AND ProjectID = ? AND TeamStatus = "Requested"', [userId, projectId]);

    // Redirect the User to the notifications page or any other desired page
    res.redirect('/home');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
}

exports.rejectJoinRequest = async (req, res) => {
  try {
    // Extract userId and projectId from the request body
    const { userId, projectId } = req.body;

    //console.log('userId:', userId);
    //console.log('projectId:', projectId);

    // Update the team table to mark the request as accepted
    await db.query('UPDATE Team SET TeamStatus = "Rejected", TeamModifiedDate = NOW() WHERE UserID = ? AND ProjectID = ? AND TeamStatus = "Requested"', [userId, projectId]);

    // Redirect the User to the notifications page or any other desired page
    res.redirect('/home');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
}

exports.deleteProject = async (req, res) => {
  try {
    // Extract projectId from the request body
    const { projectId } = req.body;

    // Update the team table to mark the status as disabled so it will not appear on project table
    await db.query('UPDATE Project SET ProjectStatus = "Disabled", ProjectModifiedDate = NOW() WHERE ProjectID = ?', [projectId]);

    res.redirect('/project');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
}