"use strict";
const clientCtrl = require("./Controller");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/clientcallclosure", sessionAuth, clientCtrl.clientApiCallClosure);
app.post(
  "/clientcalldatatransmission",
  sessionAuth,
  clientCtrl.clientApiDataTransmission
);
app.post(
  "/clientauthenticate",
  sessionAuth,
  clientCtrl.clientApiCallValidation
);

module.exports = app;
