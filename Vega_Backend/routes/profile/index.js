"use strict";
const profile = require("./controller");
const sessionAuth = require("../../services/sessionAuth");
const alumnisessionAuth = require("../../services/alumnisessionAuth");
const express = require("express");
const app = express.Router();

app.post("/getProfileData", sessionAuth, profile.getProfileData);
app.post("/putProfileData", alumnisessionAuth, profile.putProfileData); // Alumni can access this API
app.get("/getQuoteofDay", profile.getQuoteofDay);

module.exports = app;
