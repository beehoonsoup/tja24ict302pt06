// controllers/userController.js

const bcrypt = require('bcrypt');
const db = require('../config/db');

exports.getProfilePage = (req, res) => {
  const user = req.session.user;
  let message = req.query.message || null;
  let fromProfileEditPage = false;

  // Check if the message is from the profile edit page
  if (req.headers.referer && req.headers.referer.endsWith('/profile-edit')) {
    fromProfileEditPage = true;
  }

  // Render the profile page with the message and fromProfileEditPage flag
  res.render('profile', { user, message, fromProfileEditPage });
};

exports.getEditProfilePage = async (req, res) => {
  //const user = req.session.user;
  const userId = req.session.user.UserID;
  const user = req.session.user;

  const [users] = await db.query('SELECT * FROM User u WHERE u.UserID = ?', [userId]);
  const [bio] = await db.query('SELECT * FROM Biography WHERE UserID = ?', [userId]);

  res.render('profile-edit', { user, users, bio });
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, password, bioDescription } = req.body;
    let hashedPassword = null;

    // Check if the password is provided
    if (password) {
      // Hash the password if provided
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const userId = req.session.user.UserID;

    // Construct the SQL query and parameters
    let sql = 'UPDATE User SET FirstName = ?, LastName = ?, EmailAddress = ?';
    const params = [firstName, lastName, email];

    // Include the hashed password in the query and parameters if provided
    if (hashedPassword) {
      sql += ', UserPassword = ?';
      params.push(hashedPassword);
    }

    sql += ' WHERE UserID = ?';
    params.push(userId);

    // Execute the update query
    await db.execute(sql, params);

    await db.execute(
      'UPDATE Biography SET Description = ?, DateModified = NOW() WHERE UserID = ?',
      [bioDescription, userId]
    );

    // Update the user object in the session with the new details
    req.session.user = { ...req.session.user, FirstName: firstName, LastName: lastName, EmailAddress: email };
    
    // Redirect back to the profile page with a success message
    res.redirect('/home');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};