const userfeedbackCtrl = require("./controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post(
  "/learningfeedbackquestiontype",
  sessionAuth,
  userfeedbackCtrl.getFeedbackQuestionTypeMaster
);
app.post(
  "/addfeedbackquestions",
  sessionAuth,
  userfeedbackCtrl.addFeedbackQuestions
);
app.post(
  "/getfeedbackquestions",
  sessionAuth,
  userfeedbackCtrl.getFeedbackQuestions
);
app.post(
  "/deactivatefeedbackquestions",
  sessionAuth,
  userfeedbackCtrl.deactivateFeedbackQuestions
);
app.post(
  "/savefeedbackresponse",
  sessionAuth,
  userfeedbackCtrl.saveFeedbackResponse
);
app.post(
  "/viewfeedbackresponse",
  sessionAuth,
  userfeedbackCtrl.viewFeedbackResponse
);
app.post("/savefeedbackform", sessionAuth, userfeedbackCtrl.saveFeedbackForm);
app.post("/viewfeedbackform", sessionAuth, userfeedbackCtrl.viewFeedbackForm);
app.post(
  "/deactivatefeedbackform",
  sessionAuth,
  userfeedbackCtrl.deactivateFeedbackForm
);
app.post(
  "/getselectedformquestions",
  sessionAuth,
  userfeedbackCtrl.getSelectedFormQuestions
);
app.post(
  "/getlearningquestiondetails",
  sessionAuth,
  userfeedbackCtrl.getLearningQuestionDetails
);
app.post(
  "/createFeedbackForm",
  sessionAuth,
  userfeedbackCtrl.createFeedbackForm
);
module.exports = app;
