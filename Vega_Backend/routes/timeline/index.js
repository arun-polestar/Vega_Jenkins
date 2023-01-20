const timelineController = require("./Controller");
const timelinePollController = require("./poll");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/createPost", sessionAuth, timelineController.createPost);
app.get("/fetchPost", sessionAuth, timelineController.fetchPost);
app.post("/editPost", sessionAuth, timelineController.editPost);
app.post("/deletePost", sessionAuth, timelineController.deletePost);
// app.post("/likeOrComment",sessionAuth,timelineController.likeOrComment);
app.get(
  "/fetchLikeOrComment",
  sessionAuth,
  timelineController.fetchLikeOrComment
);
app.post("/editComment", sessionAuth, timelineController.editComment);
// app.post("/deleteLikeOrComment",sessionAuth,timelineController.deleteLikeOrComment);
app.get(
  "/fetchUpcomingBirthdays",
  sessionAuth,
  timelineController.fetchUpcomingBirthdays
);
app.get(
  "/fetchUpcomingAnniversary",
  sessionAuth,
  timelineController.fetchUpcomingAnniversary
);
app.get("/fetchCovidData", timelineController.coviddata);
app.get(
  "/fetchNotificationData",
  sessionAuth,
  timelineController.fetchNotificationData
);
app.post(
  "/masterReportCategory",
  sessionAuth,
  timelineController.masterReportCategory
);
app.post("/reportPost", sessionAuth, timelineController.reportPost);
app.get(
  "/fetchReportedPostDetails",
  sessionAuth,
  timelineController.fetchReportedPostDetails
);
app.post(
  "/deleteReadNotifications",
  sessionAuth,
  timelineController.deleteReadNotifications
);
app.get(
  "/fetchReportedCommentsPost",
  sessionAuth,
  timelineController.fetchReportedCommentsPost
);
app.post("/cubedata", sessionAuth, timelineController.cubedata);
app.post(
  "/fetchtimelinedata",
  sessionAuth,
  timelineController.fetchtimelinedata
);
app.post(
  "/masterTimelineApproval",
  sessionAuth,
  timelineController.masterTimelineApproval
);
app.post(
  "/actionOnPendingPost",
  sessionAuth,
  timelineController.actionOnPendingPost
);
app.post(
  "/fetchEmployeeDailyReaction",
  sessionAuth,
  timelineController.fetchEmployeeDailyReaction
);
app.post(
  "/UpdateEmployeeDailyReaction",
  sessionAuth,
  timelineController.UpdateEmployeeDailyReaction
);
app.post(
  "/timelinedashboard",
  sessionAuth,
  timelineController.timelinedashboard
);
app.post(
  "/viewtimelinepraise",
  sessionAuth,
  timelineController.viewtimelinepraise
);

//Timeline Poll Api's
app.post("/createPoll", sessionAuth, timelinePollController.createPoll);
app.post("/voteForPoll", sessionAuth, timelinePollController.voteForPoll);
app.post("/fetchPoll", sessionAuth, timelinePollController.fetchPoll);
app.post(
  "/actionOnPendingPoll",
  sessionAuth,
  timelinePollController.actionOnPendingPoll
);
app.post(
  "/fetchPollVoters",
  sessionAuth,
  timelinePollController.fetchPollVoters
);
app.post("/deletePoll", sessionAuth, timelinePollController.deletePoll);
app.post(
  "/userPollCreationAccess",
  sessionAuth,
  timelinePollController.userPollCreationAccess
);
app.post("/editPoll", sessionAuth, timelinePollController.editPoll);

app.post("/addsuggestion", sessionAuth, timelineController.addSuggestion);
app.post("/viewsuggestion", sessionAuth, timelineController.viewSuggestion);
app.post(
  "/currentsuggestion",
  sessionAuth,
  timelineController.getCurrentSuggestion
);

module.exports = app;
