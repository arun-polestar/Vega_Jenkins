"use strict";

const esop = require("./esop.Controller");
const letter = require("./grantlatter.Controller");

const sessionAuth = require("../../services/sessionAuth");
const alumnisessionAuth = require("../../services/alumnisessionAuth");
const express = require("express");
const app = express.Router();
const Uploads = require("../common/Uploads");

app.post("/esopmaster", sessionAuth, esop.esopMaster);
app.post(
  "/esoppolicy",
  sessionAuth,
  esop.esopPolicy
);
app.post("/grantesop", sessionAuth, esop.grantesop);
app.post("/esopGrantReport", sessionAuth, esop.esopGrantReport);
app.post("/employeeesop", alumnisessionAuth, esop.employeeesop); // Alumni can access this API
app.post("/esopexpense", sessionAuth, esop.esopexpense);
app.post("/uploadesopuser", sessionAuth, esop.uploadesopuser);
app.post("/esopreport", sessionAuth, esop.esopreport);
app.post("/esopopertaion", sessionAuth, esop.esopopertaion);
app.post("/esopdashboard", sessionAuth, esop.esopdashboard);
app.post("/esopanalytics", sessionAuth, esop.esopanalytics);
app.post("/updateexercise", sessionAuth, esop.updateexercise);
app.post("/updatesurrender", sessionAuth, esop.updatesurrender);
app.post("/savegrantletter", sessionAuth, letter.saveGrantLetter);
app.post("/fetchgrantletter", sessionAuth, letter.fetchGrantLetter);
app.post("/deletegrantletter", sessionAuth, letter.deleteGrantLetter);
app.post("/grantLetterPreview", sessionAuth, letter.grantLetterPreview);
app.post("/sampleletterpreview", sessionAuth, letter.sampleLetterPreview);
app.post("/sendgrantletter", sessionAuth, letter.sendGrantLetter);
app.post("/updategrantletter", sessionAuth, letter.updateGrantLetter);
app.post("/deletegrantletter", sessionAuth, letter.deleteGrantLetter);
app.post("/addusersignature", sessionAuth, esop.addusersignature);
app.post("/viewusersignature", alumnisessionAuth, esop.viewusersignature); // Alumni can access this API
app.post("/addnominee", sessionAuth, esop.addnominee);
app.post("/viewnominee", alumnisessionAuth, esop.viewnominee); // Alumni can access this API
app.post("/usersettings", alumnisessionAuth, esop.usersettings); // Alumni can access this API
app.post("/updateintrinsicvalue", sessionAuth, esop.updateintrinsicvalue);
app.post("/uploadintrinsicvalue", sessionAuth, esop.uploadintrinsicvalue);
app.post("/esopcaptable", sessionAuth, esop.esopcaptable);
app.post("/viewesopopertaion", sessionAuth, esop.viewesopopertaion);
app.post("/viewesopopertaion", sessionAuth, esop.viewesopopertaion);
app.post("/sendesopreminder", sessionAuth, esop.sendesopreminder);
app.post("/esoprefreshdata", sessionAuth, esop.esoprefreshdata);
app.post("/esopcheckerapprove", sessionAuth, esop.esopcheckerapprove);
app.post("/esopcheckerview", sessionAuth, esop.esopcheckerview);
app.post(
  "/employeeexerciserequest",
  alumnisessionAuth,
  esop.employeeexerciserequest
); // Alumni can access this API
app.post("/mstexerciseapprove", sessionAuth, esop.mstexerciseapprove);
app.post("/uploadletter", sessionAuth, esop.uploadLetter);
app.post("/exerciseletter", sessionAuth, letter.exerciseLetter);
app.post("/uploadzipfile", sessionAuth, letter.uploadzipfile);

// app.post('/viewesopdata', sessionAuth, esop.viewesopdata);

// esopopertaion - > viewesopopertaion

// esopmaster - esopreport

module.exports = app;
