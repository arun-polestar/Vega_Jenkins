const proc = require("../../common/procedureConfig");
const commonModel = require("../../common/Model");
const query = commonModel.mysqlPromiseModelService;
const commonCtrl = require("../../common/Controller");
const mailservice = require("../../../services/mailerService");
const addeventService = require("../../../services/addeventService");
const _ = require("lodash");
const mime = require("mime");
var moment = require("moment");
const async = require("async");
const notificationCtrl = require("../../notification/Controller");
const utils = require("../../common/utils");
const uuidv4 = require("uuid").v4;
const fs = require("fs");
const path = require("path");
const webUrlLink = require('../../../config/config').webUrlLink;


module.exports = {
  preScreeningAccepted: preScreeningAccepted,
  trxrequisitionView: trxrequisitionView,
  getCandidateData: getCandidateData,
  scheduleInterview: scheduleInterview,
  savePreScreeningData: savePreScreeningData,
  responseSheetData: responseSheetData,
  getHistory: getHistory,
  actionScreening: actionScreening,
  filterCandidateData: filterCandidateData,
  scheduleView: scheduleView,
  reschedulecandidate: reschedulecandidate,
  getWalkin: getWalkin,
  rejectRescheduleRequest: rejectRescheduleRequest,
  myUpcomingInterview,
  getLateralBatches,
  getRequisitionwiseCandidates,
  scheduleOnlineTest,
  validateLateralCandidate,
  rescheduleOnlineTest,
  removeAssessment,
  trxrequisitionViewLazy,
  updateInterviewer
}

//same api is called from candidates also
//to get interview calendar data of candidates

function trxrequisitionView(req, res) {
  if (!req.body) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  var body = req.body;
  body.id = 'All';
  body.candidateid = 'All';
  body.reqtype = 'view';
  var obj = JSON.stringify(body);
  var call = req.body.interviewdate || req.body.monthdate ? proc.trxrequisition : proc.rmscandidate;
  commonModel.mysqlModelService(call, [obj], function (err, results) {
    if (err) {
      return res.json({ message: err, state: -1, data: null });
    } else {
      if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
        return res.json({ message: results[1][0].message, data: results[0], state: results[1][0].state });
      } else {
        return res.status(400).json({ message: "Something went wrong.", state: -1, data: null });
      }
    }
  })
}
function trxrequisitionViewLazy(req, res) {
  if (!req.body) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  var body = req.body;
  body.id = 'All';
  body.candidateid = 'All';
  body.reqtype = 'view';
  var obj = JSON.stringify(body);
  var call = req.body.interviewdate || req.body.monthdate ? proc.trxrequisition : proc.rmscandidate;
  commonModel.mysqlModelService(call, [obj], function (err, results) {
    if (err) {
      return res.json({ message: err, state: -1, data: null });
    } else {
      if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
        let result = commonCtrl.lazyLoading(results[0], req.body)
        return res.json({ message: results[1][0].message, data: result.data, totalcount: result.count, state: results[1][0].state });
      } else {
        return res.status(400).json({ message: "Something went wrong.", state: -1, data: null });
      }
    }
  })
}

function myUpcomingInterview(req, res) {
  let body = { ...req.body, id: 'All', action: 'pendingInterviews', reqtype: 'upcoming' };
  commonModel.mysqlModelService(proc.trxrequisition, [JSON.stringify(body)], function (err, results) {
    if (err) {
      return res.json({ message: err, state: -1, data: null });
    } else {
      if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
        return res.json({ message: results[1][0].message, data: results[0], state: results[1][0].state });
      } else {
        return res.status(400).json({ message: "Something went wrong.", state: -1, data: null });
      }
    }
  })
}

function reschedulecandidate(req, res) {
  if (!req.body.action) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  req.body.reqtype = 'add';
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService(proc.trxrequisition, [obj], function (err, results) {
    if (err) {
      return res.json({ err: "DB Error", message: err, state: -1, data: null });
    } else {
      if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
        if (req.body.action == "viewreschedulecandidate") {

        }
        return res.json({ message: results[1][0].message, data: results, state: results[1][0].state });
      } else {
        return res.json({ message: "Something went wrong.", state: -1, data: null });
      }
    }
  })
}

function rejectRescheduleRequest(req, res) {
  if (!req.body.id || !req.body.requestedbyid) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  req.body.reqtype = 'edit'
  req.body.action = 'rejectreschedule'
  req.body.requisitionid = 35;
  let obj = req.body;
  commonModel.mysqlModelService(proc.trxrequisition, [JSON.stringify(obj)], function (err, results) {
    if (err) {
      return res.json({ err: "DB Error", message: err, state: -1, data: null });
    } else {
      ////console.log("result",results[0])
      let mailOptions = {
        id: req.body.requestedbyid,
        mailType: 'rejectreschedule',
        moduleid: req.body.moduleid ? req.body.moduleid : "rms",
        headingVariables: {
          heading: "Interview Reschedule Rejection"
        },
        subjectVariables: {
          subject: "Interview Reschedule Rejection"
        },
        bodyVariables: {
          trxcandidatelink: '',
          trxapplicantcode: '',
          trxscreeninglink: '',
          //trxcandidatedob: '',
          trxcandidateemail: results && results[0] && results[0][0] && results[0][0].trxcandidateemail,
          trxcandidatephone: results && results[0] && results[0][0] && results[0][0].trxcandidatephone,
          trxinterviewer: results && results[0] && results[0][0] && results[0][0].trxinterviewer,
          trxinterviewstate: results && results[0] && results[0][0] && results[0][0].trxinterviewstate,//technical,screening,hr
          trxinterviewdate: results && results[0] && results[0][0] && results[0][0].trxinterviewdate,//past date
          trxrescheduledate: '',//New date
          trxcandidateinfo: '',
          trxreshceduleremark: '',
          trxcandidateskill: results && results[0] && results[0][0] && results[0][0].trxcandidateskill,
          trxcandidatequalification: results && results[0] && results[0][0] && results[0][0].trxcandidatequalification,
          trxrescheduledby: '',
          trxcandidatename: req.body.candidatename,
          trxrejectreason: req.body.rejectreason ? req.body.rejectreason : '',
          rejectreason: req.body.rejectreason ? req.body.rejectreason : '',
          candidatename: req.body.candidatename
        },
        createdby: req.body.createdby
      }
      mailservice.mail(mailOptions, function (err, response) {
        //console.log('MAILSSSSSSS', err, response)
      })

      return res.json({
        message: results[0][0].message,
        data: results[0],
        state: results[0][0].state
      });



    }
  })
}

function scheduleView(req, res) {
  var body = req.body;
  body.id = 'All';
  body.candidateid = 'All';
  body.reqtype = 'view';

  var obj = JSON.stringify(body);
  var call = req.body.interviewdate ? proc.trxrequisition : 'call usp_schedule_view(?)';
  commonModel.mysqlModelService(call, [obj], function (err, results) {
    if (err) {
      return res.json({ message: err, state: -1, data: null });
    } else {
      if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
        res.json({ message: results[1][0].message, data: results[0], state: results[1][0].state });
      } else {
        return res.json({ message: "Something went wrong.", state: -1, data: null });
      }
    }
  })
}


function getCandidateData(req, res) {
  if (!req.body || !req.body.createdby) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  var obj = {
    createdby: req.body.createdby,
    id: req.body.id || 'All',
    requisitionid: req.body.reqid,
    populate: req.body.populate || 0,
    reqtype: 'view',
    status: req.body.status,
    stateid: req.body.stateid
  }
  if (req.body.action) obj.action = req.body.action;

  if (req.body.startDate && req.body.endDate) {
    obj.startDate = req.body.startDate;
    obj.endDate = req.body.endDate;
  }
  //console.log('OBJjjjjjjjjjjjj', obj);
  commonModel.mysqlPromiseModelService(proc.rmscandidate, [JSON.stringify(obj)])
    .then((results) => {
      if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
        var result = commonCtrl.lazyLoading(results[0], req.body);
        res.json({ message: results[1][0].message, data: result.data, totalcount: result.count, state: results[1][0].state });
      } else {
        //console.log('ERRRRRRRRRRRR', results);
        return res.json({ message: "Something went wrong.", state: -1, data: null });
      }
    })
    .catch(err => {
      return res.json({ message: err, state: -1, data: null });
    })
}


function preScreeningAccepted(req, res) {

  if (!req.body || !req.body.createdby || !req.body.candidateid || !req.body.requisitionid) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  req.body.action = 'Prescreen';
  req.body.reqtype = 'add';
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService(proc.trxrequisition, [obj], function (err, results) {
    if (err) {
      return res.json({ message: err, state: -1, data: null });
    }
    else if (results && results[0] && results[0][0] && results[0][0].state && results[0][0].state == 1) {
      return res.json({ message: results[0][0].message, data: results[0], state: results[0][0].state });
    } else {
      return res.status(400).json({ message: "Something went wrong.", state: -1, data: null });
    }

  });
}

async function scheduleInterview(req, res) {
  if (!req.body || !req.body.createdby || !(req.body.candidateid || req.body.campusData) || !req.body.requisitionid || !req.body.interviewerid || !req.body.state) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  let dataarr = [];
  let errlog = [];
  if (req.body && req.body.data) {
    dataarr = req.body.data;
  }
  let c2cData = "";
  if (typeof req.body.campusData === "string") {
    c2cData = req.body.campusData && JSON.parse(req.body.campusData);
  } else {
    c2cData = req.body.campusData && JSON.parse(JSON.stringify(req.body.campusData));
  }
  if (c2cData && c2cData.length) {
    _.map(c2cData, (item) => {
      if (item.fileblob) {
        const decodeddata = utils.decodeBase64File(item.fileblob),
          extension = mime.extension(decodeddata.type),
          mediaName = `${uuidv4()}_${item.filename ? item.filename : '.' + extension
            }`,
          dest = utils.makeDirectories("/uploads/c2c_resume");
        fs.writeFileSync(path.join(dest, mediaName), decodeddata.data);
        item.file_name = mediaName;
        item.file_path = path.join("/c2c_resume", mediaName);
      }
    });

    const [dbd, err] = await query(proc.trxrequisition, [
      JSON.stringify({
        action: "addC2CCandidate",
        campusData: c2cData,
      }),
    ]);
    if (dbd && dbd[0] && dbd[0].candidate_id) {
      req.body.candidateid = _.chain(dbd[0].candidate_id)
        .split(",")
        .compact()
        .toString()
        .value();
    }

    if (!req.body.candidateid && !err && err[0] && err[0].email) {
      return res.status(400).json({
        message: "Something went wrong.",
        state: -1,
        data: null,
      });
    } else if (!req.body.candidateid && err && err[0] && err[0].email) {
      return res.json({
        message: "Candidate(s) already rejected from HR/Technical interview",
        state: -2,
        data: null,
        err: err
      });
    }
    errlog = err;
  }

  const drive = req.body && req.body.driveid
  if (drive)
    req.body.driveid = Buffer.from(req.body.driveid, 'base64').toString('binary');
  var candidateInfo = ''; var listofcandidates = ''; var resumelist, resumefilename;
  if (dataarr.length > 0) {
    resumefilename = _.map(dataarr, 'filename')
    resumelist = _.map(dataarr, 'filepath')
    var candidateN; var Cqualifiction; var Cskills;
    dataarr.forEach(function (item) {
      candidateN = item.candidatename ? item.candidatename.charAt(0).toUpperCase() + item.candidatename.slice(1).toLowerCase() : 'N/A'
      Cqualifiction = item.qualification ? item.qualification : 'N/A';
      Cskills = item.skills || item.skillText ? item.skills || item.skillText : 'N/A';
      candidateInfo += ` <h4 style="font-family:Georgia, 'Times New Roman', Times, serif;font-weight: normal;margin:0px;padding:15px 0px 8px;color:#333;font-size:16px;"><b style="padding: 6px 0px;display: inline-block;">Candidate Name : </b> ` + candidateN + `<br><b style="padding: 6px 0px;display: inline-block;">Qualification : </b> ` + Cqualifiction + `<br><b style="padding: 6px 0px;display: inline-block;">Skills : </b> ` + Cskills + `<br><br></h4>`;
      listofcandidates += item.candidatename.charAt(0).toUpperCase() + item.candidatename.slice(1).toLowerCase() + ','
    });
  }
  listofcandidates = listofcandidates.slice(0, listofcandidates.length - 1);
  req.body.reqtype = 'add';
  var body = req.body;
  if (!body.interviewdate)
    body.interviewdate = new Date();

  body.interviewerid = body.interviewerid ? body.interviewerid.toString() : '';
  body.candidateid = body.candidateid && body.candidateid.toString();
  body.action = 'Schedule';
  var endDate = null; var dateFormat;
  if (req.body.interviewdate) {
    req.body.interviewdate = moment(req.body.interviewdate).format("YYYY-MM-DD HH:mm");
    dateFormat = commonCtrl.convertDateFormat(req.body.interviewdate, 10);
    endDate = moment(moment(req.body.interviewdate).add(30, 'm').toDate()).format("YYYY-MM-DD HH:mm");
  }
  var obj = JSON.stringify(body);
  commonModel.mysqlModelService(proc.trxrequisition, [obj], function (err, results) {
    if (err) {
      return res.json({ message: err, state: -1, data: null });
    }
    var startDate = req.body.interviewdate.replace(' ', 'T') + ':00';
    var resultData = results && results[1] && results[1][0];
    endDate = endDate.replace(' ', 'T') + ':00';
    if (resultData && (resultData.stateval == 'Screening' || resultData.stateval == 'Technical Interview' || resultData.stateval == 'HR Interview')) {
      var inviteData = [{
        moduleid: req.body.moduleid ? req.body.moduleid : "rms",
        jobtitle: resultData.jobtitle,
        title: resultData.stateval + ' Scheduled for ' + resultData.candidatelist,
        agenda: req.body.remark || 'Interview Scheduled.', starttime: startDate
        , endtime: endDate, emails: resultData.emaillist,
        frequencyid: resultData.state, module: 'RMS',
        location: req.body.companyname,//|| 'Polestar Solution & Services, India',
        mailType: 'scheduledinterview',
        resumelist: resumelist,
        resumefilename: resumefilename,
        // messageInterview: resultData.stateval + ' is scheduled.<br>',
        //candidateInfo: candidateInfo,
        //interviewMailDate: dateFormat

        trxinterviewer: '',//dataarr[0].interviewer,
        trxinterviewstate: resultData.stateval,//technical,screening,hr
        trxinterviewdate: dateFormat,//past date
        trxrescheduledate: '',//New date
        trxcandidateinfo: candidateInfo,
        trxreqjobtitle: resultData.jobtitle,
        trxreqjobopenings: resultData.trxreqjobopenings,
        trxreqskills: resultData.trxreqskills,
        trxreqexperience: resultData.trxreqexperience,
        trxreqexpiry: commonCtrl.convertDateFormat(resultData.trxreqexpiry, 4),
        trxreqdesignation: resultData.trxreqdesignation,
        trxreshceduleremark: '',
        trxrescheduledby: '',
        trxcandidatelist: resultData.candidatelist,
        interviewlinkoption: req.body.interviewlinkoption

      }];


      let candidates = results && results[0];
      if (resultData.mode == 'Video') {
        if (results && results[0] && results[0][0] && results[0][0].state == -1) {
          return res.json({ message: results[0][0].message, state: -1, data: null });
        }
        let i = 0
        let mailLog = [];
        async.each(candidates, function (item, callback) {
          const link = `${(req.headers.origin || req.body.host) + '/#'}/online-interview?shareid=${item.guid}`;
          const linkURL = drive ? `${link}_${drive}` : link;
          i = i + 1;
          //console.log('linkURL----->>>', linkURL);
          setTimeout(() => {
            var mailOptions = {
              //  userid: req.body.createdby,
              moduleid: req.body.moduleid ? req.body.moduleid : "rms",
              email: item.email,
              mailType: 'onlineScreening',
              subjectVariables: {
                subject: 'Invitation For trxinterviewstate Online Assessment'
              },
              headingVariables: {
                heading: 'Online trxinterviewstate Test'
              },
              bodyVariables: {
                trxinterviewstate: resultData.stateval,
                trxscreeningotp: item.otp,
                trxcompanyname: req.body.companyname || 'Our Organization',
                trxapplicantcode: '',
                trxscreeninglink: linkURL,
                trxcandidatename: item.name
              },
              loop: 1

            };
            mailservice.mail(mailOptions, err => {
              let mailobj = {
                toemail: 'to:{' + mailOptions.email + '}',
                description: ((err && err.reason && err.reason.response) || err) || 'Mail Sent Successfully',
                status: err ? 0 : 1,
                mailtype: mailOptions.mailType,
                action: 'insert',
                mailobj: mailOptions
              }
              mailLog.push(mailobj);
              callback(null, mailLog);
            });
          }, i * 3000);
        }, function () {
          try {
            let action = JSON.stringify({ action: 'insert' })
            let logobj = JSON.stringify(mailLog);
            commonModel.mysqlModelService('call usp_email_logs(?,?)', [action, logobj], function (err) {
              if (err) {
                //console.log('err', err)
              } else {
                //console.log('OK')
              }
            })
          } catch (error) {
            //console.log('err', error)
          }
        })
      }
      addeventService.addevent(inviteData, function (error, data) {
        var body = {
          'calendartoken': data && data[0] && data[0].eventid,
          'id': resultData.state,
          action: 'updatetoken',
          createdby: req.body.tokenFetchedData.id,
          reqtype: 'edit'
        };
        var obj = JSON.stringify(body);
        commonModel.mysqlModelService(proc.trxrequisition, [obj], function (err, success) {
          if (err) {
            return res.json({ message: err, state: -1, data: null });
          }
          if (errlog.length) {
            return res.json({
              message: " Some candidate(s) already rejected from HR/Technical interview",
              data: null,
              err: errlog,
              state: -2,
            });
          } else {
            return res.json({
              message: "success",
              data: results,
              state: 1,
            });
          }
        });

      });
    }
  });
}

async function updateInterviewer(req, res) {
  try {
    if (!req.body.interviewerid || !req.body.action || !req.body.transactionid) {
      return res.json({ state: -1, message: "Required parameter are missing" })
    } else {
      await query(proc.trxrequisition, [JSON.stringify(req.body)]);
      return res.json({ state: 1, message: "Interviewer updated successfully" });
    }
  } catch (err) {
    return res.json({ state: -1, message: "Something went wrong", err: err })
  }
}



function savePreScreeningData(req, res) {
  if (!req.body) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }


  _.each(req.body && req.body.data, function (item) {
    item.createdby = req.body.createdby;
  });


  var obj = JSON.stringify(req.body.data);
  commonModel.mysqlPromiseModelService(proc.candidatebulk_edit, [obj])
    .then(results => {
      if (results && results[0] && results[0][0] && results[0][0].state && results[0][0].state == 1) {
        return res.json({ message: results[0][0].message, data: results[0], state: results[0][0].state });
      } else {
        return res.status(400).json({ message: "Something went wrong.", state: -1, data: null });
      }
    })
    .catch(err => {
      return res.json({ message: err, state: -1, data: null });
    })
}



function getWalkin(req, res) {
  if (!req.body.requisitionid) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  var obj = req.body;
  obj.action = 'getwalkin';
  commonModel.mysqlModelService(proc.drivemasterproc, [JSON.stringify(obj)], function (err, results) {
    if (err) {
      return res.json({ message: err, state: -1, data: null });
    }
    res.json({ message: 'success', data: results[0], state: 1 });

  });
}

function responseSheetData(req, res) {
  if (!req.body.transactionid) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService(proc.interviewquestion_view, [obj], function (err, results) {
    if (err) {
      return res.json({ message: err, state: -1, data: null });
    }
    res.json({ message: 'success', data: results[0], state: 1 });
  });
}


function getHistory(req, res) {
  if (!req.body || !req.body.action || !req.body.candidateid) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  req.body.reqtype = 'view';
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService(proc.trxrequisition, [obj], function (err, results) {

    if (err) {
      return res.json({ message: err, state: -1, data: null });
    }
    res.json({ message: 'success', data: results[0], state: 1 });
  });
}



function actionScreening(req, res) {
  req.body.reqtype = 'edit';
  var body = req.body;
  var obj = JSON.stringify(body);
  commonModel.mysqlPromiseModelService(proc.trxrequisition, [obj])
    .then(results => {
      res.json({ message: 'success', result: results, state: 1 });
    })
    .catch(err => {
      return res.json({ message: err, state: -1, data: null });
    })
}
function filterCandidateData(req, res) {
  var obj = JSON.stringify({
    id: 'All',
    action: 'F',
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    populate: 1,
    createdby: req.body.createdby
  });
  commonModel.mysqlModelService(proc.rmscandidate, [obj], function (err, results) {
    if (err) {
      return res.json({ message: 'failure', state: -1, data: null });
    }
    return res.json({ message: 'success', data: results[0], state: 1 });
  });
}


async function getLateralBatches(req, res) {
  try {
    let obj = req.body;
    obj.action = "lateral_batches";
    var result = await query('call usp_testseries_operations(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.err, state: -1, data: null });
    }
    return res.json({ message: 'Success', state: 1, data: result && result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function getRequisitionwiseCandidates(req, res) {
  try {
    let obj = req.body;
    obj.action = "candidates";
    var result = await query('call usp_testseries_operations(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.err, state: -1, data: null });
    }
    return res.json({ message: 'Success', state: 1, data: result && result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}
async function scheduleOnlineTest(req, res) {
  try {
    if (!req.body.candidateid || !req.body.linkexpiry || !req.body.testseries) {
      return res.json({ state: -1, message: 'Required Parameters are missing' })
    }
    let object = { ...req.body, action: 'schedule_lateral_test' };
    let results = await query('call usp_testseries_operations(?)', [JSON.stringify(object)]);
    sendAssessmentLink(results[0]);
    return res.json({ state: 1, message: 'Online Test Scheduled Successfully' })
  } catch (err) {
    return res.json({ state: -1, message: 'Something went wrong!' });
  }
}

function sendAssessmentLink(data) {
  return new Promise(resolve => {
    let sent = [];
    let errors = [];

    const finalise = () => {
      if ((sent.length + errors.length) >= data.length) {
        resolve({ sent, errors });
      }
    };
    data.forEach((item, index) => {
      let emailObj = {
        email: item.trxcandidateemail,
        to: item.trxcandidateemail,
        bodyVariables: {
          ...item,
          trxassessmentexpiry: moment(item.trxassessmentexpiry).format('MMMM Do YYYY, h:mm:ss a'),
          trxassessmenturl: `${webUrlLink}/#testseries/${item.trxbatchname && item.trxbatchname.toLowerCase()}`
        },
        subjectVariables: {
          subject: 'Pre-Assessment Test Scheduled'
        },
        headingVariables: {
          heading: "Hey Candidate! A pre-assessment test is scheduled for you"
        },
        mailType: 'onlinetest_lateral',
      }

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

  })
}
async function validateLateralCandidate(req, res) {
  if (!req.body.applicant_id || !req.body.applicant_otp) {
    return res.json({ state: -1, message: 'Required Parameters are missing' });
  }
  try {
    let object = { ...req.body, action: 'validate_lateral_candidate' };
    let results = await query('call usp_testseries_operations(?)', [JSON.stringify(object)])
    return res.json({ state: 1, message: 'Success', data: results[0] })
  } catch (err) {
    return res.json({ state: -1, message: err || err.message })
  }
}
async function rescheduleOnlineTest(req, res) {
  try {
    if (!req.body.transactionid) {
      return res.json({ state: -1, message: 'Required Parameters are missing' })
    }
    let object = { ...req.body, action: 'reschedule_lateral_test' };
    let results = await query('call usp_testseries_operations(?)', [JSON.stringify(object)]);
    sendAssessmentLink(results[0]);
    return res.json({ state: 1, message: 'Online Test Scheduled Successfully' })
  } catch (err) {
    return res.json({ state: -1, message: 'Something went wrong!' });
  }
}

async function removeAssessment(req, res) {
  try {
    if (!req.body.transactionid) {
      return res.json({ state: -1, message: 'Required Parameters are missing' })
    }
    let object = { ...req.body, action: 'remove_lateral_test' };
    let results = await query('call usp_testseries_operations(?)', [JSON.stringify(object)]);
    return res.json({ state: 1, message: 'SUccess' })
  } catch (err) {
    return res.json({ state: -1, message: 'Something went wrong!' });
  }
}