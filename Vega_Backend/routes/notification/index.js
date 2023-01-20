"use strict";
const notify = require("./Controller");
const sessionAuth = require("../../services/sessionAuth");
const alumnisessionAuth = require("../../services/alumnisessionAuth");

const express = require("express");
const app = express.Router();

app.post("/getNotificationData", sessionAuth, notify.getNotificationData);
app.post("/clearNotification", sessionAuth, notify.clearNotification);
// app.post('/getUserLoginTimes',sessionAuth,notify.getUserLoginTimes);
app.post("/clearlogin", alumnisessionAuth, notify.clearlogin);
app.post(
  "/getVendorNotificationData",
  sessionAuth,
  notify.getVendorNotificationData
);
app.post(
  "/clearVendorNotification",
  sessionAuth,
  notify.clearVendorNotification
);
app.post(
  "/joiningReminderNotification",
  sessionAuth,
  notify.joiningReminderNotification
);
app.post(
  "/interviewReminderNotification",
  sessionAuth,
  notify.interviewReminderNotification
);
app.post(
  "/sendNotificationToMobileDevices",
  sessionAuth,
  notify.sendNotificationToMobileDevices
);

app.post(
  "/read_notification",
  sessionAuth,
  notify.readNotification
);



module.exports = app;
