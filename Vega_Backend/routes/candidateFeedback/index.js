'use strict';
const candidatefeedback = require('./Controller');
const sessionAuth = require('../../services/sessionAuth');
const express = require('express');
const app = express.Router();


app.post('/saveFeedback', candidatefeedback.saveFeedback);
app.post('/saveHrFeedback', sessionAuth, candidatefeedback.saveHrFeedback);
app.post('/getFeedbackQuestions', candidatefeedback.getFeedbackQuestions);



module.exports = app