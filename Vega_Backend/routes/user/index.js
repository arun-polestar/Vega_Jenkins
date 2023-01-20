"use strict";
const userCtrl = require("./user.controller");
const validatorService = require("./user.validator");
const sessionAuth = require("../../services/sessionAuth");
const alumnisessionAuth = require("../../services/alumnisessionAuth");

const express = require("express");
const app = express.Router();

// module.exports = function (app) {
app.post("/getUserList", sessionAuth, userCtrl.getUserList);
app.post(
  "/createUser",
  sessionAuth,
  validatorService.validate("createUser"),
  userCtrl.createUser
);
app.post("/getUserInfo", sessionAuth, userCtrl.getUserInfo);
app.post("/getUserModules", sessionAuth, userCtrl.getUserModules);
app.post("/validateEmailEcode", sessionAuth, userCtrl.validateEmailEcode);
app.post("/validate", userCtrl.validateToken);
app.post("/resetPassword", userCtrl.resetPassword);
app.post("/changeUserStatus", sessionAuth, userCtrl.changeUserStatus);
app.post("/getAllModule", sessionAuth, userCtrl.getAllModule);
app.post("/createMultipleUsers", userCtrl.createMultipleUsers);
app.post("/updateProfile", sessionAuth, userCtrl.updateProfile);
app.post("/updateProfileOnMobile", sessionAuth, userCtrl.updateProfileOnMobile);
app.post("/getlogo", userCtrl.getlogo);
app.post("/licenseuserlist", sessionAuth, userCtrl.licenseUserList);
app.post(
  "/createempasuser",
  sessionAuth,
  userCtrl.checkModuleLicense,
  userCtrl.createEmpAsUser
);
app.post(
  "/editusermodule",
  sessionAuth,
  userCtrl.checkModuleLicense,
  userCtrl.editUserModule
);
app.post("/getusershift", sessionAuth, userCtrl.getUserShift);
app.post("/changeLicenseStatus", sessionAuth, userCtrl.changeLicenseStatus);
app.post("/removeprofile", sessionAuth, userCtrl.removeprofile);
app.post("/getrecentjoineduser", sessionAuth, userCtrl.getRecentJoinedUser);
app.post("/edituserflag", sessionAuth, userCtrl.editUserFlag);
app.post("/uploaduserrolesexcel", sessionAuth, userCtrl.uploadUserRolesExcel);
app.post("/resetPasswordLogin", alumnisessionAuth, userCtrl.resetPasswordLogin);
app.post("/deactivateuser", sessionAuth, userCtrl.deactivateuser);
app.post("/getGoogleKey", sessionAuth, userCtrl.getGoogleKey);
app.post("/getfydates", sessionAuth, userCtrl.getFyDates);
app.post("/upload_resume", sessionAuth, userCtrl.uploadResumeOnVegaProfile);

module.exports = app;

// app.post('/changedefaultmodule', sessionAuth, userCtrl.changedefaultmodule)

// }
