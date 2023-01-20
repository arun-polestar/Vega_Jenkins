const resumeUploadController = require("./Controller");
const express = require("express");
const app = express.Router();

app.post(
  "/candidateResumeUpload",
  resumeUploadController.candidateResumeUpload
);

module.exports = app;
