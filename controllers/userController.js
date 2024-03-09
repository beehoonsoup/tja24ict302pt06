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


exports.getEditProfilePage = (req, res) => {
  const user = req.session.user;
  res.render('profile-edit', { user });
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    let hashedPassword = null;

    // Check if the password is provided
    if (password) {
      // Hash the password if provided
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const userId = req.session.user.UserID;

    // Construct the SQL query and parameters
    let sql = 'UPDATE user SET FirstName = ?, LastName = ?, EmailAddress = ?';
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

    // Update the user object in the session with the new details
    req.session.user = { ...req.session.user, FirstName: firstName, LastName: lastName, EmailAddress: email };

    // Redirect back to the profile page with a success message
    res.redirect('/profile?message=Profile%20has%20been%20updated');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};
