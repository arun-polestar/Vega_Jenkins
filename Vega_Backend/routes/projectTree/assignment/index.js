const assignmentCtrl = require("./assignment.controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post('/addWBSResource', sessionAuth, assignmentCtrl.addWBSResource)
app.post('/getAllWbsResource', sessionAuth, assignmentCtrl.getAllWbsResource)
app.post('/getClientProjectMapping', sessionAuth, assignmentCtrl.getClientProjectMapping)




module.exports = app;
