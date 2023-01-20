const formResponseCtrl = require("./controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post(
  "/peopleengagement/employeeslist",
  sessionAuth,
  formResponseCtrl.getEmployeesList,
);

app.post(
  "/peopleengagement/formslist",
  sessionAuth,
  formResponseCtrl.getFormsListByUserId,
);

app.post(
  "/peopleengagement/dashboard_details",
  sessionAuth,
  formResponseCtrl.getDashboardDetails,
);

app.post(
  "/peopleengagement/dashboard_chartDetails",
  sessionAuth,
  formResponseCtrl.getDashboardChartsDetails,
);

app.post(
  "/peopleengagement/get_peoplemanager_mentees_detail",
  sessionAuth,
  formResponseCtrl.getPeopleManagerMenteesDetail,
);

app.post(
  "/peopleengagement/pivot_data",
  sessionAuth,
  formResponseCtrl.getEngagementPivotData,
);

module.exports = app;
