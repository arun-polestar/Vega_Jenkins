'use strict';
const schedulingCtrl = require('./Controller');
const sessionAuth = require('../../../services/sessionAuth');
const express = require('express');
const app = express.Router();

//API to accept pre screen candidates
app.post('/preScreeningAccepted', sessionAuth, schedulingCtrl.preScreeningAccepted);
app.post('/trxrequisitionView', sessionAuth, schedulingCtrl.trxrequisitionView);
app.post('/trxrequisitionViewLazy', sessionAuth, schedulingCtrl.trxrequisitionViewLazy);
app.post('/updateInterviewer', sessionAuth, schedulingCtrl.updateInterviewer);




app.post('/getCandidateData', sessionAuth, schedulingCtrl.getCandidateData);
app.post('/scheduleInterview', sessionAuth, schedulingCtrl.scheduleInterview);
app.post('/savePreScreeningData', sessionAuth, schedulingCtrl.savePreScreeningData);
// Special API
app.post('/getWalkin', sessionAuth, schedulingCtrl.getWalkin);

app.post('/responseSheetData', sessionAuth, schedulingCtrl.responseSheetData);
app.post('/getHistory', sessionAuth, schedulingCtrl.getHistory);
app.post('/actionScreening', sessionAuth, schedulingCtrl.actionScreening);
app.post('/filterCandidateData', sessionAuth, schedulingCtrl.filterCandidateData);
app.post('/scheduleView', sessionAuth, schedulingCtrl.scheduleView);
app.post('/reschedulecandidate', sessionAuth, schedulingCtrl.reschedulecandidate);
app.post('/rejectreschedule', sessionAuth, schedulingCtrl.rejectRescheduleRequest);
app.post('/myupcominginterview', sessionAuth, schedulingCtrl.myUpcomingInterview);

app.post('/getLateralBatches', sessionAuth, schedulingCtrl.getLateralBatches);
app.post('/getRequisitionwiseCandidates', sessionAuth, schedulingCtrl.getRequisitionwiseCandidates);
app.post('/scheduleOnlineTest', sessionAuth, schedulingCtrl.scheduleOnlineTest);
app.post('/rescheduleOnlineTest', sessionAuth, schedulingCtrl.rescheduleOnlineTest);
app.post('/validateLateralCandidate', schedulingCtrl.validateLateralCandidate);
app.post('/removeAssessment', sessionAuth, schedulingCtrl.removeAssessment);




module.exports = app;