"use strict";
const sessionAuth = require("../../../../services/sessionAuth");
var testController = require("./Controller");
const express = require("express");
const app = express.Router();

app.post("/questionsForTest", testController.questionsForTest);
app.post("/answercapture", testController.answercapture);
//app.post('/videoquestion', testController.videoquestion);
app.post("/answerCaptureLateral", testController.answerCaptureLateral);

module.exports = app;
