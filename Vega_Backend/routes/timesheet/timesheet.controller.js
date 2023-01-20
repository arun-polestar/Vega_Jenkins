/**
 * TimesheetController
 */
// var path =  require('path');
var fs = require('fs');
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Kolkata");
//const exec = require('child_process').exec;
var path = require('path')
var _ = require('underscore');
const commonModel = require('../common/Model');
mailservice = require('../../services/mailerService');
const appRoot = require('app-root-path');
const async = require('async');
const xlsx = require('xlsx');
const makeDir = require("../../routes/common/utils").makeDirectories;
const https = require('https');
const axios = require('axios');
const query = require('../common/Model').mysqlPromiseModelService
const commonCtrl = require('../common/Controller');
const { saveBellNotification, sendNotificationToMobileDevices } = require('../notification/Controller');
const { sendBellIconNotification } = require('../notification/socket.io')
const attendanceCtrl = require('../attendance/Controller');

const config = require('../../config/config');
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;






module.exports = {
  timesheetInfo: timesheetInfo,
  updateTimesheet: updateTimesheet,
  updateTimesheetStatus: updateTimesheetStatus,
  timesheetUsers: timesheetUsers,
  uploadedAttendance: uploadedAttendance,
  fetchLeaveReport: fetchLeaveReport,
  addTimesheetAssignment: addTimesheetAssignment,
  timesheetConfigOperations: timesheetConfigOperations,
  timesheetConfigView: timesheetConfigView,
  timesheetAdhocReport: timesheetAdhocReport,
  timesheetReminder: timesheetReminder,
  timesheetDashboard: timesheetDashboard,
  timeSheetReport: timeSheetReport,
  timesheetmaster: timesheetmaster,
  edittimesheetmaster: edittimesheetmaster,
  punchOperations: punchOperations,
  getNitcoAttendance,
  saveNitcoAttendance,
  timesheetdump,
  getClientAttendance,
  saveClientAttendance,
  customTimesheetReport,
  unlockTimesheet,
  timesheetLockedUsers,
  sendTimesheetReminder
};
function timesheetInfo(req, res) {
  req.setTimeout(300 * 1000);
  //var fortnightdate = moment().date()<=15? moment().add(15-moment().date(), 'day').format('YYYY-MM-DD'): moment().endOf('month').format('YYYY-MM-DD');
  //if(!req.body.fortnightdate) req.body.fortnightdate = fortnightdate;
  //else
  req.body.fortnightdate = moment(req.body.fortnightdate, 'DD-MM-YYYY').format('YYYY-MM-DD');
  if (!req.body.userid) req.body.userid = req.body.createdby;
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService('call usp_trxtimesheet_view(?)', [obj], function (err, results) {
    if (err) {
      return res.json({ state: -1, message: err, data: null });
    }
    //   //console.log(results[1],'DATessssssssss');
    return res.json({ state: 1, message: results[1][0].message, data: results[0] });
  });
}

function updateTimesheet(req, res) {
  var timesheetData = _.map(_.reject(req.body.timesheetData, function (item) {
    return item.wbsname == 'Thumb Hours' || item.wbsname == 'Work Schedule' || item.wbsname == 'Punch IN'
  }), function (item) {
    item.billeddate = moment(item.billeddate).format('YYYY-MM-DD');
    item.createdby = req.body.createdby;
    delete item.wbsname; delete item.billdate;
    return item;
  });
  req.body.issubmitted = timesheetData && timesheetData[0] && timesheetData[0].issubmitted;
  //console.log(req.body.issubmitted, 'req.body.issubmitted');
  ////console.log('XXXXXXXXXXXXXXXXXXXXXXXXXX',req.body.timesheetData);
  var obj = JSON.stringify(timesheetData);
  commonModel.mysqlModelService('call usp_trxtimesheet_add(?)', [obj], function (err, results) {
    if (err) {
      if (err == 'leave') {
        return res.json({ state: -1, message: 'You have not applied leave(s) as per the timesheet submitted', data: null });
      }
      else {
        return res.json({ state: -1, message: err, data: null });
      }
    }

    if (req.body.issubmitted == 0) {
      return res.json({ state: 1, message: "Success", data: null });
    }
    else {
      ////console.log("tokndata", req.body.tokenFetchedData)
      let timesheetParam = results[0][0];
      var curDate = moment();
      var approvalDate = curDate.date() <= 15 ? curDate.add(17 - curDate.date(), 'day').format('DD-MM-YYYY') : curDate.endOf('month').add(2, 'day').format('DD-MM-YYYY');
      var emailObj = {
        userid: req.body.tokenFetchedData && req.body.tokenFetchedData.id,
        id: req.body.managerid || req.body.tokenFetchedData && req.body.tokenFetchedData.managerid,
        mailType: 'timesheetSubmitted',
        //modrole:"TimeUserRoles",
        moduleid: req.body.moduleid ? req.body.moduleid : "Time",
        createdby: req.body.createdby,
        bodyVariables:
        {
          "trxempdob": moment(results[0] && results[0][0] && results[0][0].trxempdob, 'YYYY-MM-DD').format('DD-MM-YYYY'),
          "trxempjoining": moment(results[0] && results[0][0] && results[0][0].trxempjoining, 'YYYY-MM-DD').format('DD-MM-YYYY'),// ,
          "trxempsupervisor": results[0] && results[0][0] && results[0][0].trxempsupervisor,
          "fortnightstartdt": moment(results[0] && results[0][0] && results[0][0].fortnightstartdt, 'YYYY-MM-DD').format('DD-MM-YYYY'),//results[0][0].fortnightstartdt,
          "fortnightenddt": moment(results[0] && results[0][0] && results[0][0].fortnightenddt, 'YYYY-MM-DD').format('DD-MM-YYYY'),//results[0][0].fortnightenddt,
          "trxtimesheetrejectreason": '',
          "trxtimesheetstatus": "Submitted",
          trxempname: (req.body.tokenFetchedData.firstname + (req.body.tokenFetchedData.lastname ? (' ' + req.body.tokenFetchedData.lastname) : ''))
          , trxtimesheetapprovaldt: approvalDate
        },
        subjectVariables: {
          subject: "Timesheet Submitted by (trxempname)!"
        },
        headingVariables: {
          heading: "New Timesheet Submitted"
        },
      };
      let bellNotificationData = {
        "assignedtouserid": timesheetParam.notification_to,
        "assignedfromuserid": timesheetParam.notification_from,
        "notificationdesc": `Timesheet Submitted by ${timesheetParam.trxempname} for Approval ( ${timesheetParam.fortnight_date || ''} )`,
        "attribute1": "",
        "attribute2": "",
        "attribute3": "",
        "attribute4": "",
        "isvendor": "",
        "web_route": 'time-sheet/approve-timesheet',
        "app_route": "app/route",
        "fortnight_date": timesheetParam.fortnight_date,
        "module_name": "Time",
        "createddate": moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        "datevalue": new Date().valueOf()
      }

      let message = {
        notification: {
          title: 'Timesheet',
          body: bellNotificationData.notificationdesc
        },
        data: {
          userid: req.body.createdby.toString(),
          route: '/timesheet',
          setCurrentFortnightDate: timesheetParam.fortnight_date,
          tab: '1',
          type: 'timesheet'
        }
      };
      sendNotificationToMobileDevices(timesheetParam.notification_to, message);
      sendBellIconNotification(bellNotificationData);
      saveBellNotification(bellNotificationData);
      ////console.log("emailobject------",req.body.tokenFetchedData,"req body-----");

      mailservice.mail(emailObj, function (err, response) {
        if (err) {
          //console.log('return res.ok({message:Mail not sent.})', err);
        }
        //console.log('Mail Sent');
      });
      return res.json({ state: 1, message: 'Success', data: null })
    }
  });
}
function updateTimesheetStatus(req, res) {
  req.body.fortnightdate = moment(req.body.fortnightdate, 'DD-MM-YYYY').format('YYYY-MM-DD');
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService('call usp_trxtimesheet_approve(?)', [obj], function (err, results) {
    if (err) {
      return res.json({ state: -1, message: err, data: null });
    }
    //	//console.log("isapprove",results,results[0],results[0][0].trxempjoining)
    let timesheetParam = results[0][0]
    var timesheetStatus = req.body.isapproved == 0 ? 'timesheetRejected' : 'timesheetApproved';
    var emailObj = {
      userid: req.body.userid,
      id: req.body.userid,
      mailType: timesheetStatus,
      moduleid: req.body.moduleid ? req.body.moduleid : "Time",
      createdby: req.body.createdby,
    };
    var trxtimesheetstatus = req.body.isapproved == 0 ? 'Rejected' : 'Approved'
    if (timesheetStatus == 'timesheetRejected') {

      emailObj.bodyVariables = {
        "trxempname": results[0] && results[0][0] && results[0][0].trxempname,
        "trxempdob": moment(results[0] && results[0][0] && results[0][0].trxempdob, 'YYYY-MM-DD').format('DD-MM-YYYY'),
        "trxempjoining": moment(results[0] && results[0][0] && results[0][0].trxempjoining, 'YYYY-MM-DD').format('DD-MM-YYYY'),// ,
        "trxempsupervisor": results[0] && results[0][0] && results[0][0].trxempsupervisor,
        "fortnightstartdt": moment(results[0] && results[0][0] && results[0][0].fortnightstartdt, 'YYYY-MM-DD').format('DD-MM-YYYY'),//results[0][0].fortnightstartdt,
        "fortnightenddt": moment(results[0] && results[0][0] && results[0][0].fortnightenddt, 'YYYY-MM-DD').format('DD-MM-YYYY'),//results[0][0].fortnightenddt,
        timesheetRejectionReason: req.body.rejectionreason,
        "trxtimesheetrejectreason": req.body.rejectionreason,
        trxtimesheetstatus: trxtimesheetstatus
      };
      emailObj.subjectVariables = {
        subject: "Timesheet trxtimesheetstatus"

      };
      emailObj.headingVariables = {
        heading: "Timesheet Rejected"
      };

    }
    else if (timesheetStatus == 'timesheetApproved') {
      emailObj.bodyVariables = {
        "trxempname": results[0][0].trxempname,
        "trxempdob": moment(results[0][0].trxempdob, 'YYYY-MM-DD').format('DD-MM-YYYY'),
        "trxempjoining": moment(results[0][0].trxempjoining, 'YYYY-MM-DD').format('DD-MM-YYYY'),// ,
        "trxempsupervisor": results[0][0].trxempsupervisor,
        "fortnightstartdt": results[0][0].fortnightstartdt,
        "fortnightenddt": results[0][0].fortnightenddt,
        "trxtimesheetrejectreason": '',
        trxtimesheetstatus: trxtimesheetstatus
      };
      emailObj.subjectVariables = {
        subject: "Timesheet trxtimesheetstatus"

      };
      emailObj.headingVariables = {
        heading: "Timesheet Approved"
      };

    }
    let bellNotificationData = {
      "assignedtouserid": timesheetParam.notification_to,
      "assignedfromuserid": timesheetParam.notification_from,
      "notificationdesc": `Your Timesheet has been ${trxtimesheetstatus} by ${timesheetParam.notification_from_name} for ( ${timesheetParam.fortnight_date || ''} )`,
      "attribute1": "",
      "attribute2": "",
      "attribute3": "",
      "attribute4": "",
      "isvendor": "",
      "web_route": 'time-sheet/fill-timesheet',
      "app_route": "app/route",
      "fortnight_date": timesheetParam.fortnight_date,
      "module_name": "Time",
      "createddate": moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      "datevalue": new Date().valueOf()
    }
    let message = {
      notification: {
        title: 'Timesheet',
        body: bellNotificationData.notificationdesc
      },
      data: {
        userid: req.body.createdby.toString(),
        route: '/timesheet',
        setCurrentFortnightDate: timesheetParam.fortnight_date,
        tab: '0',
        type: 'timesheet'
      }
    };
    sendNotificationToMobileDevices(timesheetParam.notification_to, message)
    sendBellIconNotification(bellNotificationData)
    saveBellNotification(bellNotificationData)
    mailservice.mail(emailObj, function (err, response) {
      //sails.sockets.broadcast('fusionSocket', 'userevent'+req.body.userid, {cubeUpdate:true, message: 'Your Timesheet is '+ (req.body.isapproved == 0 ? 'Rejected' : 'Approved')});
      if (err) {
        //console.log('return res.ok({message:})', err);
      }
      //console.log('return res.ok()');
    });
    return res.json({ state: 1, message: 'Success', data: null })
  });
}
function timesheetUsers(req, res) {
  if (!req.body.type) {
    return res.json({ state: -1, message: "Required parameters are missing" });
  }
  if (req.body.fortnightdate) {
    req.body.fortnightdate = moment(req.body.fortnightdate, 'DD-MM-YYYY').format('YYYY-MM-DD');
  }
  if (!req.body.fortnightdate) req.body.fortnightdate = moment().date() <= 15 ? moment().add(15 - moment().date(), 'day').format('YYYY-MM-DD') : moment().endOf('month').format('YYYY-MM-DD');
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService('call usp_mstuser_emplistview(?)', [obj], function (err, results) {
    if (err) {
      return res.json({ state: -1, message: err, data: null });
    }

    return res.json({ state: 1, message: 'Success', data: results[0] });
  });

}
function uploadedAttendance(req, res) {
  req.setTimeout(1000 * 60 * 20);
  //req.body.fileCount = req.files && Object.keys(req.files).length
  if (!req.body.fileCount) {
    return res.json({ state: -1, message: 'File Count is required' });
  }
  var checkdir2 = makeDir(path.join('uploads', 'Time', 'thumbhours'));
  var filesUploaded = [];
  var count = req.body.fileCount;
  count = typeof count == 'number' ? count : parseInt(count);
  async.times(count, function (n, next) {
    var sampleFile = {};
    if (Object.keys(req.files).length == 1) {
      sampleFile = req.files['file'];
    } else {
      sampleFile = req.files['file[' + n + ']'];
    }
    if (sampleFile && sampleFile.name && path.extname(sampleFile.name) == '.xlsx') {
      let filepath = path.join(checkdir2, sampleFile.name)
      //console.log('sampleFile.name', sampleFile.name)
      sampleFile.mv(filepath, (err) => {
        //console.log('ERRRORRRRRRRRRRRRRRRR IN MOVING', err)
        if (!err) {
          filesUploaded.push(filepath);
        }
        next(null, 'success');
      })
    } else {
      next(null, 'success');
    }
  }, function (err, users) {
    if (filesUploaded.length) {
      var attendanceArr = [];
      async.each(filesUploaded, function (item, cb) {
        let workbook = xlsx.readFile(item, {
          cellDates: true, cellNF: false, cellText: false
        })
        let sheet_name_list = workbook.SheetNames;
        var records = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]],
          { header: 1, raw: false, dateNF: 'yyyy-mm-dd hh:mm:ss' });

        attendanceArr = attendanceArr.concat(records);
        fs.unlink(item, function (err) {
          if (err) {

          }
        });
        cb();
      }, function (err) {
        if (err) {
          return res.json({ state: -1, message: 'Invalid data in files' });
        }
        else if (attendanceArr && attendanceArr[0] && attendanceArr[0].length == 0) {
          return res.json({ state: -1, message: 'Empty File(s), No Record parsed' });
        }
        commonModel.mysqlModelService('INSERT INTO `stgtrxthumbdata`(`ecode`,`punchtime`,`mykey`,`key1`,`key2`,`key3`) VALUES ?', [attendanceArr], function (err, results1) {
          //console.log(err, results1, 'ttttttttttttttttttttttt');
          if (err) {
            return res.json({ state: -1, message: err.message || 'Something went wrong in parsing data', data: null });
          }
          commonModel.mysqlModelService('call usp_trxtimesheet_upload(?)', [req.body.createdby], function (err, results) {
            //console.log(err, results, 'dbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
            if (err) {
              return res.json({ state: -1, message: err, data: null });

            }
            return res.json({ state: 1, message: 'Success', data: null });
          });
        });

      });
    }
    else {
      return res.json({ state: -1, message: 'No file(s) were uploaded in correct format (.xlsx)' })
    }
  });
}
function fetchLeaveReport(req, res) {
  if (!req.body.startdate) {
    return res.badRequest();
  }
  req.body.startdate = (moment(req.body.startdate, 'DD-MM-YYYY').format('YYYY-MM-DD') + ' 00:00:00');
  req.body.enddate = (moment(req.body.enddate, 'DD-MM-YYYY').format('YYYY-MM-DD') + ' 23:59:59');
  var obj = JSON.stringify(req.body);
  dbService.query('call usp_mstreport_view(?)', [obj], function (err, results) {
    if (err) {
      return res.serverError(err);
    }
    errorService.getError(results[0][0], function (err) {
      if (err) return res.status(422).send(err);
      return res.ok(results[0]);
    });
  });
}
function addTimesheetAssignment(req, res) {
  if (!req.body.createdby) {
    return res.badRequest();
  }
  var obj = JSON.stringify(req.body);
  dbService.query('call usp_mstreport_view(?)', [obj], function (err, results) {
    if (err) {
      return res.serverError(err);
    }
    errorService.getError(results[0][0], function (err) {
      if (err) return res.status(422).send(err);
      return res.ok(results[0]);
    });
  });
}
function timesheetConfigOperations(req, res) {
  req.body = _.mapObject(req.body, function (val, key) {
    if (val && val.constructor === Array) {
      val = val.toString();
    }
    return val;
  })
  var obj = req.body;
  obj.state = obj.state.toString();
  obj.country = obj.country.toString();
  obj.businessunit = obj.businessunit.toString();
  obj.workforce = obj.workforce.toString();
  commonModel.mysqlModelService('call usp_msttimesheet_operations(?)', [JSON.stringify(obj)], function (err, result) {
    if (err) {
      return res.json({ state: -1, message: err, data: null })
    } else {
      return res.json({ state: 1, message: 'Success', data: null })
    }
  })
}
function timesheetConfigView(req, res) {
  let obj = req.body;
  commonModel.mysqlModelService('call usp_msttimesheet_operations(?)', [JSON.stringify(obj)], function (err, result) {
    if (err) {
      return res.json({ state: -1, message: err, data: null })
    } else {
      return res.json({ state: 1, message: 'Success', data: result[0] })
    }
  })
}
function timesheetAdhocReport(req, res) {
  //viewtimesheetreport
  if (!req.body || !req.body.createdby || !req.body.action) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  req.body.mod = "TimeUserRoles"
  var obj = JSON.stringify(req.body);

  commonModel.mysqlPromiseModelService('call usp_allreports_operations(?)', [obj])
    .then(result => {

      return res.json({ message: 'success', data: result[0], state: 1 });
    })
    .catch(err => {
      res.json({ message: err, data: err, state: -1 });
    })
}


function timesheetReminder(action) {
  try {
    var obj = JSON.stringify({ "action": action });
    commonModel.mysqlModelService('call usp_trxtimesheet_reminder(?)', [obj], function (err, results) {
      if (err) {
        //console.log('errrrr', err)
      }
      else if (results && results[0]) {
        return new Promise(resolve => {
          let sent = [];
          let errors = [];

          const finalise = () => {
            if ((sent.length + errors.length) >= results[0].length) {
              resolve({ sent, errors });
            }
          };
          results[0].forEach((item, index) => {
            let rem = null; var subject = null; var timesub = null;
            let trxtimestatus = '';
            let emailObj = {
              moduleid: 'Time',
              bcc: item.useremail,
              bodyVariables: {
                fortnightsd: item.fortnightstartdate && moment(new Date(item.fortnightstartdate)).format('MMM Do'),
                fortnighted: item.fortnightenddate && moment(new Date(item.fortnightenddate)).format('MMM Do'),
                trxtimesheetapprovaldt: item.approvalenddate && moment(new Date(item.approvalenddate)).format('MMM Do'),
                fortnightstartdt: item.fortnightstartdate && moment(new Date(item.fortnightstartdate)).format('MMM Do'),
                fortnightenddt: item.fortnightenddate && moment(new Date(item.fortnightenddate)).format('MMM Do'),
                trxempname: item.trxempname,
                trxempdob: item.trxempdob && moment(new Date(item.trxempdob)).format('MMM Do'),
                trxempjoining: item.trxempjoining && moment(new Date(item.trxempjoining)).format('MMM Do'),
                trxempsupervisor: item.trxempsupervisor,
                trxempemail: item.trxempemail
              },
              subjectVariables: {},
              mailType: 'timesheetReminder',
              headingVariables: { heading: "Timesheet Reminder" }
            }
            if (item.reminder && item.reminder == 'First') {
              rem = "<Reminder-1> ";
              subject = "<Reminder-1> Submission and Approval of Timesheet";
              timesub = "Submission and Approval of Timesheet"
              trxtimestatus = 'Closure';
            } else if (item.reminder && item.reminder == 'Second') {
              rem = "Reminder-2"
              subject = "<Reminder-2> Submission and Approval of Timesheet"
              timesub = "Submission and Approval of Timesheet"

            } else if (item.reminder && item.reminder == 'Final') {
              rem = "Final reminder";
              subject = "<Final Reminder> Submit Your Timesheet"
              timesub = "Submit Your Timesheet"
              trxtimestatus = "Lock - In Day"

            }
            //emailObj.bodyVariables['remindervar'] = rem;
            emailObj.bodyVariables['timesheetremindercount'] = rem;
            emailObj.bodyVariables['trxtimesheetsubject'] = timesub;
            emailObj.bodyVariables['trxtimestatus'] = trxtimestatus
            //emailObj.subjectVariables['subject'] = subject;
            setTimeout(function () {
              mailservice.mail(emailObj, function (err, response) {
                if (err) {
                  errors.push(1);
                  finalise();
                  //console.log('Error in sending timesheet reminder', err);
                } else {
                  sent.push(2);
                  finalise();
                }
              })
            }, 5000 * index);
          });


          // let groups = _.groupBy(results[0], function (value) {
          //   return value.fortnightstartdate + '#' + value.fortnightenddate + '#' + value.approvalenddate + '#' + value.reminder;
          // });
          // let counter = 0;
          // let rem = null; var subject = null; var timesub = null;
          // for (key in groups) {
          //   //console.log('ressssssssssssssss', key)

          //   counter = counter + 1;
          //   let emailObj = { moduleid: 'Time', useremail: [], bodyVariables: {}, subjectVariables: {}, mailType: 'timesheetReminder', headingVariables: { heading: "Timesheet Reminder" } }

          //   _.each(groups[key], function (item) {
          //     emailObj.useremail.push(item.useremail);
          //   })

          //   let keyarr = key.split('#');
          //   emailObj.bcc = emailObj.useremail && emailObj.useremail.toString();
          //   emailObj.bodyVariables['fortnightsd'] = moment(new Date(keyarr[0])).format('MMM Do')
          //   emailObj.bodyVariables['fortnighted'] = moment(new Date(keyarr[1])).format('MMM Do')
          //   emailObj.bodyVariables['trxtimesheetapprovaldt'] = moment(new Date(keyarr[2])).format('LL');
          //   if (keyarr[3] == 'First') {
          //     rem = "<Reminder-1> ";
          //     subject = "<Reminder-1> Submission and Approval of Timesheet";
          //     timesub = "Submission and Approval of Timesheet"
          //   } else if (keyarr[3] == 'Second') {
          //     rem = "Reminder-2"
          //     subject = "<Reminder-2> Submission and Approval of Timesheet"
          //     timesub = "Submission and Approval of Timesheet"

          //   } else if (keyarr[3] == 'Final') {
          //     rem = "Final reminder";
          //     subject = "<Final Reminder> Submit Your Timesheet"
          //     timesub = "Submit Your Timesheet"

          //   }
          //   //emailObj.bodyVariables['remindervar'] = rem;
          //   emailObj.bodyVariables['timesheetremindercount'] = rem;
          //   emailObj.bodyVariables['trxtimesheetsubject'] = timesub;
          //   //emailObj.subjectVariables['subject'] = subject;
          //   setTimeout(() => {
          //     mailservice.mail(emailObj, function (err, response) {
          //       if (err) {
          //         //console.log('Error in sending timesheet reminder', err);
          //       }
          //     })
          //   }, counter * 5000);
          // }
        })
        // else if (results && results[1]) {

        // //message object to sending message with notification to mobile devices
        // let message = {
        // 	notification: {
        // 		title: 'Timesheet',
        // 		body: ''
        // 	},
        // 	data: {
        // 		route: '/timesheet',
        // 		// setCurrentFortnightDate: this.fortnightdate,
        // 		tab: '0'
        // 	}
        // };
        // 	message.notification.body = `Please submit your timesheet.`
        // 	let userid = results && results[1] && results[1].map(key => key.userid);
        // 	//console.log('TImesheet---------------------------------------------->', userid, message)
        // 	notificationCtrl.sendNotificationToMobileDevices(userid, message);
        // } 
      }
    })
  }
  catch (err) {
    //console.log('Something went wrong', err)
  }
}
function timesheetDashboard(req, res) {
  if (!req.body || !req.body.createdby || !req.body.action) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  req.body = _.mapObject(req.body, function (val, key) {
    if (val && val.constructor === Array) {
      val = val.toString();
    }
    return val;
  })
  var obj = JSON.stringify(req.body);

  commonModel.mysqlPromiseModelService('call usp_trxtimesheet_report(?)', [obj])
    .then(result => {
      let daterange = result[1] && result[1][0]
      return res.json({ message: 'success', data: result[0], state: 1, daterange: daterange });
    })
    .catch(err => {
      res.json({ message: err, data: err, state: -1 });
    })
}


function timeSheetReport(req, res) {
  try {
    if (req.body.action) {
      commonModel.mysqlModelService('call usp_timesheet_dashboard(?)', [JSON.stringify(req.body)], (err, data) => {
        if (err) {
          res.json({
            message: err.message, data: err, state: -1
          })
        }
        else {
          // if (data[1][0].state == -1 || data[5][0].state == -1){
          // //console.log(err,data);
          // 	throw Error('Something Went Wrong in DB')
          // }else{
          if (req.body.action == 'fortnight') {
            for (let i = 0; i < data[0].length; i++) {
              data[0][i].fortnightdate = moment(new Date(data[0][i].fortnightdate)).format('DD/MM/YYYY');
            }
            let current_fortnight = moment(new Date(data[1][0].current_fortnight)).format('DD/MM/YYYY');
            return res.json({
              state: data[1][0].state,
              message: data[1][0].message,
              current_fortnight: current_fortnight,
              data: data
            })
          }
          else if (req.body.action == 'alldata') {
            for (let i = 0; i < data[0].length; i++) {
              data[0][i].fortnightdate = new Date(data[0][i].fortnightdate).toLocaleDateString()
              data[0][i].fulldate = new Date(data[0][i].fulldate).toLocaleDateString()
            }
            // //console.log(data[5])
            let current_fortnight = moment(new Date(data[8] && data[8][0] && data[8][0].current_fortnight)).format('DD/MM/YYYY');
            return res.json({
              state: data[8] && data[8][0] && data[8][0].state || -1,
              message: data[8] && data[8][0] && data[8][0].message || 'Something went wrong!',
              current_fortnight: current_fortnight,
              data: data
            })
          }
          // }	
        }
      })
    }
    else {
      throw Error('Some Keys Are missing');
    }
  }
  catch (err) {
    return res.json({
      message: err.message, data: err, state: -1
    })
  }
}


function timesheetmaster(req, res) {
  try {
    if (req.body.action) {
      let obj = req.body;
      commonModel.mysqlModelService('call usp_trxtimesheet_reminder(?)', [JSON.stringify(obj)], (err, data) => {
        if (err) {
          return res.json({
            message: err.message, data: err, state: -1
          })
        }
        else {
          //console.log(data);
          res.json({
            state: 1,
            message: "success",
            data: data
          })
        }
      })
    }
    else {
      throw Error('Action is Required');
    }
  }
  catch (err) {
    res.json({
      message: err.message, data: err, state: -1
    })
  }
}


function edittimesheetmaster(req, res) {
  try {
    if (req.body.action) {
      let obj = {};
      if (req.body.action == 'checkinedit') {
        obj = {
          action: req.body.action,
          configvalue1: req.body.checkinLocation,
          configvalue2: req.body.checkinImages,
          configvalue3: req.body.checkinBreaks,
          configvalue4: req.body.checkinRemarks,
          is_geo_fencing: req.body.is_geo_fencing,
          fencing_radius: req.body.fencing_radius
        }
      } else {
        obj = {
          action: req.body.action,
          configvalue1: req.body.checkoutLocation,
          configvalue2: req.body.checkoutImages,
          configvalue4: req.body.checkoutRemarks,
          configvalue5: req.body.multiCheckouts,
          is_geo_fencing: req.body.is_geo_fencing,
          fencing_radius: req.body.fencing_radius
        }
      }
      //console.log(obj);
      commonModel.mysqlModelService('call usp_trxtimesheet_reminder(?)', [JSON.stringify(obj)], (err, data) => {
        if (err) throw err
        else {
          //console.log(data);
          return res.json({
            state: data[0][0].state,
            message: data[0][0].message,
            data: data
          })
        }
      })
    }
    else {
      throw Error('Action is Required');
    }
  }
  catch (err) {
    res.json({
      message: err.message, data: err, state: -1
    })
  }
}

// async function uploadfile(req){
// 	if (!fs.existsSync(path.join(appRoot.path, 'uploads'))) {
// 		fs.mkdirSync(path.join(appRoot.path, 'uploads'))
// 	}
// 	if (!fs.existsSync(path.join(appRoot.path, 'uploads/timesheet'))) {
// 		fs.mkdirSync(path.join(appRoot.path, 'uploads/timesheet'));
// 	}
// 	if (!fs.existsSync(path.join(appRoot.path, `uploads/timesheet/${req.body.createdby}`))) {
// 		fs.mkdirSync(path.join(appRoot.path, `uploads/timesheet/${req.body.createdby}`));
// 	} 

// 	let tempfilepath = `uploads/timesheet/${req.body.createdby}/`;
// 	let fileobj = await upload.uploadmultipledoc(req, tempfilepath);
// 	return fileobj;
// }

async function punchOperations(req, res) {
  try {
    if (req.body.action) {
      let obj = {};
      obj = req.body;

      /** GEO Fencing checking */
      if (req.body.action == 'add') {
        let reqData = {
          createdby: req.body.createdby,
          qr_code: req.body.qr_code,
          action: "qrdetails",
          request_type: req.body.id
        }
        let [locationdetails, results] = await query('call usp_attendance_operations(?)', [JSON.stringify(reqData)])
        /**GEO FENCING REQUIRED */
        if (results[0].geo_fencing_required && results[0].geo_fencing_required == 1) {
          if (locationdetails && locationdetails[0]) {
            let distance = await attendanceCtrl.findDistanceBetweenTwoCoordinates(req.body.latitude, req.body.longitude, locationdetails[0].latitude, locationdetails[0].longitude)
            /** IF DISTANCE IS GREATER THAN THRESHOLD THROW ERROR */
            if (distance > locationdetails[0].fencing_radius) {
              throw Error(`Seems like you are far from your office location! ${Math.round((distance / 1000), 2)}Km away`)
            } else {
              req.body.locationname = locationdetails[0].location_name
            }
          } else {
            throw Error('We could not identify the your base office location')
          }
        }
        /**
         * WHEN GEO FENCING IS NOT REQUIRED
        */

        else {
          req.body.locationname = req.body.locationname || (locationdetails[0] && locationdetails[0].location_name)
          req.body.latitude = req.body.latitude || (locationdetails[0] && locationdetails[0].latitude)
          req.body.longitude = req.body.longitude || (locationdetails[0] && locationdetails[0].longitude)
        }
      }
      /**
       * Ends here
       */
      if (req.body.action == 'add' && req.body.checkinselfie) {

        let today = new Date();
        let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        let monthFolder = `${months[today.getMonth()]}_${today.getFullYear()}_${req.body.createdby}`;
        let checkPostsDir = path.join('uploads', 'Punchin');
        makeDir(checkPostsDir);
        let checkdir = path.join('uploads', 'Punchin', monthFolder);
        makeDir(checkdir);
        var base64Data = req.body.checkinselfie.replace(/^data:image\/png;base64,/, "");
        newFileName = `${Date.now()}_selfie_${req.body.createdby}.png`;

        fs.writeFile(path.join(appRoot && appRoot.path, checkdir, newFileName), base64Data, 'base64', function (err) {
        });
        req.body.checkinfilepath = `Punchin/${monthFolder}/${newFileName}`
      }
      delete req.body.checkinselfie;
      obj = req.body;

      // if (req.files){
      // 	let fileobj = await uploadfile(req);
      // 	obj.filepath = fileobj[0].filepath
      // }
      //console.log('FILE and all', obj);
      commonModel.mysqlModelService('call usp_timesheet_punch(?)', [JSON.stringify(obj)], (err, data) => {
        ////console.log(err,data)
        if (err) {
          return res.json({
            message: err.message || err, data: null, state: -1
          })
        }
        else {
          if (obj.action == 'punchmaster' || obj.action == 'view') {
            return res.json({
              state: data[1][0].state,
              message: data[1][0].message,
              data: data
            })
          }
          else if (obj.action == 'punch-in-view') {
            return res.json({
              state: data[2][0].state,
              message: data[2][0].message,
              data: data
            })
          }
          else if (obj.action == 'add') {
            //console.log('AAAAAAAAAAAAAAAAAAAAAAAAAA', data)
            return res.json({
              state: data[0][0].state,
              message: data[0][0].message,
              data: data
            })
          }
        }
      })
    }
    else {
      throw Error('Action is not Defined')
    }
  }
  catch (err) {
    res.json({
      message: err.message, data: err, state: -1
    })
  }
}

function getNitcoAttendance() {
  var options = {
    host: 'routerprd.nitco.in',
    port: 8084,
    path: '/routerprd/getUserattJsonAction.do'
  }
  //let apiurl = "https://routerprd.nitco.in:8084/routerprd/getUserattJsonAction.do";

  https.get(options, (res) => {
    let body = "";

    res.on("data", (chunk) => {
      body += chunk;
    });

    res.on("end", () => {
      try {
        let jsondata = JSON.parse(body);
        if (jsondata && jsondata.empattdetails && jsondata.empattdetails.length > 0)
          saveNitcoAttendance(jsondata)
        else 1
        //console.log('No JSON DATA found');

      } catch (error) {
        console.error(error.message);
      };
    });

  }).on("error", (error) => {
    console.error(error.message);
  });
}

function saveNitcoAttendance(empAttendanceJSON) {
  let empattdetails = [];
  _.each(empAttendanceJSON && empAttendanceJSON.empattdetails, function (item) {
    let details = [];
    details.push(item.employeecode);
    details.push(`${item.punchdate} ${item.punchtime}`);
    empattdetails.push(details);
  });
  commonModel.mysqlModelService('Insert into stgtrxthumbdata(ecode,punchtime) VALUES ?',
    [empattdetails], function (err, result2) {
      if (err) {
        //console.log('err', err)
      } else {
        commonModel.mysqlModelService('call usp_trxtimesheet_attendance(?)',
          [JSON.stringify({})], function (err, result3) {
            if (err) {
              //console.log('err', err)
            }
            else {
              //console.log('Success', result3);
            }
          })
        //console.log('Success');
      }
    })
}
function timesheetdump(req, res) {
  if (!req.body.action) return res.json({ state: -1, message: 'Required Parameters are missing' });
  let rq = req.body;
  commonModel.mysqlPromiseModelService('call usp_trxtimesheet_report(?)', [JSON.stringify(rq)])
    .then(results => {
      return res.json({ state: 1, message: 'success', data: results[0] })
    })
    .catch(err => {
      //console.log('TImesheet Dump Error', err)
      return res.json({ state: -1, message: 'Something went wrong' });
    })
}
function getClientAttendance(client) {
  let url = '';
  let data = {};
  let method = 'get';
  if (client == 'nitco') {
    url = 'https://routerprd.nitco.in:8084/routerprd/getUserattJsonAction.do';
  } else if (client == 'mawai') {
    url = 'http://vegahr.mawaiweb.com/api/Employee/timesheet';
    data = {
      month: (new Date().getMonth() + 1).toString(),
      year: (new Date().getFullYear()).toString()
    }
    method = 'post';
  }

  axios({ method, url, data }).
    then(jsondata => {
      ////console.log('jsondata',jsondata)
      if ((client == 'nitco' && jsondata.empattdetails && jsondata.empattdetails.length > 0)
        || (client == 'mawai' && jsondata['data'].data && jsondata['data'].data.length > 0)) {
        saveClientAttendance(jsondata['data'].data, client)
      } else {
        //console.log('Something went wrong')
      }
    }).catch(err => {
      //console.log('Something went wrong', err);
    })
}
async function saveClientAttendance(jsonData, client) {
  //console.log('jsonData', jsonData)
  let attendanceDetails = [];
  if (client == 'nitco') {

    _.each(jsonData && jsonData.empattdetails, function (item) {
      let details = [];
      details.push(item.employeecode);
      details.push(`${item.punchdate} ${item.punchtime}`);
      attendanceDetails.push(details);
    });
  } else if (client == 'mawai') {
    _.each(jsonData, function (item) {
      let details = [];
      details.push(item.eng_cd);
      details.push(moment(item.in_time, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD HH:mm:ss'));
      attendanceDetails.push(details);
      details = [];
      details.push(item.eng_cd);
      details.push(moment(item.out_time, 'DD/MM/YYYY HH:mm').add(12, 'hours').format('YYYY-MM-DD HH:mm:ss'));
      attendanceDetails.push(details);

    })
  }
  try {
    let results = await query('Insert into stgtrxthumbdata(ecode,punchtime) VALUES ?', [attendanceDetails])
    let results2 = await query('call usp_trxtimesheet_attendance(?)', [JSON.stringify({ client })])
  } catch (err) {
    //console.log('Something went wrong in client attendance')
  }
}
async function customTimesheetReport(req, res) {
  try {
    let rq = { action: 'mawai_report', ...req.body }
    let results = await query('call usp_trxtimesheet_report(?)', [JSON.stringify(rq)])
    let dbresult = await commonCtrl.lazyLoading(results[0], req.body);
    if (dbresult && "data" in dbresult && "count" in dbresult) {
      return res.json({ "state": 1, message: "success", "data": dbresult.data, "count": dbresult.count });
    }
    else {
      return res.json({ state: -1, message: "something went wrong", data: null })
    }
  } catch (err) {
    //console.log('Err', err);
    return res.json({ state: -1, message: 'Something went wrong' });
  }

}
async function unlockTimesheet(req, res) {
  try {
    let rq = req.body;
    let results = await query('call usp_trxtimesheet_reminder(?)', [JSON.stringify(rq)])
    if (results) {
      return res.json({ state: 1, message: 'Success' })
    } else {
      return res.json({ state: -1, message: 'Something went wrong' })
    }

  } catch (err) {
    //console.log('Err', err);
    return res.json({ state: -1, message: 'Something went wrong' });
  }
}
async function timesheetLockedUsers(req, res) {
  try {
    let rq = req.body;
    let results = await query('call usp_trxtimesheet_reminder(?)', [JSON.stringify(rq)])
    if (results) {
      return res.json({ state: 1, message: 'Success', data: results[0] })
    } else {
      return res.json({ state: -1, message: 'Something went wrong' })
    }

  } catch (err) {
    //console.log('Err', err);
    return res.json({ state: -1, message: 'Something went wrong' });
  }
}

async function sendTimesheetReminder(req, res) {
  try {
    if (!req.body.usermails || !req.body.fortnightdate) {
      return res.json({ "state": -1, message: "Required parameters are missing" });
    }
    let emailObj = {
      moduleid: 'Time',
      bcc: req.body.usermails,
      cc: req.body.tokenFetchedData.email,
      mailType: "externaltimesheetreminder",
      createdby: req.body.createdby,
      bodyVariables: {
        trxfortnightdt: moment(req.body.fortnightdate, 'YYYY-MM-DD').format('DD-MM-YYYY'),
        trxremarks: req.body.remarks || ""
      }
    }
    let bellNotificationData = {
      "assignedtouserid": req.body.userids,
      "assignedfromuserid": req.body.createdby,
      "notificationdesc": `Timesheet Submission Reminder for period of ${req.body.fortnightdate}`,
      "attribute1": "",
      "attribute2": "",
      "attribute3": "",
      "attribute4": "",
      "isvendor": "",
      "web_route": 'time-sheet/fill-timesheet',
      "app_route": "app/route",
      "fortnight_date": req.body.fortnightdate,
      "module_name": "Time",
      "createddate": moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      "datevalue": new Date().valueOf()
    }

    let message = {
      notification: {
        title: 'Timesheet',
        body: bellNotificationData.notificationdesc
      },
      data: {
        route: '/timesheet',
        setCurrentFortnightDate: req.body.fortnightdate,
        tab: '0',
        type: 'timesheet'
      }
    };

    sendNotificationToMobileDevices(bellNotificationData.assignedtouserid, message);
    sendBellIconNotification(bellNotificationData)
    saveBellNotification(bellNotificationData)

    mailservice.mail(emailObj, function (err, response) {
      if (err) {
        console.log('err', err)
      }
    });
    return res.json({ state: 1, message: "Email Sent Successfully" })
  } catch (err) {
    return res.json({ "state": -1, message: "Something went wrong", err: err })
  }
}