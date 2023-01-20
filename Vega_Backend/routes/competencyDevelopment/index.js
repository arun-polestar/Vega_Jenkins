const competencyController = require("./Controller");
const sessionAuth = require("../../services/sessionAuth");
const Uploads = require("../common/Uploads");

const express = require("express");
const app = express.Router();

app.get(
  "/caseStudy/get",
  sessionAuth,
  competencyController.getCaseStudy
);

app.post(
  "/caseStudy/save",
  sessionAuth,
  new Uploads("competencyDevelopment").multipleFile,
  competencyController.saveCaseStudy
);
app.post(
  "/caseStudy/isactive",
  sessionAuth,
  competencyController.isactiveCaseStudy
);

app.get(
  "/header/get",
  sessionAuth,
  competencyController.getHeader
);

app.post(
  "/header/save",
  sessionAuth,
  competencyController.saveHeader
);
app.post(
  "/header/isactive",
  sessionAuth,
  competencyController.isactiveHeader
);

app.get(
  "/station/get",
  sessionAuth,
  competencyController.getStation
);

app.post(
  "/station/save",
  sessionAuth,
  competencyController.saveStation
);
app.post(
  "/station/isactive",
  sessionAuth,
  competencyController.isactiveStation
);

app.get(
  "/assignment/get",
  sessionAuth,
  competencyController.getAssignment
);

app.post(
  "/assignment/save",
  sessionAuth,
  new Uploads("competencyDevelopment").multipleFile,
  competencyController.saveAssignment
);
app.post(
  "/assignment/isactive",
  sessionAuth,
  competencyController.isactiveAssignment
);

app.get(
  "/review/data",
  sessionAuth,
  competencyController.getReviewData
);

app.post(
  "/review/userSubmit",
  sessionAuth,
  new Uploads("competencyDevelopment").multipleFile,
  competencyController.userSubmit
);

app.post(
  "/review/reviewerSubmit",
  sessionAuth,
  new Uploads("competencyDevelopment").multipleFile,
  competencyController.reviewerSubmit
);

app.get(
  "/category/dropdown",
  sessionAuth,
  competencyController.getCategory
);

app.get(
  "/competencyLevel/dropdown",
  sessionAuth,
  competencyController.getCompetencyLevel
);

app.get(
  "/competencyStatus/dropdown",
  sessionAuth,
  competencyController.competencyStatusDropdown
);

app.get(
  "/competency/home",
  sessionAuth,
  competencyController.competencyHome
);

app.post(
  "/competency/viewDetail",
  sessionAuth,
  competencyController.viewDetail
);

app.post(
  "/competency/userViewDetail",
  sessionAuth,
  competencyController.userViewDetail
);

app.post(
  "/competency/countStatus",
  sessionAuth,
  competencyController.countStatus
);

app.post(
  "/competency/adminViewDetail",
  sessionAuth,
  competencyController.stationViewDetailsAdmin
);

app.post(
  "/competency/userMarkInProgress",
  sessionAuth,
  competencyController.userMarkInProgress
);

app.post(
  "/competency/afterCompleteStatus",
  sessionAuth,
  competencyController.afterCompleteStatus
);

module.exports = app;
