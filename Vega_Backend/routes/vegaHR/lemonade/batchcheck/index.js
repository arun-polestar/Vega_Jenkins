const batchCheckController = require("./Controller");
// const sessionAuth = require("../../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/validateCandidate", batchCheckController.validateCandidate);

module.exports = app;
