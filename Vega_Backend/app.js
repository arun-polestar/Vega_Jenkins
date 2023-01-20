"use strict";

const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const errorHandler = require("errorhandler");
const fileUpload = require("express-fileupload");
const app = express();
const cronService = require("./services/cronService");
const helmet = require("helmet");
const { makeDirectories } = require("./routes/common/utils");
const env = (process.env.NODE_ENV || "development").toLowerCase();
const path = require("path");
const rfs = require("rotating-file-stream");
const compression = require("compression");
const session = require("express-session");

app.use((req, res, next) => {
  res["time"] = new Date();
  res.removeHeader("Server");
  next();
});

app.use(["/", "/getfileurl"], express.static(makeDirectories("/uploads")));
app.use(["/", "/getlogourl"], express.static(makeDirectories("/assets")));
//app.use(["/", "/getlogourl"], express.static(makeDirectories("/assets")));

app.use(express.json({ limit: "10mb" }));

app.use(
  express.urlencoded({
    limit: "10mb",
    extended: false,
    parameterLimit: 50000,
  })
);
//app.use(helmet());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        frameAncestors: [
          "https://teams.microsoft.com",
          "*.teams.microsoft.com",
          "*.skype.com",
          "https://www.w3schools.com/",
        ],
      },
    },
    frameguard: false,
  })
);

app.use(cookieParser("1a2b3c4d5e6f"));
app.use(
  fileUpload({
    createParentPath: true,
    limits: {
      fileSize: 20 * 1024 * 1024,
    },
    abortOnLimit: true,
  })
);
app.use(compression());
app.use(session({ secret: "SECRET" })); // session secret
app.use(require("./routes"));

const accessLogStream = rfs.createStream("access.log", {
  interval: "1d", // rotate daily
  path: path.join(__dirname, "log"),
});

app.use(
  logger(env === "production" ? "combined" : "dev", {
    stream: accessLogStream,
    format:
      ":istDate :method :url :status :res[Content-Length] :response-time ms",
  })
);

if (env === "production") {
  logger.token("istDate", function () {
    return new Date();
  });

  app.use((req, res) => res.send(404));

  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render("error", {
      message: err.message,
      error: err,
    });
  });
}

if (env === "development") {
  app.use(errorHandler());
}
cronService.runAllCronJobs();

module.exports = app;
