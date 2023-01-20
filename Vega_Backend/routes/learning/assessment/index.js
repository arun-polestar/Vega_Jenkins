const assessmentCtrl = require("./controller");
const sessionAuth = require("../../../services/sessionAuth");

const express = require("express");
const app = express.Router();

app.post("/getallquestion", sessionAuth, assessmentCtrl.getAllQuestions);
app.post(
  "/deactivateQuestions",
  sessionAuth,
  assessmentCtrl.deactivateQuestions
);
app.post("/markcomplete", sessionAuth, assessmentCtrl.markcomplete);
app.post("/submitTest", sessionAuth, assessmentCtrl.submitTest);
app.post("/uploadQuestions", sessionAuth, assessmentCtrl.uploadQuestions);
app.post(
  "/savelearningquestion",
  sessionAuth,
  assessmentCtrl.savelearningQuestion
);
app.post("/getassessment", sessionAuth, assessmentCtrl.getassessment);
app.post(
  "/updateTopicQuestionStatus",
  sessionAuth,
  assessmentCtrl.updateTopicQuestionStatus
);
app.post(
  "/verifyTestStatus",
  sessionAuth,
  assessmentCtrl.verifyTestStatus
);
app.post(
  "/viewTestHistory",
  sessionAuth,
  assessmentCtrl.viewTestHistory
);

module.exports = app;
