const projectCtrl = require("./project.controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/createproject", sessionAuth, projectCtrl.addProject);
app.post("/getexistingproject", sessionAuth, projectCtrl.getExistingProject);
app.post("/addbooklevel", sessionAuth, projectCtrl.addbooklevel);
app.post("/getmoduleuser", sessionAuth, projectCtrl.getmoduleuser);
app.post("/projectreport", sessionAuth, projectCtrl.projectreport);
app.post("/selfassignwbs", sessionAuth, projectCtrl.selfassignwbs);
app.post("/projectview", sessionAuth, projectCtrl.projectview);

module.exports = app;
