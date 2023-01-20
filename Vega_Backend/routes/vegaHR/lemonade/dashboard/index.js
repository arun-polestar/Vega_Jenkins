const dashboardController = require("./Controller");
const schedulingController = require("../../scheduling/Controller");
const sessionAuth = require("../../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post(
  "/getDashboardData",
  sessionAuth,
  dashboardController.getDashboardData
);
app.post(
  "/updateprocess",
  sessionAuth,
  dashboardController.updateprocess,
  schedulingController.scheduleInterview
);
app.post(
  "/getAnswerdetails",
  sessionAuth,
  dashboardController.getAnswerdetails
);
app.post(
  "/getResponseSheetLateral",
  sessionAuth,
  dashboardController.getResponseSheetLateral
);
app.post(
  "/sectionWiseScoreDashboard",
  sessionAuth,
  dashboardController.sectionWiseScoreDashboard
);

module.exports = app;
