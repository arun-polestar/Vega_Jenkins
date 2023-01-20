const mysql = require("mysql");
const config = require("./config/config").mysqlconfig;
const chalk = require("chalk");
//const util = require("util");

const pool = mysql.createPool({
  host: config.host,
  user: config.user,
  password: config.password,
  port: config.port,
  database: config.database,
  //connectionLimit: 990,
  //connectTimeout: 3 * 60 * 1000,
  //acquireTimeout: 3 *  60 * 1000,
  // timeout: 3* 60 * 1000,
  // waitForConnections: true,
  charset: "utf8mb4"
});
/**
 * Ping database to check for common exception errors.
 */
pool.getConnection((err, connection) => {
  if (err) {
    console.error(err);
  }
  if (connection) {
    console.log(
      chalk.green("✓") +
      ' ' + "Database Working Fine!");
    return connection.release();
  }
});

module.exports = pool;