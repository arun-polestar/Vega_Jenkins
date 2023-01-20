"use strict";
const sessionAuth = require("../../../services/sessionAuth");
var driveMaster = require("./Controller");
const express = require("express");
const app = express.Router();

app.post("/drivemaster", sessionAuth, driveMaster.drivemaster);
app.post("/drivebytype", sessionAuth, driveMaster.drivebytype);

module.exports = app;
