const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const db = require('../config/db');

exports.uploadUserCSV = async (req, res) => {
  const csvfile = req.file;

  if (!csvfile) {
    return res.status(400).send('No CSV file uploaded');
  }

  const users = [];

  fs.createReadStream(csvfile.path)
    .pipe(csv())
    .on('data', async (row) => {
      // Trim keys to remove any leading or trailing whitespace
      const trimmedRow = Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key.trim(), value])
      );

      const { FirstName, LastName, EmailAddress, UserName, UserPassword } = trimmedRow;
      const hashedPassword = bcrypt.hashSync(UserPassword, 10);

      //console.log('Extracted data:', FirstName, LastName, EmailAddress, UserName, hashedPassword, UserPassword);

      if (FirstName && LastName && EmailAddress && UserName && UserPassword) {
        users.push([FirstName, LastName, EmailAddress, UserName, hashedPassword, "2", "enabled"]);
      }
    })
    .on('end', async () => {
      try {
        //console.log('Users to insert:', users);

        if (users.length > 0) {
          // Get the maximum UserID from the existing records
          const [[{ maxUserID }]] = await db.query('SELECT MAX(UserID) as maxUserID FROM User');
          const startingUserID = maxUserID ? maxUserID + 1 : 1; // Starting UserID for the new records

          // Insert users into the User table with consistent UserID values
          const userIds = [];
          for (let i = 0; i < users.length; i++) {
            const newUserID = startingUserID + i;
            userIds.push(newUserID);
            users[i].unshift(newUserID); // Prepend UserID to user data
          }
          const sql = 'INSERT INTO User (UserID, FirstName, LastName, EmailAddress, UserName, UserPassword, RoleID, UserStatus) VALUES ?';
          await db.query(sql, [users]);

          // Insert biography for each new user
          for (let i = 0; i < users.length; i++) {
            await db.execute('INSERT INTO Biography (UserID, Description, DateCreated, DateModified) VALUES (?, "This is my bio, please edit here", NOW(), NOW())', [userIds[i]]);
          }

          //console.log('Inserted into database:', users);
        }

        res.redirect('/upload?message=Upload%20successful');
      } catch (error) {
        console.error('Error uploading CSV:', error);
        res.redirect('/upload?message=Error%20uploading%20CSV');
      }
    });
};


exports.getUserPage = async (req, res) => {
  const user = req.session.user;

  const [userList] = await db.query('SELECT * FROM User u INNER JOIN Role r ON r.RoleID = u.RoleID ORDER BY UserID');

  res.render('user', { user: user, userList });
};

exports.adminGetEditProfilePage = async (req, res) => {
  const userId = req.params.userId;
  const user = req.session.user;

  const [users] = await db.query('SELECT * FROM User u WHERE u.UserID = ?', [userId]);
  const [bio] = await db.query('SELECT * FROM Biography WHERE UserID = ?', [userId]);

  res.render('user-profile', { user, users, bio });
};

exports.adminUpdateUserProfile = async (req, res) => {
  try {
    const { password } = req.body;
    let hashedPassword = null;

    // Check if the password is provided
    if (password) {
      // Hash the password if provided
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const userId = req.params.userId;

    // Construct the SQL query and parameters
    let sql = 'UPDATE User SET ';
    const params = [];

    // Include the hashed password in the query and parameters if provided
    if (hashedPassword) {
      sql += 'UserPassword = ?';
      params.push(hashedPassword);
    }

    sql += ' WHERE UserID = ?';
    params.push(userId);

    // Execute the update query
    await db.execute(sql, params);

    // Redirect back to the profile page with a success message
    res.redirect('/user');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};

exports.updateUserStatus = async (req, res) => {
  const userId = req.params.userId;
  const { userStatus } = req.body;

  try {
      // Update user status in the database
      await db.execute('UPDATE User SET UserStatus = ? WHERE UserID = ?', [userStatus, userId]);

      res.redirect('/user'); // Redirect to the user list page
  } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).send('An error occurred while updating user status.');
  }
};

exports.updateUserRole = async (req, res) => {
  const userId = req.params.userId;
  const { userRole } = req.body;

  try {
      // Update user status in the database
      await db.execute('UPDATE User SET RoleID = ? WHERE UserID = ?', [userRole, userId]);

      res.redirect('/user'); // Redirect to the user list page
  } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).send('An error occurred while updating user status.');
  }
};

exports.getProject = async (req, res) => {
  try {
    // Fetch projects from the database
    const [projects] = await db.execute('SELECT p.*, CASE WHEN t.MemberCount IS NULL THEN 0 ELSE t.MemberCount END AS MemberCount, u.FirstName AS CreatedByFirstName, u.LastName AS CreatedByLastName FROM Project p INNER JOIN User u on p.ProjectCreatedBy = u.UserID LEFT JOIN (SELECT ProjectID, COUNT(*) as MemberCount FROM Team WHERE TeamStatus = "Verified" GROUP BY ProjectID) t ON t.ProjectID = p.ProjectID ORDER BY p.ProjectID DESC');

    // Format the StartDate and EndDate in short date format
    projects.forEach(project => {
      project.ProjectCreatedDate = new Date(project.ProjectCreatedDate).toLocaleDateString('en-US');
      project.ProjectModifiedDate = new Date(project.ProjectModifiedDate).toLocaleDateString('en-US');
    });

    // Render the projects page with the formatted project data
    res.render('project-adm', {
      projects,
      user: req.session.user
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};

exports.updateProjectStatus = async (req, res) => {
  const projectId = req.params.projectId;
  const { projectStatus } = req.body;

  try {
      // Update user status in the database
      await db.execute('UPDATE Project SET ProjectStatus = ?, ProjectModifiedDate = NOW() WHERE ProjectID = ?', [projectStatus, projectId]);

      res.redirect('/project-adm');
  } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).send('An error occurred while updating user status.');
  }
};

exports.getUploadPage = (req, res) => {
  const user = req.session.user;
  let message = req.query.message || null;
  let fromUploadPage = false;

  if (req.headers.referer && req.headers.referer.endsWith('/upload')) {
    fromUploadPage = true;
  }

  res.render('upload', { user, error: req.session.error, message, fromUploadPage });
};

exports.downloadFile = (req, res) => {
  const filePath = path.join(__dirname, '..', 'public', 'download', 'upload_user.csv');
  res.download(filePath, '/public/download/upload_user.csv', (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(500).send('Internal Server Error');
    }
  });
};
