"use strict";
const screening = require("./Controller");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/readOnilneScreening", screening.readOnilneScreening);
app.post("/validateotp", screening.validateotp);
app.post("/updatescreeningrating", screening.updatescreeningrating);

module.exports = app;
