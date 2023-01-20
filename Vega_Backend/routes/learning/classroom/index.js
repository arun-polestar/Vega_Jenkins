const classroomCtrl = require("./controller");
const sessionAuth = require("../../../services/sessionAuth");

const express = require('express');
const app = express.Router();

app.post('/addclassroomtrainee', sessionAuth, classroomCtrl.addClassroomTrainee);
app.post('/deactivateclassroom', sessionAuth, classroomCtrl.deactivateClassroom);
app.post('/assignedclassroomtrainee', sessionAuth, classroomCtrl.getAssignedClassroomTrainee);
app.post('/addclassroomtraining', sessionAuth, classroomCtrl.addClassroomTraining);
app.post('/getclassroomtraining', sessionAuth, classroomCtrl.getClassroomTraining);
app.post('/editclassroomtraining', sessionAuth, classroomCtrl.updateClassroomTraining);
app.post('/deactivateclassroomtraining', sessionAuth, classroomCtrl.deactivateClassroomTraining);
app.post('/getbatchwisetraining', sessionAuth, classroomCtrl.getBatchwiseTraining);
app.post('/getlazyloadedbatchdata', sessionAuth, classroomCtrl.getLazyLoadedBatchData);


module.exports = app;
