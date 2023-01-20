const requisitionCtrl = require('./Controller')
const sessionAuth = require('../../../services/sessionAuth')
const express = require('express');
const app = express.Router();


app.post('/getRequisitionData', sessionAuth, requisitionCtrl.getRequisitionData);
app.post('/saveRequisitionData', sessionAuth, requisitionCtrl.saveRequisitionData);
app.post('/tagCandidateInfo', sessionAuth, requisitionCtrl.tagCandidateInfo);
app.post('/actionRequisition', sessionAuth, requisitionCtrl.actionRequisition);
app.post('/deleteRequisition', sessionAuth, requisitionCtrl.deleteRequisition);
app.post('/saveRequisitionQuestion', sessionAuth, requisitionCtrl.saveRequisitionQuestion);
app.post('/requistionsave', sessionAuth, requisitionCtrl.requistionsave)
app.post('/getRmsUserByRole', sessionAuth, requisitionCtrl.getRmsUserByRole);
app.post('/getRMSVendorData', sessionAuth, requisitionCtrl.getRMSVendorData);
app.post('/updateHrRequisitionData', sessionAuth, requisitionCtrl.updateHrRequisitionData);

app.post('/moveRequisitionData', sessionAuth, requisitionCtrl.moveRequisitionData);
app.post('/untagCandidate', sessionAuth, requisitionCtrl.untagCandidate);

app.post('/linkedinShare', requisitionCtrl.linkedinShare);
app.post('/linkedinAuth', requisitionCtrl.linkedinAuth);

app.post('/getCandidateRatingData', sessionAuth, requisitionCtrl.getCandidateRatingData);
app.post('/sendReferralMail', sessionAuth, requisitionCtrl.sendReferralMail);
app.post('/validateRequisitionToken', requisitionCtrl.validateRequisitionToken);
app.post('/getUserByRequisition', sessionAuth, requisitionCtrl.getUserByRequisition);
app.post('/uploadTaggedCandidate', sessionAuth, requisitionCtrl.uploadTaggedCandidate);

app.post('/deleteDraftRequisition', sessionAuth, requisitionCtrl.deleteDraftRequisition);
app.post('/resendAssessmentLink', sessionAuth, requisitionCtrl.resendAssessmentLink);
app.post('/updateRewardApplicable', sessionAuth, requisitionCtrl.updateRewardApplicable);



module.exports = app;