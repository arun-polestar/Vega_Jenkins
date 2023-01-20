const batchCtrl = require("./controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/createbatch", sessionAuth, batchCtrl.createBatch);
app.post("/viewbatch", sessionAuth, batchCtrl.viewBatch);
app.post("/addparticipants", sessionAuth, batchCtrl.addParticipants);
app.post("/viewbatchtopic", sessionAuth, batchCtrl.viewBatchTopic);
app.post("/viewBatchDetails", sessionAuth, batchCtrl.viewBatchDetails);
app.post("/myBatchStatus", sessionAuth, batchCtrl.myBatchStatus);
app.post("/viewParticipants", sessionAuth, batchCtrl.viewParticipants);
app.post("/publishBatch", sessionAuth, batchCtrl.publishBatch);
app.post(
  "/addLearningCertificateSignature",
  sessionAuth,
  batchCtrl.addLearningCertificateSignature
);
app.post(
  "/viewLearningCertificateSignature",
  sessionAuth,
  batchCtrl.viewLearningCertificateSignature
);

module.exports = app;
