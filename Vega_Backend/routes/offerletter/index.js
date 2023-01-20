"use strict";
const offerLetterCtrl = require("./Controller");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/saveOfferLetter", sessionAuth, offerLetterCtrl.saveOfferLetter);
app.post("/fetchOfferLetter", sessionAuth, offerLetterCtrl.fetchOfferLetter);
app.post("/deleteOfferLetter", sessionAuth, offerLetterCtrl.deleteOfferLetter);
app.post("/updateStatus", sessionAuth, offerLetterCtrl.updateStatus);
app.post(
  "/fetchOfferLetterRequiredFields",
  sessionAuth,
  offerLetterCtrl.fetchOfferLetterRequiredFields
);
app.post(
  "/offerLetterPreview",
  sessionAuth,
  offerLetterCtrl.offerLetterPreview
);
app.post("/sendOfferLetter", sessionAuth, offerLetterCtrl.sendOfferLetter);

module.exports = app;
