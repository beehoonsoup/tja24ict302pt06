const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'mabelin',
  password: '123',
  database: 'sys',
  connectionLimit: 10
});

module.exports = pool.promise();
