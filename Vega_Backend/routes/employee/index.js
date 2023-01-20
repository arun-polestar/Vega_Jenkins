'use strict';
const empCtrl = require('./employee.controller');
//const competencyCtrl = require('./competency/competency.contoller')
const validatorService = require('./employee.validator');
const sessionAuth = require("../../services/sessionAuth");
const apikeyVerfiy = require("../../services/apikeyVerifyService");
const alumnisessionAuth = require('../../services/alumnisessionAuth');
const express = require('express');
const app = express.Router();

/**
 * Competency Routes   --> moved to resourceManagement
 */
// app.post('/import-excel-competency', sessionAuth, competencyCtrl.importCompetencyExcel)
// app.post('/get_competency', sessionAuth, competencyCtrl.getCompetencyDetails)
// app.post('/getCompetencyRole', sessionAuth, competencyCtrl.getCompetencyRole)


/**
 * Employee Routes
 */

app.post('/getEmployeeList', sessionAuth, empCtrl.getEmployeeList);
app.post('/createEmployee', sessionAuth, validatorService.validate('createEmployee'), empCtrl.createEmployee);
app.post('/getEmployeeInfo', sessionAuth, empCtrl.getEmployeeInfo);
app.post('/validateEmployeeEmailEcode', sessionAuth, empCtrl.validateEmployeeEmailEcode)
// app.post('/validateEmployeeToken',  empCtrl.validateEmployeeToken);
app.post('/changeEmployeeStatus', sessionAuth, empCtrl.changeEmployeeStatus)
//   app.post('/getAllModule', sessionAuth, empCtrl.getAllModule);
//   app.post('/updateProfile',sessionAuth,empCtrl.updateProfile);
//   app.post('/getlogo',empCtrl.getlogo);
app.post('/getnewempdetail', sessionAuth, empCtrl.getNewEmpDetail);
app.post('/getreportee', sessionAuth, empCtrl.getReportee);
app.post('/gethrrefer', sessionAuth, empCtrl.gethrrefer);
app.post('/searchEmployee', sessionAuth, empCtrl.searchEmployeeList);
app.post('/getEmployeeDetails', sessionAuth, empCtrl.getEmployeeDetails);
app.post('/getEmployeeLeavesTrend', sessionAuth, empCtrl.getEmployeeLeavesTrend);
app.post('/getProjectBillingDataTrend', sessionAuth, empCtrl.getProjectBillingDataTrend);
app.post('/getWorkExperienceAnalysis', sessionAuth, empCtrl.getWorkExperienceAnalysis);
app.post('/getEmployeeAdditionalDetails', sessionAuth, empCtrl.getEmployeeAdditionalDetails);
app.post('/getPromotionDataAnalysis', sessionAuth, empCtrl.getPromotionDataAnalysis);
app.post('/getEmployeeReactionAverage', sessionAuth, empCtrl.getEmployeeReactionAverage);
app.post('/uploadEmployeeExceldata', sessionAuth, empCtrl.uploadEmployeeExcel);
app.post('/getEmployeeReactions', sessionAuth, empCtrl.getEmployeeReactions);
app.post('/getempList', sessionAuth, empCtrl.getempList);
app.post('/employeetaxoperation', alumnisessionAuth, empCtrl.employeetaxoperation);  //Alumni can access this API
app.post('/getEmpShiftByDate', sessionAuth, empCtrl.getEmpShiftByDate);
app.post('/getEmployeeByID', sessionAuth, empCtrl.getEmployeeByID)
app.post('/getsalaryslip', sessionAuth, empCtrl.generateSalarySlip);
app.post('/deactivatedEmployeeExcel', sessionAuth, empCtrl.deactivatedEmployeeExcel)
app.post('/supervisorEmployeeExcel', sessionAuth, empCtrl.supervisorEmployeeExcel)
app.post('/getEmployeeDataByssl', apikeyVerfiy, empCtrl.publicEmpDataApi)
app.post('/getAlumniEmployees', sessionAuth, empCtrl.getAlumniEmployees);





module.exports = app;
