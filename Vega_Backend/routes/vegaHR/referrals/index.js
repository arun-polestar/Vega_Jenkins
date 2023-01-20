const referralCtrl = require('./Controller');
const sessionAuth = require('../../../services/sessionAuth');

const express = require('express');
const app = express.Router();

app.post('/getParsedRefrralData', sessionAuth, referralCtrl.getParsedRefrralData);
app.post('/viewResumeHistory', sessionAuth, referralCtrl.viewResumeHistory);
// app.post('/parseDataReferral',sessionAuth, referralCtrl.parseDataReferral);
// app.post('/editTemporaryRecord',sessionAuth, referralCtrl.editTemporaryRecord);
app.post('/rmsuploadreferral', sessionAuth, referralCtrl.rmsUploadReferral);
app.post('/rmsaddrefmatrix', sessionAuth, referralCtrl.addReferalMatrix);
app.post('/requistionresumeupload', referralCtrl.requistionResumeUpload);

module.exports = app;