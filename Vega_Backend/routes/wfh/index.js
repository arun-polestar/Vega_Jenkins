const wfhCtrl = require("./wfh.controller");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/addwfhmaster", sessionAuth, wfhCtrl.addWFHMaster);
app.post("/viewWFHMaster", sessionAuth, wfhCtrl.viewWFHMaster);
app.post("/applywfhrequest", sessionAuth, wfhCtrl.applyWFHRequest);
app.post("/viewwfhrequest", sessionAuth, wfhCtrl.viewWFHRequest);
app.post("/getwfhdays", sessionAuth, wfhCtrl.calculateWFHDays);
app.post("/getworktype", sessionAuth, wfhCtrl.getWorkType);
app.post("/approvewfhrequest", sessionAuth, wfhCtrl.approveWFHRequest);
app.post("/getwfhhistory", sessionAuth, wfhCtrl.getWFHHistory);
app.post("/upcomingwfh", sessionAuth, wfhCtrl.upcomingWFH);
app.post("/pendingwfhcounts", sessionAuth, wfhCtrl.getPendingApprovalCounts);
app.post("/workPlaceDetails", wfhCtrl.workPlaceDetails);

module.exports = app;
