const dashboardCtrl = require('./controller');
const sessionAuth = require('../../../services/sessionAuth');

const express = require('express');
const app = express.Router();

app.post('/getLearningDashboardData', sessionAuth, dashboardCtrl.getDashboardData);
app.post('/getLearningDashboardDataAdhock', sessionAuth, dashboardCtrl.getDashboardDataAdhock);
app.post('/getCalendarData', sessionAuth, dashboardCtrl.getCalendarData);
app.post('/getlearninganalyticsdata', sessionAuth, dashboardCtrl.getLearningAnalyticsData)

module.exports = app;
