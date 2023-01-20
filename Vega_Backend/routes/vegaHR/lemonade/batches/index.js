const batchesController = require("./Controller");
const sessionAuth = require("../../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/getBatches", sessionAuth, batchesController.getBatches);
app.post(
  "/changeBatchStatus",
  sessionAuth,
  batchesController.changeBatchStatus
);

module.exports = app;
