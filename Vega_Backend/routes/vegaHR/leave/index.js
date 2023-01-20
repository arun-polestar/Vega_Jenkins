const leaveCtrl = require("./leave.controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/leaveconfig", sessionAuth, leaveCtrl.leaveConfig);
app.post("/applyleave", sessionAuth, leaveCtrl.applyLeave);
app.post("/forwardleave", sessionAuth, leaveCtrl.forwardleave);
app.post("/leaveaction", sessionAuth, leaveCtrl.leaveAction);
app.post("/viewmodulereport", sessionAuth, leaveCtrl.viewleavereport);
app.post(
  "/changeleavetypestatus",
  sessionAuth,
  leaveCtrl.changeLeaveTypeStatus
);
app.post(
  "/changeleaveconfigstatus",
  sessionAuth,
  leaveCtrl.changeLeaveConfigStatus
);
app.post(
  "/leaveconfigoperations",
  sessionAuth,
  leaveCtrl.leaveConfigOperations
);
app.post("/viewleaveconfig", sessionAuth, leaveCtrl.viewLeaveConfig);
app.post("/leaveAppliedDetail", sessionAuth, leaveCtrl.leaveAppliedDetail);
app.post("/leaveReports", sessionAuth, leaveCtrl.leaveReports);
app.post("/saveAdditionalLeave", sessionAuth, leaveCtrl.saveAdditionalLeave);
app.post("/viewAdditionalLeave", sessionAuth, leaveCtrl.viewAdditionalLeave);
app.post("/requestCompoff", sessionAuth, leaveCtrl.requestCompoff);
app.post("/approveCompoff", sessionAuth, leaveCtrl.approveCompoff);
app.post("/viewCompoff", sessionAuth, leaveCtrl.viewCompoff);
app.post("/uploadleavebalance", sessionAuth, leaveCtrl.uploadleavebalance);
app.post("/leavetakenReport", sessionAuth, leaveCtrl.leavetakenReport);
app.post("/leaveDashboard", sessionAuth, leaveCtrl.leaveDashboard);
app.post("/upcomingLeaves", sessionAuth, leaveCtrl.upcomingLeaves);
app.post("/getMonthlyLeave", leaveCtrl.getMonthlyLeave);
app.post("/leaveHomeCounts", sessionAuth, leaveCtrl.leaveHomeCounts);
app.post("/leaveDashboardCard", sessionAuth, leaveCtrl.leaveDashboardCard);
app.post("/leaveReconcileReport", sessionAuth, leaveCtrl.leaveReconcileReport);
app.post(
  "/leaveTransactionReport",
  sessionAuth,
  leaveCtrl.leaveTransactionReport
);

module.exports = app;
