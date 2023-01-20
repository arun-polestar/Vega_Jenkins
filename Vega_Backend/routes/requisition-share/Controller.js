'use strict'
const commonModel = require('../common/Model');
const proc = require('../common/procedureConfig');
var _ = require('underscore');
var uploadCtrl = require('../vegaHR/upload/Controller');
const mailservice = require('../../services/mailerService');
const moment = require('moment')
const webUrlLink = require('../../config/config').webUrlLink;

module.exports = {
  saveRequisitionShareData: saveRequisitionShareData,
  getRequisitionShareDescription: getRequisitionShareDescription,
  screeningQuestion: screeningQuestion,
  GetPublishedJobOpenings

}

function saveRequisitionShareData(req, res) {
  if (req && req.body) {
    var body = req.body;
    body.skills = body.skillText && body.skillText.toString();
    body.qualification = body.qualification && body.qualification.toString();
    body.requisitionid = body.requisitionuid;
    var object = JSON.stringify(body);
    commonModel.mysqlModelService(proc.requisitionshare, [object], function (err, results) {
      if (err) {
        return res.json({
          "state": -1,
          "message": err || "Failed! try after some time.",
          "data": null
        });
      } else if (results && results[0] && results[0][0]) {
        if (req.body.action == 'drive') {
          var errmessage;
          var emailObj = {
            email: results[0][0].email,
            mailType: 'vega-hr_drive',
            subjectVariables: {
              subject: "Congratulations-Applicant Number " + results[0][0].applicantcode
            },
            headingVariables: {
              heading: "Congratulations Applicant"
            },
            bodyVariables: {
              candidatename: results[0][0].candidatename,
              applicantcode: results[0][0].applicantcode,
              drivedate: results[0][0].drivedate && moment(results[0][0].drivedate).format("DD-MM-YYYY")
            },
          };
          //console.log('xxxxxxxmmmmmxxxxxxxx', emailObj);
          mailservice.send(emailObj, function (err, response) {
            //console.log('aaaaaaaaaaaaaaaaaaaaaaa', err, response);
            if (err) {
              errmessage = err
            }
          });
        } else if (req.body.action == 'exp' && results[0][0].ifassessment) {
          let assessmenturl = `${webUrlLink}/#lemonade/${results[0][0].batchname && results[0][0].batchname.toLowerCase()}`
          var errmessage;
          var emailObj = {
            email: results[0][0].email,
            mailType: 'vega-hr_drive_exp',
            subjectVariables: {
              subject: "Congratulations-Applicant Number " + results[0][0].applicantcode
            },
            headingVariables: {
              heading: "Congratulations Applicant"
            },
            bodyVariables: {
              candidatename: results[0][0].candidatename,
              applicantcode: results[0][0].applicantcode,
              assessmenturl: assessmenturl,
              assessmentvalidity: moment(results[0][0].assessmentvalidity).format('MMMM Do YYYY, h:mm:ss a')
            },
          };
          //console.log('new mail for applicant expereinced', emailObj);
          mailservice.send(emailObj, function (err, response) {
            //console.log('aaaaaaaaaaaaaaaaaaaaaaa', err, response);
            if (err) {
              errmessage = err
            }
          });
        }
        return res.json({
          "state": 1,
          "message": errmessage || "Success",
          "data": results && results[0]
        });
      } else {
        return res.json({
          "state": 1,
          "message": "Failed! Try after sometime",
          "data": null
        });
      }
    });
  } else {
    return res.json({
      "state": -1,
      "message": "Invalid Request",
      "data": null
    });
  }

}

function getRequisitionShareDescription(req, res) {
  if (req && req.body && req.body.id) {
    let reqData = {
      populate: 1,
      action: 'requisitionshare',
      id: req.body.id
    }
    reqData = JSON.stringify(reqData);
    commonModel.mysqlModelService(proc.bachcheckproc, [reqData], function (err, results) {
      var x = results && results[0] && results[0][0]
      if (err) {
        return res.json({
          "state": -1,
          "message": err || "Failed! try after some time.",
          "data": null
        });
      } else if (results && results[1] && results[1][0] && results[1][0] && x) {
        return res.json({
          "state": results[1][0].state,
          "message": "Success",
          "data": x
        });
      } else {
        return res.json({
          "state": -1,
          "message": "Failed! Please try another link",
          "data": null
        });
      }
    });
  } else {
    return res.json({
      "state": -1,
      "message": "Invalid Request",
      "data": null
    });
  }

}

function screeningQuestion(req, res) {
  if (req && req.body && req.body.id) {
    req.body['populate'] = 1
    const reqData = JSON.stringify(req.body);
    commonModel.mysqlModelService(proc.bachcheckproc, [reqData], function (err, results) {
      if (err) {
        return res.json({
          "state": -1,
          "message": err || "Failed! try after some time.",
          "data": null
        });
      } else if (results && results[1] && results[1][0] && results[1][0].state == 1) {
        return res.json({
          "state": results[1][0].state,
          "message": "Success",
          "data": results[0]
        });
      } else {
        return res.json({
          "state": -1,
          "message": "Failed! Please try another link",
          "data": null
        });
      }
    });
  } else {
    return res.json({
      "state": -1,
      "message": "Invalid Request",
      "data": null
    });
  }

}
function GetPublishedJobOpenings(req, res) {
  let rq = {
    action: 'get_requisition_open'
  }
  commonModel.mysqlModelService(proc.bachcheckproc, [JSON.stringify(rq)], function (err, result) {
    if (err) {
      return res.json({ state: -1, message: 'Something went wrong' })
    } else {
      let results = _.map(result[0], function (item) {
        item.applylink = `${webUrlLink}/#/shareto?uid=${item.guid}`
        return item;
      })
      //https://sandbox.vega-hr.com/#/shareto?uid=
      return res.json({ state: 1, message: 'Success', data: results })
    }
  })
}