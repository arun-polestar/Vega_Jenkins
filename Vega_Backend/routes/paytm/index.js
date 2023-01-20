"use strict";
const paytmctrl = require("./Controller");
const sessionAuth = require("../../services/sessionAuth");
const alumnisessionAuth = require("../../services/alumnisessionAuth");
const express = require("express");
const app = express.Router();

app.post("/paytmmaster", sessionAuth, paytmctrl.paytmmaster);
app.post("/viewpaytmconfig", alumnisessionAuth, paytmctrl.viewpaytmconfig); // Alumni can access this API
app.post("/pastpayout", alumnisessionAuth, paytmctrl.pastpayout); // Alumni can access this API
app.post("/viewpaytmbalance", sessionAuth, paytmctrl.viewpaytmbalance);
app.post("/paytmkr", sessionAuth, paytmctrl.paytmkr);
app.post("/accountdetail", sessionAuth, paytmctrl.accountdetail);
app.post("/transactiontype", alumnisessionAuth, paytmctrl.transactiontype); // Alumni can access this API
app.post("/orderlist", sessionAuth, paytmctrl.orderlist);
app.post("/transactionall", sessionAuth, paytmctrl.transactionall);
app.post("/budgetmaster", sessionAuth, paytmctrl.budgetmaster);
app.post("/userbymapid", sessionAuth, paytmctrl.userbymapid);
app.post("/uploadpaytmbudget", sessionAuth, paytmctrl.uploadpaytmbudget);
app.post("/userbudgetvalidate", sessionAuth, paytmctrl.userbudgetvalidate);
app.post("/budgetdashboard", sessionAuth, paytmctrl.budgetdashboard);
app.post("/budgetoperation", sessionAuth, paytmctrl.budgetoperation);
app.post("/xyzdata", sessionAuth, paytmctrl.xyzdata);
module.exports = app;
