"use strict";
const commonCtrl = require("./Controller");
const sessionAuth = require("../../services/sessionAuth");
const alumnisessionAuth = require("../../services/alumnisessionAuth");
const express = require("express");
const app = express.Router();

app.post(
  "/getMultipleMasters",
  alumnisessionAuth,
  commonCtrl.getMultipleMasters
); // Alumni can access this API
app.post("/getMastersList", sessionAuth, commonCtrl.getMastersList);
app.post("/viewMaster", sessionAuth, commonCtrl.viewMaster);
app.post("/getUserTypeahead", sessionAuth, commonCtrl.getUserTypeahead);
app.post("/saveMaster", sessionAuth, commonCtrl.saveMaster);
app.post("/getLemonadeMaster", commonCtrl.getLemonadeMaster);
app.post("/getcountrystatelist", sessionAuth, commonCtrl.getCountryStateList);

app.post("/viewHrMaster", sessionAuth, commonCtrl.viewHrMaster);
app.post("/saveHrMaster", sessionAuth, commonCtrl.saveHrMaster);

app.post("/getExpenseMaster", sessionAuth, commonCtrl.getExpenseMaster);
app.post("/configusers", sessionAuth, commonCtrl.configusers);

app.post("/cascadeView", sessionAuth, commonCtrl.cascadeView);
app.post("/cascadeMaster", sessionAuth, commonCtrl.cascadeMaster);
app.post("/cascadeOperation", sessionAuth, commonCtrl.cascadeOperation);

app.post("/savermsmaster", sessionAuth, commonCtrl.saveRMSMaster);
app.post("/viewrmsmaster", sessionAuth, commonCtrl.viewRMSMaster);
app.post("/hrmconfig", sessionAuth, commonCtrl.hrmConfigMaster);

app.post("/viewEmailLogs", sessionAuth, commonCtrl.viewEmailLogs);
app.post("/clearEmailLogsByUser", sessionAuth, commonCtrl.clearEmailLogsByUser);
app.post("/modulesession", sessionAuth, commonCtrl.modulesession);

module.exports = app;
