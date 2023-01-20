const shiftCtrl = require("./shift.controller");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/shiftoperation", sessionAuth, shiftCtrl.shiftOperation);
app.post("/shiftview", sessionAuth, shiftCtrl.shiftView);
app.post("/deactivateshift", sessionAuth, shiftCtrl.deactivateShift);
app.post("/getalternateshift", sessionAuth, shiftCtrl.getAlternateShift);

module.exports = app;
