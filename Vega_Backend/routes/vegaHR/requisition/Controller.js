const commonModel = require('../../common/Model');
const commonCtrl = require('./../../common/Controller');
const proc = require('../../common/procedureConfig');
const mailservice = require('../../../services/mailerService');
const Promise = require("bluebird");
var _ = require('underscore')
var moment = require('moment');
var uploadControllers = require('../upload/Controller');
var async = require('async');
const notificationCtrl = require('../../notification/Controller');
//const { query } = require('express');
const webUrlLink = require('../../../config/config').webUrlLink
const query = require('../../common/Model').mysqlPromiseModelService;
const { gmail } = require('googleapis/build/src/apis/gmail');

module.exports = {
  getRequisitionData: getRequisitionData,
  saveRequisitionData: saveRequisitionData,
  actionRequisition: actionRequisition,
  deleteRequisition: deleteRequisition,
  saveRequisitionQuestion: saveRequisitionQuestion,
  getRmsUserByRole: getRmsUserByRole,
  getRMSVendorData: getRMSVendorData,
  updateHrRequisitionData: updateHrRequisitionData,
  moveRequisitionData: moveRequisitionData,
  untagCandidate: untagCandidate,
  tagCandidateInfo: tagCandidateInfo,
  requistionsave: requistionsave,
  linkedinShare: linkedinShare,
  linkedinAuth: linkedinAuth,
  getCandidateRatingData: getCandidateRatingData,
  sendReferralMail: sendReferralMail,
  validateRequisitionToken: validateRequisitionToken,
  getUserByRequisition: getUserByRequisition,
  uploadTaggedCandidate: uploadTaggedCandidate,
  deleteDraftRequisition: deleteDraftRequisition,
  resendAssessmentLink,
  updateRewardApplicable
  // tagCandidateInfo2:tagCandidateInfo2


}

function getRequisitionData(req, res) {
  if (!req.body || !req.body.createdby) {
    return res.json({ state: -1, data: null, message: 'Required Parameters are missing' });
  }
  var obj = JSON.stringify({
    id: req.body.id || "All",
    createdby: req.body.createdby,
    populate: req.body.populate || 0,
    candidateid: req.body.candidateid,
    status: req.body.status,
    reqtype: 'view'
    // issubmit : req.body.issubmit  || 1
  });////console.log("obj",obj)

  commonModel.mysqlPromiseModelService(proc.requisition, [obj])
    .then(result => {
      return res.json({ state: 1, data: result[0], message: "Success" })
    })
    .catch(err => {
      return res.json({ state: -1, data: null, message: err.message || err });

    })
}
function saveRequisitionData(req, res) {
  if (!req.body) {
    return res.json({ state: -1, message: "Required parameters missing" });
  }
  var body = req.body;
  let obj1 = [];
  if (req && req.body && req.body.data) {
    obj1 = req.body.data;
  }
  var objsub = JSON.stringify(obj1);
  body.skillids = body.skillids && body.skillids.toString();
  body.issubmit = body.issubmit;
  body.countryid = body.countryid && body.countryid.toString();
  body.locationid = body.locationid && body.locationid.toString();
  body.businessunitid = body.businessunitid && body.businessunitid.toString();
  body.workforceid = body.workforceid && body.workforceid.toString();
  // body.designationid = body.designationid && body.designationid.toString();
  // body.departmentid = body.departmentid && body.departmentid.toString();
  if (req.body.expirydate) req.body.expirydate = moment(req.body.expirydate).format('YYYY-MM-DD');
  body.minimumsalary = body.minimumsalary ? body.minimumsalary : 0;
  body.maximumsalary = body.maximumsalary ? body.maximumsalary : 0;
  body.newid = body.id;
  body.id = body.tabType == 2 && body.issubmit == 1 ? null : body.id;
  if (body.issubmit == 1) {
    if (body.id) {
      body.reqtype = 'edit';
    } else {
      body.reqtype = 'add';
    }
    if (body.reqtype == 'add') {
      body.id - null;
    }
  }
  else if (body.issubmit == 0) {
    body.reqtype = 'add';
    body.newid = body.id;
    body.id - null;
  }

  var obj = JSON.stringify(body);
  commonModel.mysqlModelService(proc.requisition, [obj], function (err, results) {
    if (err) {
      return res.json({ state: -1, data: null, message: err || "Something went wrong" });
    }

    if (results[0] && results[0].length && results[0][0].message === 'Success' && results[0][0].state) {
      var obj = JSON.stringify({
        createdby: req.body.createdby,
        reqid: results[0][0].state,
      });
      commonModel.mysqlModelService(proc.tokenview, [obj], function (err, results) {
        if (err) {
          return res.json({ state: -1, data: null, message: err.message || JSON.stringify(err) });
        }
        var emails = results[0].map(item => item.user)
          .filter((value, index, self) => self.indexOf(value) === index);

        return Promise.map(emails, function (item) {
          var finalResult = results[0].filter(function (obj) {
            return obj.user === item;
          });
          var hradminuserid = finalResult[0].userid;
          var acceptToken = finalResult[0];
          var rejectToken = finalResult[1];
          var mailOptions = {
            userid: req.body.createdby,
            email: item,
            mailType: 'requisitionRaised',
            moduleid: req.body.moduleid ? req.body.moduleid : "rms",
            headingVariables: {
              heading: "New Requisition raised"
            },
            subjectVariables: {
              subject: "New requisition raised for your approval!"
            },
            bodyVariables: {
              trxreqjobtitle: req.body.jobtitle,
              trxreqjobopenings: req.body.positions,
              trxreqskills: req.body.skillsName ? req.body.skillsName.toString() : '',
              trxreqexperience: req.body.minexperience + '-' + req.body.maxexperience + '(Years)',
              trxreqexpiry: req.body.expirydate && moment(req.body.expirydate, 'YYYY-MM-DD').format('DD-MM-YYYY'),//moment(req.body.expirydate).format('DD-MM-YYYY'),
              trxreqdescription: req.body.jobdescription,
              trxreqaccept: req.body.host + '/requistionaction/validate?token=' + acceptToken.tokenid + '&uid=' + item,
              trxreqreject: req.body.host + '/requistionaction/validate?token=' + rejectToken.tokenid + '&uid=' + item,
              trxreqdesignation: req.body.designationname ? req.body.designationname.toString() : '',
            }
          };
          if (req.body.issubmit == 1) {
            let message = {
              notification: {
                title: 'Requisition',
                body: ''
              },
              data: {
                route: '/requisition',
                type: 'requisition'
              }
            };
            var msgbody = `New requisition raised by ${req.body.tokenFetchedData.firstname + ' ' + req.body.tokenFetchedData.lastname || ''} for approval.`;

            var keysdata = {
              createdby: req.body.createdby, touser: hradminuserid,
              description: msgbody, module: 'RMS', action: 'add'
            };

            message.notification.body = msgbody
            notificationCtrl.sendNotificationToMobileDevices(hradminuserid, message);

            notificationCtrl.saveUserNotificationDirect(keysdata)
            mailservice.mail(mailOptions, function (err, response) {
              if (err) {
                return { response: 'Mail not sent.', error: err };
              }
              else {
                return { response: 'Mail sent' };
              }
            });
          } else {
            return { response: 'success' }
          }
          //return sendMailCustom(mailOptions);
        })
          .then(function (data) {
            res.json({ message: 'success', data: null, state: 1 });
          })
          .catch(function (e) {
            res.json({ message: e.message || JSON.stringify(e), data: null, state: -1 });
          });
      });


    }

  });
}


function actionRequisition(req, res) {
  var body = req.body;
  var obj = JSON.stringify(body);

  commonModel.mysqlModelService(proc.tokenview, [obj], function (err, results) {
    if (err) {
      return res.json({ message: err.message || err, data: null, state: -1 });
    }

    if (results && results[0] && results[0][0]) {

      let tokenid = _.where(results[0], { user: req.body.tokenFetchedData.email })
      var hradminsres = results[0].filter(function (obj) {
        return obj.user !== req.body.tokenFetchedData.email;
      });
      //console.log("hrrrr", hradminsres)
      var obj = JSON.stringify({ tokenid: tokenid && tokenid[0] && tokenid[0].tokenid });

      commonModel.mysqlModelService(proc.tokenaction, [obj], function (err, results) {
        //console.log("reslll", results)
        if (err) {
          return res.json({ message: err.message || err, data: null, state: -1 });
        }
        let message = {
          notification: {
            title: 'Requisition',
            body: ''
          },
          data: {
            route: '/requisition',
            type: 'requisition'
          }
        };

        if (req.body.action == 'A') {
          var reqstatus = "Approved";
        } else if (req.body.action == 'R') {
          var reqstatus = "Rejected";
        }
        var msgbody = `Requisition ${reqstatus || ''} by ${req.body.tokenFetchedData.firstname + ' ' + req.body.tokenFetchedData.lastname || ''}`;

        var keysdata = {
          createdby: req.body.createdby, touser: req.body.raisedbyid,
          description: msgbody, module: 'RMS', action: 'add'
        };

        message.notification.body = msgbody

        notificationCtrl.sendNotificationToMobileDevices(req.body.raisedbyid, message);

        notificationCtrl.saveUserNotificationDirect(keysdata)

        if (hradminsres && hradminsres.length > 0) {
          _.each(hradminsres, (itemhr) => {
            var keysdatahr = {
              createdby: req.body.createdby, touser: itemhr.userid,
              description: msgbody, module: 'RMS', action: 'add'
            };
            notificationCtrl.sendNotificationToMobileDevices(itemhr.userid, message);

            notificationCtrl.saveUserNotificationDirect(keysdatahr)

          });
        }
        return res.json({ message: 'success', data: results, state: 1 });
      });


    } else {
      return res.json({ message: 'Action is already taken by some other user', data: null, state: -1 });
    }

  });

}
function deleteRequisition(req, res) {
  var body = req.body;
  body.userid = req.body.createdby;
  var obj = JSON.stringify(body);
  commonModel.mysqlModelService(proc.requisitionaction, [obj], function (err, results) {
    if (err) {
      return res.json({ message: err.message || err, state: -1, data: null });
    }
    res.json({ message: 'success', data: results, state: 1 });
  });
}

function requistionsave(req, res) {
  var body = req.body;
  body.action = 'getsavedata';
  body.userid = req.body.createdby;
  var obj = JSON.stringify(body);

  commonModel.mysqlModelService(proc.requisition, [obj], function (err, results) {
    if (err) {
      return res.json({ message: err.message || err, state: -1, data: null });
    }
    res.json({ message: 'success', data: results, state: 1 });
  });
}

function saveRequisitionQuestion(req, res) {

  var body = req.body;
  body.userid = req.body.createdby;
  body.action = body.action ? body.action : 'addquestion';
  var obj = JSON.stringify(body);
  commonModel.mysqlModelService(proc.requisitionquestion, [obj], function (err, results) {
    if (err) {
      return res.json({ message: err.message || err, state: -1, data: null });
    }
    res.json({ message: 'success', data: results, state: 1 });
  });
}
function getRmsUserByRole(req, res) {
  if (!req.body.role) {
    return res.json({ message: 'role is missing', state: -1, data: null });
  }
  var connectionAsync = Promise.promisifyAll(commonModel);
  var obj1 = req.body;
  var obj2 = req.body;
  obj1.configcode = 'modules';
  var obj_1 = JSON.stringify(obj1);
  obj2.configcode = 'RMSUserRoles';
  var obj_2 = JSON.stringify(obj2);
  Promise.all([
    connectionAsync.mysqlModelServiceAsync(proc.mstconfigview, [obj_1]),
    connectionAsync.mysqlModelServiceAsync(proc.mstconfigview, [obj_2]),

  ])
    .spread(function (modules, roles) {
      var moduleId = _.where(modules[0], { configvalue1: 'RMS' });
      var roleId = _.where(roles[0], { configvalue1: req.body.role })
      var obj_3 = JSON.stringify({
        moduleid: moduleId[0].id,
        roleid: roleId[0].id,
        createdby: req.body.createdby,
        populate: 1,
        attribute: 'rmsrole'
      });
      connectionAsync.mysqlModelServiceAsync(proc.mstuser_module_view, [obj_3])
        .then(function (result) {
          if (result[1] && result[1][0] && result[1][0].state && result[1][0].state == 1) {
            res.json({ message: 'success', data: result[0], state: 1 });
          } else {
            res.json({ message: 'something went wrong.', data: null, state: -1 })
          }
        });
    })
    .catch(function (e) {
      res.json({ message: e.message || e, data: null, state: -1 });
    });

}
function getRMSVendorData(req, res) {
  if (!req.body.tokenFetchedData) {
    return res.json({ message: 'User authorization failed', state: 0, data: null });
  }
  var body = req.body;
  var obj = JSON.stringify(body);

  commonModel.mysqlModelService(proc.vendorview, [obj], function (err, results) {
    if (err) {
      return res.json({ message: err.message || err, data: null, state: -1 });
    }
    if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
      return res.json({ message: 'success', data: results, state: 1 });
    } else {
      return res.json({ message: 'Something went wrong', data: null, state: -1 });
    }
  });
}
function updateHrRequisitionData(req, res) {
  var body = req.body;
  var dataObj = body.data;
  body.data && delete body.data;

  body.assignedtohr = req.body.assignedtohrid && req.body.assignedtohrid.toString();
  body.vendorid = req.body.vendorid && req.body.vendorid.toString();
  body.reqtype = 'edit';
  var obj = JSON.stringify(body);
  let obj1 = [];
  if (req && req.body && req.body.data) {
    obj1 = req.body.data;
  }
  commonModel.mysqlModelService(proc.requisition, [obj], function (err, results) {
    if (err) {
      return res.json({ message: err.message || err, data: null, state: -1 });
    }

    var data = {
      id: req.body.assignedtohr,
      createdby: req.body.createdby,
      type: 'MultiUser'
    }
    req.body.data = dataObj;
    var obj2 = JSON.stringify(data);
    commonModel.mysqlModelService(proc.employeeList, [obj2], function (err, results) {
      if (err) {
        return res.json({ message: err.message || err, data: null, state: -1 });
      }
      var useremails = results[0].map(function (item) {
        return item.useremail;
      });
      var extractdate = req.body.data.expirydate && req.body.data.expirydate.split("T")
      var mailOptions = {
        email: useremails.toString(),
        mailType: 'requisitionAssigned',
        userid: req.body.createdby,
        moduleid: req.body.moduleid ? req.body.moduleid : "rms",
        headingVariables: {
          heading: "Requisition has been assigned"
        },
        subjectVariables: {
          subject: "New requisition assigned to initiate interview process"
        },
        bodyVariables: {
          trxreqjobtitle: req.body.data.jobtitle,
          trxreqjobopenings: req.body.data.positions,
          trxreqskills: req.body.data.skills,
          trxreqexperience: req.body.data.minexperience + '-' + req.body.data.maxexperience + '(Years)',
          trxreqexpiry: extractdate[0] && moment(extractdate[0], 'YYYY-MM-DD').format('DD-MM-YYYY'),//moment(req.body.data.expirydate).format('DD-MM-YYYY'),
          trxreqdescription: req.body.jobdescription,
          trxreqaccept: '',
          trxreqreject: '',
          trxreqdesignation: req.body.designationname ? req.body.designationname.toString() : '',
        }
      };
      if (req.body.assignedtohrid) {
        let message = {
          notification: {
            title: 'Requisition',
            body: ''
          },
          data: {
            route: '/requisition',
            type: 'requisition'
          }
        };
        var msgbody = `New requisition assigned to you by ${req.body.tokenFetchedData.firstname + ' ' + req.body.tokenFetchedData.lastname || ''}.`;
        var keysdata = {
          createdby: req.body.createdby, touser: req.body.assignedtohrid,
          description: msgbody, module: 'RMS', action: 'add'
        };
        message.notification.body = msgbody
        notificationCtrl.sendNotificationToMobileDevices(req.body.assignedtohrid, message);
        notificationCtrl.saveUserNotificationDirect(keysdata)
        return mailservice.sendMailCustom(mailOptions)
          .then(function (data) {

            return res.json({ message: 'success', data: results[0], state: 1 });
          })
          .catch(function (e) {
            return res.json({ message: e.message || e, data: results[0], state: -1 });
          })
      } else {
        return res.json({ state: 1, message: 'success', data: results[0] })
      }
    });
  });
}

function moveRequisitionData(req, res) {
  var body = req.body;
  body.reqtype = 'edit';
  var obj = JSON.stringify(body);
  let obj1 = [];
  if (req && req.body && req.body.data) {
    obj1 = req.body.data;
  }


  commonModel.mysqlModelService(proc.requisition, [obj], function (err, results) {
    if (err) {
      return res.json({ message: err.message || err, data: null, state: -1 });
    }
    return res.json({ message: 'success', data: results && results[0], state: 1 });
  });
}

function untagCandidate(req, res) {
  var body = req.body;
  body.reqtype = 'edit'
  var obj = JSON.stringify(body);
  commonModel.mysqlModelService(proc.trxrequisition, [obj], function (err, results) {
    if (err) {
      return res.json({ message: err.message || err, data: null, state: -1 });
    }
    return res.json({ message: 'success', data: results[0], state: 1 });
  });
}
function linkedinShare(req, res) {
  var accesstoken = req.body.access_token ? req.body.access_token : '';
  var text = htmlToText.fromString(req.body.datashare, {
    wordwrap: 130
  });
  var url = 'https://api.linkedin.com/v1/people/~/shares?format=json';
  var headers =
  {
    authorization: 'Bearer' + accesstoken,
    'content-type': 'application/json',
    'x-li-format': 'json',
  };
  var body = {
    "comment": text ? text : '',
    "content": {
      "title": "Apply Now !",
      "submitted-url": "https://polestarllp.com/career/",
      "submitted-image-url": "https://michaelafoundation.com/wp-content/uploads/2017/07/we-are-hiring.png"
    },
    "visibility": {
      "code": "anyone"
    },
  };


  request({ url: url, headers: headers, body: body, json: true, method: "POST" },
    function (error, response, body) {
      if (error) {
        //console.log(error, 'error2222')
      };
      res.send(body)
    });
}
function linkedinAuth(req, res) {
  //console.log("reqqqqq", req.body);
  var url = "https://www.linkedin.com/oauth/v2/accessToken?client_id=" + req.body.clientid + "&client_secret=" + req.body.clientsecret + "&grant_type=authorization_code&redirect_uri=https://fusion.polestarllp.com/requisition&code=" + req.body.code;

  var headers =
  {
    'content-type': 'application/x-www-form-urlencoded'
  };
  request({ url: url, headers: headers, method: "POST" }, function (error, response, body) {
    if (error) {
      //console.log(error, 'errorerror')
    };
    res.send(body);
  })
}

function getCandidateRatingData(req, res) {
  var obj = req.body;
  obj.reqtype = 'view';
  commonModel.mysqlPromiseModelService(proc.trxrequisition, [JSON.stringify(obj)])
    .then(results => {
      return res.json({ state: 1, message: 'Success', data: results[0] })
    })
    .catch(err => {
      return res.json({ state: -1, message: err.message || err, data: null })
    })
}


function tagCandidateInfo(req, res) {

  var requisitionData = {};
  requisitionData = req.body && req.body.requisitionInfo;
  var candidateData = {};
  candidateData = req.body && req.body.candidateInfo;
  var obj = {
    "type": "getExperienceMasterData",
    "createdby": req.body.tokenFetchedData.id,
    "isactive": requisitionData.isactive,
    "requisitionid": requisitionData && requisitionData.id
  }
  var object = JSON.stringify(obj);
  commonModel.mysqlModelService(proc.mstconfigview, [object], function (err, results) {
    if (err) { } else {
      var mastersFromDb;
      mastersFromDb = results;
    }
    // //console.log("mastersFromDbbbbbbbbbbbb",mastersFromDb);

    multipleCandidateRanking(candidateData, mastersFromDb, requisitionData, req.body.tokenFetchedData.id).then((response) => {
      var finalObject = {};
      finalObject = response;
      finalObject = JSON.stringify(finalObject);

      commonModel.mysqlModelService('call usp_tagcandidateinfo(?)', [finalObject], function (err, results) {
        if (err) {
          return res.json({ message: err.message || err, data: null, state: -1 });
        }
        else {
          return res.json({ message: 'success', data: results, state: 1 });
        }
      });
    })
    // callback(); // show that no errors happened
    // }, function(err) {
    //     if(err) {
    //         //console.log("There was an error" + err);
    //     } else {
    //     }
    // });
    // var arrObj=[];
    // for (let index = 0; index < (candidateData && candidateData.length); index++) {
    //     var body = {};
    //     body.action = req.body && req.body.action;
    //     body.reqtype = 'add';
    //     body.action = 'Tagged';
    //     var rankingParameters =uploadControllers.getCandidateRanking(candidateData[index], mastersFromDb);
    //     body.ranking = rankingParameters.ranking || 0;
    //     body.tenthScore = rankingParameters.tenthScore || 0;
    //     body.twelfthScore = rankingParameters.twelfthScore || 0;
    //     body.highestDegreeScore = rankingParameters.highestDegreeScore || 0;
    //     body.yearsWithCompanyScore = rankingParameters.yearsWithCompanyScore || 0;
    //     body.collegeTierScore = rankingParameters.collegeTierScore || 0;
    //     body.experienceScore = rankingParameters.experienceScore || 0;
    //     body.skillsScore = rankingParameters.skillsScore || 0;
    //     body.ctcExpectationScore = rankingParameters.ctcExpectationScore || 0;
    //     body.candidateid = candidateData[index].id || 0;
    //     body.requisitionid = requisitionData.id || 0;
    //     body.createdby = req.body.tokenFetchedData.id;
    //     arrObj.push(body);
    //     //var obj = JSON.stringify(body);   
    // }
  });
}


function multipleCandidateRanking(body, mastersFromDb, requisitionData, createdby) {
  var arrObj = [];

  return new Promise((resolve, reject) => {
    _.each(body, (item) => {
      var rankingParameters = uploadControllers.getCandidateRanking(item, mastersFromDb)

      var body1 = {};
      body1.action = item.action || 'Tagged';
      body1.reqtype = 'add';
      //body1.action = 'Tagged';
      body1.ranking = rankingParameters.ranking || 0;
      body1.tenthScore = rankingParameters.tenthScore || 0;
      body1.twelfthScore = rankingParameters.twelfthScore || 0;
      body1.highestDegreeScore = rankingParameters.highestDegreeScore || 0;
      body1.yearsWithCompanyScore = rankingParameters.yearsWithCompanyScore || 0;
      body1.collegeTierScore = rankingParameters.collegeTierScore || 0;
      body1.experienceScore = rankingParameters.experienceScore || 0;
      body1.skillsScore = rankingParameters.skillsScore || 0;
      body1.ctcExpectationScore = rankingParameters.ctcExpectationScore || 0;
      body1.candidateid = item.id || 0;
      body1.requisitionid = requisitionData.id || 0;
      body1.createdby = createdby;
      arrObj.push(body1);
    });

    resolve(arrObj);
  })

}
function sendReferralMail(req, res) {//doubt
  // if (!req.body.tokenFetchedData) {
  //   return res.json({
  //     message: 'User authorization failed',
  //     state: 0,
  //     data: null
  //   });
  // }
  // var obj = JSON.stringify({ type: 'allactiveemployee' });
  // commonModel.mysqlModelService('call usp_mail_notifications(?)', [obj], function (err, results) {
  //   if (err) {
  //     res.json({ message: err.message || err, state: -1, data: null });
  //   }
  //   else {
  //     var emailList = _.pluck(results && results[0], 'useremail');
  //     var item = req.body;
  //     if (item.jobtitle && item.locationid && item.positions) {
  //       var exp = (item.minexperience || 0) + '-' + (item.maxexperience || 0) + ' yr(s)';
  //       var emailObj = {
  //         bcc: emailList,
  //         mailType: 'referral', subjectVariables: { subject: "Referral Opportunities " },
  //         headingVariables: { heading: "Referrals" }
  //         , bodyVariables: {
  //           profile: item.jobtitle,
  //           location: item.locationid, experience: exp, noofvacancy: item.positions
  //         }
  //       };
  //       mailservice.mail(emailObj, function (err, response) {
  //         if (err) {
  //           res.json({ data: null, message: err.message || err, state: -1 });
  //           return;
  //         }
  //         res.json({ message: 'success', state: 1, data: null });
  //       });
  //     }
  //     else {
  //       res.json({ state: -1, message: 'Profile/Location/Openings is missing.', data: null })
  //     }

  //   }
  // });
  if (!req.body.tokenFetchedData) {
    return res.json({
      message: 'User authorization failed',
      state: 0,
      data: null
    });
  }
  var obj = JSON.stringify({ type: 'allactiveemployee' });
  commonModel.mysqlModelService('call usp_mail_notifications(?)', [obj], function (err, results) {
    //console.log("results", results[0]);
    if (err) {
      //console.log("errorrrrr", err);
      res.json({ message: err.message || err, state: -1, data: null });
    }
    else if (results && results[0]) {
      res.json({
        "state": 1,
        "message": "Mail Triggered"
      })
      return new Promise(resolve => {
        let sent = [];
        let errors = [];

        const finalise = () => {
          if ((sent.length + errors.length) >= results[0].length) {
            resolve({ sent, errors });
          }
        };
        results[0].forEach((item, index) => {
          if (index == 0) {
            var reqObj = req.body;
            if (reqObj.jobtitle && reqObj.locationid && reqObj.positions) {
              var exp = (reqObj.minexperience || 0) + '-' + (reqObj.maxexperience || 0) + ' yr(s)';
              let emailObj = {
                moduleid: item.moduleid,
                mailType: 'referral',
                //bcc: item.useremail,
                bcc: "avinash.kumar@polestarllp.com",
                bodyVariables: {
                  profile: reqObj.jobtitle,
                  location: reqObj.locationid, experience: exp,
                  noofvacancy: reqObj.positions
                },
                subjectVariables: { subject: "Referral Opportunities " },
                headingVariables: { heading: "Referrals" }
              }

              setTimeout(function () {
                mailservice.mail(emailObj, function (err, response) {
                  if (err) {
                    errors.push(1);
                    finalise();
                    //console.log("errorsArray", errors);
                    //console.log('Error in Referral', err);
                  } else {
                    sent.push(2);
                    finalise();
                    //console.log("sentArray", sent);
                  }
                })
              }, 5000 * index);
            }
          }
        });
      })
    }

    else {
      res.json({ state: -1, message: 'Referral is missing.', data: null })
    }
  })
}
function validateRequisitionToken(req, res) {
  var body = {
    tokenid: req.body.token,
    uid: req.body.uid
  };
  var obj = JSON.stringify(body);
  commonModel.mysqlModelService(proc.tokenaction, [obj], function (err, results) {
    if (err) {
      return res.json({ message: err.message || err, state: -1 });
    }
    res.json({ message: 'success', data: results, state: 1 });
  });
}
function getUserByRequisition(req, res) {
  if (!req.body.requisitionid) {
    return res.json({ state: -1, message: 'required paramters missing' })
  } else {
    req.body.action = 'userbyrequisition';
    let obj = JSON.stringify(req.body);
    let obj1 = [];
    if (req && req.body && req.body.data) {
      obj1 = req.body.data;
    }

    commonModel.mysqlModelService(proc.requisition, [obj], function (err, results) {
      if (err) {
        return res.json({ message: err.message || err, state: -1 });
      }
      res.json({ message: 'success', data: results && results[0], state: 1 });
    });
  }
}

async function uploadTaggedCandidate(req, res) {
  var requisitionData = {};
  requisitionData = await commonCtrl.verifyNull(req.body.requisitionInfo);
  var candidateData = {};
  candidateData = await commonCtrl.verifyNull(req.body.candidateInfo);
  candidateData.action = req.body.action || 'upload_tagged';
  var obj = {
    "type": "getExperienceMasterData",
    "createdby": req.body.tokenFetchedData.id,
    "isactive": requisitionData.isactive,
    "requisitionid": requisitionData && requisitionData.id
  }
  var object = JSON.stringify(obj);
  commonModel.mysqlModelService(proc.mstconfigview, [object], function (err, results) {
    if (err) { } else {
      var mastersFromDb;
      mastersFromDb = results;
    }

    multipleCandidateRanking([candidateData], mastersFromDb, requisitionData, req.body.tokenFetchedData.id).then((response) => {
      var finalObject = {};
      finalObject = [{ ...candidateData, ...response[0] }];
      finalObject = JSON.stringify(finalObject);

      commonModel.mysqlModelService('call usp_tagcandidateinfo(?)', [finalObject], function (err, results) {
        if (err) {
          return res.json({ message: err.message || err, data: null, state: -1 });
        }
        else {
          return res.json({ message: 'success', data: results, state: 1 });
        }
      });
    })
  });
}

function deleteDraftRequisition(req, res) {
  if (!req.body.id) {
    return res.json({ state: -1, message: 'Required Parameters are missing' })
  } else {
    let obj = req.body;
    obj.action = 'delete_draft';
    commonModel.mysqlModelService(proc.requisition, [JSON.stringify(obj)], function (err, results) {
      if (err) {
        return res.json({ message: err.message || err, state: -1, data: null });
      }
      return res.json({ message: 'success', data: results[0], state: 1 });
    });

  }
}
function resendAssessmentLink(req, res) {
  if (!req.body.id) {
    return res.json({ state: -1, message: 'Required paramters are missing' })
  }
  let object = req.body;
  object.action = 'resend_assessment_link';
  commonModel.mysqlModelService('call usp_trxonlinecandidate_view(?)', [JSON.stringify(object)], function (err, results) {
    if (err) {
      return res.json({
        "state": -1,
        "message": err || "Failed! try after some time.",
        "data": null
      });
    }
    else if (results[0][0] && results[0][0].ifassessment) {
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
      return res.json({ state: 1, message: 'Success' })
    } else {
      return res.json({ state: -1, message: 'No Assessment Batch found!' })
    }
  })
}
async function updateRewardApplicable(req, res) {
  try {
    if (!req.body.id) {
      return res.json({ state: -1, message: 'Required Parameters are missing' });
    } else {
      let obj = req.body;
      obj.action = 'reward_applicable';
      let result = await query('call usp_requisition_operations(?)', [JSON.stringify(obj)]);
      return res.json({ state: 1, message: 'Success' });
    }
  } catch (err) {
    return res.json({ state: -1, message: 'Something went wrong' })
  }
}