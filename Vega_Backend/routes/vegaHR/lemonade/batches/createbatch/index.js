const batchesController = require("./Controller");
const sessionAuth = require("../../../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/saveBatchData", sessionAuth, batchesController.saveBatchData);

module.exports = app;
