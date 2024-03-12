const mysql = require('mysql2');

/*
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'w2}JHOAH25MZ~8G',
  database: 'tw2024',
  connectionLimit: 10
});
*/
/*
//localdb -mk
const pool = mysql.createPool({
  host: 'localhost',
  user: 'mabelin',
  password: '123',
  database: 'sys',
  connectionLimit: 10
});
*/

//localdb -kelly
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Qwer1234',
  database: 'sys',
  connectionLimit: 10
});


module.exports = pool.promise();
