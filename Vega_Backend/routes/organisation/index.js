"use strict";

var organisationCtrl = require("./Controller");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post(
  "/organisationconfig",
  sessionAuth,
  organisationCtrl.organisationconfig
);

app.post(
  "/getPMRM",
  sessionAuth,
  organisationCtrl.getpmrm
);
module.exports = app;
