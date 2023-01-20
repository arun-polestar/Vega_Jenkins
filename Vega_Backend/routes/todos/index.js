const todosController = require("./Controller");
// var authCtrl = require('../handlers/authController');
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/todosoperations", sessionAuth, todosController.todosOperations);
app.post("/viewtodos", sessionAuth, todosController.viewTodos);
app.post(
  "/todoscategoryoperations",
  sessionAuth,
  todosController.todosCategoryOperations
);
app.post("/todoscategoryview", sessionAuth, todosController.todosCategoryView);

module.exports = app;
