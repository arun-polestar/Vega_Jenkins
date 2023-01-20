const uploadController = require("./Controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post(
  "/expenseAttachments",
  sessionAuth,
  uploadController.expenseAttachments
);

module.exports = app;
