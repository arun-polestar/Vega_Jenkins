'use strict';

var superadminCtrl = require('./Controller');
// var authCtrl = require('../handlers/authController');
const sessionAuth = require("../../services/sessionAuth");
const alumnisessionAuth = require('../../services/alumnisessionAuth');
const express = require('express');
const app = express.Router();

app.post('/getfeature', superadminCtrl.getfeature);
app.post('/getclientdata', alumnisessionAuth, superadminCtrl.getclientdata);
app.post('/upgradepackage', superadminCtrl.upgradepackage);

module.exports = app;
