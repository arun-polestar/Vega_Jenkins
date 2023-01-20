const dashboard = require("./dashboard.controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/getrmsdashboardinfo", sessionAuth, dashboard.getRmsDashboardInfo);
app.post("/getdashboardcount", sessionAuth, dashboard.getDashboardCount);
app.post("/getdashboarddataemp", sessionAuth, dashboard.getDashboardDataemp);
app.post("/getRMSDashboardData", sessionAuth, dashboard.getRMSDashboardData);
app.post("/getRMSDashboardRequisition", sessionAuth, dashboard.getRMSDashboardRequisition);





module.exports = app;
