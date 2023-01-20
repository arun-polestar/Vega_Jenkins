const expenseController = require("./Controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/raiseExpense", sessionAuth, expenseController.raiseExpense);
app.post("/getRaiseExpense", sessionAuth, expenseController.getRaiseExpense);
app.post("/getTripAsMaster", sessionAuth, expenseController.getTripAsMaster);
app.post("/approveExpense", sessionAuth, expenseController.approveExpense);
app.post("/getLimitsExp", sessionAuth, expenseController.getLimitsExp);
app.post("/getHQMVRData", sessionAuth, expenseController.getHQMVRData);
app.post("/getExpenseDetail", sessionAuth, expenseController.getExpenseDetail);
app.post(
  "/editAndResubmitExpense",
  sessionAuth,
  expenseController.editAndResubmitExpense
);
app.post("/markExpensePaid", sessionAuth, expenseController.markExpensePaid);



module.exports = app;
