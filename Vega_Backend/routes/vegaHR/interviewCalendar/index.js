
const interviewCalCtrl = require('./Controller')
const sessionAuth = require('../../../services/sessionAuth');
const express = require('express');
const app = express.Router();

app.post('/downloadresume', sessionAuth, interviewCalCtrl.downloadResume);
app.post('/getRecomendation', sessionAuth, interviewCalCtrl.getRecomendation);
app.post('/saveAssisstantFeedback', sessionAuth, interviewCalCtrl.saveAssisstantFeedback);
app.post('/viewFeedback', sessionAuth, interviewCalCtrl.viewFeedback);
app.post('/BulkInterviewFeedback', sessionAuth, interviewCalCtrl.BulkInterviewFeedback);





module.exports = app;



