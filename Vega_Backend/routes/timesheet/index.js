const timesheetCtrl = require("./timesheet.controller");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/timesheetinfo", sessionAuth, timesheetCtrl.timesheetInfo);
app.post("/updatetimesheet", sessionAuth, timesheetCtrl.updateTimesheet);
app.post(
  "/updatetimesheetstatus",
  sessionAuth,
  timesheetCtrl.updateTimesheetStatus
);
app.post("/timesheetusers", sessionAuth, timesheetCtrl.timesheetUsers);
app.post("/uploadedattendance", sessionAuth, timesheetCtrl.uploadedAttendance);
app.post("/fetchleavereport", sessionAuth, timesheetCtrl.fetchLeaveReport);
app.post(
  "/addtimesheetassignment",
  sessionAuth,
  timesheetCtrl.addTimesheetAssignment
);
app.post(
  "/timesheetconfigoperations",
  sessionAuth,
  timesheetCtrl.timesheetConfigOperations
);
app.post(
  "/timesheetconfigview",
  sessionAuth,
  timesheetCtrl.timesheetConfigView
);
app.post(
  "/timesheetreportview",
  sessionAuth,
  timesheetCtrl.timesheetAdhocReport
);
app.post("/timesheetDashboard", sessionAuth, timesheetCtrl.timesheetDashboard);
app.post("/timesheetreport", sessionAuth, timesheetCtrl.timeSheetReport);
app.post("/timesheetmaster", sessionAuth, timesheetCtrl.timesheetmaster);
app.post(
  "/edittimesheetmaster",
  sessionAuth,
  timesheetCtrl.edittimesheetmaster
);
app.post("/punchoperations", sessionAuth, timesheetCtrl.punchOperations);
app.post("/timesheetdump", sessionAuth, timesheetCtrl.timesheetdump);
app.post(
  "/customTimesheetReport",
  sessionAuth,
  timesheetCtrl.customTimesheetReport
);
app.post("/unlockTimesheet", sessionAuth, timesheetCtrl.unlockTimesheet);
app.post(
  "/timesheetLockedUsers",
  sessionAuth,
  timesheetCtrl.timesheetLockedUsers
);
app.post(
  "/sendTimesheetReminder",
  sessionAuth,
  timesheetCtrl.sendTimesheetReminder
);


module.exports = app;
