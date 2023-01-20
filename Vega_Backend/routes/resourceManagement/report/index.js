'use strict'
let reportCtrl = require("./report.controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require('express');
const app = express.Router();

app.post('/get_resource_competency_data', sessionAuth, reportCtrl.getResourceCompetencyData);
app.post('/get_resource_competency_count', sessionAuth, reportCtrl.getResourceCompetencyCount);
app.post('/get_fortnight_utilization_report', sessionAuth, reportCtrl.getFortnightUtilizationReport);
app.post('/get_current_bench_report', sessionAuth, reportCtrl.getCurrentBenchReport);
app.post('/get_resource_adhoc_report', sessionAuth, reportCtrl.getResourceAdhocReport);
app.post('/get_timesheet_assignment_FTE_report', sessionAuth, reportCtrl.getTimesheetAssignmentFTEReport);

module.exports = app;