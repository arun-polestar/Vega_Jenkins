const api = require("./Controller");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/urlconfig", sessionAuth, api.urlconfig);
module.exports = app;
