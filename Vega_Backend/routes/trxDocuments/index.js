"use strict";
const ctrl = require("./Controller");
const sessionAuth = require("../../services/sessionAuth");
const utils = require("../common/utils");
const express = require("express");
const app = express.Router();

app.post("/addtrxDocuments", sessionAuth, ctrl.addtrxDocuments);
app.post("/gettrxDocuments", sessionAuth, ctrl.gettrxDocuments);
app.post("/getZip", sessionAuth, utils.downloadzip);

module.exports = app;
