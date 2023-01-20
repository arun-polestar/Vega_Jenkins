const wbsCtrl = require("./wbs.controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/createwbs", sessionAuth, wbsCtrl.addWbs);
app.post("/viewwbslist", sessionAuth, wbsCtrl.viewwbslist);
app.post("/getWBSResourceMapping", sessionAuth, wbsCtrl.getWBSResourceMapping);
app.post("/getWBSResourceWise", sessionAuth, wbsCtrl.getWBSResourceWise);





module.exports = app;
