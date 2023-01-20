const uploadController = require("./Controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/getparseddata", sessionAuth, uploadController.getParsedData);
app.post(
  "/deletetemporarycandidate",
  sessionAuth,
  uploadController.deleteTemporaryCandidate
);
app.post("/addcandidate", sessionAuth, uploadController.addCandidate);
app.post(
  "/edittemporaryrecord",
  sessionAuth,
  uploadController.editTemporaryRecord
);
app.post("/rmsUpload", sessionAuth, uploadController.rmsUpload);
app.post("/getfile", uploadController.getfile);
app.get("/getMedia/:id", uploadController.getMedia);
app.post("/rerunranking", sessionAuth, uploadController.rerunRanking);
app.post("/downloadFile", uploadController.downloadFile);
app.get("/getDuplicateCandidate", uploadController.getDuplicateCandidate);
app.post("/uploadCandidateExcel", uploadController.uploadCandidateExcel);

module.exports = app;
