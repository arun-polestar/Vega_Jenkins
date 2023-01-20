"use strict";
const Ctrl = require("./Controller");
const c2cCtrl = require("./c2c.Controller");
const alumnisessionAuth = require("../../services/alumnisessionAuth");

const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/couponbalance", Ctrl.couponbalance);
app.post("/voucherlist", alumnisessionAuth, Ctrl.voucherlist); // Alumni can access this api
app.post("/fileterlist", alumnisessionAuth, Ctrl.fileterlist); // Alumni can access this api
app.post("/placedorder", alumnisessionAuth, Ctrl.placedorder); // Alumni can access this api
app.post("/redeemcoupon", alumnisessionAuth, Ctrl.redeemcoupon); // Alumni can access this api
app.post("/passcodeset", alumnisessionAuth, Ctrl.passcodeset); // Alumni can access this api
app.post("/viewcouponcode", alumnisessionAuth, Ctrl.viewcouponcode); // Alumni can access this api
app.post("/useCoupon", alumnisessionAuth, Ctrl.useCoupon); // Alumni can access this api
app.get("/viewRedeemLimit", alumnisessionAuth, Ctrl.viewRedeemLimit); // Alumni can access this api

// app.post("/orderdetails", sessionAuth, Ctrl.orderdetails);
app.post("/viewBalance", sessionAuth, Ctrl.viewBalance);

app.post("/c2cvoucherlist", c2cCtrl.voucherlist);
app.post("/c2cfileterlist", c2cCtrl.fileterlist);
app.post("/c2cplacedorder", c2cCtrl.placedorder);

module.exports = app;
