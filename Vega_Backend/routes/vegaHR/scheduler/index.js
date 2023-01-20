const schedulerCtrl = require("./scheduler.controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post(
  "/getSchedulerData",
  sessionAuth,
  schedulerCtrl.getSchedulerData,
  schedulerCtrl.finalSchedulerData
);
app.post("/saveSchedulerData", sessionAuth, schedulerCtrl.saveSchedulerData);
app.post(
  "/changeSchedulerStatus",
  sessionAuth,
  schedulerCtrl.changeSchedulerStatus
);
app.post("/getVerificationUrl", sessionAuth, schedulerCtrl.getVerificationUrl);
app.get("/generateToken", schedulerCtrl.generateToken);

module.exports = app;
