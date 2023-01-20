'use strict'
let mastersCtrl = require("./masters.controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require('express');
const app = express.Router();

app.post('/get_dropdown_lists', sessionAuth, mastersCtrl.getDropdownLists);

module.exports = app;