const topicCtrl = require("./controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/saveTrainingTopic", sessionAuth, topicCtrl.saveTrainingTopic);
app.post("/viewTrainingTopic", sessionAuth, topicCtrl.viewTrainingTopic);
app.post("/uploadTopicQuestions", sessionAuth, topicCtrl.uploadTopicQuestions);
app.post("/markAsAttended", sessionAuth, topicCtrl.markAsAttended);
app.post("/saveBatchTopic", sessionAuth, topicCtrl.saveBatchTopic);
app.post("/viewTrainerList", sessionAuth, topicCtrl.viewTrainerList);
app.post("/addTopicQuestion", sessionAuth, topicCtrl.addTopicQuestion);
app.post("/markTopicAsCompleted", sessionAuth, topicCtrl.markTopicAsCompleted);
app.post(
  "/getUnattendedTraineeList",
  sessionAuth,
  topicCtrl.getUnattendedTraineeList
);

module.exports = app;
