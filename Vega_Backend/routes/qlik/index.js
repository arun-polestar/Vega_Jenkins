"use strict";
const qlik = require("./qlikticket");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/qlikAuth", sessionAuth, qlik.qlikauth);

module.exports = app;
