"use strict";
const pms = require("./Controller");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/pmsmasteroperation", sessionAuth, pms.pmsmasteroperation);
app.post("/pmsmasteradd", sessionAuth, pms.pmsmasteradd);
app.post("/dropdown", sessionAuth, pms.dropdown);
app.post("/addlevelweightage", sessionAuth, pms.addlevelweightage);
app.post("/objectivemap", sessionAuth, pms.objectivemap);
app.post("/pmsopertion", sessionAuth, pms.pmsopertion);
app.post("/addrating", sessionAuth, pms.addrating);
app.post("/selfperformanceperiod", sessionAuth, pms.selfperformanceperiod);
app.post(
  "/additionalsupervisorlist",
  sessionAuth,
  pms.additionalsupervisorlist
);
app.post("/pmsmasterdata", sessionAuth, pms.pmsmasterdata);
app.post("/addempobj", sessionAuth, pms.addempobj);
app.post("/uploadRating", sessionAuth, pms.uploadRating);
// app.post('/addobjcomment',sessionAuth,pms.addobjcomment);
app.post("/pmsadreportview", sessionAuth, pms.pmsAdhocReport);
app.post("/pmsgridmap", sessionAuth, pms.pmsgridmap);
app.post("/addgridrating", sessionAuth, pms.addgridrating);
app.post("/ratingdata", sessionAuth, pms.ratingdata);
app.post("/griddata", sessionAuth, pms.griddata);
app.post("/uploadQuestionRating", sessionAuth, pms.uploadQuestionRating);

module.exports = app;
