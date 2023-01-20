const proc = require("../../common/procedureConfig");
const commonModel = require("../../common/Model");
const _ = require("underscore");
const lodash = require("lodash");
const mailservice = require("../../../services/mailerService");
const moment = require("moment");
const webUrllink = require("../../../config/config").webUrlLink;
const path = require("path");
const appRoot = require("app-root-path");
const fs = require("fs");
const async = require("async");
const query = require("../../common/Model").mysqlPromiseModelService;
const uploadService = require("../../../services/uploadService");
const excelToJson = require("convert-excel-to-json");
const notificationCtrl = require("../../notification/Controller");
const feedbackController = require("../../feedback/Controller");
const { makeDirectories } = require("../../common/utils");
const { sendBellIconNotification } = require("../../notification/socket.io")

const config = require("../../../config/config");
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;



module.exports = {
  leaveConfig: leaveConfig,
  applyLeave: applyLeave,
  forwardleave: forwardleave,
  updateLeaves: updateLeaves,
  leaveAction: leaveAction,
  leaveAllotOnConfirm: leaveAllotOnConfirm,
  viewleavereport: viewleavereport,
  changeLeaveTypeStatus: changeLeaveTypeStatus,
  changeLeaveConfigStatus: changeLeaveConfigStatus,
  leaveConfigOperations: leaveConfigOperations,
  viewLeaveConfig: viewLeaveConfig,
  leaveAppliedDetail: leaveAppliedDetail,
  leaveReports: leaveReports,
  saveAdditionalLeave,
  viewAdditionalLeave,
  requestCompoff,
  approveCompoff,
  viewCompoff,
  uploadleavebalance,
  leavetakenReport,
  leaveDashboard,
  clearCompoffBalance,
  upcomingLeaves,
  getMonthlyLeave,
  leaveReconcileReport,
  leaveHomeCounts,
  leaveDashboardCard,
  leaveTransactionReport,
};

function leaveConfig(req, res) {
  req.body = _.mapObject(req.body, function (val, key) {
    if (val && val.constructor === Array) {
      val = val.toString();
    }
    return val;
  });
  let obj = req.body;
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService(proc.leaveOperations, [obj])
    .then((result) => {
      return res.json({ message: "success", data: result[0], state: 1 });
    })
    .catch((err) => {
      res.json({ message: err, data: err, state: -1 });
    });
}

function applyLeave(req, res) {
  var obj = req.body;
  obj.fromdate = moment(new Date(req.body.fromdate)).format("YYYY-MM-DD HH:mm");
  obj.todate = moment(new Date(req.body.todate)).format("YYYY-MM-DD HH:mm");
  if (obj.isHalf && obj.isHalf == 1) {
    obj.todate = moment(new Date(req.body.fromdate)).format("YYYY-MM-DD HH:mm");
  }
  obj.ccemails = req.body.ccemails && req.body.ccemails.toString();
  obj.action = "applyleave";
  obj.offdates = obj.offdates && obj.offdates.split(",");
  obj.holidaydates = obj.holidaydates && obj.holidaydates.split(",");
  obj.weekoffdates = obj.weekoffdates && obj.weekoffdates.split(",");
  obj.dates = [];
  _.each(obj.offdates, function (item) {
    if (
      !(
        _.indexOf(obj.holidaydates, item) > -1 ||
        _.indexOf(obj.weekoffdates, item) > -1
      )
    )
      obj.dates.push(item);
  });
  if (obj.dates) obj.dates = obj.dates.toString();

  //message object to sending message with notification to mobile devices
  let message = {
    notification: {
      title: "Leave",
      body: "",
    },
    data: {
      route: "/leaves",
      type: "leave",
    },
  };

  let countfiles = req.body.attachCount || 0;
  countfiles = parseInt(countfiles);

  //if (countfiles && countfiles != 0) {
  let createdby = req.body.createdby.toString();
  let uploadPath = makeDirectories(path.join("uploads", "leave", createdby));
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
        //console.log("sampleFile.name", sampleFile_name);
        sampleFile.mv(filepath1, (err) => {
          if (!err) {
            filename.push(sampleFile_name);
            let uploadfilename = path.join("leave", createdby, sampleFile_name);
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
      obj = JSON.stringify(obj);
      commonModel
        .mysqlPromiseModelService(proc.leaveOperations, [obj])
        .then((result) => {
          let leaveParam = result && result[0] && result[0][0];
          res.json({
            message: "Leave Applied Successfully",
            data: null,
            state: 1,
            leave_id: leaveParam.leaveapplyid
          });
          var fdate = req.body.fromdate.split(" ")[0];
          var tdate = req.body.todate.split(" ")[0];
          var tokemail = req.body.tokenFetchedData.email.toString();
          let moduleid = req.body.moduleid ? req.body.moduleid : "Leave";

          let bellNotificationData = {
            "assignedtouserid": leaveParam.notification_to,
            "assignedfromuserid": leaveParam.notification_from,
            "notificationdesc": "",
            "attribute1": "",
            "attribute2": "",
            "attribute3": leaveParam.leaveapplyid,
            "attribute4": 0,
            "isvendor": "",
            "web_route": 'leave-management/home',
            "app_route": "app/route",
            "fortnight_date": "",
            "module_name": "Leave",
            "createddate": moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            "createdby": req.body.createdby,
            "datevalue": new Date().valueOf()
          }



          if (req.body.userid && req.body.useremail) {
            var mailOptions = {
              email: req.body.useremail,
              moduleid: moduleid,
              userid: req.body.userid,
              mailType: "applyleavebyadmin",
              banner: "",
              subjectVariables: {
                subject: "Leave applied by admin on your behalf",
              },
              headingVariables: { heading: "Leave Application" },
              bodyVariables: {
                trxempname:
                  "Admin - " +
                  req.body.tokenFetchedData.firstname +
                  " " +
                  req.body.tokenFetchedData.lastname, //+ ' <font color="black" size=""20px>( '+ req.body.tokenFetchedData.email +' )</font>',
                trxleavetype: req.body.leavetypename,
                trxempemail: tokemail, //format('ddd Do MMMM, YYYY')
                trxleavefromdt: moment(fdate, "YYYY-MM-DD").format(
                  "DD MMMM YYYY"
                ), //moment(req.body.fromdate).format('DD-MM-YYYY'),
                trxleavetodt: moment(tdate, "YYYY-MM-DD").format(
                  "DD MMMM YYYY"
                ), //moment(req.body.todate).format('DD-MM-YYYY'),
                trxleavetaken: req.body.leavetaken,
                trxleavereason: req.body.reason || "",
                trxleavefromsess: req.body.fromsession,
                trxleavetosess: req.body.tosession,
                trxempsupervisor: leaveParam && leaveParam.trxempsupervisor,
                trxempdob: leaveParam && leaveParam.trxempdob,
                trxempjoining: leaveParam && leaveParam.trxempjoining,
                trxtotal_approved: leaveParam && leaveParam.trxtotal_approved,
                trxtotal_applied: leaveParam && leaveParam.trxtotal_applied,
                //linkUrl:webUrllink
              },
            };
            let messageonbehalf = {
              notification: {
                title: "Leave",
                body: "Leave applied by admin on your behalf.",
              },
              data: {
                route: "/leaves",
                type: "leave",
                tab: '0'
              },
            };

            message.notification.body = `Leave requested by admin on behalf of ${req.body.username || ""
              }`;
            notificationCtrl.sendNotificationToMobileDevices(
              req.body.userid,
              messageonbehalf
            );
            notificationCtrl.sendNotificationToMobileDevices(
              leaveParam && leaveParam.trxempsupervisorid,
              message
            );
            var msgbody = `Leave applied by admin on behalf of ${req.body.username || ""
              } from: ${moment(fdate, "YYYY-MM-DD").format("DD MMMM YYYY")} to: ${moment(tdate, "YYYY-MM-DD").format("DD MMMM YYYY")}`;
            let bellNotificationDataSupervisor = {
              ...bellNotificationData,
              "assignedtouserid": leaveParam.trxempsupervisorid,
              "notificationdesc": msgbody,
            };
            if (global.io) {
              bellNotificationData.notificationdesc = `Leave applied by admin on your behalf. from: ${moment(fdate, "YYYY-MM-DD").format("DD MMMM YYYY")} to: ${moment(tdate, "YYYY-MM-DD").format("DD MMMM YYYY")}`
              sendBellIconNotification(bellNotificationData)
              sendBellIconNotification(bellNotificationDataSupervisor)
            }
            notificationCtrl.saveBellNotification(bellNotificationData);
            notificationCtrl.saveBellNotification(bellNotificationDataSupervisor);
            //console.log("mailptions", mailOptions);
          } else {
            var mailOptions = {
              email: req.body.appliedtoemail,
              cc: (req.body.ccemails && req.body.ccemails.toString()) || "",
              moduleid: moduleid,
              userid: req.body.tokenFetchedData && req.body.tokenFetchedData.id,
              // email:'shubham.sachdeva@polestarllp.com',
              mailType: "applyleave",
              banner: "",
              subjectVariables: {
                leaveType: req.body.leavetypename,
                requestByName:
                  req.body.tokenFetchedData.firstname +
                  " " +
                  req.body.tokenFetchedData.lastname,
                subject: "Request for leaveType by requestByName",
              },
              headingVariables: { heading: "Leave Application" },
              bodyVariables: {
                trxempname:
                  req.body.tokenFetchedData.firstname +
                  " " +
                  req.body.tokenFetchedData.lastname, //+ ' <font color="black" size=""20px>( '+ req.body.tokenFetchedData.email +' )</font>',
                trxleavetype: req.body.leavetypename,
                trxempemail: tokemail, //format('ddd Do MMMM, YYYY')
                trxleavefromdt: moment(fdate, "YYYY-MM-DD").format(
                  "DD MMMM YYYY"
                ), //moment(req.body.fromdate).format('DD-MM-YYYY'),
                trxleavetodt: moment(tdate, "YYYY-MM-DD").format(
                  "DD MMMM YYYY"
                ), //moment(req.body.todate).format('DD-MM-YYYY'),
                trxleavetaken: req.body.leavetaken,
                trxleavereason: req.body.reason || "",
                trxleavefromsess: req.body.fromsession,
                trxleavetosess: req.body.tosession,
                trxempsupervisor: leaveParam && leaveParam.trxempsupervisor,
                trxempdob: leaveParam && leaveParam.trxempdob,
                trxempjoining: leaveParam && leaveParam.trxempjoining,
                trxtotal_approved: leaveParam && leaveParam.trxtotal_approved,
                trxtotal_applied: leaveParam && leaveParam.trxtotal_applied,
                //linkUrl: webUrllink
              },
            };
            bellNotificationData.notificationdesc = `Leave Requested by ${leaveParam.notification_from_name || ''} for Approval. from: ${moment(fdate, "YYYY-MM-DD").format("DD MMMM YYYY")} to: ${moment(tdate, "YYYY-MM-DD").format("DD MMMM YYYY")}`
            message.notification.body = bellNotificationData.notificationdesc
            message.data.tab = '1'

            notificationCtrl.sendNotificationToMobileDevices(leaveParam.notification_to, message)
            sendBellIconNotification(bellNotificationData)
            notificationCtrl.saveBellNotification(bellNotificationData)
          }
          mailservice.mail(mailOptions, function (err, response) {
            if (err) {
              //console.log(
              // " { state:-1,message: 'Mail not sent.', error: err }"
              //  );
            } else {
              //console.log("return { state:1,message: 'Mail sent' }");
            }
          });
        })
        .catch((err) => {
          res.json({
            message: err || "Something went wrong",
            data: err,
            state: -1,
          });
        });
    }
  );
  //   }
}
function forwardleave(req, res) {
  let obj = req.body;
  obj.fromdate = moment(req.body.fromdate).format("YYYY-MM-DD HH:mm");
  obj.todate = moment(req.body.todate).format("YYYY-MM-DD HH:mm");
  let fdate = req.body.fromdate.split(" ")[0];
  let tdate = req.body.todate.split(" ")[0];
  obj.action = "forwardleave";
  let message = {
    notification: {
      title: "Leave",
      body: "",
    },
    data: {
      route: "/leaves",
      type: "leave",
      tab: '1'
    },
  };
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService(proc.leaveOperations, [obj])
    .then((result) => {
      res.json({
        message: "Leave Forwarded Successfully",
        data: null,
        state: 1,
      });
      let leaveParam = result[0][0];
      let moduleid = req.body.moduleid ? req.body.moduleid : "Leave";
      var mailOptions = {
        email: req.body.appliedtoemail,
        moduleid: moduleid,
        userid: result && result[0] && result[0][0] && result[0][0].userid,
        // email:'shubham.sachdeva@polestarllp.com',
        mailType: "forwardleave",
        subjectVariables: {
          subject: req.body.forwardedby + " has forwarded leave application ",
        },
        headingVariables: { heading: "Leave Application Forwarded" },
        bodyVariables: {
          trxempname: req.body.appliedby,
          trxleavetype: req.body.leavetypename,
          trxleavefromdt: moment(fdate, "YYYY-MM-DD").format("DD MMMM YYYY"), //req.body.fromdate,
          trxleavetodt: moment(tdate, "YYYY-MM-DD").format("DD MMMM YYYY"), //req.body.todate
          trxleavetaken: req.body.leavetaken,
          trxleavereason: req.body.reason || "",
          trxleavefromsess: req.body.fromsession,
          trxleavetosess: req.body.tosession,
          trxleaveforwardedby: req.body.forwardedby,
          trxempsupervisor:
            result &&
            result[0] &&
            result[0][0] &&
            result[0][0].trxempsupervisor,
          trxempdob:
            result && result[0] && result[0][0] && result[0][0].trxempdob,
          trxempjoining:
            result && result[0] && result[0][0] && result[0][0].trxempjoining,
          trxtotal_approved:
            result &&
            result[0] &&
            result[0][0] &&
            result[0][0].trxtotal_approved,
          trxtotal_applied:
            result &&
            result[0] &&
            result[0][0] &&
            result[0][0].trxtotal_applied,
          //linkUrl:webUrllink
        },
      };
      let bellNotificationData = {
        "assignedtouserid": leaveParam.notification_to,
        "assignedfromuserid": leaveParam.notification_from,
        "notificationdesc": "",
        "attribute1": "",
        "attribute2": "",
        "attribute3": leaveParam.leaveapplyid,
        "attribute4": 3,
        "isvendor": "",
        "web_route": 'leave-management/home',
        "app_route": "app/route",
        "fortnight_date": "",
        "module_name": "Leave",
        "createddate": moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        "datevalue": new Date().valueOf()
      }
      bellNotificationData.notificationdesc = `Leave request of ${leaveParam.notification_for_name} from: ${moment(fdate, "YYYY-MM-DD").format("DD MMMM YYYY")} to: ${moment(tdate, "YYYY-MM-DD").format("DD MMMM YYYY")} has been Forwarded by ${leaveParam.notification_from_name} for your Approval`
      message.notification.body = bellNotificationData.notificationdesc

      notificationCtrl.sendNotificationToMobileDevices(leaveParam.notification_to, message);
      sendBellIconNotification(bellNotificationData)
      notificationCtrl.saveBellNotification(bellNotificationData)
      //notificationCtrl.saveUserNotificationDirect(keysdata)
      mailservice.mail(mailOptions, function (err, response) {
        if (err) {
          //console.log("err", err);
          //console.log(" { state:-1,message: 'Mail not sent.', error: err }");
        } else {
          //console.log("return { state:1,message: 'Mail sent' }");
        }
      });
    })
    .catch((err) => {
      res.json({ message: "Something went wrong", data: err, state: -1 });
    });
}

function updateLeaves() {
  let obj = {
    action: "leavefrequency",
  };
  commonModel
    .mysqlPromiseModelService("call usp_leave_update(?)", [JSON.stringify(obj)])
    .then((result) => {
      //console.log(
      //   "success  " +
      //     `${result[0] && result[0][0] && result[0][0].updatecount} 
      //     No.of Leave Configurations has been updated 
      //     and leaves are assigned/updated to users based on that`
      //   );
    })
    .catch((err) => {
      //console.log("ERROR leave update", err);
    });
}

function leaveAction(req, res) {
  if (!req.body.action) {
    return res.json({ state: -1, message: "Action is Required" });
  }
  let obj = req.body;
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService(proc.leaveOperations, [obj])
    .then((result) => {
      res.json({
        message: result[0] && result[0][0] && result[0][0].message,
        data: result[0],
        state: 1,
      });
      let leaveParam = result[0][0]
      var mailtype = "";
      var leavestatus = "";
      var leavesub = "";
      var subjecttype = "";
      var headingtype = "";
      let moduleid = req.body.moduleid ? req.body.moduleid : "Leave";
      let message = {
        notification: {
          title: "Leave",
          body: "",
        },
        data: {
          route: "/leaves",
          type: "leave",
          tab: '0'
        },
      };
      let fdate = leaveParam.trxfromdate ? moment(leaveParam.trxfromdate, "YYYY-MM-DD").format("DD MMMM YYYY") : moment(req.body.fromdate, "DD-MM-YYYY").format("DD MMMM YYYY")
      let tdate = leaveParam.trxtodate ? moment(leaveParam.trxtodate, "YYYY-MM-DD").format("DD MMMM YYYY") : moment(req.body.todate, "DD-MM-YYYY").format("DD MMMM YYYY")
      let bellNotificationData = {
        "assignedtouserid": leaveParam.notification_to,
        "assignedfromuserid": leaveParam.notification_from,
        "notificationdesc": "",
        "attribute1": "",
        "attribute2": "",
        "attribute3": leaveParam.leaveapplyid,
        "attribute4": 3,
        "isvendor": "",
        "web_route": 'leave-management/home',
        "app_route": "app/route",
        "fortnight_date": "",
        "module_name": "Leave",
        "createddate": moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        "datevalue": new Date().valueOf()
      }

      if (req.body.action == "approveleave") {
        mailtype = "actionleave";
        leavestatus = req.body.isapproved == 1 ? "is Approved" : "is Rejected";
        leavesub = req.body.isapproved == 1 ? "Approved" : "Rejected";
        subjecttype =
          "Request for " + req.body.leavetypename + " is " + leavesub;
        headingtype = req.body.leavetypename + " Application " + leavesub;

        bellNotificationData.notificationdesc = `Your Leave has been ${leavesub} by ${leaveParam.notification_from_name} from: ${fdate} to: ${tdate}`
        message.notification.body = bellNotificationData.notificationdesc

      } else if (req.body.action == "cancelleave") {
        mailtype = "actionleave";
        leavestatus =
          req.body.isapproved == 1
            ? "withdrawal accepted"
            : "withdrawal rejected";
        leavesub = req.body.isapproved == 1 ? "approved" : "rejected";
        subjecttype =
          "Request for " + req.body.leavetypename + " withdrawal " + leavesub;
        headingtype = "Leave " + leavestatus;

        bellNotificationData.notificationdesc = `Your leave withdrawal request has been ${leavesub} by ${leaveParam.notification_from_name} from: ${fdate} to: ${tdate}`
        message.notification.body = bellNotificationData.notificationdesc
      } else if (req.body.action == "withdrawleave") {
        mailtype =
          result[0] && result[0][0] && result[0][0].state == 1
            ? "withdrawleave"
            : "withdrawapproval";
        subjecttype =
          req.body.appliedby + " has withdrawn " + req.body.leavetypename;
        headingtype = req.body.leavetypename + " Withdrawn";

        bellNotificationData.notificationdesc = mailtype == 'withdrawleave' ? `${leaveParam.notification_from_name} has withdrawn ${req.body.leavetypename} from: ${fdate} to: ${tdate}` :
          `Leave Withdrawal request raised by ${leaveParam.notification_from_name} for Apprval. from: ${fdate} to: ${tdate}`
        message.notification.body = bellNotificationData.notificationdesc

      }
      sendBellIconNotification(bellNotificationData);
      notificationCtrl.saveBellNotification(bellNotificationData)
      notificationCtrl.sendNotificationToMobileDevices(bellNotificationData.assignedtouserid, message)
      var mailOptions = {
        email: result[0] && result[0][0] && result[0][0].sendmailto,
        moduleid: "Leave",
        userid: result && result[0] && result[0][0] && result[0][0].userid,
        mailType: mailtype,
        subjectVariables: { subject: subjecttype },
        headingVariables: { heading: headingtype },
        bodyVariables: {
          trxempname: req.body.appliedby,
          trxleavetype: req.body.leavetypename,
          trxleavefromdt: result[0][0].trxfromdate
            ? moment(result[0][0].trxfromdate, "YYYY-MM-DD").format(
              "DD MMMM YYYY"
            )
            : moment(req.body.fromdate, "DD-MM-YYYY").format("DD MMMM YYYY"),
          trxleavetodt: result[0][0].trxtodate
            ? moment(result[0][0].trxtodate, "YYYY-MM-DD").format(
              "DD MMMM YYYY"
            )
            : moment(req.body.todate, "DD-MM-YYYY").format("DD MMMM YYYY"),
          trxleavetaken: req.body.leavetaken,
          trxleavereason: req.body.reason || "",
          trxleavefromsess: req.body.fromsession,
          trxleavetosess: req.body.tosession,
          //linkUrl:webUrllink,
          trxleaveaction: leavestatus,
          trxempsupervisor:
            result &&
            result[0] &&
            result[0][0] &&
            result[0][0].trxempsupervisor,
          trxempdob:
            result && result[0] && result[0][0] && result[0][0].trxempdob,
          trxempjoining:
            result && result[0] && result[0][0] && result[0][0].trxempjoining,
          trxtotal_approved:
            result &&
            result[0] &&
            result[0][0] &&
            result[0][0].trxtotal_approved,
          trxtotal_applied:
            result &&
            result[0] &&
            result[0][0] &&
            result[0][0].trxtotal_applied,
        },

      };

      mailservice.mail(mailOptions, function (err, response) {
        if (err) {
          console.log('1')
        } else {
          console.log('leave mail err', err);
        }
      });
    })
    .catch((err) => {
      res.json({ message: err, data: err, state: -1 });
    });
}

function leaveAllotOnConfirm(action) {
  let obj = {
    action: action || "leaveonconfirm",
  };
  commonModel
    .mysqlPromiseModelService("call usp_leave_update(?)", [JSON.stringify(obj)])
    .then((result) => {
      //console.log(
      //    "success " +
      //     `${result[0] && result[0][0] && result[0][0].confirmcount} 
      //      No.of Users has been alloted leaves as per config`
      //s    );
    })
    .catch((err) => {
      //console.log("ERROR on confirm", err);
    });
}

function viewleavereport(req, res) {
  if (!req.body || !req.body.createdby || !req.body.action) {
    return res.json({
      message: "Required parameters are missing.",
      state: -1,
      data: null,
    });
  }
  req.body.mod = "LeaveUserRoles";
  var obj = JSON.stringify(req.body);

  commonModel
    .mysqlPromiseModelService("call usp_allreports_operations(?)", [obj])
    .then((result) => {
      return res.json({ message: "success", data: result[0], state: 1 });
    })
    .catch((err) => {
      res.json({ message: err, data: err, state: -1 });
    });
}

function changeLeaveTypeStatus(req, res) {
  if (!req.body.id || !req.body.action || req.body.status == null) {
    return res.json({
      message: "Required parameters are missing.",
      state: -1,
      data: null,
    });
  }
  req.body.configcode = "leavetype";
  let obj = JSON.stringify(req.body);

  commonModel
    .mysqlPromiseModelService("call usp_mstportalconfig_hr_operation(?)", [obj])
    .then((result) => {
      return res.json({ message: "success", data: result[0], state: 1 });
    })
    .catch((err) => {
      res.json({ message: err, data: err, state: -1 });
    });
}

function changeLeaveConfigStatus(req, res) {
  if (!req.body.id || !req.body.action) {
    return res.json({
      message: "Required parameters are missing.",
      state: -1,
      data: null,
    });
  }
  let obj = JSON.stringify(req.body);

  commonModel
    .mysqlPromiseModelService(proc.leaveOperations, [obj])
    .then((result) => {
      return res.json({ message: "success", data: result[0], state: 1 });
    })
    .catch((err) => {
      res.json({ message: err, data: err, state: -1 });
    });
}
function leaveConfigOperations(req, res) {
  let obj = req.body;
  let obj2 = req.body && req.body.data;
  req.body = _.mapObject(req.body, function (val, key) {
    if (val && val.constructor === Array) {
      val = val.toString();
    }
    return val;
  });
  if (!obj.action) {
    return res.json({ state: -1, message: "Required Parameters are missing" });
  }
  ////console.log('obj11111111111',obj)
  ////console.log('obj22222222222',obj2)
  if (obj.effectivestartdate)
    obj.effectivestartdate = moment(req.body.effectivestartdate).format(
      "YYYY-MM-DD HH:mm"
    );
  obj = JSON.stringify(obj);
  obj2 = JSON.stringify(obj2);
  commonModel
    .mysqlPromiseModelService("call usp_leaveconfig_operations(?,?)", [
      obj,
      obj2,
    ])
    .then((result) => {
      //console.log("res in leave", result);
      return res.json({ message: "success", data: result[0], state: 1 });
    })
    .catch((err) => {
      //console.log("err in leave", err);
      res.json({ message: err, data: err, state: -1 });
    });
}
function viewLeaveConfig(req, res) {
  if (!req.body.mapid || !req.body.leavetype) {
    return res.json({ state: -1, message: "Required Parameters are Missing" });
  }
  let obj = req.body;
  obj.action = "viewconfig";
  // //console.log('obj',obj)
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService(proc.leaveOperations, [obj])
    .then((result) => {
      if (result[0] && result[0].length) {
        //console.log("inside1111111111");
        let maparr = [];
        // newresult = JSON.parse(JSON.stringify(result[0]));
        //console.log("reee", result[0]);
        lodash.each(result[0], function (item) {
          maparr.push({
            departmentid: item.department,
            departmentname: item.departmentname,
            mapid: item.mapid,
            designationid: item.designation,
            designationname: item.designationname,
          });
        });
        ////console.log('maparr',maparr)
        result[0][0].data = maparr;
        delete result[0][0].mapid;
        delete result[0][0].department;
        delete result[0][0].designation;
        delete result[0][0].departmentname;
        delete result[0][0].designationname;
        ////console.log('arrrrrrrrr',result[0])
        return res.json({ state: 1, message: "Success", data: result[0][0] });
      } else {
        return res.json({ state: 1, message: "Success", data: result[0] });
      }
    })
    .catch((err) => {
      res.json({ message: err, data: err, state: -1 });
    });
}

function leaveAppliedDetail(req, res) {
  if (!req.body.userid) {
    return res.json({ state: -1, message: "Required Paramteres are missing" });
  } else {
    req.body.action = "leavetypedetail";
    let obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.leaveOperations, [obj])
      .then((results) => {
        return res.json({
          state: 1,
          message: "Success",
          data: results[0],
        });
      })
      .catch((err) => {
        res.json({ message: err, data: err, state: -1 });
      });
  }
}
function leaveReports(req, res) {
  req.body = _.mapObject(req.body, function (val, key) {
    if (val && val.constructor === Array) {
      val = val.toString();
    }
    return val;
  });
  let obj = req.body;
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService(proc.leaveOperations, [obj])
    .then((result) => {
      return res.json({ message: "success", data: result, state: 1 });
    })
    .catch((err) => {
      res.json({ message: err, data: err, state: -1 });
    });
}
function saveAdditionalLeave(req, res) {
  if (!req.body.userid || !req.body.leavetype || !req.body.leavecount) {
    return res.json({ state: -1, message: "Required Parameters are missing" });
  }
  let obj = req.body;
  obj.action = "i_add";
  query(proc.leaveOperations, [JSON.stringify(obj)])
    .then((result) => {
      res.json({ state: 1, message: "Success" });
      let moduleid = req.body.moduleid ? req.body.moduleid : "Leave";
      let trxgrantbyuser =
        req.body.tokenFetchedData.firstname +
        " " +
        req.body.tokenFetchedData.lastname;
      var mailOptions = {
        email: req.body.useremail,
        moduleid: moduleid,
        userid: result && result[0] && result[0][0] && result[0][0].userid,
        // email:'shubham.sachdeva@polestarllp.com',
        mailType: "leaveadditional",
        subjectVariables: {
          trxleavegrantbyuser: trxgrantbyuser,
          trxleavetype: req.body.leavetypename || "",
          subject: "trxleavegrantbyuser has granted additional leave(s)",
        },
        headingVariables: {
          trxleavetype: req.body.leavetypename || "",
          trxempname: req.body.fullname,
          heading: "trxleavetype has been granted to trxempname",
        },
        bodyVariables: {
          trxempname: req.body.fullname,
          trxleavetype: req.body.leavetypename,
          trxleavereason: req.body.remark || "",
          trxleavecountgranted: req.body.leavecount,
          trxempsupervisor:
            result &&
            result[0] &&
            result[0][0] &&
            result[0][0].trxempsupervisor,
          trxempdob:
            result && result[0] && result[0][0] && result[0][0].trxempdob,
          trxempjoining:
            result && result[0] && result[0][0] && result[0][0].trxempjoining,
          trxtotal_approved:
            result &&
            result[0] &&
            result[0][0] &&
            result[0][0].trxtotal_approved,
          trxtotal_applied:
            result &&
            result[0] &&
            result[0][0] &&
            result[0][0].trxtotal_applied,
          //linkUrl:webUrllink
        },
      };

      mailservice.mail(mailOptions, function (err, response) {
        if (err) {
          //console.log(" { state:-1,message: 'Mail not sent.', error: err }");
        } else {
          //console.log("return { state:1,message: 'Mail sent' }");
        }
      });
    })
    .catch((err) =>
      res.json({ state: -1, message: err || "Something went wrong" })
    );
}
function viewAdditionalLeave(req, res) {
  let obj = req.body;
  obj.action = "v_add";
  query(proc.leaveOperations, [JSON.stringify(obj)])
    .then((result) =>
      res.json({ state: 1, message: "Success", data: result[0] })
    )
    .catch((err) =>
      res.json({ state: -1, message: err || "Something went wrong" })
    );
}
function requestCompoff(req, res) {
  if (!req.body.todate) {
    req.body.todate = req.body.fromdate;
  }
  if (!req.body.fromdate || !req.body.todate || !req.body.leavetaken) {
    return res.json({ state: -1, message: "Required parameters are missing" });
  } else {
    var obj = req.body;
    obj.userid = req.body.createdby;
    obj.fromdate = moment(req.body.fromdate).format("YYYY-MM-DD HH:mm");
    obj.todate = moment(req.body.todate).format("YYYY-MM-DD HH:mm");
    obj.ccemails = req.body.ccemails && req.body.ccemails.toString();
    obj.action = "req_compoff";
    let message = {
      notification: {
        title: "Leave",
        body: "",
      },
      data: {
        route: "/leaves",
        type: "leave",
      },
    };
    let countfiles = req.body.attachCount || 0;
    countfiles = parseInt(countfiles);
    var timestamp = Date.now();
    //if (countfiles && countfiles != 0) {

    let createdby = req.body.createdby.toString();
    let uploadPath = makeDirectories(path.join("uploads", "leave", createdby));
    var filename = [];
    var filepath = [];
    async.times(
      countfiles,
      function (n, next) {
        var sampleFile = {};
        sampleFile = req.files["file[" + n + "]"];
        if (sampleFile) {
          let filepath1 = path.join(uploadPath, sampleFile.name);
          sampleFile.mv(filepath1, (err) => {
            if (!err) {
              filename.push(timestamp + sampleFile.name);
              let uploadfilename = path.join(
                "leave",
                createdby,
                sampleFile.name
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
        obj = JSON.stringify(obj);

        commonModel
          .mysqlPromiseModelService(proc.leaveOperations, [obj])
          .then((result) => {
            //console.log("rrrrr", result);
            res.json({
              message: "Compensatory-Off Grant Requested",
              data: null,
              state: 1,
            });
            var fdate = req.body.fromdate.split(" ")[0];
            var tdate = req.body.todate.split(" ")[0];
            var tokemail = req.body.tokenFetchedData.email.toString();
            let moduleid = req.body.moduleid ? req.body.moduleid : "Leave";
            req.body.leavetypename = "Compensatory Off";

            var mailOptions = {
              email:
                result[0] && result[0][0] && result[0][0].trxappliedtoemail,
              cc: (req.body.ccemails && req.body.ccemails.toString()) || "",
              moduleid: moduleid,
              userid: req.body.tokenFetchedData && req.body.tokenFetchedData.id,
              // email:'shubham.sachdeva@polestarllp.com',
              mailType: "grantcompoffrequest",
              banner: "",
              subjectVariables: {
                leaveType: req.body.leavetypename,
                trxempname:
                  req.body.tokenFetchedData.firstname +
                  " " +
                  req.body.tokenFetchedData.lastname,
                subject: "Request for grant of Compensatory Off by trxempname",
              },
              headingVariables: { heading: "Compensatory Off grant request" },
              bodyVariables: {
                trxempname:
                  req.body.tokenFetchedData.firstname +
                  " " +
                  req.body.tokenFetchedData.lastname, //+ ' <font color="black" size=""20px>( '+ req.body.tokenFetchedData.email +' )</font>',
                trxleavetype: req.body.leavetypename,
                trxempemail: tokemail, //format('ddd Do MMMM, YYYY')
                trxleavefromdt: moment(fdate, "YYYY-MM-DD").format(
                  "DD MMMM YYYY"
                ), //moment(req.body.fromdate).format('DD-MM-YYYY'),
                trxleavetodt: moment(tdate, "YYYY-MM-DD").format(
                  "DD MMMM YYYY"
                ), //moment(req.body.todate).format('DD-MM-YYYY'),
                trxleavetaken: req.body.leavetaken,
                trxleavereason: req.body.reason || "",
                trxleavefromsess: req.body.fromsession,
                trxleavetosess: req.body.tosession,
                trxempsupervisor:
                  result &&
                  result[0] &&
                  result[0][0] &&
                  result[0][0].trxempsupervisor,
                trxempdob:
                  result && result[0] && result[0][0] && result[0][0].trxempdob,
                trxempjoining:
                  result &&
                  result[0] &&
                  result[0][0] &&
                  result[0][0].trxempjoining,
                trxtotal_approved:
                  result &&
                  result[0] &&
                  result[0][0] &&
                  result[0][0].trxtotal_approved,
                trxtotal_applied:
                  result &&
                  result[0] &&
                  result[0][0] &&
                  result[0][0].trxtotal_applied,
                //linkUrl: webUrllink
              },
            };
            message.notification.body = `Request for grant of Compensatory Off by ${req.body.tokenFetchedData.firstname +
              " " +
              req.body.tokenFetchedData.lastname
              }.`;
            notificationCtrl.sendNotificationToMobileDevices(
              result &&
              result[0] &&
              result[0][0] &&
              result[0][0].trxempsupervisorid,
              message
            );

            mailservice.mail(mailOptions, function (err, response) {
              if (err) {
                //console.log(
                //       " { state:-1,message: 'Mail not sent.', error: err }"
                //       );
              } else {
                //console.log("return { state:1,message: 'Mail sent' }");
              }
            });
          })
          .catch((err) => {
            res.json({
              message: err || "Something went wrong",
              data: err,
              state: -1,
            });
          });
      }
    );
  }
}
function approveCompoff(req, res) {
  if (!req.body.id || (!req.body.isapproved && req.body.isapproved != 0)) {
    return res.json({ state: -1, message: "Required parameters are missing" });
  } else {
    let obj = req.body;
    obj.action = "approve_compoff";
    obj = JSON.stringify(obj);
    commonModel
      .mysqlPromiseModelService(proc.leaveOperations, [obj])
      .then((result) => {
        res.json({
          message: result[0] && result[0][0] && result[0][0].message,
          data: result[0],
          state: 1,
        });
        let mailtype = "approvecompoff";
        let leavestatus =
          req.body.isapproved == 1 ? "is Approved" : "is Rejected";

        var mailOptions = {
          email: result[0] && result[0][0] && result[0][0].sendmailto,
          moduleid: "Leave",
          userid: result && result[0] && result[0][0] && result[0][0].userid,
          // email:'shubham.sachdeva@polestarllp.com',
          mailType: mailtype,
          subjectVariables: { trxleavestatus: leavestatus },
          headingVariables: { trxleavestatus: leavestatus },
          bodyVariables: {
            trxempname: req.body.name,
            //trxleavetype: req.body.leavetypename,
            trxleavefromdt: moment(req.body.fromdate, "DD-MM-YYYY").format(
              "DD MMMM YYYY"
            ),
            trxleavetodt: moment(req.body.todate, "DD-MM-YYYY").format(
              "DD MMMM YYYY"
            ),
            trxcompofftakendays: req.body.leavecount,
            trxleavereason: req.body.reason || "",
            trxleavefromsess: req.body.fromsession,
            trxleavetosess: req.body.tosession,
            //linkUrl:webUrllink,
            trxleaveaction: leavestatus,
            trxempsupervisor:
              result &&
              result[0] &&
              result[0][0] &&
              result[0][0].trxempsupervisor,
            trxempdob:
              result && result[0] && result[0][0] && result[0][0].trxempdob,
            trxempjoining:
              result && result[0] && result[0][0] && result[0][0].trxempjoining,
            trxtotal_approved:
              result &&
              result[0] &&
              result[0][0] &&
              result[0][0].trxtotal_approved,
            trxtotal_applied:
              result &&
              result[0] &&
              result[0][0] &&
              result[0][0].trxtotal_applied,
          },
        };
        let message = {
          notification: {
            title: "Leave",
            body: "",
          },
          data: {
            route: "/leaves",
            type: "leave",
          },
        };
        message.notification.body = `Your Compensatory Off ${leavestatus} by ${req.body.tokenFetchedData.firstname +
          " " +
          req.body.tokenFetchedData.lastname
          }.`;
        notificationCtrl.sendNotificationToMobileDevices(
          result && result[0] && result[0][0] && result[0][0].userid,
          message
        );

        mailservice.mail(mailOptions, function (err, response) {
          if (err) {
            //console.log(
            //   " { state:-1,message: 'Mail not sent.', error: err }",
            //      err
            //    );
          } else {
            //console.log("return { state:1,message: 'Mail sent' }");
          }
        });
      })
      .catch((err) => {
        res.json({ message: err, data: err, state: -1 });
      });
  }
}
function viewCompoff(req, res) {
  let obj = req.body;
  obj.action = "v_compoff";
  query(proc.leaveOperations, [JSON.stringify(obj)])
    .then((result) =>
      res.json({ state: 1, message: "Success", data: result[0] })
    )
    .catch((err) =>
      res.json({ state: -1, message: err || "Something went wrong" })
    );
}

function uploadleavebalance(req, res) {
  if (!req.files || !req.files.file) {
    return res.json({ state: -1, message: "File Template is missing" });
  } else if (!req.body.leavetypeid) {
    return res.json({ state: -1, message: "Required Parameters are missing" });
  } else {
    if (!fs.existsSync(path.join(appRoot.path, "uploads"))) {
      fs.mkdirSync(path.join(appRoot.path, "uploads"));
    }
    if (!fs.existsSync(path.join(appRoot.path, "uploads/leave"))) {
      fs.mkdirSync(path.join(appRoot.path, "uploads/leave"));
    }
    if (
      !fs.existsSync(path.join(appRoot.path, "uploads/leave/openingbalance"))
    ) {
      fs.mkdirSync(path.join(appRoot.path, "uploads/leave/openingbalance"));
    }
    let fp = "uploads/leave/openingbalance/";
    if (
      req.files &&
      req.files["file"] &&
      req.files["file"].name &&
      (path.extname(req.files["file"].name.toLowerCase()) == ".xlsx" ||
        path.extname(req.files["file"].name.toLowerCase()) == ".xls")
    ) {
      uploadService
        .uploadmultipledoc(req, fp)
        .then(async (data) => {
          var result = excelToJson({
            sourceFile: path.join(data[0].filepath),
            header: {
              rows: 1,
            },
            columnToKey: {
              "*": "{{columnHeader}}",
            },
          });
          if (result) {
            result.data = result[Object.keys(result)[0]];
            let headerkeys = Object.keys(result.data[0]);
            headerkeys = headerkeys && headerkeys.toString();

            if (headerkeys == "empcode,balance") {
              if (
                result.data.length ===
                lodash.uniqBy(result.data, "empcode").length
              ) {
                let obj = {
                  action: "add_opening_bal",
                  createdby: req.body.createdby,
                  leavetypeid: req.body.leavetypeid,
                };
                return query("call usp_leave_balance_upload(?,?)", [
                  JSON.stringify(obj),
                  JSON.stringify(result.data),
                ]).then((results) => {
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
                        results &&
                        results[1] &&
                        results[1][0] &&
                        results[1][0].message,
                      data: results[0],
                    });
                  } else if (
                    results &&
                    results[1] &&
                    results[1][0] &&
                    results[1][0].state &&
                    results[1][0].state == -1
                  ) {
                    return res.json({
                      state: results[1][0].state,
                      message:
                        results &&
                        results[1] &&
                        results[1][0] &&
                        results[1][0].message,
                      data: results[0],
                    });
                  } else {
                    return res.json({
                      state: -1,
                      message: "Something Went Wrong",
                      data: null,
                    });
                  }
                });
              } else {
                return res.json({
                  state: -1,
                  message:
                    "Found Multiple Entries of Same Employee Code,Please Correct the Data and Upload it again.",
                });
              }
            }
          } else {
            return res.json({ state: -1, message: "Invalid Template File." });
          }
        })
        .catch((err) => {
          //console.log("error", err);
          return res.json({ state: -1, message: "Something went wrong" });
        });
    } else {
      return res.json({ state: -1, message: "Unsupported File Format" });
    }
  }
}
function leavetakenReport(req, res) {
  try {
    if (!req.body.fy) {
      return res.json({
        state: -1,
        message: "Required Parameters are missing",
      });
    } else {
      let obj = req.body;
      obj.action = "leavetaken_r";
      query(proc.leaveOperations, [JSON.stringify(obj)])
        .then((result) => {
          //let leaveapplied = lodash.groupBy(result[1],'username');
          //let leavebalance = lodash.groupBy(result[2],'username');
          return res.json({
            state: 1,
            message: "Success",
            data: result[0],
            leaveapplied: result[1],
            leavebalance: result[2],
          });
        })
        .catch((err) => {
          //console.log("errr", err);
          return res.json({
            state: -1,
            message: err || "Something went wrong",
          });
        });
    }
  } catch (err) {
    return res.json({ state: -1, message: "Something went wrong" });
  }
}
async function leaveDashboard(req, res) {
  try {
    if (!req.body.action || !req.body.financialyear) {
      return res.json({
        state: -1,
        message: "Required Parameters are missing",
      });
    }
    let rq = {
      action: req.body.action,
      financialyear: req.body.financialyear,
      createdby: req.body.createdby,
      viewas: req.body.viewas,
      isAnalyticsModule: req.body.isAnalyticsModule
    };
    let results = await query("call usp_leave_reports(?)", [
      JSON.stringify(rq),
    ]);
    if (rq.action == "availed_r")
      return res.json({ state: 1, message: "Success", data: results[0] });
    else if (rq.action == "balance_r") {
      if (results[1] && results[1].length) {
        _.each(results[1], (item) => {
          let index = lodash.findIndex(results[0], {
            leavetype: item.leavetype,
            userid: item.userid,
          });
          if (index > -1) {
            results[0][index].leavebalance += item.leavecount;
          }
        });
      }
      if (results[2] && results[2].length) {
        _.each(results[2], (item) => {
          let index = lodash.findIndex(results[0], {
            leavetype: item.leavetype,
            userid: item.userid,
          });
          if (index > -1) {
            results[0][index].leavebalance += item.leavecount;
          }
        });
      }
      return res.json({ state: 1, message: "Success", data: results[0] });
    } else if (rq.action == "absenteerate") {
      _.map(results[0], (item) => {
        let index = lodash.findIndex(results[1], { userid: item.userid });
        if (index > -1) {
          item.rate = (results[1][index].leavedays / item.workingdays) * 100;
        } else {
          item.rate = 0;
        }
      });
      return res.json({ state: 1, message: "Success", data: results[0] });
    }
  } catch (err) {
    return res.json({ state: -1, message: "Something went wrong" });
  }
}
function clearCompoffBalance() {
  let rq = {
    action: "clearcompoffbalance",
  };
  commonModel.mysqlModelService(
    "call usp_leave_update(?)",
    [JSON.stringify(rq)],
    function (err, results) {
      if (err) {
        //console.log("ERR IN CLEAR COMP OFF BALANCE");
      } else {
        //console.log("Success");
      }
    }
  );
}
async function upcomingLeaves(req, res) {
  try {
    let allreportees = await feedbackController.userhierarcy(req, res);
    let rq = { allreportees, ...req.body };
    let results = await query("call usp_leave_reports(?)", [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "success", data: results });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
}
async function getMonthlyLeave(req, res) {
  try {
    let key = req.query.k;
    if (!key) return res.json({ state: -1, message: "Invalid Key" });
    let obj = {
      action: "leave_monthly_api",
      s_key: key,
      ...req.body,
    };
    let [results] = await query("call usp_leave_reports(?)", [
      JSON.stringify(obj),
    ]);
    return res.json({ state: 1, message: "success", data: results });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
}

async function leaveReconcileReport(req, res) {
  try {
    if (!req.body.month || !req.body.financialyear)
      return res.json({
        state: -1,
        message: "Required Parameters are missing",
      });
    let rq = { action: "timesheet_leave_comparison", ...req.body };
    let [timesheetData, leaveData] = await query("call usp_leave_reports(?)", [
      JSON.stringify(rq),
    ]);
    let leaveDefaulter = timesheetData
      .filter((e) => {
        return !leaveData.some(
          (item) =>
            item.ecode === e.ecode &&
            item.leavedate == e.billeddate &&
            item.leavetaken == e.billedhours
        );
      })
      .map((ldefaulter) => {
        ldefaulter.leavedate = ldefaulter.billeddate;
        ldefaulter.defaultertype = "Leave";
        return ldefaulter;
      });

    let timeDefaulter = leaveData
      .filter((e) => {
        return !timesheetData.some(
          (item) =>
            item.ecode === e.ecode &&
            item.billeddate == e.leavedate &&
            item.billedhours == e.leavetaken
        );
      })
      .map((tdefaulter) => {
        //tdefaulter.leavedate = tdefaulter.billeddate
        tdefaulter.defaultertype = "Timesheet";
        return tdefaulter;
      });

    let reconciledData = [...leaveDefaulter, ...timeDefaulter];

    return res.json({ state: 1, message: "Success", data: reconciledData });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
}
async function leaveHomeCounts(req, res) {
  try {
    let rq = { ...req.body, action: "home_counts" };
    let [results] = await query("call usp_leave_reports(?)", [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "success", data: results });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
}
async function leaveDashboardCard(req, res) {
  try {
    let rq = { ...req.body, action: "dashboard_card" };
    let results = await query("call usp_leave_reports(?)", [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "success", data: results });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
}
async function leaveTransactionReport(req, res) {
  try {
    if (!req.body.month || !req.body.financialyear)
      return res.json({
        state: -1,
        message: "Required Parameters are missing",
      });
    let rq = { ...req.body, action: "transaction_report" };
    let [results] = await query("call usp_leave_reports(?)", [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "success", data: results });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
}
