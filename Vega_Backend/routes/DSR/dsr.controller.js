// const commonModel = require('../common/Model');
// const proc = require('../common/procedureConfig');
// var moment = require('moment');

// module.exports = {
//     viewDsrTable: viewDsrTable,
//     saveSubmitDsr: saveSubmitDsr,
//     monthSummary: monthSummary,
//     addEmployeeLocation: addEmployeeLocation
// }

// function viewDsrTable(req, res) {
//     if (!req.body.createdby) {
//         return res.json({ state: -1, message: "failure", data: null });
//     }
//     if (!req.body.userid) {
//         req.body.userid = req.body.createdby;
//         req.body.startdate = moment.utc(new Date().toISOString()).format('YYYY-MM-DD');
//         req.body.enddate = moment.utc(new Date().toISOString()).format('YYYY-MM-DD');
//     }
//     else {
//         req.body.startdate = req.body.startdate + ' 00:00:00';
//         req.body.enddate = req.body.enddate + ' 23:59:59';
//     }
//     var obj = JSON.stringify(req.body);
//     commonModel.mysqlPromiseModelService(proc.dsrentryview, [obj]
//     ).then(function (results) {
//         return res.json({ state: 1, message: "success", data: results[0] });
//     }).catch(function (err) {
//         return res.json({ state: -1, message: err, data: null });
//     });
// }

// function saveSubmitDsr(req, res) {
//     if (!req.body.createdby) {
//         return res.json({ state: -1, message: "failure", data: null });
//     }
//     var currentProcedure = req.body.id ? proc.dsrentryedit : proc.dsrentryview;
//     var scrumData = req.body.scrum;
//     delete req.body.scrum;
//     var obj = JSON.stringify(req.body);
//     commonModel.mysqlPromiseModelService(currentProcedure, [obj, scrumData]
//     ).then(function (results) {
//         return res.json({ state: 1, message: "success", data: results[0][0] });
//     }).catch(function (err) {
//         return res.json({ state: -1, message: err, data: null });
//     });
// }

// function monthSummary(req, res) {
//     if (!req.body.deviceid) {
//         return res.json({ state: -1, message: "failure", data: null });
//     }
//     var obj = JSON.stringify(req.body);
//     //console.log('objhe===========================',obj);
//     commonModel.mysqlPromiseModelService(proc.employeelocationadd, [obj]
//     ).then(function (results) {
//         var data = _.map(results[0], function (item, key) {
//             item.markdate = moment(item.markdate).format('YYYY-MM-DD');
//             return item;
//         });
//         return res.json({ state: 1, message: "success", data: data });
//     }).catch(function (err) {
//         return res.json({ state: -1, message: err, data: null });
//     });
// }

// function addEmployeeLocation(req, res) {
//     if (!req.body.deviceid) {
//         return res.badRequest();
//     }
//     var obj = JSON.stringify(req.body);
//     // console.log('objhe===========================',obj);
//     commonModel.mysqlPromiseModelService(proc.employeelocationadd, [obj]
//     ).then(function (results) {
//         return res.json({ state: 1, message: results && results[0] && results[0][0] && results[0][0].message, data: null });
//     }).catch(function (err) {
//         return res.json({ state: -1, message: err, data: null });
//     });
// }