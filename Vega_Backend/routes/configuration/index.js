"use strict";
const configCtrl = require("./configuration.controller");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/viewConfigMaster", sessionAuth, configCtrl.viewConfigMaster);
app.post("/saveConfigMaster", sessionAuth, configCtrl.saveConfigMaster);
app.post("/changeConfigStatus", sessionAuth, configCtrl.changeConfigStatus);
app.post("/addConfigMapping", sessionAuth, configCtrl.addConfigMapping);
app.post("/addnoticeperiod", sessionAuth, configCtrl.addnoticeperiod);
app.post("/viewnoticeconfig", sessionAuth, configCtrl.viewnoticeconfig);
app.post("/customrole", sessionAuth, configCtrl.customrole);
app.post("/viewcustomroleconfig", sessionAuth, configCtrl.viewcustomroleconfig);

module.exports = app;
