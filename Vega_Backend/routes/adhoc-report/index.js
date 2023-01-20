"use strict";
const adhocCtrl = require("./adhoc-report.controller");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/getAdhocReport", sessionAuth, adhocCtrl.getAdhocReport);
app.post("/expenseadreportview", sessionAuth, adhocCtrl.expenseAdhocReport);
app.post("/moodscorereport", sessionAuth, adhocCtrl.moodScoreReport);
app.post("/readreactioncomment", sessionAuth, adhocCtrl.readReactionComment);
app.post(
  "/getmoodpercentagemaster",
  sessionAuth,
  adhocCtrl.getMoodPercentagemaster
);
app.post("/getBasicReport", sessionAuth, adhocCtrl.getBasicReport);
app.post(
  "/getOpeningLeaveBalance",
  sessionAuth,
  adhocCtrl.getOpeningLeaveBalance
);
app.post("/getMonthlyWP", sessionAuth, adhocCtrl.getMonthlyWP);

module.exports = app;
