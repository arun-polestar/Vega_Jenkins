"use strict";
const adminCtrl = require("./admin.controller");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();
const Uploads = require("../common/Uploads");

app.post(
  "/saveDataAdmin",
  sessionAuth,
  new Uploads("admin").multipleFile,
  adminCtrl.saveDataAdmin
);
app.post(
  "/uploadExpandedLogo",
  sessionAuth,
  new Uploads("admin").multipleFile,
  adminCtrl.uploadExpandedLogo
);
app.post(
  "/getModulewiseUserCounts",
  sessionAuth,
  adminCtrl.modulewiseUserCounts
);
app.post("/getModulewiseUsers", sessionAuth, adminCtrl.modulewiseUsers);
app.post("/getEmployeeLoginLogs", sessionAuth, adminCtrl.getEmployeeLoginLogs);
app.post(
  "/getEmployeeLicenseCounts",
  sessionAuth,
  adminCtrl.getEmployeeLicenseCounts
);
app.post(
  "/getEmployeeLicenseData",
  sessionAuth,
  adminCtrl.getEmployeeLicenseData
);

app.post("/moduleLicenseUpdate", adminCtrl.moduleLicenseUpdate);
app.post(
  "/updateCredential",
  sessionAuth,
  new Uploads("admin").singleFile,
  adminCtrl.updateCredential
);

module.exports = app;
