const subscriberController = require('./Controller');
const express = require('express');
const app = express.Router();


app.post('/subscriber', subscriberController.subscriberData);
app.post('/superadminRequest', subscriberController.superadminRequest);

module.exports = app
