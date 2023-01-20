"use strict";
const expensemaster = require("./Controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/getMasterData", sessionAuth, expensemaster.getMasterData);
app.post("/saveExpenseMaster", sessionAuth, expensemaster.saveExpenseMaster);
app.post("/hqmvrBudgetAdd", sessionAuth, expensemaster.hqmvrBudgetAdd);
app.post("/hqmvrBudgetEdit", sessionAuth, expensemaster.hqmvrBudgetEdit);
app.post("/hqmvrBudgetView", sessionAuth, expensemaster.hqmvrBudgetView);

module.exports = app;
