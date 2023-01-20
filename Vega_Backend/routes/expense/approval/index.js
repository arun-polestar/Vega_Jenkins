"use strict";
const expenseApproval = require("./controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post(
  "/saveExpenseApprovalMaster",
  sessionAuth,
  expenseApproval.addExpenseApprovalMaster
);
app.post(
  "/editExpenseApprovalMaster",
  sessionAuth,
  expenseApproval.editExpenseApprovalMaster
);
app.post(
  "/getExpenseApprovalMaster",
  sessionAuth,
  expenseApproval.viewExpenseApprovalMaster
);
app.post(
  "/deactivateExpenseApprovalMaster",
  sessionAuth,
  expenseApproval.deactivateExpenseApprovalMaster
);

module.exports = app;
