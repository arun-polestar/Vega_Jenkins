const proc = require("../common/procedureConfig");
const commonModel = require("../common/Model");
const commonCtrl = require("../common/Controller");
const mailservice = require("../../services/mailerService");
const _ = require("underscore");
const lodash = require("lodash");
const path = require("path");
const async = require("async");
const notificationCtrl = require("../notification/Controller");
const moment = require("moment");
const { makeDirectories } = require("../common/utils");

module.exports = {
  resignationApply: resignationApply,
  resignationView: resignationView,
  resignationApprove: resignationApprove,
  selfviewresignation: selfviewresignation,
  reporteeList: reporteeList,
  viewchecklist: viewchecklist,
  viewchecklistitem: viewchecklistitem,
  updatechecklistitem: updatechecklistitem,
  getexitmaster: getexitmaster,
  addexitmaster: addexitmaster,
  activateexitmaster: activateexitmaster,
  getreasonlist: getreasonlist,
  viewexitquestion: viewexitquestion,
  closeresignation: closeresignation,
  updatefinaldate: updatefinaldate,
  getUsersbyLocation: getUsersbyLocation,
  getresignationlist: getresignationlist,
  retractionapprove: retractionapprove,
  exitreportview: exitreportview,
  viewexitconfig: viewexitconfig,
  exitreport: exitreport,
  addchecklistmaster: addchecklistmaster,
  showchecklist: showchecklist,
  retractresignation: retractresignation,
  initiatechecklist: initiatechecklist,
  exitupload: exitupload,
  checklistbymapid: checklistbymapid,
  updatechecklistform: updatechecklistform,
  initiateQuestionFlag: initiateQuestionFlag,
};

function resignationApply(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    req.body.userData = JSON.parse(req.body.userData);
    req.body.userData.reason =
      req.body &&
      req.body.userData &&
      req.body.userData.reason &&
      req.body.userData.reason.toString();

    let userData = req.body.userData;
    userData.createdby = req.body.createdby;
    var obj = userData;

    // start for upload
    let countfiles = req.body.userData.attachCount || 0;
    countfiles = parseInt(countfiles);
    // var timestamp = Date.now();
    //if (countfiles && countfiles != 0) {
    // if (countfiles > 10) {
    //     return res.json({ message: "File can't be more than 10", state: -1, data: null })
    // }

    let createdby = req.body.createdby.toString();
    let uploadPath = makeDirectories(path.join("uploads", "exit", createdby));
    var filename = [];
    var filepath = [];
    async.times(
      countfiles,
      function (n, next) {
        var sampleFile = {};
        sampleFile = req.files["file[" + n + "]"];
        if (sampleFile) {
          let sampleFile_name = `${Date.now()}_${sampleFile.name}`;
          let filepath1 = path.join(uploadPath, sampleFile_name);
          sampleFile.mv(filepath1, (err) => {
            if (!err) {
              filename.push(sampleFile_name);
              let uploadfilename = path.join(
                "exit",
                createdby,
                sampleFile_name
              );
              filepath.push(uploadfilename);
            }
            next(null, "success");
          });
        } else {
          next(null, "success");
        }
      },
      async (err, users) => {
        obj.filename = (filename && filename.join(",")) || "";
        obj.filepath = (filepath && filepath.join(",")) || "";

        // end for upload
        obj = JSON.stringify(obj);
        commonModel
          .mysqlPromiseModelService(proc.resignationOperation, [obj])
          .then((results) => {
            //console.log(results, "<<<<<<<<<<<<<< results");
            //console.log(req.body, "data in req");
            if (
              results &&
              results[2] &&
              results[2][0] &&
              results[2][0].state &&
              results[2][0].state == 1
            ) {
              res.json({
                state: results[2][0].state,
                message:
                  results &&
                  results[2] &&
                  results[2][0] &&
                  results[2][0].message,
                ismanager:
                  results &&
                  results[2] &&
                  results[2][0] &&
                  results[2][0].ismanager,
                data: results && results[0],
              });
              let subjecttype;
              let headingtype;

              if (
                results &&
                results[1] &&
                results[1][0] &&
                results[1][0].useremail
              ) {
                subjecttype =
                  results[1][0].trxexitapplyusername +
                  " has initiated resignation !";
                headingtype =
                  results[1][0].trxexitapplyusername +
                  " has initiated resignation !";
                let bodyVariables = {
                  trxexituserrname: results[1][0].trxexituserrname || "",
                  trxexitapplyusername:
                    results[1][0].trxexitapplyusername || "",
                  trxexitreason: results[1][0].trxexitreason || "",
                  trxexitcomment: results[1][0].trxexitcomment || "",
                  trxexitapplydate: results[1][0].trxexitapplydate || "",
                  trxexitstatus:
                    req.body && req.body.userData && req.body.userData.status,
                };
                let subjectVariables = {
                  subject: subjecttype,
                };
                let headingVariables = {
                  heading: headingtype,
                };
                let emailObj = {
                  //cc: results && results[1] && results[1][0] && results[1][0].useremail || '',
                  email:
                    (results &&
                      results[1] &&
                      results[1][0] &&
                      results[1][0].useremail) ||
                    "",
                  moduleid: req.body.moduleid ? req.body.moduleid : "Exit",
                  userid:
                    (req.body &&
                      req.body.userData &&
                      req.body.userData.reportees) ||
                    req.body.createdby, //req.body.userid ? req.body.userid : req.body.createdby,
                  mailType: "resignationapply",
                  bodyVariables,
                  subjectVariables,
                  headingVariables,
                };
                mailservice.mail(emailObj, function (err) {
                  if (err) {
                    //console.log("MAILLLLLLLLLLL", err);
                  }
                });
                let message = {
                  notification: {
                    title: "Exit",
                    body: `${results[1][0].trxexitapplyusername} has applied for resignation.`,
                  },
                  data: {
                    route: "/exit",
                    type: "exit",
                  },
                };
                notificationCtrl.sendNotificationToMobileDevices(
                  req.body.tokenFetchedData.managerid,
                  message
                );

                var msgbody = `${results[1][0].trxexitapplyusername} has applied for resignation.`;

                var keysdata = {
                  createdby: req.body.createdby,
                  touser: req.body.tokenFetchedData.managerid,
                  description: msgbody,
                  module: "Exit",
                  action: "add",
                };

                notificationCtrl.saveUserNotificationDirect(keysdata);
              }
              //mail service
              // obj = JSON.parse(obj);
              // obj.action = obj.action == 'retractrequest' ? "mailonresignationretract" : "mailonresignationapply";
              // obj = JSON.stringify(obj);
              // commonModel.mysqlModelService(proc.resignationOperation, [obj], function (err, results) {
              //     if (err) {
              //         return res.json({ message: 'Some error occured.', data: err, state: -1 });
              //     }
              //     else {
              //         let subjecttype;
              //         let headingtype;
              //         if (results && results[0] && results[0][0] && results[0][0].useremail) {
              //             if (results[0][0].mailtype == "resignationapply") {
              //                 subjecttype = results[0][0].exitname + " has initiated resignation !";
              //                 headingtype = "Resignation is applied ";
              //             } else if (results[0][0].mailtype == "resignationapplybysupervisor") {
              //                 subjecttype = results[0][0].exitname + " has initiated your resignation !";
              //                 headingtype = "Your Resignation applied by Supervisor";
              //             } else if (results[0][0].mailtype == "hrresignationapply") {
              //                 subjecttype = results[0][0].exitname + " has initiated resignation !";
              //                 headingtype = "Resignation is applied";
              //             } else if (results[0][0].mailtype == "hrresignationapplybysupervisor") {
              //                 subjecttype = results[0][0].exitname + " has initiated your resignation !";
              //                 headingtype = "Resignation applied by Supervisor";
              //             } else if (results[0][0].mailtype == "selfresignationapply") {
              //                 subjecttype = results[0][0].exitname + " has initiated resignation !";
              //                 headingtype = "You have initate your Resignation";
              //             } else if (results[0][0].mailtype == "reporteeresignationapply") {
              //                 subjecttype = results[0][0].exitname + " resignation initiated";
              //                 headingtype = "You have initate Your Reportee Resignation";
              //             } else if (results[0][0].mailtype == "retractresignation") {
              //                 subjecttype = results[0][0].exitname + " has retracted resignation!";
              //                 headingtype = "Resignation has been  Retracted";
              //             }
              //             // //console.log('##################################', results)
              //             let bodyVariables = {
              //                 exitname: results[0][0].exitname || '',
              //                 exitreason: results[0][0].exitreason || '',
              //                 retractreason: results[0][0].retractreason || '',
              //                 exitnames: results[0][0].exitname || '',
              //             }
              //             let subjectVariables = {
              //                 subject: subjecttype,
              //             };
              //             let headingVariables = {
              //                 heading: headingtype,
              //             };
              //             let emailObj = {
              //                 bcc: results && results[0] && results[0][0] && results[0][0].useremail,
              //                 mailType: results && results[0] && results[0][0] && results[0][0].mailtype,
              //                 bodyVariables, subjectVariables, headingVariables
              //             };
              //             mailservice.mail(emailObj, function (err) {
              //                 if (err) {
              //                     //console.log("MAILLLLLLLLLLL", err);
              //                 }
              //             })
              //         }
              //         if (results && results[1] && results[1][0] && results[1][0].useremail) {
              //             if (results[1][0].hrmailtype == "resignationapply") {
              //                 subjecttype = results[1][0].exitname + " has initiated resignation !";
              //                 headingtype = "Resignation is applied ";
              //             } else if (results[1][0].hrmailtype == "resignationapplybysupervisor") {
              //                 subjecttype = results[1][0].exitname + " has initiated your resignation !";
              //                 headingtype = "Your Resignation applied by Supervisor";
              //             } else if (results[1][0].hrmailtype == "hrresignationapply") {
              //                 subjecttype = results[1][0].exitname + " has initiated resignation !";
              //                 headingtype = "Resignation is applied";
              //             } else if (results[1][0].hrmailtype == "hrresignationapplybysupervisor") {
              //                 subjecttype = results[1][0].exitname + " has initiated your resignation !";
              //                 headingtype = "Resignation applied by Supervisor";
              //             } else if (results[1][0].hrmailtype == "selfresignationapply") {
              //                 subjecttype = results[1][0].exitname + " has initiated resignation !";
              //                 headingtype = "You have initate your Resignation";
              //             } else if (results[1][0].hrmailtype == "reporteeresignationapply") {
              //                 subjecttype = results[1][0].exitname + " resignation initiated";
              //                 headingtype = "You have initate Your Reportee Resignation";
              //             } else if (results[1][0].hrmailtype == "retractresignation") {
              //                 subjecttype = results[1][0].exitname + " has retracted resignation!";
              //                 headingtype = "Resignation has been  Retracted";
              //             }
              //             let bodyVariables = {
              //                 exitname: results[1][0].exitname || '',
              //                 exitreason: results[1][0].exitreason || '',
              //                 retractreason: results[1][0].retractreason || '',
              //                 exitnames: results[1][0].exitname || '',
              //             }
              //             let subjectVariables = {
              //                 subject: subjecttype,
              //             }
              //             let headingVariables = {
              //                 heading: headingtype,
              //             }
              //             // //console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@', results)
              //             let emailObj = {
              //                 bcc: results && results[1] && results[1][0] && results[1][0].useremail,
              //                 mailType: results && results[1] && results[1][0] && results[1][0].hrmailtype,
              //                 bodyVariables, subjectVariables, headingVariables
              //             };
              //             mailservice.mail(emailObj, function (err) {
              //                 if (err) {
              //                     //console.log("MAILLLLLLLLLLL", err);
              //                 }
              //                 else {
              //                     // return res.json({ state: 1, message: 'mail sent' });
              //                 }
              //             })
              //         }
              //         if (results && results[2] && results[2][0] && results[2][0].useremail) {
              //             // //console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@', results);
              //             if (results[2][0].hrmailtype == "resignationapply") {
              //                 subjecttype = results[2][0].exitname + " has initiated resignation !";
              //                 headingtype = "Resignation is applied ";
              //             } else if (results[2][0].hrmailtype == "resignationapplybysupervisor") {
              //                 subjecttype = results[2][0].exitname + " has initiated your resignation !";
              //                 headingtype = "Your Resignation applied by Supervisor";
              //             } else if (results[2][0].hrmailtype == "hrresignationapply") {
              //                 subjecttype = results[2][0].exitname + " has initiated resignation !";
              //                 headingtype = "Resignation is applied";
              //             } else if (results[2][0].hrmailtype == "hrresignationapplybysupervisor") {
              //                 subjecttype = results[2][0].exitname + " has initiated your resignation !";
              //                 headingtype = "Resignation applied by Supervisor";
              //             } else if (results[2][0].hrmailtype == "selfresignationapply") {
              //                 subjecttype = results[2][0].exitname + " has initiated resignation !";
              //                 headingtype = "You have initate your Resignation";
              //             } else if (results[2][0].hrmailtype == "reporteeresignationapply") {
              //                 subjecttype = results[2][0].exitname + " resignation initiated";
              //                 headingtype = "You have initated your Reportee Resignation";
              //             } else if (results[2][0].hrmailtype == "retractresignation") {
              //                 subjecttype = results[2][0].exitname + " has retracted resignation!";
              //                 headingtype = "Resignation has been  Retracted";
              //             }
              //             let bodyVariables = {
              //                 exitname: results[2][0].exitname || '',
              //                 exitreason: results[2][0].exitreason || '',
              //                 retractreason: results[2][0].retractreason || '',
              //                 exitname: results[2][0].exitname || '',
              //             }
              //             let subjectVariables = {
              //                 subject: subjecttype,
              //             }
              //             let headingVariables = {
              //                 heading: headingtype,
              //             }
              //             let emailObj = {
              //                 bcc: results && results[2] && results[2][0] && results[2][0].useremail,
              //                 mailType: results && results[2] && results[2][0] && results[2][0].hrmailtype,
              //                 bodyVariables, subjectVariables, headingVariables
              //             };
              //             mailservice.mail(emailObj, function (err) {
              //                 if (err) {
              //                     //console.log("MAILLLLLLLLLLL", err);
              //                 }
              //                 else {
              //                     // return res.json({ state: 1, message: 'mail sent' });
              //                 }
              //             })
              //         }
              //     }
              // });
              // end mail service
            } else {
              return res.json({
                state: -1,
                message: "Something went wrong",
                data: null,
              });
            }
          })
          .catch((err) => {
            return res.json({
              state: -1,
              data: null,
              message: err.message || err,
            });
          });
      }
    );
  }
}

function reporteeList(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    req.body.action = "reporteelist";
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.resignationOperation, [obj])
      .then((results) => {
        if (
          results &&
          results[1] &&
          results[1][0] &&
          results[1][0].state &&
          results[1][0].state == 1
        ) {
          return res.json({
            state: results[1][0].state,
            message:
              results && results[1] && results[1][0] && results[1][0].message,
            data: results && results[0],
          });
        } else {
          return res.json({
            state: -1,
            message: "Something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function getreasonlist(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.resignationOperation, [obj])
      .then((results) => {
        if (
          results &&
          results[1] &&
          results[1][0] &&
          results[1][0].state &&
          results[1][0].state == 1
        ) {
          return res.json({
            state: results[1][0].state,
            message:
              results && results[1] && results[1][0] && results[1][0].message,
            data: results && results[0],
          });
        } else {
          return res.json({
            state: -1,
            message: "Something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function resignationApprove(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.resignationOperation, [obj])
      .then((results) => {
        //console.log('anuj', req.body);
        //console.log(results, "<<<<<<<<<<<<< results");
        if (
          results &&
          results[2] &&
          results[2][0] &&
          results[2][0].state &&
          results[2][0].state == 1
        ) {
          res.json({
            state: results[2][0].state,
            message: results[2][0].message,
          });
          if (
            results &&
            results[0] &&
            results[0][0] &&
            results[0][0].useremail
          ) {
            let subjecttype;
            let headingtype;
            if (results[0][0].mailtype == "exitapprovebyhr") {
              subjecttype = "Resignation Is Approved By HR";
              headingtype = "Resignation is approved By HR";
            } else if (results[0][0].mailtype == "exitapprovedbysupervisor") {
              subjecttype = "Resignation Is Approved  By Supervisor";
              headingtype = "Resignation is Approved  By Supervisor";
            }
            let bodyVariables = {
              trxapprovedby: results[0][0].trxapprovedby || "",
              trxrejectedby: results[0][0].trxrejectedby || "",
              trxretractreason: results[0][0].trxretractreason || "",
              trxexituserrname: results[0][0].trxexituserrname || "",
              trxexitapplyusername: results[0][0].trxexitapplyusername || "",
              trxexitreason: results[0][0].trxexitreason || "",
              trxexitcomment: results[0][0].trxexitcomment || "",
              trxexitapplydate: results[0][0].trxexitapplydate || "",
              trxapprovedremark: results[0][0].trxapprovedremark || "", //by hr
              trxexitstatus: "", //exit
              trxrelievingdate:
                req.body &&
                req.body.relievingdate &&
                moment(req.body.relievingdate, "YYYY-MM-DD").format(
                  "DD-MM-YYYY"
                ),
            };
            let subjectVariables = {
              subject: subjecttype,
            };
            let headingVariables = {
              heading: headingtype,
            };
            let emailObj = {
              // cc: results[0][0].useremail,
              email: results[0][0].useremail,
              mailType: results[0][0].mailtype,
              moduleid: req.body.moduleid ? req.body.moduleid : "Exit",
              userid: req.body.userid ? req.body.userid : req.body.createdby,
              bodyVariables,
              subjectVariables,
              headingVariables,
            };
            mailservice.mail(emailObj, function (err) {
              if (err) {
                //console.log("MAILLLLLLLLLLL", err);
              } else {
                // return res.json({ state: 1, message: 'mail sent' });
              }
            });
          }
          let message = {
            notification: {
              title: "Exit",
              body: `${req.body.tokenFetchedData.firstname} ${req.body.tokenFetchedData.lastname} has approved your resignation.`,
            },
            data: {
              route: "/exit",
              type: "exit",
            },
          };
          notificationCtrl.sendNotificationToMobileDevices(
            req.body.userid,
            message
          );

          var msgbody = `${req.body.tokenFetchedData.firstname} ${req.body.tokenFetchedData.lastname} has approved your resignation.`;

          var keysdata = {
            createdby: req.body.createdby,
            touser: req.body.userid,
            description: msgbody,
            module: "Exit",
            action: "add",
          };

          notificationCtrl.saveUserNotificationDirect(keysdata);

          // if (results && results[1] && results[1][0] && results[1][0].useremail) {
          //     if (results[1][0].mailtype == "exitapprovebyhr") {
          //         subjecttype = "Resignation is approved by HR";
          //         headingtype = "Resignation is approved By HR";
          //     } else if (results[1][0].mailtype == "exitapprovedbysupervisor") {
          //         subjecttype = "Resignation is approved  by Supervisor";
          //         headingtype = "Resignation is Approved  By Supervisor";
          //     }
          //     let bodyVariables = {
          //         trxexituserrname: results[0][0].trxexituserrname || '',
          //         trxactiontakenby: results[0][0].trxactiontakenby || '',
          //         trxexitapplyusername: results[0][0].trxexitapplyusername || '',
          //         trxexitreason: results[0][0].trxexitreason || '',
          //         trxexitcomment: results[0][0].trxexitcomment || '',
          //         trxexitapplydate: results[0][0].trxexitapplydate || '',
          //     }
          //     let subjectVariables = {
          //         subject: subjecttype,
          //     }
          //     let headingVariables = {
          //         heading: headingtype,
          //     }
          //     //console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@', results)
          //     let emailObj = {
          //         //cc: results && results[1] && results[1][0] && results[1][0].useremail,
          //         email: results && results[1] && results[1][0] && results[1][0].useremail,
          //         moduleid: req.body.moduleid ? req.body.moduleid : 'Exit',
          //         userid: req.body.userid ? req.body.userid : req.body.createdby,
          //         mailType: results && results[1] && results[1][0] && results[1][0].mailtype,
          //         bodyVariables, subjectVariables, headingVariables
          //     };
          //     mailservice.mail(emailObj, function (err) {
          //         if (err) {
          //             //console.log("MAILLLLLLLLLLL", err);
          //         }

          //         else {
          //             // return res.json({ state: 1, message: 'mail sent' });
          //         }
          //     })
          // }
          // end mail service
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function selfviewresignation(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.resignationOperation, [obj])
      .then((results) => {
        return res.json({
          state: 1,
          message: "Success",
          ismanager:
            results && results[3] && results[3][0] && results[3][0].ismanager,
          initiateExitQuestion:
            results &&
            results[3] &&
            results[3][0] &&
            results[3][0].initiateExitQuestion,
          data: results[0][0],
          checklist: results[1],
          question: results[2],
        });
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function resignationView(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.resignationOperation, [obj])
      .then((results) => {
        if (
          results &&
          results[1] &&
          results[1][0] &&
          results[1][0].state &&
          results[1][0].state == 1
        ) {
          if (results && results[0] && results[0][0] && results[0][0].reason) {
            var reason = results[0][0].reason;
            var reasonArr = reason && reason.toString().split(",");
            results[0][0].reason = reasonArr;
          }
          dbresult = commonCtrl.lazyLoading(results[0], req.body);
          if (dbresult && "data" in dbresult && "count" in dbresult) {
            return res.json({
              state: 1,
              message: "success",
              data: dbresult.data,
              count: dbresult.count,
              ismanager: results[1][0].ismanager,
              initiateExitQuestion:
                results[1][0] && results[1][0].initiateExitQuestion,
            });
          }
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function viewchecklist(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.resignationOperation, [obj])
      .then((results) => {
        if (
          results &&
          results[1] &&
          results[1][0] &&
          results[1][0].state &&
          results[1][0].state == 1
        ) {
          return res.json({
            state: results[1][0].state,
            message: results[1][0].message,
            data: results[0],
          });
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: results,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function viewexitquestion(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.resignationOperation, [obj])
      .then((results) => {
        if (
          results &&
          results[1] &&
          results[1][0] &&
          results[1][0].state &&
          results[1][0].state == 1
        ) {
          return res.json({
            state: results[1][0].state,
            message: results[1][0].message,
            data: results[0],
          });
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function viewchecklistitem(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.resignationOperation, [obj])
      .then((results) => {
        if (
          results &&
          results[1] &&
          results[1][0] &&
          results[1][0].state &&
          results[1][0].state == 1
        ) {
          return res.json({
            state: results[1][0].state,
            message: results[1][0].message,
            data: results[0],
          });
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function updatechecklistitem(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    let obj = JSON.stringify(req.body.checkList);
    let obj1 = {
      createdby: req.body.createdby,
      type: req.body.type,
      resignationid: req.body.resignationid,
      action: req.body && req.body.action,
    };
    obj1 = JSON.stringify(obj1);
    commonModel
      .mysqlPromiseModelService(proc.updatechecklist, [obj, obj1])
      .then((results) => {
        if (
          results &&
          results[0] &&
          results[0][0] &&
          results[0][0].state &&
          results[0][0].state == 1
        ) {
          return res.json({
            state: results[0][0].state,
            message: results[0][0].message,
            data: results[0],
          });
          //mail
          //end mail
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function addexitmaster(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    if (
      req.body &&
      req.body.action &&
      req.body.action == "addchecklistmaster"
    ) {
      var newdata = [];
      var owner = req.body.owner;
      var mappingData = req.body.mappingData;
      owner.map((item) => {
        mappingData.map((item1) => {
          item.departmentid = item1.departmentid;
          item.mapid = item1.mapid;
          newdata.push(item);
        });
      });
      req.body.newdata = newdata;
      var obj = JSON.stringify(req.body);
      var procname = proc.checklistOperation;
    } else {
      var obj = JSON.stringify(req.body);
      var procname = proc.resignationMaster;
    }
    var obj1 = null;
    if (req.body && req.body.configcode == "checklistitem") {
      obj1 = req.body && req.body.ownerdata;
    } else if (req.body && req.body.configcode == "exitquestion") {
      obj1 = req.body && req.body.questions;
    } else {
      obj1 = "";
    }

    commonModel
      .mysqlPromiseModelService(procname, [obj, obj1])
      .then((results) => {
        if (
          results &&
          results[0] &&
          results[0][0] &&
          results[0][0].state &&
          results[0][0].state == 1
        ) {
          return res.json({
            message: results[0][0].message,
            state: results[0][0].state,
            data: results[0],
          });
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function getexitmaster(req, res) {
  if (!req.body.action) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.resignationMaster, [obj, ""])
      .then((results) => {
        let dbresult = commonCtrl.lazyLoading(results[0], req.body);
        
        if (dbresult && "data" in dbresult && "count" in dbresult) {
          return res.json({
            state: 1,
            message: "success",
            data: dbresult.data,
            count: dbresult.count,
          });
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function activateexitmaster(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({ message: "send required data", date: -1, data: null });
  } else {
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.resignationMaster, [obj, ""])
      .then((results) => {
        if (
          results &&
          results[0] &&
          results[0][0] &&
          results[0][0].state &&
          results[0][0].state == 1
        ) {
          return res.json({
            state: results[0][0].state,
            message: results[0][0].message,
          });
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function updatefinaldate(req, res) {
  if (!req.body || req.body.finalrelieving_date) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    var obj = req.body;
    obj.action = "datechange";
    obj = JSON.stringify(obj);
    commonModel
      .mysqlPromiseModelService(proc.resignationOperation, [obj])
      .then((results) => {
        if (
          results &&
          results[0] &&
          results[1][0] &&
          results[1][0].state &&
          results[1][0].state == 1
        ) {
          return res.json({
            state: results[1][0].state,
            message:
              results && results[0] && results[1][0] && results[1][0].message,
            data: results && results[0],
          });
        } else {
          return res.json({
            state: -1,
            message: "Something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function closeresignation(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    var obj = req.body;
    obj.action = "resignclose";
    obj = JSON.stringify(obj);
    commonModel
      .mysqlPromiseModelService(proc.resignationOperation, [obj])
      .then((results) => {
        if (
          results &&
          results[0] &&
          results[1][0] &&
          results[1][0].state &&
          results[1][0].state == 1
        ) {
          res.json({
            state: results[1][0].state,
            message:
              results && results[0] && results[1][0] && results[1][0].message,
            data: results && results[0],
          });
          subjecttype =
            results[0][0] &&
            results[0][0].trxexituserrname +
              " resignation has been Completed !";
          headingtype =
            results[0][0] &&
            results[0][0].trxexituserrname +
              " resignation has been Completed !!";
          let bodyVariables = {
            trxexitapplyusername:
              (results[0][0] && results[0][0].trxexituserrname) || "",
            trxrelievingdate:
              (results[0][0] && results[0][0].trxrelievingdate) || "",
          };
          let subjectVariables = {
            subject: subjecttype,
          };
          let headingVariables = {
            heading: headingtype,
          };
          let emailObj = {
            //cc: results && results[1] && results[1][0] && results[1][0].useremail || '',
            email: (results[0][0] && results[0][0].useremail) || "",
            moduleid: req.body.moduleid ? req.body.moduleid : "Exit",
            userid:
              (results[0][0] && results[0][0].userid) || req.body.createdby, //req.body.userid ? req.body.userid : req.body.createdby,
            mailType: "resignationclose",
            bodyVariables,
            subjectVariables,
            headingVariables,
          };
          mailservice.mail(emailObj, function (err) {
            if (err) {
              //console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
              //console.log("MAILLLLLLLLLLL", err);
            }
          });
        } else {
          return res.json({
            state: -1,
            message: "Something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        //console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', err);

        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function getUsersbyLocation(req, res) {
  if (!req.body || !req.body.createdby) {
    return res.json({
      message: "Required parameters are missing.",
      state: -1,
      data: null,
    });
  }
  var obj = req.body;
  commonModel.mysqlModelService(
    proc.employeeList,
    [JSON.stringify(obj)],
    function (err, results) {
      if (err) {
        return res.json({ message: err, state: -1, data: null });
      } else {
        if (
          results &&
          results[1] &&
          results[1][0] &&
          results[1][0].state &&
          results[1][0].state == 1
        ) {
          return res.json({
            data: results[0],
            state: results[1][0].state,
            message: results[1][0].message,
          });
        } else {
          return res
            .status(400)
            .json({ message: "Something went wrong.", state: -1, data: null });
        }
      }
    }
  );
}

function getresignationlist(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.resignationOperation, [obj])
      .then((results) => {
        var dbresult = commonCtrl.lazyLoading(results[0], req.body);
        if (dbresult && "data" in dbresult && "count" in dbresult) {
          return res.json({
            state: 1,
            message: "success",
            data: dbresult.data,
            count: dbresult.count,
          });
        } else {
          return res.json({
            state: -1,
            message: "Something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function retractionapprove(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    let subjecttype;
    let headingtype;
    var retractionstatus;
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.resignationOperation, [obj])
      .then((results) => {
        if (
          results &&
          results[1] &&
          results[1][0] &&
          results[1][0].state &&
          results[1][0].state == 1
        ) {
          res.json({
            state: results[1][0].state,
            message:
              results && results[1] && results[1][0] && results[1][0].message,
            data: results && results[0],
          });
          if (
            results &&
            results[0] &&
            results[0][0] &&
            results[0][0].useremail
          ) {
            if (results[0][0].mailtype == "retractionapproved") {
              subjecttype = "Retraction has been Approved";
              headingtype = "Retraction has been Approved";
              retractionstatus = "approved";
            } else if (results[0][0].mailtype == "retractionrejected") {
              subjecttype = "Retraction has been Rejected";
              headingtype = "Retraction has been Rejected";
              retractionstatus = "rejected";
            }
            let subjectVariables = {
              subject: subjecttype,
            };
            let headingVariables = {
              heading: headingtype,
            };
            let bodyVariables = {
              trxapprovedby: results[0][0].trxapprovedby || "",
              trxrejectedby: results[0][0].trxrejectedby || "",
              trxretractreason: results[0][0].trxretractreason || "",
              trxexituserrname: results[0][0].trxexituserrname || "",
              trxexitapplyusername: results[0][0].trxexitapplyusername || "",
              trxexitreason: results[0][0].trxexitreason || "",
              trxexitcomment: results[0][0].trxexitcomment || "",
              trxexitapplydate: results[0][0].trxexitapplydate || "",
            };
            let emailObj = {
              //cc: results && results[0] && results[0][0] && results[0][0].useremail,
              email:
                results &&
                results[0] &&
                results[0][0] &&
                results[0][0].useremail,
              moduleid: req.body.moduleid ? req.body.moduleid : "Exit",
              userid: req.body.userid ? req.body.userid : req.body.createdby,
              mailType:
                results &&
                results[0] &&
                results[0][0] &&
                results[0][0].mailtype,
              bodyVariables,
              headingVariables,
              subjectVariables,
            };

            let message = {
              notification: {
                title: "Exit",
                body: `Retraction requested by you is ${retractionstatus} by ${req.body.tokenFetchedData.firstname} ${req.body.tokenFetchedData.lastname}.`,
              },
              data: {
                route: "/exit",
                type: "exit",
              },
            };
            notificationCtrl.sendNotificationToMobileDevices(
              req.body.userid,
              message
            );

            var msgbody = `Retraction requested by you is ${retractionstatus} by ${req.body.tokenFetchedData.firstname} ${req.body.tokenFetchedData.lastname}.`;

            var keysdata = {
              createdby: req.body.createdby,
              touser: req.body.userid,
              description: msgbody,
              module: "Exit",
              action: "add",
            };

            notificationCtrl.saveUserNotificationDirect(keysdata);
            mailservice.mail(emailObj, function (err) {
              if (err) {
                //console.log("MAILLLLLLLLLLL", err);
              } else {
                // return res.json({ state: 1, message: 'mail sent' });
              }
            });
          }
        } else {
          return res.json({
            state: -1,
            message: "Something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function exitreportview(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.resignationOperation, [obj])
      .then((results) => {
        if (
          results &&
          results[4] &&
          results[4][0] &&
          results[4][0].state &&
          results[4][0].state == 1
        ) {
          return res.json({
            state: results[4][0].state,
            message: results[4][0].state,
            ismanager: results[4][0].ismanager,
            data: results,
          });
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function exitreport(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.resignationOperation, [obj])
      .then((results) => {
        dbresult = commonCtrl.lazyLoading(results[0], req.body);
        if (dbresult && "data" in dbresult && "count" in dbresult) {
          return res.json({
            state: 1,
            message: "success",
            data: dbresult.data,
            count: dbresult.count,
          });
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function viewexitconfig(req, res) {
  if (!req.body.mapid) {
    return res.json({ state: -1, message: "Required Parameters are Missing" });
  }
  let obj = req.body;
  obj.action = "viewconfig";
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService(proc.resignationMaster, [obj, ""])
    .then((result) => {
      if (result[0] && result[0].length) {
        let maparr = [];
        lodash.each(result[0], function (item) {
          maparr.push({
            departmentid: item.departmentid,
            departmentname: item.departmentname,
            mapid: item.mapid,
          });
        });
        result[0][0].data = maparr;
        delete result[0][0].mapid;
        delete result[0][0].department;
        delete result[0][0].designation;
        delete result[0][0].departmentname;
        delete result[0][0].designationname;

        return res.json({ state: 1, message: "Success", data: result[0][0] });
      } else {
        return res.json({ state: 1, message: "AAAAAAAAcess", data: result[0] });
      }
    })
    .catch((err) => {
      res.json({ message: err, data: err, state: -1 });
    });
}

async function addchecklistmaster(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    if (
      req.body &&
      req.body.action &&
      req.body.action == "addchecklistmaster"
    ) {
      var newdata = [];
      var ownerdata = req.body && req.body.ownerdata;
      var mappingData = req.body.mappingData;
      ownerdata.map((item) => {
        mappingData.map((item1) => {
          newdata.push({
            ...item,
            departmentid: item1.departmentid,
            mapid: item1.mapid,
            newmapid: item1.newmapid,
          });
        });
      });
      req.body.newdata = newdata;
      req.body = await commonCtrl.verifyNull(req.body);
      var obj = JSON.stringify(req.body);
    }
    commonModel
      .mysqlPromiseModelService(proc.checklistOperation, [obj])
      .then((results) => {
        return res.json({
          state: results[0][0].state,
          message: results[0][0].message,
          data: results,
        });
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function showchecklist(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.resignationOperation, [obj])
      .then((results) => {
        var groupedData = _.groupBy(results[0], (val) => {
          return (
            val.formname +
            "#@#" +
            val.approvalrequired +
            "#@#" +
            val.approvalname
          );
        });
        let arr = [];
        for (const [key, value] of Object.entries(groupedData)) {
          arr.push({
            formname: key.split("#@#")[0],
            approvalrequired: key.split("#@#")[1],
            approvalname: key.split("#@#")[2],
            checklistdata: value,
          });
        }
        let arr_result = [];
        arr_result.push(arr);
        arr_result.push(results[1]);
        return res.json({
          state: "1",
          message: "success",
          data: arr_result,
          initiateExitQuestion:
            results[2] && results[2][0] && results[2][0].initiateExitQuestion,
        });
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function retractresignation(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.resignationOperation, [obj])
      .then((results) => {
        //console.log(results, "<<<<<<<<<<<<<<<< results");
        //console.log(req.body, "data in req");
        res.json({ state: "1", message: "success", data: results });
        let subjecttype;
        let headingtype;
        if (results && results[0] && results[0][0] && results[0][0].useremail) {
          subjecttype =
            results[0][0].trxexituserrname + " has retracted resignation!";
          headingtype =
            results[0][0].trxexituserrname + " has retracted resignation!";
          let bodyVariables = {
            trxexituserrname: results[0][0].trxexituserrname || "",
            trxexitapplyusername: results[0][0].trxexitapplyusername || "",
            trxexitreason: results[0][0].trxexitreason || "",
            trxretractcomment: results[0][0].trxretractcomment || "",
            trxexitapplydate: results[0][0].trxexitapplydate || "",
          };
          let subjectVariables = {
            subject: subjecttype,
          };
          let headingVariables = {
            heading: headingtype,
          };
          let emailObj = {
            // cc: results && results[0] && results[0][0] && results[0][0].useremail || '',
            email:
              (results &&
                results[0] &&
                results[0][0] &&
                results[0][0].useremail) ||
              "",
            moduleid: req.body.moduleid ? req.body.moduleid : "Exit",
            userid: req.body.userid ? req.body.userid : req.body.createdby,
            mailType: "retractresignation",
            bodyVariables,
            subjectVariables,
            headingVariables,
          };
          mailservice.mail(emailObj, function (err) {
            if (err) {
              //console.log("MAILLLLLLLLLLL", err);
            }
          });
        }

        let message = {
          notification: {
            title: "Exit",
            body: `${results[0][0].trxexitapplyusername} has retracted resignation.`,
          },
          data: {
            route: "/exit",
            type: "exit",
          },
        };
        notificationCtrl.sendNotificationToMobileDevices(
          req.body.tokenFetchedData.managerid,
          message
        );

        var msgbody = `${results[0][0].trxexitapplyusername} has retracted resignation.`;

        var keysdata = {
          createdby: req.body.createdby,
          touser: req.body.tokenFetchedData.managerid,
          description: msgbody,
          module: "Exit",
          action: "add",
        };

        notificationCtrl.saveUserNotificationDirect(keysdata);
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function initiatechecklist(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.resignationOperation, [obj])
      .then((results) => {
        res.json({ state: "1", message: "success", data: results[2] });
        if (results && results[0]) {
          var list = results[0];
          let subjecttype;
          let headingtype;
          list.forEach(function (item) {
            subjecttype = "Checklist has been Initiated for Approval";
            headingtype = "Checklist has been Initiated for Approval";

            let bodyVariables = {
              trxexitapplyusername: (item && item.trxexitapplyusername) || "",
              trxexituserrname: (item && item.trxexituserrname) || "",
              trxexitreason: (item && item.trxexitreason) || "",
              trxexitcomment: (item && item.trxexitcomment) || "",
              trxchecklistitem: (item && item.trxchecklistitem) || "",
              trxexitapplydate: (item && item.trxexitapplydate) || "",
            };
            let subjectVariables = {
              subject: subjecttype,
            };
            let headingVariables = {
              heading: headingtype,
            };
            let emailObj = {
              //cc: item.useremail,
              email: (item && item.useremail) || "",
              mailType: "exitchecklistinitate",
              moduleid: req.body.moduleid ? req.body.moduleid : "Exit",
              userid: req.body.userid ? req.body.userid : req.body.createdby,
              bodyVariables,
              subjectVariables,
              headingVariables,
            };
            mailservice.mail(emailObj, function (err) {
              if (err) {
                //console.log("MAILLLLLLLLLLL", err);
              }
            });
          });
        }
        if (results && results[1] && results[1][0] && results[1][0].useremail) {
          let subjecttype;
          let headingtype;
          subjecttype = "Please submit your Resignation feedback!";
          headingtype = "Please submit your Resignation feedback!";
          let bodyVariables = {};
          let subjectVariables = {
            subject: subjecttype,
          };
          let headingVariables = {
            heading: headingtype,
          };
          let emailObj = {
            //cc: results && results[1] && results[1][0] && results[1][0].useremail || '',
            email:
              (results &&
                results[1] &&
                results[1][0] &&
                results[1][0].useremail) ||
              "",
            moduleid: req.body.moduleid ? req.body.moduleid : "Exit",
            userid:
              req.body && req.body.userid
                ? req.body.userid
                : req.body.createdby,
            mailType: "exitfeedback",
            bodyVariables,
            subjectVariables,
            headingVariables,
          };
          mailservice.mail(emailObj, function (err) {
            if (err) {
              //console.log("MAILLLLLLLLLLL", err);
            }
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function exitupload(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    // req.body.action = 'exitupload';
    req.body.userData = JSON.parse(req.body.userData);
    let userData = req.body.userData;
    userData.createdby = req.body.createdby;
    var obj = userData;
    let countfiles = req.body.userData.attachCount || 0;
    countfiles = parseInt(countfiles);
    // var timestamp = Date.now();
    //if (countfiles && countfiles != 0) {
    // if (countfiles > 10) {
    //     return res.json({ message: "File can't be more than 10", state: -1, data: null })
    // }

    let createdby = req.body.createdby.toString();
    let uploadPath = makeDirectories(path.join("uploads", "exit", createdby));
    var filename = [];
    var filepath = [];
    async.times(
      countfiles,
      function (n, next) {
        var sampleFile = {};
        sampleFile = req.files["file[" + n + "]"];
        if (sampleFile) {
          let sampleFile_name = `${Date.now()}_${sampleFile.name}`;
          let filepath1 = path.join(uploadPath, sampleFile_name);
          sampleFile.mv(filepath1, (err) => {
            if (!err) {
              filename.push(sampleFile_name);
              let uploadfilename = path.join(
                "exit",
                createdby,
                sampleFile_name
              );
              filepath.push(uploadfilename);
            }
            next(null, "success");
          });
        } else {
          next(null, "success");
        }
      },
      async (err, users) => {
        // var obj = req.body.userData;
        obj.filename = (filename && filename.join(",")) || "";
        obj.filepath = (filepath && filepath.join(",")) || "";
        obj = JSON.stringify(obj);
        commonModel
          .mysqlPromiseModelService(proc.resignationOperation, [obj])
          .then((results) => {
            return res.json({
              state: 1,
              message: "Success",
              data: results && results[0],
            });
          })
          .catch((err) => {
            return res.json({
              state: -1,
              data: null,
              message: err.message || err,
            });
          });
      }
    );
  }
}

async function checklistbymapid(req, res) {
  if (!req.body || !req.body.createdby || !req.body.action) {
    return res.json({ message: "Send required data", state: -1 });
  }

  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.resignationMaster, [obj, ""])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
      });
    })
    .catch((err) => {
      return res.json({ state: -1, data: null, message: err.message || err });
    });
}

function updatechecklistform(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    var obj = req.body;
    obj = JSON.stringify(obj);
    commonModel
      .mysqlPromiseModelService(proc.resignationOperation, [obj])
      .then((results) => {
        return res.json({ state: 1, message: "Success", data: results });
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}
function initiateQuestionFlag(req, res) {
  try {
    let obj = JSON.stringify(req.body);
    commonModel.mysqlModelService(
      "call usp_mst_resignation(?,?)",
      [obj, JSON.stringify({})],
      function (err, results) {
        if (err) {
          return res.json({ state: -1, message: err, data: null });
        }
        return res.json({
          state: 1,
          message: "Success",
          data: results[0],
        });
      }
    );
  } catch (error) {
    return res.json({ state: -1, message: "Something went wrong" });
  }
}
