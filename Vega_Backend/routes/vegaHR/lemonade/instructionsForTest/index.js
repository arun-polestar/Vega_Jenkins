const InstructionsController = require("./Controller");
// const sessionAuth = require("../../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/getBatchInstructions", InstructionsController.getBatchInstructions);

module.exports = app;
