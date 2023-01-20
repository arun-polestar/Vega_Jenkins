const formResponseCtrl = require("./controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post(
  "/engagementhomepagemaster",
  sessionAuth,
  formResponseCtrl.getEngagementHomepageMaster,
);
  
app.post(
  '/createEngagementFormResponse',
  sessionAuth,
  formResponseCtrl.createEngagementFormResponse,
);
  
app.post(
  '/getEngagementFormResponse',
  sessionAuth,
  formResponseCtrl.getEngagementFormResponse,
);

app.post(
  '/getengagementformdetails',
  sessionAuth,
  formResponseCtrl.getEngagementFormDetails,
);

app.post(
  '/peopleengagement/form/userdetails',
  sessionAuth,
  formResponseCtrl.getSubmittedFormsUserDetails,
);

app.post(
  '/peopleengagement/form/details',
  sessionAuth,
  formResponseCtrl.getSubmittedFormDetails,
);

module.exports = app;
