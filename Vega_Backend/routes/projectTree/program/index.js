const programCtrl = require("./program.controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/createprogram", sessionAuth, programCtrl.addProgram);
app.post("/viewprogram", sessionAuth, programCtrl.viewprogram);

module.exports = app;
