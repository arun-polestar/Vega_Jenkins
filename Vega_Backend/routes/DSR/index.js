const dsr = require('./Controller');
const sessionAuth = require('../../services/sessionAuth');
const express = require('express');
const app = express.Router();

// var dsrController = require('./dsr.controller');
// const sessionAuth = require("../../services/sessionAuth");

app.post('/savesubmitdsr', sessionAuth, dsr.savesubmitdsr);
app.post('/dsrview', sessionAuth, dsr.dsrview);
app.post('/viewdsrtype', sessionAuth, dsr.viewdsrtype);
app.post('/dsrbyuser', sessionAuth, dsr.dsrByUser);



// app.post('/viewDsrTable',dsrController.viewDsrTable);
// app.post('/saveSubmitDsr',dsrController.saveSubmitDsr);
// app.post('/monthSummary',dsrController.monthSummary);
// app.post('/addEmployeeLocation',dsrController.addEmployeeLocation);


module.exports = app;