const mysql = require('mysql2')

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'admin123',
  database: 'chinese-medicine-recognition'
}).promise()

module.exports = pool