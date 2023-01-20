"use strict";
const commonModel = require("../../common/Model");
const proc = require("../../common/procedureConfig");
var _ = require("underscore");
const commonCtrl = require("../../common/Controller");
const mailservice = require("../../../services/mailerService");
const notificationCtrl = require("../../notification/Controller");
const uploadService = require("../../../services/uploadService");
const moment = require("moment");
const { sendBellIconNotification } = require('../../notification/socket.io')


module.exports = {
  raiseExpense: raiseExpense,
  getRaiseExpense: getRaiseExpense,
  getTripAsMaster: getTripAsMaster,
  approveExpense: approveExpense,
  getLimitsExp: getLimitsExp,
  getHQMVRData,
  getExpenseDetail,
  editAndResubmitExpense,
  markExpensePaid
};

async function raiseExpense(req, res) {
  try {
    let object = req.body;
    let obj2 = req.body.req ? req.body.req : {};
    if (req.files) {
      //console.log("Inside files");
      let fileUploaded = await uploadService.uploadMultiple(
        req,
        "expense",
        req.body.attachCount && parseInt(req.body.attachCount)
      );
      object.filename =
        fileUploaded.filename && fileUploaded.filename.toString();
      object.filepath =
        fileUploaded.filepath && fileUploaded.filepath.toString();
    }
    if (
      req.body.previousfilepath &&
      req.body.previousfilepath != "null" &&
      req.files
    ) {
      object.filepath = req.body.previousfilepath + "," + object.filepath;
      object.filename = req.body.previousfilename + "," + object.filename;
    } else if (
      req.body.previousfilepath &&
      req.body.previousfilepath != "null"
    ) {
      object.filepath = req.body.previousfilepath;
      object.filename = req.body.previousfilename;
    } else if (
      !req.files &&
      (!req.body.previousfilepath || req.body.previousfilepath == "null")
    ) {
      delete object.filepath;
      delete object.filename;
    }
    object = commonCtrl.verifyNull(object);
    obj2 = commonCtrl.verifyNull(obj2);
    commonModel
      .mysqlPromiseModelService(proc.raiseExpense, [
        JSON.stringify(object),
        JSON.stringify(obj2),
      ])
      .then((results) => {
        if (
          results &&
          results[1] &&
          results[1][0] &&
          results[1][0].state > 0 &&
          req.body.issubmitted === 1
        ) {
          let expenseParam = results[0][0]

          let bellNotificationData = {
            "assignedtouserid": expenseParam.notification_to,
            "assignedfromuserid": expenseParam.notification_from,
            "notificationdesc": expenseParam.notification_desc,
            "attribute1": "",
            "attribute2": "",
            "attribute3": expenseParam.statusid,
            "attribute4": "",
            "isvendor": "",
            "web_route": 'expense/approve-expense',
            "app_route": "app/route",
            "fortnight_date": "",
            "module_name": "Expense",
            "createddate": moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            "datevalue": new Date().valueOf()
          }

          let message = {
            notification: {
              title: 'Expense',
              body: expenseParam.notification_desc
            },
            data: {
              route: '/my-expense',
              tab: '1',
              type: 'expense'
            }
          };

          notificationCtrl.sendNotificationToMobileDevices(expenseParam.notification_to, message);

          if (bellNotificationData.assignedtouserid) {
            if (global.io) {
              sendBellIconNotification(bellNotificationData)
            }
            notificationCtrl.saveBellNotification(bellNotificationData)
          }

          if (results[0] && results[0][0] && results[0][0].useremail) {
            var emailObj = {
              email: results[0] && results[0][0].useremail,
              mailType: "expenseRaised",
              moduleid: req.body.moduleid ? req.body.moduleid : "Expense",
              userid: req.body.createdby,
              bodyVariables: {
                expenseusername:
                  req.body.tokenFetchedData.firstname +
                  " " +
                  req.body.tokenFetchedData.lastname,
              },
              subjectVariables: {
                subject: "New Expense Raised",
              },
              headingVariables: {
                heading: "New Expense Raised",
              },
            };
            mailservice.mail(emailObj, function (err, response) {
              return sendMailMsg(res, err, results, response);
            });
          } else {
            res.json({
              message: "success",
              data: [],
              state: 1,
            });
          }
        } else if (
          results &&
          results[0] &&
          results[0][0] &&
          results[0][0].state > 0 &&
          req.body.issubmitted == 0
        ) {
          res.json({
            message: results[0].message,
            data: results,
            state: 1,
          });
        } else {
          //console.log(results);
          res.json({
            message: "Failed",
            data: results,
            state: -1,
          });
        }
      })
      .catch((err) => {
        res.json({
          message: err,
          data: null,
          state: -1,
        });
      });
    //      });
  } catch (err) {
    //console.log("err", err);
    return res.json({ state: -1, message: "Something went wrong!" });
  }
}

function getRaiseExpense(req, res) {
  if (req && req.body) {
    var object = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.viewExpense, [object])
      .then(async (results) => {
        if (req.body.type === "submitCheck") {
          res.json({
            message: results[0].message,
            data: await results,
            state: results[0] && results[0][0] && results[0][0].state,
          });
        } else if (
          req.body.type === "Single" ||
          req.body.type === "SingleApprove"
        ) {
          res.json({
            message: "success",
            data: await results,
            state: 1,
          });
        } else {
          var lazydata = commonCtrl.lazyLoading(
            results && results[0],
            req.body
          );
          if (lazydata && "data" in lazydata && "count" in lazydata) {
            results[0] = lazydata.data;
            res.json({
              message: "success",
              data: results && results[0],
              totalcount: lazydata.count,
              state: 1,
            });
          } else {
            res.json({
              message: "No Lazy Data",
              data: null,
              state: -1,
            });
          }
        }
      })
      .catch((err) => {
        return res.json({
          state: -1,
          message: err,
          data: null,
        });
      });
  }
}

function getTripAsMaster(req, res) {
  if (req && req.body) {
    commonModel
      .mysqlPromiseModelService(proc.expenseProc, [JSON.stringify(req.body)])
      .then((results) => {
        if (results && results[0]) {
          res.json({
            message: "Success",
            data: results[0],
            state: 1,
          });
        } else {
          res.json({
            message: "Something went wrong during fetching Master/Trip data",
            data: null,
            state: -1,
          });
        }
      })
      .catch((err) => {
        res.json({
          message: err,
          data: null,
          state: -1,
        });
      });
  }
}

async function approveExpense(req, res) {
  try {
    if (req && req.body) {
      let object = JSON.stringify(req.body);
      let message;
      let emailObj = null;
      var subjecttype = null;
      var headingtype = null;
      var usernme = null;
      if (req.body.isapproved == 1) {
        subjecttype = "New Expense Raised";
        headingtype = "New Expense Raised";
      } else {
        usernme = req.body.isapproved
          ? req.body.employeename
          : req.body.tokenFetchedData.firstname +
          " " +
          req.body.tokenFetchedData.lastname;
        subjecttype = "trxexpenseactionby Has Rejected Your Expense";
        headingtype = "Expense Rejected";
      }
      let results = await commonModel.mysqlPromiseModelService(
        proc.approveExpense,
        [object]
      );
      //console.log(results, "rrrrrrrrrrrrrrrrrrr");

      if (results && results[0] && results[0].length) {
        let expenseParam = results[0][0];
        let bellNotificationData = {
          "assignedtouserid": "",
          "assignedfromuserid": expenseParam.notification_from,
          "notificationdesc": "",
          "attribute1": "",
          "attribute2": "",
          "attribute3": expenseParam.statusid,
          "attribute4": "",
          "isvendor": "",
          "web_route": 'expense/my-expense',
          "app_route": "app/route",
          "fortnight_date": "",
          "module_name": "Expense",
          "createddate": moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
          "datevalue": new Date().valueOf()
        }
        let bellNotificationData2 = {
          ...bellNotificationData,
          "datevalue": new Date().valueOf()
        }

        let message = {
          notification: {
            title: 'Expense',
            body: ""
          },
          data: {
            route: '/my-expense',
            tab: '1',
            type: 'expense'
          }
        };

        let message2 = {
          notification: {
            title: 'Expense',
            body: ""
          },
          data: {
            route: '/my-expense',
            tab: '0',
            type: 'expense'
          }
        };

        if (results && results[1] && results[1][0] && results[1][0].state > 0) {

          /**
           * Expense is either in rejected state or has further approvals */
          emailObj = {
            email: results[0][0] && results[0][0].useremail,
            mailType:
              req.body.isapproved == 1 ? "expenseRaised" : "expenseRejected",
            moduleid: req.body.moduleid ? req.body.moduleid : "Expense",
            userid: req.body.userid ? req.body.userid : req.body.createdby,
            bodyVariables: {
              trxexpenseactionby:
                req.body.tokenFetchedData.firstname +
                " " +
                req.body.tokenFetchedData.lastname,
              expenseusername: req.body.isapproved
                ? req.body.employeename
                : req.body.tokenFetchedData.firstname +
                " " +
                req.body.tokenFetchedData.lastname,
            },
            subjectVariables: {
              subject: subjecttype,
            },
            headingVariables: {
              heading: headingtype,
            },
          };

          if (req.body.isapproved == 1) {
            message = {
              notification: {
                title: "Expense",
                body: `Your expense is approved by ${req.body.tokenFetchedData.firstname} ${req.body.tokenFetchedData.lastname}.`,
              },
              data: {
                route: "/my-expense",
                type: "expense",
              },
            };
            /**
             * Sending Notification to Expense Raised user if expense is approved but have further approvals
             */

            bellNotificationData2.notificationdesc = `Your expense has been approved by ${expenseParam.notification_from_name} and is pending for further approval(s)`
            bellNotificationData2.assignedtouserid = expenseParam.notification_for
            bellNotificationData2.attribute3 = expenseParam.expense_id
            message2.notification.body = bellNotificationData2.notificationdesc

            notificationCtrl.sendNotificationToMobileDevices(bellNotificationData2.assignedtouserid, message2)
            sendBellIconNotification(bellNotificationData2)
            notificationCtrl.saveBellNotification(bellNotificationData2)
          }
          /**
           * Sending Notification to further approval level or to the expense raised user if it is rejected
           */

          bellNotificationData.assignedtouserid = req.body.isapproved == 1 ? expenseParam.notification_to : expenseParam.notification_for
          bellNotificationData.notificationdesc = req.body.isapproved == 1 ? `An Expense has been raised by ${expenseParam.notification_for_name} and is pending for your approval.`
            : `Your Expense has been rejected by ${expenseParam.notification_from_name}`
          bellNotificationData.web_route = req.body.isapproved == 1 ? 'expense/approve-expense' : 'expense/my-expense'
          bellNotificationData.attribute3 = req.body.isapproved == 1 ? expenseParam.statusid : expenseParam.expense_id

          message.notification.body = bellNotificationData.notificationdesc
          message.data.tab = req.body.isapproved == 1 ? '0' : '1'

          notificationCtrl.sendNotificationToMobileDevices(bellNotificationData.assignedtouserid, message)
          sendBellIconNotification(bellNotificationData)
          notificationCtrl.saveBellNotification(bellNotificationData)

        } else if (
          results &&
          results[1] &&
          results[1][0] &&
          results[1][0].state === 0
        ) {
          usernme =
            req.body.tokenFetchedData.firstname +
            " " +
            req.body.tokenFetchedData.lastname;
          emailObj = {
            email: results[0][0] && results[0][0].useremail,
            mailType: "expenseApproved",
            moduleid: req.body.moduleid ? req.body.moduleid : "Expense",
            userid: req.body.userid,
            bodyVariables: {
              trxexpenseactionby:
                req.body.tokenFetchedData.firstname +
                " " +
                req.body.tokenFetchedData.lastname || "",
              expenseusername:
                req.body.tokenFetchedData.firstname +
                " " +
                req.body.tokenFetchedData.lastname,
            },
            subjectVariables: {
              subject: "trxexpenseactionby Has Approved Your Expense!",
            },
            headingVariables: {
              heading: "Expense Approved",
            },
          };
          bellNotificationData.assignedtouserid = expenseParam.notification_for
          bellNotificationData.notificationdesc = `Your Expense has been approved by ${expenseParam.notification_from_name}`
          bellNotificationData.attribute3 = expenseParam.expense_id
          message.notification.body = bellNotificationData.notificationdesc

          notificationCtrl.sendNotificationToMobileDevices(bellNotificationData.assignedtouserid, message)
          sendBellIconNotification(bellNotificationData)
          notificationCtrl.saveBellNotification(bellNotificationData)
        }
        if (emailObj && emailObj.email) {
          mailservice.mail(emailObj, function (err, response) {
            return sendMailMsg(res, err, results, response);
          });
        } else {
          res.json({
            state: 1,
            message:
              "Expense approved successfully, But no further approvers are configured in the system for this user. Please contact Admin/Finance Manager for further approvals",
            data: results && results[0],
          });

          bellNotificationData.assignedtouserid = expenseParam.notification_for
          bellNotificationData.notificationdesc = `Your Expense has been approved by ${expenseParam.notification_from_name} and is pending for further approval(s). Please contact Admin/Finance Manager for further approval(s)`
          bellNotificationData.attribute3 = expenseParam.expense_id
          message.notification.body = bellNotificationData.notificationdesc
          message.data.tab = '0'

          notificationCtrl.sendNotificationToMobileDevices(bellNotificationData.assignedtouserid, message)
          sendBellIconNotification(bellNotificationData)
          notificationCtrl.saveBellNotification(bellNotificationData)

        }
      } else if (
        results &&
        results[1] &&
        results[1][0] &&
        results[1][0].state > 0
      ) {
        res.json({
          message: req.body.isapproved == 1 ? "Approved" : "Rejected",
          data: [],
          state: 1,
        });
      } else {
        res.json({
          message: "Failed",
          data: null,
          state: -1,
        });
      }
    }
  } catch (err) {
    res.json({
      message: err,
      data: null,
      state: -1,
    });
  }
}

/**
 *
 * @param {*} res -Enpress res
 * @param {*} err -Error
 * @param {*} results -Db Response
 * @param {*} mailresponse  -Mail Response
 * @returns Send Response to client
 */
function sendMailMsg(res, err, results, mailresponse) {
  if (err) {
    res.json({
      message: `Action Completed but Error occured during sending mail to ${results[0][0].useremail} `,
      data: results && results[0],
      err: err && err.msg,
      state: 1,
    });
  } else {
    res.json({
      message: "success",
      data: results && results[0],
      state: 1,
    });
  }
}

async function getLimitsExp(req, res) {
  try {
    const query = commonModel.mysqlPromiseModelService;
    req.body.reqtype = "getlimits";
    const [r1, r2, ...r3] = await query(proc.expenseProc, [
      JSON.stringify(req.body),
    ]);
    res.json({
      message: "Success",
      data: { r1, r2, r3 },
      state: 1,
    });
  } catch (err) {
    res.json({
      message: err && err.message,
      data: null,
      state: -1,
    });
  }
}
async function getHQMVRData(req, res) {
  try {
    const query = commonModel.mysqlPromiseModelService;
    req.body.action = req.body.action ? req.body.action : "hqmvr_data";
    const results = await query("call usp_expense(?)", [
      JSON.stringify(req.body),
    ]);
    return res.json({
      state: 1,
      message: "Success",
      data: results[0],
    });
  } catch (err) {
    return res.json({
      message: err && err.message,
      data: null,
      state: -1,
    });
  }
}
async function getExpenseDetail(req, res) {
  try {
    const query = commonModel.mysqlPromiseModelService;
    req.body.type = "expense_detail";
    const results = await query(proc.viewExpense, [JSON.stringify(req.body)]);
    return res.json({
      state: 1,
      message: "Success",
      data: results[0],
    });
  } catch (err) {
    //console.log('err', err)
    return res.json({
      message: err && err.message,
      data: null,
      state: -1,
    });
  }
}

async function editAndResubmitExpense(req, res) {
  if (!req.body.id) {
    return res.json({ state: -1, message: "Required parameters are missing" });
  } else {
    try {
      const query = commonModel.mysqlPromiseModelService;
      let reqData = req.body;
      let result = await query("call usp_trxexpense_resubmit(?)", [
        JSON.stringify(reqData),
      ]);
      return res.json({ state: 1, message: "Success", data: [result] });
    } catch (err) {
      return res.json({
        state: -1,
        message: err.message || err || "Something went wrong!",
      });
    }
  }
}

async function markExpensePaid(req, res) {
  if (!req.body.id) {
    return res.json({ state: -1, message: "Required parameter are missing" });
  }
  try {
    let reqData = req.body;
    const query = commonModel.mysqlPromiseModelService;
    let [results] = await query('call usp_expense(?)', [JSON.stringify(reqData)]);
    sendExpensePaidEmail(results);
    return res.json({ state: 1, message: 'Success!', data: results });

  } catch (err) {
    //console.log(err);
    return res.json({ state: -1, message: err.messaage || err || 'Something went wrong' })
  }
}
function sendExpensePaidEmail(results) {
  for (let i = 0; i < results.length; i++) {
    let expenseData = results[i];
    const mailOptions = {
      email: expenseData.email,
      userid: expenseData.userid,
      moduleid: "Expense",
      mailType: "expensepaid",
      subjectVariables: { subject: `Your Expense Claim has been reimbursed Successfully`, },
      headingVariables: { heading: "Expense Claim Reimbursement" },
      bodyVariables: {
        trxempname: expenseData.trxempname,
        trx_expense_claimnumber: expenseData.trx_expense_claimnumber || "",
        trx_expense_amount: expenseData.trx_expense_amount || 0,
        trx_expense_period: expenseData.trx_expense_period && moment(expenseData.trx_expense_period, "YYYY-MM-DD").format(
          "DD MMMM YYYY"
        ) || "",
        trx_expense_raiseddate: expenseData.trx_expense_raiseddate && moment(expenseData.trx_expense_raiseddate, "YYYY-MM-DD").format(
          "DD MMMM YYYY"
        ) || "",
        trx_expense_paiddate: moment(expenseData.trx_expense_paiddate, "YYYY-MM-DD").format(
          "DD MMMM YYYY"
        ) || "",
      }
    }
    setTimeout(() => {
      mailservice.mail(mailOptions, function (err, response) {
        if (err) {
          //console.log(
          // " { state:-1,message: 'Mail not sent.', error: err }",
          // err
          //);
        } else {
          //console.log("return { state:1,message: 'Mail sent' }");
        }

      })
    }, i * 3000);
  }
}