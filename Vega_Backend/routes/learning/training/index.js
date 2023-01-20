const trainingCtrl = require("./controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require('express');
const app = express.Router();

app.post('/viewtraining', sessionAuth, trainingCtrl.viewTraining);
app.post('/savetraining', sessionAuth, trainingCtrl.saveTraining);
app.post('/deactivatetraining', sessionAuth, trainingCtrl.deactivateTraining);
app.post('/myTrainings', sessionAuth, trainingCtrl.myTrainings);
app.post('/treeStructureView', sessionAuth, trainingCtrl.treeStructureView);
app.post('/pendingVerificationAssessmentData', sessionAuth, trainingCtrl.pendingVerificationAssessmentData);


module.exports = app;