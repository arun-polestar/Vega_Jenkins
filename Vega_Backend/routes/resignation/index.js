"use strict";
const resignation = require("./Controller");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.get("/reporteeList", sessionAuth, resignation.reporteeList);
app.post("/resignationApply", sessionAuth, resignation.resignationApply);
app.post("/resignationView", sessionAuth, resignation.resignationView);
app.post("/resignationApprove", sessionAuth, resignation.resignationApprove);
app.post("/selfviewresignation", sessionAuth, resignation.selfviewresignation);
app.post("/viewchecklist", sessionAuth, resignation.viewchecklist);
app.post("/viewchecklistitem", sessionAuth, resignation.viewchecklistitem);
app.post("/updatechecklistitem", sessionAuth, resignation.updatechecklistitem);
app.post("/getexitmaster", sessionAuth, resignation.getexitmaster);
app.post("/addexitmaster", sessionAuth, resignation.addexitmaster);
app.post("/activateexitmaster", sessionAuth, resignation.activateexitmaster);
app.post("/getreasonlist", sessionAuth, resignation.getreasonlist);
app.post("/viewexitquestion", sessionAuth, resignation.viewexitquestion);
app.post("/updatefinaldate", sessionAuth, resignation.updatefinaldate);
app.post("/closeresignation", sessionAuth, resignation.closeresignation);
app.post("/getusersbylocation", sessionAuth, resignation.getUsersbyLocation);
app.post("/getresignationlist", sessionAuth, resignation.getresignationlist);
app.post("/retractionapprove", sessionAuth, resignation.retractionapprove);
app.post("/exitreportview", sessionAuth, resignation.exitreportview);
app.post("/viewexitconfig", sessionAuth, resignation.viewexitconfig);
app.post("/exitreport", sessionAuth, resignation.exitreport);
app.post("/addchecklistmaster", sessionAuth, resignation.addchecklistmaster);
app.post("/exitreport", sessionAuth, resignation.exitreport);
app.post("/showchecklist", sessionAuth, resignation.showchecklist);
app.post("/retractresignation", sessionAuth, resignation.retractresignation);
app.post("/initiatechecklist", sessionAuth, resignation.initiatechecklist);
app.post("/exitupload", sessionAuth, resignation.exitupload);
app.post("/checklistbymapid", sessionAuth, resignation.checklistbymapid);
app.post("/updatechecklistform", sessionAuth, resignation.updatechecklistform);
app.post(
  "/initiatequestionflag",
  sessionAuth,
  resignation.initiateQuestionFlag
);

module.exports = app;
