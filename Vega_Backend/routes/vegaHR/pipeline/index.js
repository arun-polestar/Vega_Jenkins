const pipelineCtrl = require("./Controller");
const sessionAuth = require("../../../services/sessionAuth");
const validatorService = require("./validator");
const express = require("express");
const app = express.Router();

app.post(
  "/getCandidateOnBoardForBGV",
  sessionAuth,
  validatorService.validate("getCandidateOnBoardForBGV"),
  pipelineCtrl.getCandidateOnBoardForBGV
);
app.post(
  "/filterOnboardDataData",
  sessionAuth,
  validatorService.validate("filterOnboardDataData"),
  pipelineCtrl.filterOnboardDataData
);
app.post(
  "/updatejoiningdate",
  sessionAuth,
  validatorService.validate("updateJoiningDate"),
  pipelineCtrl.updateJoiningDate
);
app.post(
  "/fetchOfferLetter",
  sessionAuth,
  validatorService.validate("fetchOfferLetter"),
  pipelineCtrl.fetchOfferLetter
);
app.post(
  "/sendlinktocandidate",
  sessionAuth,
  validatorService.validate("sendLinkToCandidate"),
  pipelineCtrl.sendLinkToCandidate
);
app.post(
  "/filterOnboardMassFilterdData",
  sessionAuth,
  pipelineCtrl.filterOnboardMassFilterdData
);
app.post("/getreschedulelist", sessionAuth, pipelineCtrl.getreschedulelist);
app.post("/rescheduleInterview", sessionAuth, pipelineCtrl.rescheduleInterview);
app.post(
  "/resendlinktoCandidate",
  sessionAuth,
  pipelineCtrl.resendLinkToCandidate
);
// app.post('/offerletterpreview',sessionAuth,pipelineCtrl.offerLetterPreview);

app.post(
  "/updateStatusOfSelectedData",
  sessionAuth,
  pipelineCtrl.updateStatusOfSelectedData
);

//For test
app.post(
  "/filterOnboardDataData1",
  sessionAuth,
  pipelineCtrl.filterOnboardDataData1
);

// app.post('/sendOfferLetter',sessionAuth,pipelineCtrl.sendOfferLetter);
app.post("/sendFiles", sessionAuth, pipelineCtrl.sendFiles);
app.post(
  "/massupdatejoiningdate",
  sessionAuth,
  pipelineCtrl.massUpdateJoiningDate
);

module.exports = app;
