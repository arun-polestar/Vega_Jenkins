"use strict";
const ctrl = require("./Controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/_getbudget", sessionAuth, ctrl._getbudget);
app.post("/_addbudget", sessionAuth, ctrl._addbudget);
app.post("/_editbudget", sessionAuth, ctrl._editbudget);
app.post("/_usersbulkedit", sessionAuth, ctrl._usersbulkedit);

module.exports = app;
