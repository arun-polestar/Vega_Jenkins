const utilitiesCtrl = require("./controller");
const sessionAuth = require("../../../services/sessionAuth");

const express = require("express");
const app = express.Router();

app.post(
  "/uploadstudymaterial",
  sessionAuth,
  utilitiesCtrl.uploadStudyMaterial
);
app.post("/getstudymaterial", sessionAuth, utilitiesCtrl.viewStudyMaterial);
app.post(
  "/deletestudymaterial",
  sessionAuth,
  utilitiesCtrl.deleteStudyMaterial
);
app.post(
  "/viewlearningcertificate",
  sessionAuth,
  utilitiesCtrl.viewLearningCertificate
);
app.post(
  "/taglearningcertificate",
  sessionAuth,
  utilitiesCtrl.tagLearningCertificate
);
app.post("/maketestlive", sessionAuth, utilitiesCtrl.makeTestLive);
app.post(
  "/launchbatchfeedback",
  sessionAuth,
  utilitiesCtrl.launchFeedbackForBatch
);
app.post("/launchbatchreward", sessionAuth, utilitiesCtrl.launchRewardForBatch);
app.post(
  "/gettraineeandrewarddetails",
  sessionAuth,
  utilitiesCtrl.getTraineeAndRewardDetails
);
app.post(
  "/getrewardsdata",
  sessionAuth,
  utilitiesCtrl.getRatingSlabandTestStatus
);
app.post("/tagfeedbackform", sessionAuth, utilitiesCtrl.tagFeedbackForm);

app.post(
  "/previewReward",
  sessionAuth,
  utilitiesCtrl.previewReward
);
module.exports = app;
