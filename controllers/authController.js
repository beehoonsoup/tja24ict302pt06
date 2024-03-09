const bcrypt = require('bcrypt');
const db = require('../config/db');

exports.getRegisterPage = (req, res) => {
  res.render('register');
};

exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute('INSERT INTO User (FirstName, LastName, EmailAddress, UserName, UserPassword, RoleID, UserStatus) VALUES (?, ?, ?, ?, ?, ?, ?)', [firstName, lastName, email, username, hashedPassword, 2, 'enabled']);
    res.redirect('/login?message=User%20registered%20successfully');
  } catch (error) {
    console.error(error);
    req.session.error = 'Registration failed. Please try again.';
    res.redirect('/register');
  }
};

exports.getLoginPage = (req, res) => {
  let message = req.query.message || null;
  let fromRegisterPage = false;

  // Check if the message is from the profile edit page
  if (req.headers.referer && req.headers.referer.endsWith('/register')) {
    fromRegisterPage = true;
  }

  // Render the profile page with the message and fromRegisterPage flag
  res.render('login', { error: req.session.error, message, fromRegisterPage });
};

/*exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.execute('SELECT * FROM User WHERE EmailAddress = ? OR UserName = ?', [email, email]);
    const user = rows[0];
    //console.log('Retrieved hashed password from database:', User.UserPassword);
    if (!user) {
      req.session.error = 'Invalid email/Username or password';
      res.redirect('/login');
      return;
    }
    const passwordMatch = await bcrypt.compare(password, user.UserPassword);
    if (!passwordMatch) {
      req.session.error = 'Invalid email/Username or password';
      res.redirect('/login');
      return;
    }
    req.session.user = user;
    res.redirect('/home');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};*/

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if Username or password is missing
    if (!email || !password) {
      throw new Error('Username or password is missing');
    }

    // Retrieve hashed password from the database based on the provided Username
    const hashedPassword = await retrieveHashedPasswordFromDatabase(email);

    // Compare the provided password with the hashed password
    const isPasswordMatch = await bcrypt.compare(password, hashedPassword);

    if (isPasswordMatch) {
      // Passwords match, proceed with login
      res.send('Login successful');
    } else {
      // Passwords don't match, handle invalid login attempt
      res.send('Invalid Username or password');
    }
  } catch (error) {
    // Handle any errors that occur during the login process
    console.error(error);
    res.send('An error occurred during login');
  }
};


exports.getHomePage = (req, res) => {
  if (!req.session.user) {
    // User is not logged in, redirect them to the login page
    res.redirect('/login');
    return;
  }
  
  //console.log('User object:', req.session.User); // Log the User object
  
  // User is logged in, render the home page with the User object
  res.render('home', { user: req.session.user });
};

exports.logoutUser = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      res.status(500).send('An error occurred');
      return;
    }
    res.redirect('/login');
  });
};

