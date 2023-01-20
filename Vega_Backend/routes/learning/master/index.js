const masterCtrl = require("./controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require('express');
const app = express.Router();

app.post('/gettrainingdata', sessionAuth, masterCtrl.getTrainingData);
app.post('/savetrainingdata', sessionAuth, masterCtrl.saveTrainingData);
app.post('/deletetrainingdata', sessionAuth, masterCtrl.deleteTrainingData);
app.post('/getUserData', sessionAuth, masterCtrl.getUserData);
app.post('/classroomtraining', sessionAuth, masterCtrl.classroomtraining);
app.post('/classroomview', sessionAuth, masterCtrl.classroomview);
app.post('/uploadFile', sessionAuth, masterCtrl.uploadFile);
app.post('/rejectedtrainings', sessionAuth, masterCtrl.rejectedTrainings)
app.post('/searchtrainingdata', sessionAuth, masterCtrl.searchTrainingData);
app.post('/learningmodulestoregister', sessionAuth, masterCtrl.learningModulestoRegister);
app.post('/gettrainingbymapid', sessionAuth, masterCtrl.getTrainingByMapid)
app.post('/getteststatuscounts', sessionAuth, masterCtrl.getTestStatusCounts)
app.post('/gettotalpointsandamounts', sessionAuth, masterCtrl.getTotalPointsAndAmounts)


module.exports = app;