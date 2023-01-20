"use strict";
const payrollctrl = require("./Controller");
const sessionAuth = require("../../services/sessionAuth");
const alumnisessionAuth = require("../../services/alumnisessionAuth");
const express = require("express");
const app = express.Router();

app.post("/addpayrollaction", sessionAuth, payrollctrl.addpayrollaction);
app.post("/viewpayrollaction", sessionAuth, payrollctrl.viewpayrollaction);
app.post("/viewwallet", sessionAuth, payrollctrl.viewwallet);
app.post("/userwallet", alumnisessionAuth, payrollctrl.userwallet); // Alumni can access this api
app.post("/payoutdetails", sessionAuth, payrollctrl.payoutdetails);
app.post("/uploadwalletamount", sessionAuth, payrollctrl.uploadwalletamount);

module.exports = app;
