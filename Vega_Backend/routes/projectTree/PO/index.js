const poCtrl = require("./po.controller");

const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/createpo", sessionAuth, poCtrl.addPo);

module.exports = app;
