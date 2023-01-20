const inductionCtrl = require("./Controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/saveOnBoardCandidateInfo", inductionCtrl.saveOnBoardCandidateInfo);
app.post("/saveOnBoardCandidateDocs", inductionCtrl.saveOnBoardCandidateDocs);
app.post("/getCandidateDoc", sessionAuth, inductionCtrl.getCandidateDoc);
app.post("/getMultipleMastersExt", inductionCtrl.getMultipleMastersExt);
app.post("/candidatefeedbackadd", inductionCtrl.candidateFeedbackAdd);
app.post("/hrfeedbackadd", sessionAuth, inductionCtrl.HRFeedbackAdd);
app.post(
  "/candidatefeedbackview",
  sessionAuth,
  inductionCtrl.candidateFeedbackView
);
app.post("/addmoredoc", sessionAuth, inductionCtrl.addmoredoc);

module.exports = app;
