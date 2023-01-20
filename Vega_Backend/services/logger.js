const winston = require("winston");
require("winston-daily-rotate-file");
const { combine, timestamp, printf, colorize, align } = winston.format;
const path = require("path");
const appRoot = require("app-root-path");
// let logDir = path.join(appRoot.path, "uploads/errorfile");
const makeDir = require("../routes/common/utils").makeDirectories;

makeDir("uploads");
var logDir = makeDir("uploads/errorfile");

const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename:
    path.join(appRoot.path, "uploads/errorfile/") + "combined-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxFiles: "100d",
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    colorize({ all: true }),
    timestamp({
      format: "YYYY-MM-DD hh:mm:ss.SSS A", // 2022-01-25 03:23:10.350 PM
    }),
    align(),
    printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
  ),
  transports: [fileRotateTransport],
  exitOnError: false, // do not exit on handled exceptions
});

module.exports = logger;
