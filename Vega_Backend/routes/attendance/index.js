"use strict";
const adtCtrl = require("./Controller");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/attendanceview", sessionAuth, adtCtrl.attendanceview);
app.post("/attendanceteam", sessionAuth, adtCtrl.attendanceteam);
app.post("/viewattendance", sessionAuth, adtCtrl.viewattendance);
app.get("/getDailyAttendance", adtCtrl.getDailyAttendance);
app.post("/getMissedAttendance", adtCtrl.getMissedAttendance);
app.post(
  "/getLocationByCoordinates",
  sessionAuth,
  adtCtrl.getLocationByCoordinates
);
app.post(
  "/getCurrentWeekAttendance",
  sessionAuth,
  adtCtrl.getCurrentWeekAttendance
);

app.post(
  "/getDistanceBetweenTwoCoordinates",
  sessionAuth,
  adtCtrl.getDistanceBetweenTwoCoordinates
);

app.post(
  "/getLastThirtyDaysLeaveDetails",
  sessionAuth,
  adtCtrl.getLastThirtyDaysLeaveDetails
);

app.post('/validateQrCode', sessionAuth, adtCtrl.validateQrCode)

app.post('/checkoutDetails', sessionAuth, adtCtrl.checkoutDetails)

module.exports = app;
