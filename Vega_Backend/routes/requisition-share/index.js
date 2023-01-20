'use strict';
const requisionShareCtrl = require('./Controller');
const express = require('express');
const app = express.Router();
app.post('/saveRequisitionShareData', requisionShareCtrl.saveRequisitionShareData);
app.post('/getRequisitionShareDescription', requisionShareCtrl.getRequisitionShareDescription);
app.post('/screeningQuestion', requisionShareCtrl.screeningQuestion);
app.get('/GetPublishedJobOpenings', requisionShareCtrl.GetPublishedJobOpenings);




module.exports = app;
