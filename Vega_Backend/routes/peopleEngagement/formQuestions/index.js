const formQuestionCtrl = require("./controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post(
  "/engagementQuestionType",
  sessionAuth,
  formQuestionCtrl.getEngagementQuestionTypeMaster,
);
  
app.post(
  '/createEngagementQuestions',
  sessionAuth,
  formQuestionCtrl.createEngagementQuestions
);
  
app.post(
  '/getEngagementQuestions',
  sessionAuth,
  formQuestionCtrl.getEngagementQuestions
);

app.post(
  "/deactivateEngagementQuestions",
  sessionAuth,
  formQuestionCtrl.deactivateEngagementQuestions,
);

app.post(
  "/engagementFormFrequencyType",
  sessionAuth,
  formQuestionCtrl.getEngagementFormFrequencyType,
);

app.post(
  "/createEngagementForm",
  sessionAuth,
  formQuestionCtrl.createEngagementForm,
);

app.post(
  "/saveEngagementForm",
  sessionAuth,
  formQuestionCtrl.saveEngagementForm,
);

app.post(
  "/viewEngagementForm",
  sessionAuth,
  formQuestionCtrl.viewEngagementForm,
);

app.post(
  "/deactivateEngagementForm",
  sessionAuth,
  formQuestionCtrl.deactivateEngagementForm,
);

app.post(
  "/getSelectedEngagementQuestions",
  sessionAuth,
  formQuestionCtrl.getSelectedEngagementQuestions,
);

app.post(
  "/getEngagementQuestionDetails",
  sessionAuth,
  formQuestionCtrl.getEngagementQuestionDetails,
);

module.exports = app;
