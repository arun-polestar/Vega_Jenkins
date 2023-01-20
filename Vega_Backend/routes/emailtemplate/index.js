"use strict";
const emailcntrl = require("./Controller");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/emailtemplate", sessionAuth, emailcntrl.mailtypelist);
app.post("/testmailtemplate", sessionAuth, emailcntrl.testmailtemplate);
app.post("/uploadEmailAssets", sessionAuth, emailcntrl.uploadEmailAssets);
app.post(
  "/viewEmailAssetsParams",
  sessionAuth,
  emailcntrl.viewEmailAssetsParams
);
app.post(
  "/updateEmailAssetsParams",
  sessionAuth,
  emailcntrl.updateEmailAssetsParams
);
app.post("/addEmailParams", sessionAuth, emailcntrl.addEmailParams);
app.post("/saveEmailTemplate", sessionAuth, emailcntrl.saveEmailTemplate);
app.post("/deactivatetemplate", sessionAuth, emailcntrl.deactivatetemplate);
app.post("/getcustomroles", sessionAuth, emailcntrl.getcustomroles);

module.exports = app;
