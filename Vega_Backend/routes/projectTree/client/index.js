const clientCtrl = require("./client.controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/createclient", sessionAuth, clientCtrl.addClient);
app.post("/getclientcontacts", sessionAuth, clientCtrl.getClientContacts);
app.post(
  "/clientcontactoperations",
  sessionAuth,
  clientCtrl.clientContactOperations
);
app.post("/getexistingclients", sessionAuth, clientCtrl.getExistingClients);
app.post("/viewprojecttree", sessionAuth, clientCtrl.viewprojecttree);
app.post("/viewclient", sessionAuth, clientCtrl.viewclient);
app.post("/clientoperation", sessionAuth, clientCtrl.clientOperation);

module.exports = app;
