const studentDetailsController = require("./Controller");
// const sessionAuth = require("../../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/saveStudentDetails", studentDetailsController.saveStudentDetails);
app.post("/getBatcheMaster", studentDetailsController.getBatcheMaster);
app.get(
  "/getMatchingCandidatedata",
  studentDetailsController.getMatchingCandidatedata
);

app.get("/verifyForTimer", studentDetailsController.verifyForSectionWiseTimer);


module.exports = app;
