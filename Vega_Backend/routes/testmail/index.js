"use strict";

var mail = require("./Controller");

const express = require("express");
const app = express.Router();

app.post("/mail", mail.mail);
module.exports = app;
