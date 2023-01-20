"use strict";
const trip = require("./Controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/getTripData", sessionAuth, trip.getTripData);
app.post("/saveTripData", sessionAuth, trip.saveTripData);
app.post("/getUserByCLBWD", sessionAuth, trip.getUserByCLBWD);

module.exports = app;
