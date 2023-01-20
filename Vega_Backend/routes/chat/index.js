"use strict";
const chatctrl = require("./Controller");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/getChatHistory", sessionAuth, chatctrl.getChatHistory);

module.exports = app;
