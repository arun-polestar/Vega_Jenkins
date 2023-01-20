const commonCtrl = require("./Controller");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/syncdb", sessionAuth, commonCtrl.syncdb);
app.post("/authorize", commonCtrl.Authorize);

module.exports = app;
