const companyController = require('./Controller');
var authCtrl = require('../handlers/authController');

const express = require('express');
const app = express.Router();
// module.exports = function(app) {

    app.post('/companyregister',companyController.registerCompany);
    app.post('/companylogin', companyController.companyLogin,authCtrl.generateToken);
    app.post('/confirmaccount', companyController.confirmaccount);
    app.post('/validateregistertoken', companyController.validateRegisterToken);
    app.post('/validatedomain', companyController.validatedomain);
    app.post('/companyLogout', companyController.logout);
    app.post('/validatetoken', authCtrl.validateToken,authCtrl.tokenStatus);
    app.post('/logout', authCtrl.logout);
    app.post('/setupserver', companyController.setUpServer);


    //app.post('/companyLogout', companyController.logout);
// }

module.exports = app;

