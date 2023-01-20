"use strict";
const ctrl = require("./Controller");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/addeSignature", sessionAuth, ctrl.addeSignature);
// app.get('/geteSignature', sessionAuth, ctrl.geteSignature);
module.exports = app;
