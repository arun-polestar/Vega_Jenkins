"use strict";
var _ = require("underscore");
const proc = require("../common/procedureConfig");
const commonModel = require("../common/Model");
const commonCtrl = require("../common/Controller");
const mailservice = require("../../services/mailerService");
const paytm = require("../../routes/paytm/Controller");
var _ = require("underscore");
const config = require("../../config/config");
const notificationCtrl = require("../notification/Controller");
var path = require("path");
const fs = require("fs");
const xl = require("excel4node");
const fse = require("fs-extra");
var appRoot = require("app-root-path");
var { fromPath } = require("pdf2pic");
const htmlpdf = require("html-pdf");
const image2base64 = require("image-to-base64");
const makeDir = require("../../routes/common/utils").makeDirectories;
const webUrlLink = require("../../config/config").webUrlLink;
const prefix = webUrlLink.split(".")[0].slice(webUrlLink.indexOf(":") + 3);
const rdb = require("../../redisconnect");
const { saveBellNotification } = require("../notification/Controller");
const { sendBellIconNotification } = require("../notification/socket.io");

const e = require("express");

module.exports = {
  addfeedbackmaster: addfeedbackmaster,
  viewfeedbackmaster: viewfeedbackmaster,
  // raisefeedback: raisefeedback,
  feedbackforraise,
  feedbackuserlist,
  feedbacksubtype,
  teamfeedback: teamfeedback,
  feedbackview: feedbackview,
  addfeedbackdetail: addfeedbackdetail,
  userbydesignation: userbydesignation,
  userhierarcy: userhierarcy,
  feedbackreport: feedbackreport,
  indirectreportee: indirectreportee,
  viewfeedbackreport: viewfeedbackreport,
  viewallfeedback: viewallfeedback,
  viewfeedbackstory: viewfeedbackstory,
  viewpendingdata: viewpendingdata,
  feedbacklikedetails: feedbacklikedetails,
  // feedbackdashboard: feedbackdashboard,
  feedbackdetails: feedbackdetails,
  feedbackpost: feedbackpost,
  allowfeedback: allowfeedback,
  viewHtmlCer: viewHtmlCer,
  feedbackstory,
  feedbacklike,
  selffeedback,
  deletecertificaton,
  viewinternalreward,
  pdftoimage,
  // internaldashboard,
  // viewfeedbacklike
  uploadsignature,
  createtownhall,
  addsuperadminbanalce,
  viewtransactioneonsuperadmin,
  addsignature,
  viewsignature,
  changefeedbackstatus,
  approvemultiplefeedback,
  createteam,
  feedbackReportMail,
  feedbacksuggestion,
  mstfeedbacktag,
  feedbackDashboardReport,
  draftFeedback,
  viewSelfFeedback,
  homeFeedback,
  viewOfflineAward,
  feedbackKRA
  // mstfeedbacksubtype,
};

async function addfeedbackmaster(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = await commonCtrl.verifyNull(req.body);
  obj = JSON.stringify(obj);

  commonModel
    .mysqlPromiseModelService(proc.mstfeedback, [obj])
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
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}

async function feedbackEvent(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = await commonCtrl.verifyNull(req.body);
  obj = JSON.stringify(obj);

  commonModel
    .mysqlPromiseModelService(proc.mstfeedback, [obj])
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
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}

function viewfeedbackmaster(req, res) {
  if (!req.body) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstfeedback, [obj])
    .then((results) => {
      var dbresult = commonCtrl.lazyLoading(results[0], req.body);
      if (dbresult && "data" in dbresult && "count" in dbresult) {
        return res.json({
          state: 1,
          message: "success",
          data: dbresult.data,
          count: dbresult.count,
        });
      }
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
          data: results,
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
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}

function viewfortunemaster(req, res) {
  if (!req.body) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstfeedback, [obj])
    .then((results) => {
      var dbresult = commonCtrl.lazyLoading(results[0], req.body);
      if (dbresult && "data" in dbresult && "count" in dbresult) {
        return res.json({
          state: 1,
          message: "success",
          data: dbresult.data,
          count: dbresult.count,
        });
      }
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
          data: results,
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
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}
async function addfeedbackdetail(req, res) {
  if (!req.body || !req.body.action || !req.body.configvalue1) {
    return res.json({
      message: "send required data",
      state: -1,
      data: null,
    });
  } else {
    var sampleFile = req.files && req.files.file;
    if (sampleFile) {
      let checkPostsDir = path.join("uploads", "icon");
      makeDir(checkPostsDir);
      var sampleFile_name = `${Date.now()}_${sampleFile.name}`;
      await sampleFile.mv(
        path.join(appRoot && appRoot.path, "uploads/icon", sampleFile_name)
      );
      req.body.filename = sampleFile_name;
      req.body.filepath = path.join("icon/", sampleFile_name);
      req.body.badgevalue = path.join("icon/", sampleFile_name);
      req.body.newfile = 1;
    }
    let obj = await commonCtrl.verifyNull(req.body);
    obj = JSON.stringify(req.body);

    commonModel
      .mysqlPromiseModelService(proc.mstfeedback, [obj])
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
        return res.json({
          state: -1,
          data: null,
          message: err.message || err,
        });
      });
  }
}

async function mstfeedbacktag(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = await commonCtrl.verifyNull(req.body);
  obj = JSON.stringify(obj);

  commonModel
    .mysqlPromiseModelService(proc.mstfeedbacktag, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
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

async function feedbacksubtype(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = await commonCtrl.verifyNull(req.body);
  obj = JSON.stringify(obj);

  commonModel
    .mysqlPromiseModelService(proc.feedback, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
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

async function teamfeedback(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  try {
    let validation_obj = {
      team: req.body && req.body.team,
      feedbackreasonid: req.body && req.body.feedbackreasonid,
      createdby: req.body && req.body.createdby,
      groupid: req.body && req.body.groupid,
      isteam: req.body && req.body.isteam,
      feedbackdate: req.body && req.body.feedbackdate,
      action: "teambudgetvalidate",
      reqtype: req.body && req.body.action,
      onBehalf: req.body && req.body.onBehalf,
      specialAmout: req.body && req.body.specialAmout,
    };
    let re =
      req.body.action != "rejectteamfeedback"
        ? await paytm.budgetvalidate(validation_obj)
        : "";
    if (re && re.state == -1) {
      return res.json({
        state: -1,
        message: re.message || re,
      });
    }
    let message = {
      notification: {
        title: "Feedback",
        body: "",
      },
      data: {
        route: "/rewards",
        type: "feedback",
      },
    };
    let typemail;
    let subjecttype;
    let headingtype;
    req.body.feedbackdescription =
      req.body.feedbackdescription &&
      req.body.feedbackdescription.replace(/\\n/g, " ");
    req.body.feedbackdescription =
      req.body.feedbackdescription &&
      req.body.feedbackdescription.replace(/\\r/g, " ");
    let notifyuserid =
      req.body &&
      req.body.notifyuserid &&
      req.body.notifyuserid.toString().split(",");

    var obj = req.body;
    obj = JSON.stringify(obj);
    // obj.createdby = req.body.createdby;
    var counter = 1;
    commonModel
      .mysqlPromiseModelService(proc.feedbackraise, [obj])
      .then((results) => {
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
            data: results && results[2],
            feedbackid:
              results &&
              results[2] &&
              results[2][0] &&
              results[2][0].feedbackid,
            // groupid: results && results[2] && results[2][0] && results[2][0].groupid
          });
          if (results && results[0] && results[0][0] && results[0][0].emailid) {
            let list = results[0];
            setTimeout(() => {
              list.forEach(function (item) {
                if (
                  (req.body.action == "approveteamfeedback" &&
                    item &&
                    item.finalapproval == 1) ||
                  (item && item.isapprovalrequired == 0)
                ) {
                  let bellNotificationData = {
                    assignedtouserid:
                      item && item.empid && item.empid.toString(),
                    assignedfromuserid: req.body.createdby,
                    notificationdesc: `A new ${
                      (item && item.feedback) || ""
                    } has been raised for you by ${
                      (item && item.username) || ""
                    }.`,
                    attribute1: "",
                    attribute2: "",
                    attribute3: "",
                    attribute4: "",
                    isvendor: "",
                    web_route: "rewards/feedback/1",
                    app_route: "app/route",
                    fortnight_date: "",
                    module_name: "R&R",
                    createddate: moment(new Date()).format(
                      "YYYY-MM-DD HH:mm:ss"
                    ),
                    datevalue: new Date().valueOf(),
                  };
                  sendBellIconNotification(bellNotificationData);
                  saveBellNotification(bellNotificationData);
                  typemail = "feedbackraised";
                  subjecttype = "<New Feedback Raised>";
                  headingtype = "New Feedback Raised";
                  let emplist =
                    item && item.empid && item.empid.toString().split(",");
                  emplist.forEach(function (item1) {
                    message.notification.body = `A new ${
                      (item && item.feedback) || ""
                    } has been raised for you by ${
                      (item && item.username) || ""
                    }.`;
                    //    Sending notification to mobile device on feedback action
                    notificationCtrl.sendNotificationToMobileDevices(
                      item1,
                      message
                    );
                  });
                  // notifyuserid =
                  //   item &&
                  //   item.notifyuserid &&
                  //   item.notifyuserid.toString().split(",");
                  // if (notifyuserid) {
                  //   notifyuserid.forEach(function (notifyuseriditem) {
                  //     message.notification.body = `A new ${
                  //       (item && item.feedback) || ""
                  //     } has been raised for ${
                  //       (item && item.employeename) || ""
                  //     } by ${(item && item.username) || ""}.`;
                  //     //    Sending notification to mobile device on feedback action
                  //     if (notifyuseriditem) {
                  //       notificationCtrl.sendNotificationToMobileDevices(
                  //         notifyuseriditem,
                  //         message
                  //       );
                  //     }
                  //   });
                  // }
                } else if (
                  req.body.action == "teamfeedback" ||
                  (item && item.finalapproval == 0)
                ) {
                  let bellNotificationData = {
                    assignedtouserid:
                      item && item.empid && item.empid.toString(),
                    assignedfromuserid: req.body.createdby,
                    notificationdesc: `A new ${
                      (item && item.feedback) || ""
                    } has been raised for ${(item && item.username) || ""}`,
                    attribute1: "",
                    attribute2: "",
                    attribute3: "",
                    attribute4: "",
                    isvendor: "",
                    web_route: "rewards/feedback/3",
                    app_route: "app/route",
                    fortnight_date: "",
                    module_name: "R&R",
                    createddate: moment(new Date()).format(
                      "YYYY-MM-DD HH:mm:ss"
                    ),
                    datevalue: new Date().valueOf(),
                  };
                  sendBellIconNotification(bellNotificationData);
                  saveBellNotification(bellNotificationData);
                  typemail = "feedbackapproval";
                  subjecttype = "<New Feedback Raised for Approval>";
                  headingtype = "New Feedback Raised";
                  let emplist =
                    item && item.empid && item.empid.toString().split(",");
                  emplist.forEach(function (item1) {
                    //    Sending notification to mobile device on feedback action

                    (message.notification.body = `A new ${
                      (item && item.feedback) || ""
                    } has been raised for ${(item && item.username) || ""}`),
                      // message.notification.body = `Your Raised ${
                      //   (item && item.feedback) || ""
                      // } for ${
                      //   (item && item.employeename) || ""
                      // } has been  Rejected by ${(item && item.username) || ""}.`;
                      notificationCtrl.sendNotificationToMobileDevices(
                        item1,
                        message
                      );
                  });
                } else if (req.body.action == "rejectteamfeedback") {
                  let bellNotificationData = {
                    assignedtouserid:
                      item && item.empid && item.empid.toString(),
                    assignedfromuserid: req.body.createdby,

                    notificationdesc: `Your Raised ${
                      (item && item.feedback) || ""
                    } for ${
                      (item && item.employeename) || ""
                    } has been  Rejected by ${(item && item.username) || ""}.`,
                    // notificationdesc: `A new ${
                    //   (item && item.feedback) || ""
                    // } has been raised for ${(item && item.username) || ""}`,
                    attribute1: "",
                    attribute2: "",
                    attribute3: "",
                    attribute4: "",
                    isvendor: "",
                    web_route: "rewards/feedback/2",
                    app_route: "app/route",
                    fortnight_date: "",
                    module_name: "R&R",
                    createddate: moment(new Date()).format(
                      "YYYY-MM-DD HH:mm:ss"
                    ),
                    datevalue: new Date().valueOf(),
                  };
                  sendBellIconNotification(bellNotificationData);
                  saveBellNotification(bellNotificationData);
                  typemail = "feedbackrejected";
                  subjecttype = "<Your Raised feedback Rejected>";
                  headingtype = "Your Raised feedback Rejected";
                  //    Sending notification to mobile device on feedback action
                  message.notification.body = `Your Raised ${
                    (item && item.feedback) || ""
                  } for ${
                    (item && item.employeename) || ""
                  } has been  Rejected by ${(item && item.username) || ""}.`;
                  notificationCtrl.sendNotificationToMobileDevices(
                    item.empid,
                    message
                  );
                  notifyuserid =
                    item &&
                    item.notifyuserid &&
                    item.notifyuserid.toString().split(",");
                  if (notifyuserid) {
                    notifyuserid.forEach(function (notifyuseriditem) {
                      message.notification.body = `${
                        (item && item.feedback) || "Feedback"
                      } Raised by ${
                        (item && item.trxfeedbackraisedby) || ""
                      } for ${
                        (item && item.employeename) || ""
                      } has been  Rejected by ${
                        (item && item.username) || ""
                      }.`;
                      //    Sending notification to mobile device on feedback action
                      if (notifyuseriditem)
                        notificationCtrl.sendNotificationToMobileDevices(
                          notifyuseriditem,
                          message
                        );
                      // console.log(
                      //   "notificaton msg notifyuser2",
                      //   message.notification.body,
                      //   "IIIIIII",
                      //   notifyuseriditem
                      // );
                    });
                  }
                }
                let emailObj = {
                  email: item.emailid || " ",
                  cc: (req.body && req.body.notifyto) || "",
                  mailType: typemail,
                  moduleid:
                    req.body && req.body.moduleid
                      ? req.body.moduleid
                      : "feedback",
                  userid:
                    req.body && req.body.userid
                      ? req.body.userid
                      : req.body.createdby,
                  subjectVariables: {
                    subject: subjecttype,
                  },
                  headingVariables: {
                    heading: headingtype,
                  },

                  bodyVariables: {
                    trxempname: (item && item.username) || "",
                    trxempsupervisor: item && item.trxempsupervisor,
                    trxempdob: item && item.trxempdob,
                    trxempjoining: item && item.trxempjoining,
                    trxfeedbackdescription:
                      (req.body && req.body.feedbackdescription) ||
                      (item && item.feedbackdescription) ||
                      "",
                    trxfeedbackusername: (item && item.employeename) || "",
                    trxempemail: item && item.trxempemail,
                    trxfeedbackraisedby:
                      (item && item.trxfeedbackraisedby) || "",
                    trxfeedbackraisedate:
                      (item && item.trxfeedbackraisedate) || "",
                    trxfeedbacktype: item && item.trxfeedbacktype,
                    trxfeedbacksubtype: (item && item.trxfeedbacksubtype) || "",
                    trxothercomment: (item && item.trxothercomment) || "",
                    trxrejectcomment:
                      (req.body && req.body.approver_comment) ||
                      (item && item.trxapprovercomment) ||
                      "",
                    trxapprovedby: (item && item.trxapprovedby) || "",
                    trxrejectedby: (item && item.trxrejectedby) || "",
                    trxfeedbackpoint: (item && item.trxfeedbackpoint) || "",
                    trxfeedbackamount: (item && item.trxfeedbackamount) || "",

                    // userid: req.body && req.body.userid
                  },
                };
                counter = counter + 1;
                mailservice.mail(emailObj, function (err) {
                  if (err) {
                    //  console.log("MAILLLLLLLLLLL", err);
                  }
                });
              });
            }, counter * 3000);
          }
          //This part will send notification to employee, who raised feedback, after feedback has been approved.
          if (results && results[1] && results[1][0] && results[1][0].emailid) {
            if (req.body.action == "approveteamfeedback") {
              let bellNotificationData = {
                assignedtouserid: item && item.empid && item.empid.toString(),
                assignedfromuserid: req.body.createdby,
                notificationdesc: `A new ${
                  (item && item.feedback) || ""
                } has been raised for ${(item && item.username) || ""}`,
                attribute1: "",
                attribute2: "",
                attribute3: "",
                attribute4: "",
                isvendor: "",
                web_route: "rewards/feedback/2",
                app_route: "app/route",
                fortnight_date: "",
                module_name: "R&R",
                createddate: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
                datevalue: new Date().valueOf(),
              };
              sendBellIconNotification(bellNotificationData);
              saveBellNotification(bellNotificationData);
              typemail = "feedbackapproved";
              subjecttype = "<Your Raised feedback Approved>";
              headingtype = "Your Raised feedback Approved";
              notifyuserid =
                results &&
                results[1][0] &&
                results[1][0].notifyuserid &&
                results[1][0].notifyuserid.toString().split(",");

              if (notifyuserid) {
                notifyuserid.forEach(function (notifyuseriditem) {
                  message.notification.body = `${
                    results[1][0].feedback || "Feedback"
                  } Raised  by ${
                    (results[1][0] && results[1][0].trxfeedbackraisedby) || ""
                  } for ${
                    (results[1][0] && results[1][0].employeename) || ""
                  } has been  approved by ${
                    (results[1][0] && results[1][0].username) || ""
                  }.`;
                  //    Sending notification to mobile device on feedback action
                  if (notifyuseriditem)
                    notificationCtrl.sendNotificationToMobileDevices(
                      notifyuseriditem,
                      message
                    );
                  // console.log(
                  //    "notificaton msg notifyuser3",
                  //    message.notification.body,
                  //   "IIIIIII",
                  //   notifyuseriditem
                  // );
                });
              }
              message.notification.body = `Your raised ${results[1][0].feedback} for ${results[1][0].employeename} has been approved by ${results[1][0].username}.`;
            }
            let emailObj = {
              email: (results && results[1][0] && results[1][0].emailid) || " ",
              mailType: typemail,
              moduleid:
                req.body && req.body.moduleid ? req.body.moduleid : "feedback",
              userid:
                req.body && req.body.userid
                  ? req.body.userid
                  : req.body.createdby,
              subjectVariables: {
                subject: subjecttype,
              },
              headingVariables: {
                heading: headingtype,
              },

              bodyVariables: {
                trxempname:
                  (results && results[1] && results[1][0].login_user_name) ||
                  "",
                trxfeedbackdescription:
                  (results &&
                    results[1] &&
                    results[1][0].feedbackdescription) ||
                  "",
                trxfeedbackusername:
                  (results && results[1] && results[1][0].employeename) || "",
                trxempsupervisor:
                  results &&
                  results[1] &&
                  results[1][0] &&
                  results[1][0].trxempsupervisor,
                trxempdob:
                  results &&
                  results[1] &&
                  results[1][0] &&
                  results[1][0].trxempdob,
                trxempjoining:
                  results &&
                  results[1] &&
                  results[1][0] &&
                  results[1][0].trxempjoining,
                trxempemail:
                  results &&
                  results[1] &&
                  results[1][0] &&
                  results[1][0].trxempemail,
                trxfeedbackraisedby:
                  (results &&
                    results[1] &&
                    results[1][0] &&
                    results[1][0].trxfeedbackraisedby) ||
                  "",
                trxfeedbackraisedate:
                  (results &&
                    results[1] &&
                    results[1][0] &&
                    results[1][0].trxfeedbackraisedate) ||
                  "",
                trxfeedbacktype:
                  results &&
                  results[1] &&
                  results[1][0] &&
                  results[1][0].trxfeedbacktype,
                trxfeedbacksubtype:
                  (results &&
                    results[1] &&
                    results[1][0] &&
                    results[1][0].trxfeedbacksubtype) ||
                  "",
                trxothercomment:
                  (results &&
                    results[1] &&
                    results[1][0] &&
                    results[1][0].trxothercomment) ||
                  "",
                trxrejectcomment:
                  (req.body && req.body.approver_comment) ||
                  (results &&
                    results[1] &&
                    results[1][0] &&
                    results[1][0].trxapprovercomment) ||
                  "",
                trxapprovedby:
                  (results &&
                    results[1] &&
                    results[1][0] &&
                    results[1][0].trxapprovedby) ||
                  "",
                trxrejectedby:
                  (results &&
                    results[1] &&
                    results[1][0] &&
                    results[1][0].trxrejectedby) ||
                  "",
                trxfeedbackpoint: (item && item.trxfeedbackpoint) || "",
                trxfeedbackamount: (item && item.trxfeedbackamount) || "",
              },
            };
            mailservice.mail(emailObj, function (err) {
              if (err) {
                //console.log("MAILLLLLLLLLLL", err);
              }
            });

            // Sending notification to mobile device on feedback action
            if (results && results[1] && results[1][0] && results[1][0].empid) {
              notificationCtrl.sendNotificationToMobileDevices(
                results[1][0].empid,
                message
              );
            }
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
        return res.json({
          state: -1,
          data: null,
          message: (err && err.message) || err,
        });
      });
  } catch (err) {
    return res.json({
      state: -1,
      data: null,
      message: err.message || err,
    });
  }
}

function feedbackDashboardReport(req, res) {
  if (!req.body) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.feedback_report, [obj])
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
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}

// async function raisefeedback(req, res) {
//   if (!req.body || !req.body.action) {
//     return res.json({
//       message: "Send required data",
//       state: -1,
//     });
//   }
//   try {
//     let validation_obj = {
//       userid: req.body && req.body.userid,
//       feedbackreasonid: req.body && req.body.feedbackreasonid,
//       createdby: req.body && req.body.createdby,
//       feedbackid: req.body && req.body.id,
//       feedbackdate: req.body && req.body.feedbackdate,
//       action: "userbudgetvalidate",
//       reqtype: req.body && req.body.action,
//     };
//     let re =
//       req.body.action != "rejectfeedback"
//         ? await paytm.budgetvalidate(validation_obj)
//         : "";
//     if ((re && re.state == 1) || req.body.action == "rejectfeedback") {
//       let obj = JSON.stringify(req.body);
//       let typemail;
//       let subjecttype;
//       let headingtype;

//       //message object to sending message with notification to mobile devices
//       let message = {
//         notification: {
//           title: "Feedback",
//           body: "",
//         },
//         data: {
//           route: "/rewards",
//           type: "feedback",
//         },
//       };
//       //  let descstr=req.body && req.body.feedbackdescription && req.body.feedbackdescription;
//       req.body.feedbackdescription =
//         req.body.feedbackdescription &&
//         req.body.feedbackdescription.replace(/\\n/g, " ");
//       req.body.feedbackdescription =
//         req.body.feedbackdescription &&
//         req.body.feedbackdescription.replace(/\\r/g, " ");
//       commonModel
//         .mysqlPromiseModelService(proc.feedback, [obj])
//         .then((results) => {
//           if (
//             results &&
//             results[2] &&
//             results[2][0] &&
//             results[2][0].state &&
//             results[2][0].state == 1
//           ) {
//             res.json({
//               state: results[2][0].state,
//               message: results[2][0].message,
//               data: results && results[2],
//               feedbackid:
//                 results &&
//                 results[2] &&
//                 results[2][0] &&
//                 results[2][0].feedbackid,
//             });
//             if (
//               results &&
//               results[0] &&
//               results[0][0] &&
//               results[0][0].emailid
//             ) {
//               if (
//                 req.body.action == "approvefeedback" ||
//                 (results && results[0] && results[0][0].isapprovalrequired == 0)
//               ) {
//                 typemail = "feedbackraised";
//                 subjecttype = "<New Feedback Raised>";
//                 headingtype = "New Feedback Raised";
//                 message.notification.body = `A new ${results[0][0].feedback} has been raised for you by ${results[0][0].username}.`;
//               } else if (req.body.action == "raisefeedback") {
//                 typemail = "feedbackapproval";
//                 subjecttype = "<New Feedback Raised>";
//                 headingtype = "New Feedback Raised";
//                 message.notification.body = `A new ${results[0][0].feedback} has been raised for ${results[0][0].username}`;
//               } else if (req.body.action == "supervisorapprovefeedback") {
//                 typemail = "feedbackraised";
//                 subjecttype = "<New Feedback Raised>";
//                 headingtype = "New Feedback Raised";
//               } else if (
//                 req.body.action == "rejectfeedback" ||
//                 req.body.action == "supervisorrejectfeedback"
//               ) {
//                 typemail = "feedbackrejected";
//                 subjecttype = "<Your Raised feedback Rejected>";
//                 headingtype = "Your Raised feedback Rejected";
//                 message.notification.body = `Your Raised ${results[0][0].feedback} for ${results[0][0].employeename} has been  Rejected by ${results[0][0].username}.`;
//               }
//               let emailObj = {
//                 email: results[0][0].emailid || " ",
//                 mailType: typemail,
//                 moduleid: req.body.moduleid ? req.body.moduleid : "feedback",
//                 userid: req.body.userid ? req.body.userid : req.body.createdby,
//                 subjectVariables: {
//                   subject: subjecttype,
//                 },
//                 headingVariables: {
//                   heading: headingtype,
//                 },

//                 bodyVariables: {
//                   trxempname:
//                     (results && results[0] && results[0][0].username) || "",
//                   trxfeedbackdescription: req.body.feedbackdescription || "",
//                   trxfeedbackusername:
//                     (results && results[0] && results[0][0].employeename) || "",
//                   trxempemail:
//                     results &&
//                     results[0] &&
//                     results[0][0] &&
//                     results[0][0].trxempemail,
//                   // userid: req.body && req.body.userid
//                 },
//               };
//               mailservice.mail(emailObj, function (err) {
//                 if (err) {
//                   console.log("MAILLLLLLLLLLL", err);
//                 }
//               });

//               //Sending notification to mobile device on feedback action
//               notificationCtrl.sendNotificationToMobileDevices(
//                 results[0][0].empid,
//                 message
//               );
//             }

//             //This part will send notification to employee, who raised feedback, after feedback has been approved.
//             if (
//               results &&
//               results[1] &&
//               results[1][0] &&
//               results[1][0].emailid
//             ) {
//               if (req.body.action == "approvefeedback") {
//                 typemail = "feedbackapproved";
//                 subjecttype = "<Your Raised feedback Approved>";
//                 headingtype = "Your Raised feedback Approved";
//                 message.notification.body = `Your raised ${results[1][0].feedback} for ${results[1][0].employeename} has been approved by ${results[1][0].username}.`;
//               }
//               let emailObj = {
//                 email: results[1][0].emailid || " ",
//                 mailType: typemail,
//                 moduleid: req.body.moduleid ? req.body.moduleid : "feedback",
//                 userid: req.body.userid ? req.body.userid : req.body.createdby,
//                 subjectVariables: {
//                   subject: subjecttype,
//                 },
//                 headingVariables: {
//                   heading: headingtype,
//                 },

//                 bodyVariables: {
//                   trxempname:
//                     (results && results[1] && results[1][0].login_user_name) ||
//                     "",
//                   trxfeedbackdescription:
//                     (req.body && req.body.feedbackdescription) || "",
//                   trxfeedbackusername:
//                     (results && results[1] && results[1][0].employeename) || "",
//                   trxempsupervisor:
//                     results &&
//                     results[1] &&
//                     results[1][0] &&
//                     results[1][0].trxempsupervisor,
//                   trxempdob:
//                     results &&
//                     results[1] &&
//                     results[1][0] &&
//                     results[1][0].trxempdob,
//                   trxempjoining:
//                     results &&
//                     results[1] &&
//                     results[1][0] &&
//                     results[1][0].trxempjoining,
//                   trxempemail:
//                     results &&
//                     results[1] &&
//                     results[1][0] &&
//                     results[1][0].trxempemail,
//                   // userid: req.body && req.body.userid
//                 },
//               };
//               mailservice.mail(emailObj, function (err) {
//                 if (err) {
//                   console.log("MAILLLLLLLLLLL", err);
//                 }
//               });
//               //Sending notification to mobile device on feedback action
//               notificationCtrl.sendNotificationToMobileDevices(
//                 results[1][0].empid,
//                 message
//               );
//             }
//           } else {
//             return res.json({
//               state: -1,
//               message: "Something went wrong",
//               data: null,
//             });
//           }
//         })
//         .catch((err) => {
//           return res.json({
//             state: -1,
//             data: null,
//             message: err.message || err,
//           });
//         });
//     } else {
//       return res.json({
//         state: -1,
//         data: null,
//         message: re && re.message,
//       });
//     }
//   } catch (e) {
//     return res.json({
//       state: -1,
//       data: null,
//       message: e.message || e,
//     });
//   }
// }

async function feedbackview(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  var obj = await commonCtrl.verifyNull(req.body);
  if (req.body.action == "employeefeedback") {
    userhierarcy(req, res).then((val) => {
      obj.reporteelist = val;
      obj = JSON.stringify(obj);
      return commonModel
        .mysqlPromiseModelService(proc.feedback, [obj])
        .then((results) => {
          var dbresult = commonCtrl.lazyLoading(results[0], req.body);
          if (dbresult && "data" in dbresult && "count" in dbresult) {
            return res.json({
              state: 1,
              message: "success",
              pendingcount:
                results &&
                results[1] &&
                results[1][0] &&
                results[1][0].pendingcount,
              allowraisefeedback:
                results &&
                results[1] &&
                results[1][0] &&
                results[1][0].allowraisefeedback,
              data: dbresult.data,
              otherdata: results && results[1],
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
          return res.json({
            state: -1,
            data: null,
            message: err.message || err,
          });
        });
    });
  } else {
    obj = JSON.stringify(obj);
    return commonModel
      .mysqlPromiseModelService(proc.feedback, [obj])
      .then((results) => {
        var dbresult = commonCtrl.lazyLoading(results[0], req.body);
        if (dbresult && "data" in dbresult && "count" in dbresult) {
          return res.json({
            state: 1,
            message: "success",
            pendingcount:
              results &&
              results[1] &&
              results[1][0] &&
              results[1][0].pendingcount,
            allowraisefeedback:
              results &&
              results[1] &&
              results[1][0] &&
              results[1][0].allowraisefeedback,
            data: dbresult.data,
            count: dbresult.count,
            otherdata: results && results[1],
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
        return res.json({
          state: -1,
          data: null,
          message: err.message || err,
        });
      });
  }
}

function userbydesignation(req, res) {
  if (!req.body || !req.body.createdby) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = req.body;
  obj.action = "userbydesignation";
  obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.feedback, [obj])
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
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}

async function hierarcy(obj, data, obj3) {
  let obj1 = [];
  let obj2 = [];
  _.each(obj, (item) => {
    let reportee = data.filter(
      (temp) => temp.managerid == item.userid && item.managerid != item.userid
    );
    let ownreportee = data.filter(
      (temp) => temp.managerid == item.userid && item.managerid == item.userid
    );
    obj1 = obj1.concat(ownreportee);
    if (reportee.length != 0) {
      obj2 = obj2.concat(reportee);
    }
  });
  let n2 = obj2 && obj2.length;
  obj3.push(obj2);
  obj3.push(obj1);
  if (n2 == 0) {
    return obj3;
  } else {
    // return setTimeout(()=>{
    //     return hierarcy(obj2, data, obj3)
    // },0)

    return setTimeout(hierarcy, 0, obj2, data, obj3);
    //return hierarcy(obj2, data, obj3)
  }
}

function hierarchy2(managerid, groupedData, finalarray) {
  if (_.has(groupedData, managerid)) {
    finalarray.push(...groupedData[managerid]);

    _.each(groupedData[managerid], (item) => {
      if (item.userid !== item.managerid)
        hierarchy2(item.userid, groupedData, finalarray);
    });
  }
}

function userhierarcy(req, res) {
  return new Promise(async (resolve, reject) => {
    if (!req.body.createdby) {
      reject("Send Required data");
    }
    let key = `${prefix}_userhierarcy_${req.body.createdby}`;
    let dbresult = await rdb.getGlobalKey(key);
    if (dbresult) {
      resolve(dbresult);
    } else {
      let obj = {};
      obj.createdby = req.body.createdby;
      obj.action = "alluser";
      obj = JSON.stringify(obj);
      commonModel
        .mysqlPromiseModelService(proc.feedback, [obj])
        .then(async (results) => {
          if (
            results &&
            results[1] &&
            results[1][0] &&
            results[1][0].state &&
            results[1][0].state == 1
          ) {
            let obj1 = [];
            // if (results[0][0].role != 'Admin') {
            let data = results[0];
            data = data.filter((item) => item.managerid);
            let groupedData = _.groupBy(data, "managerid");

            let finalarray = [];
            hierarchy2(req.body.createdby, groupedData, finalarray);
            let reporteeids = finalarray.map(function (value) {
              return value.userid;
            });
            reporteeids = reporteeids.toString();
            rdb.setGlobalKey(key, reporteeids, 12 * 60 * 60);
            resolve(reporteeids);
          } else {
            return res.json({
              state: -1,
              message: "Something Went Wrong",
              data: null,
            });
          }
        })
        .catch((err) => {
          return res.json({
            state: -1,
            data: null,
            message: (err && err.message) || err,
          });
        });
    }
  });
}

async function indirectreportee(req, res) {
  try {
    let key = `${prefix}_indirect_${req.body.createdby}`;
    let dbresult = await rdb.getGlobalKey(key);
    if (dbresult) {
      let cacheResult = JSON.parse(dbresult);
      return res.json({
        state: 1,
        message: "success",
        data: cacheResult.data,
        count: cacheResult.count,
      });
    } else {
      userhierarcy(req, res)
        .then((val) => {
          if (!req.body || !req.body.action) {
            return res.json({
              message: "Send required data",
              state: -1,
            });
          }
          let obj = req.body;
          obj.reporteelist = val;
          obj = JSON.stringify(obj);
          commonModel
            .mysqlPromiseModelService(proc.feedback, [obj])
            .then((results) => {
              let dbresult = commonCtrl.lazyLoading(results[0], req.body);
              if (dbresult && "data" in dbresult && "count" in dbresult) {
                //let todayEnd = new Date().setHours(23, 59, 59, 999);
                rdb.setGlobalKey(key, JSON.stringify(dbresult), 12 * 60 * 60);
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
              return res.json({
                state: -1,
                data: null,
                message: err.message || err,
              });
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
  } catch (err) {
    return res.json({ state: -1, message: "Something went wrong" });
  }
}

function feedbackreport(req, res) {
  userhierarcy(req, res)
    .then((val) => {
      if (!req.body || !req.body.action || !req.body.createdby) {
        return res.json({
          message: "Send required data",
          state: -1,
        });
      }
      let obj = req.body;
      obj.reporteelist = val;
      obj = JSON.stringify(obj);
      commonModel
        .mysqlPromiseModelService(proc.feedback, [obj])
        .then((results) => {
          var dbresult = commonCtrl.lazyLoading(results[0], req.body);
          if (dbresult && "data" in dbresult && "count" in dbresult) {
            return res.json({
              state: 1,
              message: "success",
              data: dbresult.data,
              columnname: results[1],
              fy: results[2],
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
          return res.json({
            state: -1,
            data: null,
            message: err.message || err,
          });
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

function viewfeedbackreport(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.feedback, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
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

function viewallfeedback(req, res) {
  if (!req.body) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.feedback, [obj])
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
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}

function viewfeedbackstory(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.feedback, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
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

function viewpendingdata(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.feedback, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
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

async function feedbackstory(data) {
  return new Promise((resolve, reject) => {
    data.action = "feedbackstory";
    let obj = JSON.stringify(data);
    commonModel.mysqlModelService(
      proc.feedback,
      [obj],
      function (err, results) {
        if (err) {
          reject(err);
        }
        resolve(results[0]);
      }
    );
  });
}

async function feedbacklike(data) {
  return new Promise((resolve, reject) => {
    // data.action = data.reaction_operation && data.reaction_operation == 'update' ? data.reaction_operation : 'like';
    let obj = JSON.stringify(data);
    commonModel.mysqlModelService(
      proc.feedback,
      [obj],
      function (err, results) {
        if (err) {
          // console.log("EEEEEEEEEEEEEEEEEEEEEE", err);
          reject(err);
        }
        resolve(results);
      }
    );
  });
}

function feedbacklikedetails(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.feedback, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
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

// function feedbackdashboard(req, res) {
//   if (!req.body || !req.body.action) {
//     return res.json({
//       message: "Send required data",
//       state: -1,
//     });
//   }
//   let obj = JSON.stringify(req.body);
//   commonModel
//     .mysqlPromiseModelService(proc.feedback_dashboard, [obj])
//     .then((results) => {
//       return res.json({
//         state: 1,
//         message: "Success",
//         data: results,
//       });
//     })
//     .catch((err) => {
//       return res.json({
//         state: -1,
//         data: null,
//         message: err.message || err,
//       });
//     });
// }

function feedbackdetails(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.feedback_timeline, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
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

function feedbackpost(req, res) {
  try {
    let obj = JSON.stringify(req.body);
    commonModel.mysqlModelService(
      proc.feedback_timeline,
      [obj],
      function (err, results) {
        if (err) {
          return res.json({
            state: -1,
            message: err,
            data: null,
          });
        }
        return res.json({
          state: 1,
          message: "Success",
          data: results[0],
          pendingcount:
            results[1] && results[1][0] && results[1][0].pendingcount,
        });
      }
    );
  } catch (error) {
    return res.json({
      state: -1,
      message: "Something went wrong",
    });
  }
}

function allowfeedback(req, res) {
  try {
    let obj = JSON.stringify(req.body);
    commonModel.mysqlModelService(
      proc.mstfeedback,
      [obj],
      function (err, results) {
        if (err) {
          return res.json({
            state: -1,
            message: err,
            data: null,
          });
        }
        return res.json({
          state: 1,
          message: "Success",
          data: results[0],
        });
      }
    );
  } catch (error) {
    return res.json({
      state: -1,
      message: "Something went wrong",
    });
  }
}

async function selffeedback(obj) {
  return new Promise((resolve, reject) => {
    if (!(obj && obj.createdby)) {
      reject("Send required data");
    }
    let obj1 = JSON.stringify(obj);
    commonModel
      .mysqlPromiseModelService(proc.feedback, [obj1])
      .then((results) => {
       // console.log("rrr", results)
        let isfortune;
        let shuffle = Math.floor(Math.random() * 2);
       // console.log("sss", shuffle);
        if (shuffle == 1 && results && results[0][0]
          && results[0][0].fortune && results[0][0].background_filepath) {
          isfortune = 1;
        }
        resolve({
          state: results && results[0][0] && results[0][0].state,
          message: results && results[0][0] && results[0][0].message,
          amount: results && results[0][0] && results[0][0].amount,
          isFortune: isfortune || 0,
          fortuneDetails: {
            fortune: results && results[0][0] && results[0][0].fortune,
            background_filepath :results && results[0][0] && results[0][0].background_filepath
        },
        });
      })
      .catch((err) => {
        reject(err.message || err);
      });
  });
}

async function viewHtmlCer(req, res) {
  if (!req.body) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  try {
    let obj = req.body;
    obj.action = obj.action ? obj.action : "certificatedata";
    let proc_call =
      req.body.certificatetype && req.body.certificatetype == "learning"
        ? "call usp_learning_certificate(?)"
        : "call usp_feedback_operation(?)";
    obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc_call, [obj])
      .then(async (results) => {
        if (
          results &&
          results[0] &&
          results[1][0] &&
          results[1][0].state == 1
        ) {
          var html =
            results && results[0] && results[0][0] && results[0][0].html;
          if (!html) {
            return res.json({
              message: "No Template found !",
              state: -1,
            });
          }
          var trxtrainingdate =
            (results &&
              results[0] &&
              results[0][0] &&
              results[0][0].trxtrainingdate) ||
            "";
          var trxtrainingname =
            (results &&
              results[0] &&
              results[0][0] &&
              results[0][0].trxtrainingname) ||
            "";
          var trxbatchname =
            (results &&
              results[0] &&
              results[0][0] &&
              results[0][0].trxbatchname) ||
            "";

          var {
            trxbackgroundfilepath = "",
            trxribbonimg = "",
            trxotherimg = "",
            trxpoweredby = "",
            trxcompanylogo = "",
            trxuserprofile = "",
            trxawardeddate = "",
            trxmanagingdirectorname = "",
            trxhrname = "",
            trxpresentedby = "",
            trxfeedbackawardtype = "",
            trxdummytext = "",
            trxemployeename = "",
            trxcompanyname = "",
            feedbackdescription = "",
            trxdesgnation2 = "",
            trxsignaturedesg2 = "",
            trxdesgnation1 = "",
            trxsignaturedesg1 = "",
            guid = "",
            feedbackid = "",
          } = { ...results[0][0] };

          var left_arrow = config.webUrlLink + "/webapi/cert/left-arrow.png",
            right_arrow = config.webUrlLink + "/webapi/cert/right-arrow.png",
            vega_logo = config.webUrlLink + "/webapi/cert/vega-logo.png",
            bg_image = config.webUrlLink + "/webapi/cert/certificate-bg.png";

          // --------------------------------------------------------for staging---------------------------------------------------------

          if (config && config.env && config.env == "developments") {
            trxbackgroundfilepath =
              config.webUrlLink + "/cert/" + trxbackgroundfilepath;
            trxribbonimg = config.webUrlLink + "/cert/" + trxribbonimg;
            trxotherimg = config.webUrlLink + "/cert/" + trxotherimg;
            trxpoweredby = config.webUrlLink + "/cert/poweredbyVegaHr.png";
            trxcompanylogo = path.join(
              appRoot && appRoot.path,
              "/uploads/" + trxcompanylogo
            );
            trxuserprofile = path.join(
              appRoot && appRoot.path,
              "/uploads/" + trxuserprofile
            );

            /* -----------------------------------for production ----------------------------------------------------------*/
          } else {
            trxbackgroundfilepath =
              config.webUrlLink + "/webapi/cert/" + trxbackgroundfilepath;
            trxribbonimg = config.webUrlLink + "/webapi/cert/" + trxribbonimg;
            trxotherimg = config.webUrlLink + "/webapi/cert/" + trxribbonimg;
            trxpoweredby =
              config.webUrlLink + "/webapi/cert/poweredbyVegaHr.png";
            trxcompanylogo = path.join(
              appRoot && appRoot.path,
              "/uploads/" + trxcompanylogo
            );
            trxuserprofile = path.join(
              appRoot && appRoot.path,
              "/uploads/" + trxuserprofile
            );
          }
          if (fs.existsSync(trxcompanylogo)) {
            trxcompanylogo =
              config.webUrlLink +
              "/webapi/" +
              (results &&
                results[0] &&
                results[0][0] &&
                results[0][0].trxcompanylogo);
          } else {
            trxcompanylogo =
              config.webUrlLink + "/webapi/cert/default-logo.png";
          }

          if (fs.existsSync(trxuserprofile)) {
            trxuserprofile =
              config.webUrlLink +
              "/webapi/" +
              (results &&
                results[0] &&
                results[0][0] &&
                results[0][0].trxuserprofile);
          } else {
            trxuserprofile =
              config.webUrlLink + "/webapi/img/user-placeholder.png";
          }
          trxsignaturedesg1 = path.join(
            appRoot && appRoot.path,
            trxsignaturedesg1
          );
          trxsignaturedesg2 = path.join(
            appRoot && appRoot.path,
            trxsignaturedesg2
          );

          if (fs.existsSync(trxsignaturedesg1)) {
            trxsignaturedesg1 = trxsignaturedesg1;
          } else {
            trxsignaturedesg1 =
              config.webUrlLink + "/webapi/cert/default-sign.png";
          }
          trxsignaturedesg1 = await image2base64(trxsignaturedesg1);
          trxsignaturedesg1 = "data:image/bmp;base64," + trxsignaturedesg1;

          if (fs.existsSync(trxsignaturedesg2)) {
            trxsignaturedesg2 = trxsignaturedesg2;
          } else {
            trxsignaturedesg2 =
              config.webUrlLink + "/webapi/cert/default-sign.png";
          }

          trxsignaturedesg2 = await image2base64(trxsignaturedesg2);
          trxsignaturedesg2 = "data:image/bmp;base64," + trxsignaturedesg2;

          if (req.body.action == "preview_certificate") {
            var badgevalue =
              config.webUrlLink +
              "/webapi/" +
              "cert/training_certificate_icon.svg";
          } else {
            var badgevalue =
              config.webUrlLink +
                "/webapi/" +
                (req.body && req.body.badgevalue) || "cert/default.png";
          }

          feedbackdescription = feedbackdescription.replace(/\\n/g, " ");
          feedbackdescription = feedbackdescription.replace(/\\r/g, " ");

          let certficationparams = {
            feedbackdescription: feedbackdescription,
            left_arrow: left_arrow,
            right_arrow: right_arrow,
            vega_logo: vega_logo,
            bg_image: bg_image,
            badgevalue: badgevalue,
            trxsignaturedesg1: trxsignaturedesg1,
            trxsignaturedesg2: trxsignaturedesg2,
            trxdesgnation1: trxdesgnation1,
            trxdesgnation2: trxdesgnation2,
            trxbackgroundfilepath: trxbackgroundfilepath,
            trxcompanylogo: trxcompanylogo,
            trxribbonimg: trxribbonimg,
            trxpoweredby: trxpoweredby,
            trxotherimg: trxotherimg,
            trxuserprofile: trxuserprofile,
            trxcompanyname: trxcompanyname,
            trxemployeename: trxemployeename,
            trxdummytext: trxdummytext,
            trxfeedbackawardtype: trxfeedbackawardtype,
            trxpresentedby: trxpresentedby,
            trxhrname: trxhrname,
            trxmanagingdirectorname: trxmanagingdirectorname,
            trxawardeddate: trxawardeddate,
            trxtrainingdate: trxtrainingdate,
            trxtrainingname: trxtrainingname,
            trxbatchname: trxbatchname,
          };
          if (certficationparams) {
            var paramArr = _.keys(certficationparams);
            paramArr.forEach((item) => {
              var replacementvar = certficationparams[item]
                ? certficationparams[item]
                : "";
              var match = new RegExp(item, "g");
              html = html && html.replace(match, replacementvar);
            });
          }
          const search = "\r";
          const replacer = new RegExp(search, "g");
          html = html.replace(replacer, "\n");
          let checkdir1 = path.join(appRoot.path, "/uploads");
          if (!fs.existsSync(checkdir1)) {
            fs.mkdirSync(checkdir1);
          }
          let checkdir = path.join(appRoot.path, "/uploads/certification");
          if (!fs.existsSync(checkdir)) {
            fs.mkdirSync(checkdir);
          }
          let cer_name = guid.toString().concat(feedbackid);
          let filepath = path.resolve(
            appRoot.path,
            "uploads/certification",
            `${cer_name}_certification-letter.pdf`
          );
          let uploadpath = path.join(
            "certification",
            `${cer_name}_certification.1.png`
          );
          const options = {
            format: "A4",
            orientation: "landscape",
            type: "pdf",
          };
          htmlpdf
            .create(html, options)
            .toFile(filepath, async function (err, res1) {
              if (err) {
                return res.json({
                  state: -1,
                  data: null,
                  message: err.message || err,
                });
              } else {
                try {
                  let imagecertificate = await pdftoimage(filepath, cer_name);
                  return res.json({
                    state: 1,
                    data: uploadpath || "aa",
                    message: "Success",
                  });
                } catch (e) {
                  return res.json({
                    state: -1,
                    data: null,
                    message: e.message || e,
                  });
                }
              }
            });
        } else {
          return res.json({
            message: "Something went wrong.",
            state: -1,
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
  } catch (err) {
    return res.json({
      state: -1,
      data: null,
      message: err.message || err,
    });
  }
}

async function pdftoimage(pdfpath, cer_name) {
  new Promise(function (resolve, reject) {
    try {
      const options = {
        density: 100,
        saveFilename: `${cer_name}_certification`,
        savePath: path.resolve(appRoot.path, "uploads/certification"),
        format: "png",
        width: 700,
        height: 500,
      };
      const storeAsImage = fromPath(pdfpath, options);
      const pageToConvertAsImage = 1;

      storeAsImage(pageToConvertAsImage)
        .then((result) => {
          resolve(result && result.path);
        })
        .catch((err) => {
          reject(err.message || err);
        });
    } catch (e) {
      reject(e.message || e);
    }
  });
}

async function deletecertificaton() {
  try {
    let checkdir1 = path.join(appRoot.path, "/uploads");
    if (!fs.existsSync(checkdir1)) {
      fs.mkdirSync(checkdir1);
    }
    let checkdir = path.join(appRoot.path, "/uploads/certification/");
    if (!fs.existsSync(checkdir)) {
      fs.mkdirSync(checkdir);
    }
    // await fse.emptyDir(checkdir)   // delete all file from certification
    // Read the directory given in `path`
    const files = fs.readdir(checkdir, (err, files) => {
      if (err) throw err;

      files.forEach((file) => {
        // Check if the file is with a PDF extension, remove it
        if (file.split(".").pop().toLowerCase() == "pdf") {
          fs.unlinkSync(checkdir + file);
        }
      });
    });
  } catch (err) {
    console.error(err);
  }
}

function viewinternalreward(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.feedback, [obj])
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
          data: null,
          message: "Something went wrong!",
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

// function internaldashboard(req, res) {
//   if (!req.body || !req.body.action) {
//     return res.json({
//       message: "Send required data",
//       state: -1,
//     });
//   }
//   let obj = JSON.stringify(req.body);
//   commonModel
//     .mysqlPromiseModelService(proc.feedback, [obj])
//     .then((results) => {
//       return res.json({
//         state: 1,
//         message: "Success",
//         data: results,
//       });
//     })
//     .catch((err) => {
//       return res.json({
//         state: -1,
//         data: null,
//         message: err.message || err,
//       });
//     });
// }
async function uploadsignature(req, res) {
  if (!req.body || !req.body.configcode) {
    return res.json({
      message: "send required data",
      state: -1,
    });
  }
  try {
    let checkPostsDir = makeDir("veSignature");
    var obj = req.body;
    var sampleFile = req.files && req.files.file;
    if (sampleFile) {
      var sampleFile_name = `${Date.now()}_${sampleFile.name}`;
      var filepath = path.join(checkPostsDir, sampleFile_name);
      await sampleFile.mv(
        path.join(appRoot && appRoot.path, "veSignature", sampleFile_name)
      );
      obj["configvalue1"] = path.join("veSignature/", sampleFile_name);
      obj["configvalue2"] = sampleFile_name;
    }
    obj["reqtype"] = "addesign";
    const reqData = JSON.stringify(obj);
    commonModel
      .mysqlPromiseModelService("call usp_rms_mapping_master(?,?)", [
        reqData,
        JSON.stringify([]),
      ])
      .then((results) => {
        return res.json({
          state: 1,
          message: "Success",
          data: results,
        });
      })
      .catch((err) => {
        return res.json({
          state: -1,
          data: null,
          message: err.message || err,
        });
      });
  } catch (e) {
    return res.json({
      message: e.message || e,
      state: -1,
    });
  }
}

async function createtownhall(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  var obj = req.body;
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService(proc.townhall, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "success",
        data: results,
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
async function addsuperadminbanalce(req, res) {
  var obj = req.body;
  obj.action = "addsuperadminbanalce";
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService(proc.coupon, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "success",
        data: results,
      });
    })
    .catch((err) => {
      //console.log("ERRRRRRRRRRRRRRRRRRRRRRRR", err);
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}

async function viewtransactioneonsuperadmin(req, res) {
  var obj = req.body;
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService(proc.coupon, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "success",
        data: results[0],
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

async function addsignature(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  var sampleFile = req.files && req.files.file;
  if (sampleFile) {
    let checkPostsDir = path.join("veSignature");
    makeDir(checkPostsDir);
    var sampleFile_name = `${Date.now()}_${sampleFile.name}`;
    await sampleFile.mv(
      path.join(appRoot && appRoot.path, "veSignature", sampleFile_name)
    );
    req.body.filename = sampleFile_name;
    req.body.filepath = path.join("veSignature/", sampleFile_name);
  }
  var obj = req.body;
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService(proc.mstsign, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
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

async function viewsignature(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  var obj = req.body;
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService(proc.mstsign, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
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

async function changefeedbackstatus(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  try {
    let obj = JSON.stringify(req.body);
    let typemail;
    let subjecttype;
    let headingtype;

    //message object to sending message with notification to mobile devices
    let message = {
      notification: {
        title: "Feedback",
        body: "",
      },
      data: {
        route: "/rewards",
        type: "feedback",
      },
    };
    req.body.feedbackdescription =
      req.body.feedbackdescription &&
      req.body.feedbackdescription.replace(/\\n/g, " ");
    req.body.feedbackdescription =
      req.body.feedbackdescription &&
      req.body.feedbackdescription.replace(/\\r/g, " ");
    commonModel
      .mysqlPromiseModelService(proc.mstpaytm, [obj])
      .then((results) => {
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
            data: results && results[2],
            feedbackid:
              results &&
              results[2] &&
              results[2][0] &&
              results[2][0].feedbackid,
          });
          if (results && results[0] && results[0][0] && results[0][0].emailid) {
            if (req.body.action == "rejectfeedback") {
              typemail = "feedbackrejected";
              subjecttype = "<Your Raised feedback Rejected>";
              headingtype = "Your Raised feedback Rejected";
              message.notification.body = `Your Raised ${
                results[0][0] && results[0][0].feedback
              } for ${
                results[0][0] && results[0][0].employeename
              } has been  Rejected by ${results[0][0].username}.`;

              let emailObj = {
                email: (results[0][0] && results[0][0].emailid) || " ",
                mailType: typemail,
                moduleid: req.body.moduleid ? req.body.moduleid : "feedback",
                userid: req.body.userid ? req.body.userid : req.body.createdby,
                subjectVariables: {
                  subject: subjecttype,
                },
                headingVariables: {
                  heading: headingtype,
                },

                bodyVariables: {
                  trxempname: (item && item.username) || "",
                  trxempsupervisor: item && item.trxempsupervisor,
                  trxempdob: item && item.trxempdob,
                  trxempjoining: item && item.trxempjoining,
                  trxfeedbackdescription:
                    (req.body && req.body.feedbackdescription) ||
                    (item && item.feedbackdescription) ||
                    "",
                  trxfeedbackusername: (item && item.employeename) || "",
                  trxempemail: item && item.trxempemail,
                  trxfeedbackraisedby: (item && item.trxfeedbackraisedby) || "",
                  trxfeedbackraisedate:
                    (item && item.trxfeedbackraisedate) || "",
                  trxfeedbacktype: item && item.trxfeedbacktype,
                  trxfeedbacksubtype: (item && item.trxfeedbacksubtype) || "",
                  trxothercomment: (item && item.trxothercomment) || "",
                  trxrejectcomment:
                    (req.body && req.body.approver_comment) ||
                    (item && item.trxapprovercomment) ||
                    "",
                  trxapprovedby: (item && item.trxapprovedby) || "",
                  trxrejectedby: (item && item.trxrejectedby) || "",
                  trxfeedbackpoint: (item && item.trxfeedbackpoint) || "",
                  trxfeedbackamount: (item && item.trxfeedbackamount) || "",

                  // userid: req.body && req.body.userid
                },
              };
              mailservice.mail(emailObj, function (err) {
                if (err) {
                  //  console.log("MAILLLLLLLLLLL", err);
                }
              });
              //Sending notification to mobile device on feedback action
              notificationCtrl.sendNotificationToMobileDevices(
                results[0][0].empid,
                message
              );
            }
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
        return res.json({
          state: -1,
          data: null,
          message: err.message || err,
        });
      });
  } catch (e) {
    return res.json({
      state: -1,
      data: null,
      message: e.message || e,
    });
  }
}

function approvemultiplefeedback(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  try {
    let message = {
      notification: {
        title: "Feedback",
        body: "",
      },
      data: {
        route: "/rewards",
        type: "feedback",
      },
    };
    let obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService("call usp_feedback_approve(?)", [obj])
      .then((results) => {
        res.json({
          state: 1,
          message: "Success",
          data: results && results[2],
        });
        /* if (results && results[0] && results[0][0] && results[0][0].emailid) {
          let list = results[0];
          let trxempname = "";
          let trxfeedbackusername = "";
          let typemail = "",
            subjecttype = "",
            headingtype = "";
          // trxempname = '',
          // trxfeedbackusername = '';
          let counter = 0;
          setTimeout(() => {
            list.forEach(function (item) {
              if (
                req.body.action == "approvefeedback" &&
                item &&
                item.finalapproval == 1
              ) {
                typemail = "feedbackraised";
                subjecttype = "<New Feedback Raised>";
                headingtype = "New Feedback Raised";
                trxempname = item && item.employeename;
                trxfeedbackusername = item && item.username;
                let emplist =
                  item && item.empid && item.empid.toString().split(",");
                emplist.forEach(function (item1) {
                  message.notification.body = `A new ${
                    (item && item.feedback) || ""
                  } has been raised for you by ${
                    (item && item.username) || ""
                  }.`;
                  //  Sending notification to mobile device on feedback action
                  notificationCtrl.sendNotificationToMobileDevices(
                    item1,
                    message
                  );
                  console.log(
                    "notificaton msg",
                    message.notification.body,
                    "IIIIIII",
                    item1,
                    "mailid-->",
                    item.emailid
                  );
                });
              } else if (
                req.body.action == "approvefeedback" &&
                item &&
                item.finalapproval == 0
              ) {
                typemail = "feedbackapproval";
                subjecttype = "<New Feedback Raised for Approval>";
                headingtype = "New Feedback Raised";
                trxempname = item && item.username;
                trxfeedbackusername = null;
                let emplist =
                  item && item.empid && item.empid.toString().split(",");
                emplist.forEach(function (item1) {
                  //    Sending notification to mobile device on feedback action
                  message.notification.body = `A new ${
                    (item && item.feedback) || ""
                  } has been raised for ${(item && item.username) || ""}`;
                  // notificationCtrl.sendNotificationToMobileDevices(item1, message);
                  console.log(
                    "notificaton msg",
                    message.notification.body,
                    "IIIIIII",
                    item1,
                    "mailid-->",
                    item.emailid
                  );
                });
              } else if (req.body.action == "rejectfeedback") {
                typemail = "feedbackrejected";
                subjecttype = "<Your Raised feedback Rejected>";
                headingtype = "Your Raised feedback Rejected";
                trxempname = item && item.username;
                trxfeedbackusername = item && item.employeename;
                //    Sending notification to mobile device on feedback action
                message.notification.body = `Your Raised ${
                  (item && item.feedback) || ""
                } for ${
                  (item && item.employeename) || ""
                } has been  Rejected by ${(item && item.username) || ""}.`;
                // notificationCtrl.sendNotificationToMobileDevices(item.empid, message);
              }
              let emailObj = {
                email: item.emailid || " ",
                cc: (req.body && req.body.notifyto) || "",
                mailType: typemail,
                moduleid: req.body.moduleid ? req.body.moduleid : "feedback",
                userid: req.body.userid ? req.body.userid : req.body.createdby,
                subjectVariables: {
                  subject: subjecttype,
                },
                headingVariables: {
                  heading: headingtype,
                },

                bodyVariables: {
                  trxempname: trxempname || "",
                  trxfeedbackdescription:
                    (req.body && req.body.feedbackdescription) ||
                    (item && item.feedbackdescription) ||
                    "",
                  trxfeedbackusername: trxfeedbackusername || "",
                  trxempemail: item && item.trxempemail,
                  // userid: req.body && req.body.userid
                },
              };
              counter = counter + 1;
              mailservice.mail(emailObj, function (err) {
                if (err) {
                  console.log("MAILLLLLLLLLLL", err);
                }
              });
            });
          }, counter * 3000);
        }
        if (results && results[1] && results[1][0] && results[1][0].emailid) {
          let list = results[0];
          let counter1 = 0,
            typemail,
            subjecttype,
            headingtype;
          setTimeout(() => {
            list.forEach(function (item) {
              if (req.body.action == "approvefeedback") {
                typemail = "feedbackapproved";
                subjecttype = "<Your Raised feedback Approved>S";
                headingtype = "Your Raised feedback Approved";
              }
              let emailObj = {
                email: item.emailid || " ",
                mailType: typemail,
                moduleid: req.body.moduleid ? req.body.moduleid : "feedback",
                userid: req.body.userid ? req.body.userid : req.body.createdby,
                subjectVariables: {
                  subject: subjecttype,
                },
                headingVariables: {
                  heading: headingtype,
                },

                bodyVariables: {
                  trxempname: (item && item.username) || "",
                  trxfeedbackdescription:
                    (req.body && req.body.feedbackdescription) || "",
                  trxfeedbackusername: (item && item.employeename) || "",
                  trxempsupervisor: item && item.trxempsupervisor,
                  trxempdob: item && item.trxempdob,
                  trxempjoining: item && item.trxempjoining,
                  trxempemail: item && item.trxempemail,
                },
              };
              counter1 = counter1 + 1;
              mailservice.mail(emailObj, function (err) {
                if (err) {
                  console.log("MAILLLLLLLLLLL", err);
                }
              });
            });
          }, counter1 * 3000);
        }  */
      })
      .catch((err) => {
        return res.json({
          state: -1,
          data: null,
          message: err.message || err,
        });
      });
  } catch (e) {
    return res.json({
      state: -1,
      data: null,
      message: e.message || e,
    });
  }
}

function createteam(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.feedback, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
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

function feedbackforraise(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      state: -1,
      message: "Send Required data",
    });
  }
  try {
    let obj = req.body,
      whomearr = [],
      resultarr = [];
    obj = JSON.stringify(obj);
    commonModel
      .mysqlPromiseModelService(proc.feedback, [obj])
      .then((results) => {
        let data = results && results[0];
        for (let i = 0; i < data.length; i++) {
          let filterdata =
            data[i] && data[i].allowfeedback && data[i].allowfeedback;
          if (filterdata) {
            let is_in_otheruser;
            if (data[i] && data[i].otheruserid && data[i].otheruserid) {
              is_in_otheruser = data[i].otheruserid
                .split(",")
                .indexOf(req.body.createdby.toString());
            }
            whomearr = [];
            filterdata = JSON.parse(filterdata);
            let isallow = false;
            for (let j = 0; j < filterdata.length; j++) {
              if (filterdata[j].access_to_raise == data[i].adminroleid) {
                whomearr.push(filterdata[j].allowfeedback);
                isallow = true;
              }
              if (filterdata[j].access_to_raise == data[i].hodroleid) {
                whomearr.push(filterdata[j].allowfeedback);
                isallow = true;
              }
              if (filterdata[j].access_to_raise == data[i].hoperoleid) {
                whomearr.push(filterdata[j].allowfeedback);
                isallow = true;
              }
              if (filterdata[j].access_to_raise == data[i].supervisorroleid) {
                whomearr.push(filterdata[j].allowfeedback);
                isallow = true;
              }
              if (filterdata[j].access_to_raise == data[i].userroleid) {
                whomearr.push(filterdata[j].allowfeedback);
                isallow = true;
              }
              if (
                filterdata[j].access_to_raise == data[i].otherroleid &&
                is_in_otheruser > -1
              ) {
                whomearr.push(filterdata[j].allowfeedback);
                isallow = true;
              }
            }
            // let isallow = filterdata.find(item => item.access_to_raise == data[i].roleid);
            if (isallow) {
              let whome_to_raise = [...new Set(whomearr)];
              whome_to_raise = whome_to_raise.toString();
              data[i].whome_to_raise = whome_to_raise;
              resultarr.push(data[i]);
            }
          }
        }
        return res.json({
          state: 1,
          message: "Success",
          data: resultarr,
        });
      })
      .catch((err) => {
        return res.json({
          state: -1,
          data: null,
          message: err.message || err,
        });
      });
  } catch (e) {
    return res.json({
      state: -1,
      data: null,
      message: (e && e.message) || "Something went wrong!",
    });
  }
}

async function feedbackuserlist(req, res) {
  if (!req.body) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  try {
    userhierarcy(req, res)
      .then((val) => {
        let obj = req.body;
        obj.reporteelist = val;
        obj.action = "feedbackuserlist";
        obj = JSON.stringify(obj);
        commonModel
          .mysqlPromiseModelService("call usp_feedback_user(?)", [obj])
          .then((results) => {
            return res.json({
              state: 1,
              message: "success",
              data: results,
            });
          })
          .catch((err) => {
            return res.json({
              state: -1,
              data: null,
              message: err.message || err,
            });
          });
      })
      .catch((err) => {
        return res.json({
          state: -1,
          data: null,
          message: err.message || err,
        });
      });
  } catch (err) {
    return res.json({ state: -1, message: "Something went wrong" });
  }
}

function convertJsonToExceldata(jsondata) {
  try {
    var feedbackreport = jsondata;
    if (feedbackreport.length > 0) {
      if (!fs.existsSync(path.join(appRoot.path, "uploads/feedback"))) {
        fs.mkdirSync(path.join(appRoot.path, "uploads/feedback"));
      }
      var filepath = path.join(
        appRoot.path,
        "uploads/feedback/feedbackmonthlyreport.xlsx"
      );

      const wb = new xl.Workbook();
      const ws = wb.addWorksheet("Worksheet Name");

      const headingColumnNames = [
        "Employee Name",
        "Department",
        "Designation",
        "Financial year",
        "Month",
        "Feedback count",
        "Score",
      ]; //Object.keys(feedbackreport[0]);
      // const headingColumnNames2 = ["Employee Name", "Department", "Designation"];//Object.keys(feedbackreport[0]);

      //console.log(headingColumnNames)

      let headingColumnIndex = 1;
      headingColumnNames.forEach((heading) => {
        heading.replace("'", '"');
        ws.cell(1, headingColumnIndex++).string(heading);
      });

      let rowIndex = 2;
      feedbackreport.forEach((record) => {
        let columnIndex = 1;
        ws.cell(rowIndex, columnIndex++).string(record["name"].toString());

        ws.cell(rowIndex, columnIndex++).string(
          record["departname"].toString()
        );

        ws.cell(rowIndex, columnIndex++).string(
          record["designation"].toString()
        );

        ws.cell(rowIndex, columnIndex++).string(record["financialyear"]);

        // ws.cell(rowIndex, columnIndex++)
        //   .string(record["financialquarteryear"])

        ws.cell(rowIndex, columnIndex++).string(record["month"].toString());

        record["feedbackcount"] = record["feedbackcount"].toString();
        ws.cell(rowIndex, columnIndex++).string(record["feedbackcount"]);

        record["score"] = record["score"].toString();

        ws.cell(rowIndex, columnIndex++).string(record["score"]);
        // Object.keys(record).forEach(columnName => {
        //   //record[columnName] = '"' + (record[columnName]) + '"';
        //   ws.cell(rowIndex, columnIndex++)
        //     .string(record[columnName])
        // });
        rowIndex++;
      });

      wb.write(filepath);
      //sendAlert("No Error")
    } else {
      //console.log("Empty");
    }
  } catch (err) {
    //console.log("Err", err);
  }
}

async function feedbacksuggestion(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = await commonCtrl.verifyNull(req.body);
  obj = JSON.stringify(obj);

  commonModel
    .mysqlPromiseModelService(proc.feedbacksuggestion, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
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

function feedbackReportMail() {
  let obj = {};
  obj.action = "R&Radmins";

  commonModel
    .mysqlPromiseModelService("call usp_cron_operations(?)", [
      JSON.stringify(obj),
    ])
    .then((results) => {
      if (results) {
        convertJsonToExceldata(results[0]);
        var emailList = _.pluck(results[1], "useremail");
        var filepath = path.join(
          appRoot.path,
          "uploads/feedback/feedbackmonthlyreport.xlsx"
        );
        if (fs.existsSync(filepath)) {
          let emailObj = {
            headers: {
              "Content-Transfer-Encoding": "quoted-printable",
            },
            to: emailList.toString() || " ",
            subject: "Feedback Monthly Report",
            html: "Dear Admin,<br> <br>Please find attached employees feedback monthly Report",
            attachments: [
              {
                filename: "feedbackmonthlyreport.xlsx",
                path: filepath,
              },
            ],
          };
          mailservice.sendCustomEmail(emailObj, function (err) {
            if (err) {
              //console.log("MAILLLLLLLLLLL", err);
            }
          });
        }
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

async function draftFeedback(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = await commonCtrl.verifyNull(req.body);
  obj = JSON.stringify(obj);

  commonModel
    .mysqlPromiseModelService(proc.feedbackdraft, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
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

async function viewSelfFeedback(req, res) {
  if (!req.body) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify({ ...req.body, ...(req && req.query) });
  commonModel
    .mysqlPromiseModelService(proc.selffeedback, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
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

async function homeFeedback(req, res) {
  if (!req.body) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = req.body;
  obj.reqType = "feedbackHome";
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService(proc.homeFeedback, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results && results[0] && results[0][0],
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

// async function sendleaderborad() {
//   try {
//     let obj = {
//       action: "sendleaderborad",
//     };
//     obj = JSON.stringify(req.body);
//     // commonModel.mysqlPromiseModelService(proc.feedback, [obj])
//     // .then(results => {
//     let resdata = await createleaderbord(grantobj);
//     var html = resdata && resdata.html;
//     var mailcontent = resdata && resdata.mailcontent;
//     let checkdir1 = path.join(appRoot.path, "/uploads");
//     if (!fs.existsSync(checkdir1)) {
//       fs.mkdirSync(checkdir1);
//     }
//     let checkdir = path.join(appRoot.path, "/uploads/grantletter");
//     if (!fs.existsSync(checkdir)) {
//       fs.mkdirSync(checkdir);
//     }
//     let letter_name = `${Date.now()}_${(
//       (req.body && req.body.id) ||
//       "a"
//     ).toString()}`;
//     let filepath = path.resolve(
//       appRoot.path,
//       "uploads/grantletter",
//       `${letter_name}Grant-letter.pdf`
//     );

//     let htmloptions = {
//       format: "A4",
//       header: {
//         height: "5mm",
//       },
//       footer: {
//         height: "5mm",
//       },
//       border: {
//         top: "5mm",
//         bottom: "5mm",
//         left: "2mm",
//         right: "2mm",
//       },
//       margin: {
//         right: "5mm",
//         left: "5mm",
//         top: "2mm",
//         bottom: "2mm",
//       },
//     };
//     htmlpdf
//       .create(html, htmloptions)
//       .toFile(filepath, async function (err, res1) {
//         if (err) {
//           return res.json({
//             state: -1,
//             data: null,
//             message: err.message || err,
//           });
//         } else {
//           let obj = {
//             createdby: req.body.createdby,
//             action: "sendgranttletter",
//             id: req.body.id,
//             filepath: `grantletter/${letter_name}Grant-letter.pdf`,
//           };
//           commonModel
//             .mysqlPromiseModelService(proc.sendletter, [JSON.stringify(obj)])
//             .then((results) => {
//               let alltomails, ccallmails;
//               if (results && results[0][0] && results[0][0].alltomails) {
//                 alltomails = results[0][0].alltomails;
//               }
//               if (results && results[0][0] && results[0][0].ccallmails) {
//                 ccallmails = results[0][0].ccallmails;
//               }
//               let emailObj = {
//                 to: alltomails || "",
//                 cc: ccallmails || "",
//                 subject:
//                   (results && results[0][0] && results[0][0].subject) ||
//                   "<ESOPs Grant Letter >",
//                 html: mailcontent,
//                 offerletter: 1,
//                 attachments: [
//                   {
//                     filename: "Grant-letter.pdf",
//                     path: path.join(
//                       appRoot.path,
//                       "uploads/grantletter",
//                       `${letter_name}Grant-letter.pdf`
//                     ),
//                   },
//                 ],
//               };
//               mailservice.sendCustomEmail(emailObj, function (err, response) {
//                 if (err) {
//                   return res.json({
//                     state: -1,
//                     message: err.message || JSON.stringify(err),
//                     data: null,
//                   });
//                 } else {
//                   return res.json({
//                     state: 1,
//                     message: "Sucess",
//                     data: null,
//                   });
//                 }
//               });
//             })
//             .catch((err) => {
//               return res.json({
//                 message: err,
//                 data: null,
//                 state: -1,
//               });
//             });
//         }
//       });
//     console.log("Success");
//   } catch (e) {
//     console.log("Failure", e);
//   }
// }

// function createleaderbord(grantobj) {
//   return new Promise((resolve, reject) => {
//     try {
//       commonModel
//         .mysqlPromiseModelService(proc.feedback, [grantobj])
//         .then(async (results) => {
//           let Leaderboard = "";
//           let employeelist = "";
//           let FY = "";
//           let Month = "";
//           let Date = "";
//           results[0].forEach(function (item) {
//             employeelist += `<tr>
//         <td style="text-align:center;border: 1px solid #ddd;padding: 5px !important;">${item.Employeename} </td>
//         <td style="text-align:center;border: 1px solid #ddd;padding: 5px !important;"> ${item.Employeepoint}</td>
//         </tr>`;
//           });
//           Leaderboard = `<table cellspacing="0" cellpadding="0"; style ="font-family: arial, sans-serif;font-size:7px
//         border-collapse: collapse;
//         width: 90%;margin:auto; text-align:center;border:1px solid #ddd;"> <tr>
//         <th style ="width: 300px;text-align: center;padding: 6px;background: #f5f1f1;border: 1px solid #ddd;">
//          Vesting Date </th>
//          <th style ="width: 300px;text-align: center;padding: 6px;background: #f5f1f1;border: 1px solid #ddd;">
//           Quantity </th> </tr> ${employeelist} </table>`;
//           let trxcompanylogo = path.join(
//             appRoot && appRoot.path,
//             "/uploads/" +
//               (results &&
//                 results[0] &&
//                 results[0][0] &&
//                 results[0][0].trxcompanylogo)
//           );
//           if (fs.existsSync(trxcompanylogo)) {
//             trxcompanylogo =
//               config.webUrlLink +
//               "/webapi/" +
//               (results &&
//                 results[0] &&
//                 results[0][0] &&
//                 results[0][0].trxcompanylogo);
//           } else {
//             trxcompanylogo =
//               config.webUrlLink + "/webapi/cert/default-logo.png";
//           }
//           let Companylogo = `<img src=${trxcompanylogo} alt="" height="70" width="100" style=" margin: 10px;">`;
//           let leaderBoardParamsList = {
//             Companylogo: Companylogo,
//             Leaderboard: Leaderboard,
//             FY: FY,
//             Month: Month,
//             Date: Date,
//           };

//           if (leaderBoardParamsList) {
//             var paramArr = _.keys(leaderBoardParamsList);
//             paramArr.forEach((item) => {
//               var replacementvar = leaderBoardParamsList[item]
//                 ? leaderBoardParamsList[item]
//                 : "";
//               var match = new RegExp(item, "g");
// html = html && html.replace(match, replacementvar);
//               mailcontent =
//                 mailcontent && mailcontent.replace(match, replacementvar);
//               // console.log('item', item)
//             });
//             const replacer = new RegExp("\r", "g"),
//               replacer1 = new RegExp("\ufeff", "g"),
//               replacer2 = new RegExp("\n", "g");

//             html = html
//               .replace(replacer, "")
//               .replace(replacer1, "")
//               .replace(replacer2, "");
//             mailcontent = mailcontent
//               .replace(replacer, "")
//               .replace(replacer1, "")
//               .replace(replacer2, "");
//           }
//           resolve({
//             html: html,
//             mailcontent: mailcontent,
//           });
//         })
//         .catch((err) => {
//           reject((err && err.message) || "Something went Wrong");
//         });
//     } catch (err) {
//       reject((err && err.message) || "Something went Wrong");
//     }
//   });
// }

async function feedbackKRA(req, res) {
  if (!req.body) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify({ ...req.body });
  commonModel
    .mysqlPromiseModelService(proc.feedbackkra, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
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


async function viewOfflineAward(req, res) {
  if (!req.body) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify({ ...req.body });
  commonModel
    .mysqlPromiseModelService(proc.offlineFeedback, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
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
