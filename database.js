const mysql = require('mysql2/promise');
const path = require('path');

const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

// Mysql connection info
const connection = mysql.createConnection({
    host: process.env.MySQLHost,
    user: process.env.MySQLUser,
    password: process.env.MySQLPassword,
    database: process.env.MySQLDatabase
});

module.exports = connection;
