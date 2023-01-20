"use strict";
const sessionAuth = require("../../../../services/sessionAuth");
var master = require("./Controller");
const express = require("express");
const app = express.Router();

app.post("/uploadQuestion", sessionAuth, master.uploadQuestion);
app.post("/getQuescount", master.getQuescount);
app.post("/getQuesionMaster", sessionAuth, master.getQuestionMaster);
app.post("/saveQuestionData", sessionAuth, master.saveQuestionData);
app.post("/getMastersForTest", sessionAuth, master.getMastersForTest);
app.post("/changeQuestionStatus", sessionAuth, master.changeQuestionStatus);
app.post("/changeStatus", sessionAuth, master.changeStatus);
// app.post('/questions',sessionAuth,master.questions);

module.exports = app;
