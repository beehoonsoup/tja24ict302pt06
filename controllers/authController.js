const bcrypt = require('bcrypt');
const db = require('../config/db');
const nodemailer = require('nodemailer');

exports.getRegisterPage = (req, res) => {
  res.render('register');
};

exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.execute('INSERT INTO User (FirstName, LastName, EmailAddress, UserName, UserPassword, RoleID, UserStatus) VALUES (?, ?, ?, ?, ?, ?, ?)', [firstName, lastName, email, username, hashedPassword, 2, 'enabled']);

    // Get UserID
    const [UserID] = await db.query('SELECT MAX(UserID) FROM User u');
    const PID = UserID[0]['MAX(UserID)'];

    await db.execute('INSERT INTO Biography (UserID, Description, DateCreated, DateModified) VALUES (?, "This is my bio, please edit here", NOW(), NOW())', [PID]);
    
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
  let fromLogout = false;

  // Check if the message is from the profile edit page
  if (req.headers.referer && req.headers.referer.endsWith('/register')) {
    fromRegisterPage = true;
  } else if (req.headers.referer && req.headers.referer.endsWith('/logout')) {
    fromLogout = true;
  }

  // Render the profile page with the message and fromRegisterPage flag
  res.render('login', { error: req.session.error, message, fromRegisterPage, fromLogout });
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.execute('SELECT * FROM User WHERE EmailAddress = ? OR UserName = ?', [email, email]);
    const user = rows[0];
    //console.log('Retrieved hashed password from database:', user.UserPassword);
    if (!user) {
      req.session.error = 'Invalid email/username or password';
      res.redirect('/login');
      return;
    }
    // Convert the Buffer object representing the hashed password to a string
    const hashedPassword = user.UserPassword.toString('utf8');

    const passwordMatch = await bcrypt.compare(password, hashedPassword);
    if (!passwordMatch) {
      req.session.error = 'Invalid email/username or password';
      res.redirect('/login');
      return;
    }
    req.session.user = user;
    res.redirect('/home');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
};

exports.getHomePage = (req, res) => {
  if (!req.session.user) {
    // User is not logged in, redirect them to the login page
    res.redirect('/login');
    return;
  }
  
  //console.log('User object:', req.session.user); // Log the user object
  
  // User is logged in, render the home page with the user object
  res.render('home', { user: req.session.user });
};

exports.geTestPage = (req, res) => {
 
  //console.log('User object:', req.session.user); // Log the user object
  
  // User is logged in, render the home page with the user object
  res.render('test', { user: req.session.user });
};

exports.logoutUser = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      res.status(500).send('An error occurred');
      return;
    }
    res.redirect('/login?message=User%20logout%20successfully');
  });
};

exports.getForgetPassword = async (req, res) => {
  res.render('forget-password');
};

exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the email exists in the User table
    const user = await db.query('SELECT * FROM User WHERE EmailAddress = ?', [email]);

    // If the user doesn't exist, display a message to the user
    if (!user || user.length === 0) {
      return res.status(400).send('Email not registered');
    }

    const generateToken = require('../public/js/tokenUtils.js');

    // Generate a unique token (e.g., using crypto or UUID)
    const token = generateToken();

    // Store the token in your database along with the user's email
    await saveTokenInDatabase(email, token);

    // Send reset password email
    await sendResetPasswordEmail(email, token);

    res.send('Password reset email sent successfully');
  } catch (error) {
    console.error('Error sending reset password email:', error);
    res.status(500).send('Failed to send reset password email');
  }
};

async function sendResetPasswordEmail(email, token) {
  try {
      // Create a transporter using the SMTP transport
      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: 'loves.xixi@gmail.com', // Your Gmail address
              pass: 'Welcome12345!' // Your Gmail App Password
          }
      });

      // Send reset password email
      await transporter.sendMail({
          from: 'loves.xixi@gmail.com', // Sender email address (must be your Gmail address)
          to: email, // Recipient email address
          subject: 'Reset Your Password', // Email subject
          text: `Click the link below to reset your password: http://example.com/reset-password?token=${token}`, // Email body
          html: `<p>Click the link below to reset your password:</p><p><a href="http://example.com/reset-password?token=${token}">Reset Password</a></p>` // HTML email body
      });

      console.log('Password reset email sent successfully');
  } catch (error) {
      console.error('Error sending reset password email:', error);
      throw error; // Throw the error to handle it in the calling function
  }
}