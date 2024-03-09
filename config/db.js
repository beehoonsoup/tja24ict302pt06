const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'w2}JHOAH25MZ~8G',
  database: 'tw2024',
  connectionLimit: 10
});

module.exports = pool.promise();
