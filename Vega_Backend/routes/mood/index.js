"use strict";
const moodCtrl = require("./mood.controller");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/savemoodtypemaster", sessionAuth, moodCtrl.saveMoodTypeMaster);
app.post("/viewmoodtypemaster", sessionAuth, moodCtrl.viewMoodTypeMaster);
app.post("/editmoodtypemaster", sessionAuth, moodCtrl.editMoodTypeMaster);
app.post(
  "/deactivatemoodtypemaster",
  sessionAuth,
  moodCtrl.deactivateMoodTypeMaster
);
app.post("/mooddashboardcounts", sessionAuth, moodCtrl.moodDashboardCounts);
//app.post('/typeandsubtype', sessionAuth, moodCtrl.typeAndSubtype);
app.post(
  "/pasttendaysusermoodcounts",
  sessionAuth,
  moodCtrl.getPastTenDaysUserMoodCount
);
app.post(
  "/pasttendaysusermooddetails",
  sessionAuth,
  moodCtrl.getPastTenDaysUserMoodDetails
);
app.post("/moodsubmissionsummary", sessionAuth, moodCtrl.moodSubmissionSummary);
app.post("/getgraphmoodcounts", sessionAuth, moodCtrl.getGraphMoodCounts);
app.post(
  "/getoverallaveragemood",
  sessionAuth,
  moodCtrl.getOverallAverageMoodScore
);
app.post("/getpiechartdata", sessionAuth, moodCtrl.getPieChartData);
app.post(
  "/getuserfeedbackdetails",
  sessionAuth,
  moodCtrl.getUserFeedbackDetails
);

app.post("/moodChatbotRoleDropdown", sessionAuth, moodCtrl.roleArrayForMoodChatBot);
app.post("/saveMoodTickets", sessionAuth, moodCtrl.saveMoodTickets);
app.post("/viewMoodTickets", sessionAuth, moodCtrl.viewMoodTickets);
app.post("/getMoodBotQuestions", sessionAuth, moodCtrl.getMoodBotQuestions);
app.post("/saveBotResponse", sessionAuth, moodCtrl.saveBotResponse);
app.post("/moodTicketActions", sessionAuth, moodCtrl.moodTicketActions);
app.post("/getPreviousChats", sessionAuth, moodCtrl.fetchPreviousBotChats)
app.post('/moodticket/history', sessionAuth, moodCtrl.moodticketHistory)
module.exports = app;
