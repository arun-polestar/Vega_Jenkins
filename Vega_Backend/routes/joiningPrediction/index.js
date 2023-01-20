'use strict';
const joiningPrediction = require('./Controller');
const sessionAuth = require('../../services/sessionAuth');

const express = require('express');
const app = express.Router();

app.post('/getPrediction', sessionAuth, joiningPrediction.getPrediction);


module.exports = app;