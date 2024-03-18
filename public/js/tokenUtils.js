const crypto = require('crypto');

// Function to generate a random token
function generateToken() {
  return crypto.randomBytes(20).toString('hex');
}

// Export the generateToken function
module.exports = generateToken;