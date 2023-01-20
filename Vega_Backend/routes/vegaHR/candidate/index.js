const candidateController = require("./Controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post(
  "/getlazycandidatedata",
  sessionAuth,
  candidateController.getLazyCandidateData
);
app.post(
  "/getlazycandidatedataQuery",
  sessionAuth,
  candidateController.getlazycandidatedataQuery
);
app.post(
  "/getinactivecandidate",
  sessionAuth,
  candidateController.getInactiveCandidate
);
app.post(
  "/editcandidaterecord",
  sessionAuth,
  candidateController.editCandidateRecord
);
app.post("/blockcandidate", sessionAuth, candidateController.blockCandidate);
app.post("/updateresume", sessionAuth, candidateController.updateResume);
app.post("/getCandidateZip", sessionAuth, candidateController.getCandidateZip);
app.post("/duplicate", sessionAuth, candidateController.duplicate);
app.post("/searchcandidate", sessionAuth, candidateController.searchcandidate);
app.post("/advancesearch", sessionAuth, candidateController.advanceSearch);

module.exports = app;
