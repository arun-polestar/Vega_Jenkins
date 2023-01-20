'use strict'

let competencyCtrl = require("./productivity.controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require('express');
const app = express.Router();

app.post('/import-excel-competency', sessionAuth, competencyCtrl.importCompetencyExcel);
app.post('/get_competency', sessionAuth, competencyCtrl.getCompetencyDetails);
app.post('/getCompetencyRole', sessionAuth, competencyCtrl.getCompetencyRole);

module.exports = app;