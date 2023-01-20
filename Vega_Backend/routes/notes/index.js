"use strict";

const notes = require("./Controller");

const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/addnotes", sessionAuth, notes.addnotes);
app.post("/viewnotes", sessionAuth, notes.viewnotes);

module.exports = app;
