"use strict";
const ctrl = require("./Controller");
const auth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/getExpenseReportData", auth, ctrl.getExpenseReportData);

module.exports = app;