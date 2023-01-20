"use strict";
const https = require("https");
var CryptoJS = require("crypto-js");

const PaytmChecksum = require("./PaytmChecksum");
const proc = require("../common/procedureConfig");
const commonModel = require("../common/Model");
const config = require("../../config/config");
const commonCtrl = require("../common/Controller");
const mailservice = require("../../services/mailerService");

const query = require("../common/Model").mysqlPromiseModelService,
  makeDir = require("../common/utils").makeDirectories,
  xlsx = require("xlsx"),
  path = require("path"),
  _ = require("lodash");

const crypto = require("crypto");

var hostname;
if (config && config.env && config.env == "development") {
  hostname = "staging-dashboard.paytm.com"; /* for Staging */
} else {
  hostname = "dashboard.paytm.com"; /* for production */
}

const randomString = (n) => {
  return _.times(n, () => _.random(35).toString(36)).join("");
};

module.exports = {
  paytmmaster: paytmmaster,
  budgetmaster: budgetmaster,
  userbymapid: userbymapid,
  viewpaytmconfig: viewpaytmconfig,
  viewpaytmbalance: viewpaytmbalance,
  pastpayout: pastpayout,
  paytmkr: paytmkr,
  accountdetail: accountdetail,
  transactiontype: transactiontype,
  orderlist: orderlist,
  transactionall: transactionall,
  uploadpaytmbudget: uploadpaytmbudget,
  userbudgetvalidate: userbudgetvalidate,
  budgetdashboard: budgetdashboard,
  budgetoperation: budgetoperation,
  xyzdata: xyzdata,
  budgetvalidate,
};

async function paytmmaster(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstpaytm, [obj])
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

async function budgetmaster(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstbudget, [obj])
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

async function userbymapid(req, res) {
  if (!req.body || !req.body.createdby || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }

  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstbudget, [obj])
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

async function viewpaytmconfig(req, res) {
  if (!req.body || !req.body.createdby) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }

  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.paytm, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        redeemlimit:
          (results &&
            results[0] &&
            results[0][0] &&
            results[0][0].redeemlimit) ||
          null,
        totalamount:
          (results &&
            results[1] &&
            results[1][0] &&
            results[1][0].totalamount) ||
          null,
        totalpoint:
          (results &&
            results[1] &&
            results[1][0] &&
            results[1][0].totalpoint) ||
          null,
        totalfeedback:
          (results &&
            results[1] &&
            results[1][0] &&
            results[1][0].totalfeedback) ||
          null,
        contactnumber:
          (results &&
            results[2] &&
            results[2][0] &&
            results[2][0].contactnumber) ||
          null,
        data: results && results[3],
        redeemedAmount:
          (results &&
            results[4] &&
            results[4][0] &&
            results[4][0].redeemedAmount) ||
          null,
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

async function viewpaytmbalance(req, res) {
  if (!req.body || !req.body.createdby) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  try {
    var paytmParams = {};
    var post_data = JSON.stringify(paytmParams);
    let obj = {
      action: "viewwalletbalance",
      createdby: req.body.createdby,
    };
    obj = JSON.stringify(obj);
    commonModel
      .mysqlPromiseModelService(proc.mstpaytm, [obj])
      .then(async (results) => {
        if (
          !(results && results[0] && results[0][0] && results[0][0].paytmkey)
        ) {
          return res.json({
            state: -1,
            message: "Paytm keys not found",
          });
        }
        var paytmconfig = {};
        paytmconfig = results[0][0].paytmkey;
        paytmconfig = JSON.parse(paytmconfig);
        if (
          !paytmconfig.hasOwnProperty("subwalletGuid") ||
          !paytmconfig.hasOwnProperty("x_mid") ||
          !paytmconfig.hasOwnProperty("YOUR_MERCHANT_KEY")
        ) {
          return res.json({
            state: -1,
            message: "All Paytm keys not found",
          });
        }
        PaytmChecksum.generateSignature(
          post_data,
          paytmconfig.YOUR_MERCHANT_KEY
        )
          .then(function (checksum) {
            var x_checksum = checksum;
            var options = {
              hostname: hostname,
              path: "/bpay/api/v1/account/list",
              port: 443,
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-mid": paytmconfig.x_mid,
                "x-checksum": x_checksum,
                "Content-Length": post_data.length,
              },
            };
            var response = "";
            var post_req = https.request(options, function (post_res) {
              post_res.on("data", function (chunk) {
                response += chunk;
              });

              post_res.on("end", function () {
                var _result = JSON.parse(response);
                if (_result.status == "SUCCESS") {
                  var filteredArray =
                    _result &&
                    _result.result.filter(function (itm) {
                      return (
                        (itm && itm.subWalletGuid) ==
                        (paytmconfig && paytmconfig.subwalletGuid)
                      );
                    });
                  for (let i = 0, len = filteredArray.length; i < len; i++) {
                    delete filteredArray[i].subWalletGuid;
                  }
                  return res.send({
                    state: 1,
                    message: "payment sucess",
                    data: filteredArray,
                  });
                } else {
                  return res.send({
                    status: _result.statusCode || -1,
                    message: _result.statusMessage || "payment failed",
                    data: null,
                  });
                }
              });
            });
            post_req.write(post_data);
            post_req.end();
          })
          .catch((err) => {
            return res.json({
              state: -1,
              message: err.message,
            });
          });
      })
      .catch((err) => {
        return res.json({
          state: -1,
          message: err.message || err,
        });
      });
  } catch (e) {
    return res.json({
      state: -1,
      message: e.message,
    });
  }
}

async function paytmkr(req, res) {
  if (!req.body || !req.body.createdby || !req.body.reqtype) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  try {
    let obj = {
      phonenumber: req.body && req.body.phonenumber,
      emailid: req.body && req.body.emailid,
      amount: req.body && req.body.amount,
      createdby: req.body && req.body.createdby,
      feedbackid: req.body && req.body.feedbackid,
      account_no: req.body && req.body.accountnumber,
      ifsc_code: req.body && req.body.ifsc,
      vpa: req.body && req.body.upi,
      reqtype: req.body && req.body.reqtype,
      action: "paytmkr",
    };
    obj = JSON.stringify(obj);
    var orderid = await randomString(50);
    commonModel
      .mysqlPromiseModelService(proc.paytm, [obj])
      .then(async (results) => {
        if (
          !(results && results[0] && results[0][0] && results[0][0].paytmkey)
        ) {
          return res.json({
            state: -1,
            message: "Paytm keys not found!",
          });
        }
        var paytmconfig = {};
        paytmconfig = results[0] && results[0][0] && results[0][0].paytmkey;
        paytmconfig = JSON.parse(paytmconfig);
        if (
          !paytmconfig.hasOwnProperty("subwalletGuid") ||
          !paytmconfig.hasOwnProperty("x_mid") ||
          !paytmconfig.hasOwnProperty("YOUR_MERCHANT_KEY")
        ) {
          return res.json({
            state: -1,
            message: "All Paytm keys not found!",
          });
        }
        let walletbalance = await paytmBalanceValidate(
          req,
          res,
          orderid,
          paytmconfig
        );
        var balance =
          walletbalance && walletbalance[0] && walletbalance[0].walletBalance;
        if (balance < (req.body && req.body.amount) || !balance) {
          let emailObj = {
            cc: "",
            mailType: "addfund",
            moduleid: req.body.moduleid ? req.body.moduleid : "feedback",
            userid: req.body.createdby,
            subjectVariables: {
              subject: "Please add fund in Paytm wallet",
            },
            headingVariables: {
              heading: "Please add fund in Paytm wallet",
            },

            bodyVariables: {
              trxempname:
                (req.body &&
                  req.body.tokenFetchedData &&
                  req.body.tokenFetchedData.firstname.concat(
                    " ",
                    req.body &&
                      req.body.tokenFetchedData &&
                      req.body.tokenFetchedData.lastname
                  )) ||
                " ",
              trxrequestedamount: req.body.amount || "",
              trxavilableamount:
                walletbalance &&
                walletbalance[0] &&
                walletbalance[0].walletBalance,
            },
          };
          mailservice.mail(emailObj, function (err) {
            if (err) {
              //console.log("MAILLLLLLLLLLL", err);
            }
          });
          return res.json({
            state: -1,
            message: "We are sorry, Please contact HR!",
          });
        }
        var data;
        switch (req.body.reqtype) {
          case "vpadetail":
            data = await UPItransfer(req, res, orderid, paytmconfig);
            break;
          case "viewaccountdetail":
            data = await accounttransfer(req, res, orderid, paytmconfig);
            break;
          case "paytmwalletdetatil":
            data = await wallettransfer(req, res, orderid, paytmconfig);
            break;
          default:
            return res.json({
              state: -1,
              message: "Send valid reqtype",
            });
        }
        if (data && data.status != "FAILURE") {
          setTimeout(async () => {
            var _result1 = await disbursestatus(orderid, paytmconfig);
            var obj1 = {
              status: _result1 && _result1.status,
              statusCode: _result1 && _result1.statusCode,
              statusMessage: _result1 && _result1.statusMessage,
              mid: _result1 && _result1.result && _result1.result.mid,
              orderId: _result1 && _result1.result && _result1.result.orderId,
              paytmOrderId:
                _result1 && _result1.result && _result1.result.paytmOrderId,
              amount: _result1 && _result1.result && _result1.result.amount,
              action: "adddata",
              createdby: req.body && req.body.createdby,
              phonenumber: req.body && req.body.phonenumber,
              vpa: req.body && req.body.upi,
              account_no: req.body && req.body.accountnumber,
              ifsc_code: req.body && req.body.ifsc,
              feedbackid: req.body && req.body.feedbackid,
              reqtype: req.body && req.body.reqtype,
            };
            commonModel
              .mysqlPromiseModelService(proc.paytm, [JSON.stringify(obj1)])
              .then((results) => {
                res.json({
                  state: 1,
                  message: (_result1 && _result1.statusMessage) || "Success",
                  status: _result1 && _result1.status,
                  data: _result1,
                  paytmOrderId:
                    _result1 && _result1.result && _result1.result.paytmOrderId,
                  trnDate: results && results[0] && results[0][0].trnDate,
                });
              })
              .catch((err) => {
                return res.json({
                  state: -1,
                  data: null,
                  message: _result1.statusMessage.concat(
                    ".   Error : ",
                    err.message || err
                  ),
                  status: _result1 && _result1.status,
                });
              });
          }, 5000);
        } else {
          return res.json({
            state: -1,
            message: (data && data.statusMessage) || "Fail",
            status: data && data.status,
            data: data,
          });
        }
      })
      .catch((err) => {
        return res.json({
          state: -1,
          message: err.message || err,
        });
      });
  } catch (err) {
    return res.json({
      state: -1,
      message: err.message || err,
    });
  }
}

async function wallettransfer(req, res, orderid, paytmconfig) {
  try {
    return new Promise((resolve, reject) => {
      if (
        !req.body ||
        !req.body.amount ||
        !req.body.phonenumber ||
        !paytmconfig ||
        !orderid
      ) {
        return res.json({
          message: "Send required data",
          state: -1,
        });
      }
      var paytmParams = {};
      paytmParams["orderId"] = orderid;
      paytmParams["subwalletGuid"] = paytmconfig && paytmconfig.subwalletGuid;
      paytmParams["amount"] = req.body && req.body.amount;
      paytmParams["beneficiaryPhoneNo"] = req.body && req.body.phonenumber;

      var post_data = JSON.stringify(paytmParams);

      PaytmChecksum.generateSignature(
        post_data,
        paytmconfig && paytmconfig.YOUR_MERCHANT_KEY
      )
        .then(function (checksum) {
          // for transfer amount form wallet

          var x_checksum = checksum;
          var options = {
            hostname: hostname,

            /* Solutions offered are: food, gift, gratification, loyalty, allowance, communication */
            path: "/bpay/api/v1/disburse/order/wallet/gratification",
            port: 443,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-mid": paytmconfig && paytmconfig.x_mid,
              "x-checksum": x_checksum,
              "Content-Length": (post_data && post_data.length) || 0,
            },
          };
          var response = "";
          var post_req = https.request(options, function (post_res) {
            post_res.on("data", function (chunk) {
              response += chunk;
            });
            post_res.on("end", function () {
              resolve(JSON.parse(response));
            });
          });
          post_req.write(post_data);
          post_req.end();
        })
        .catch((err) => {
          reject(err.message || err);
        });
    });
  } catch (e) {
    return res.json({
      state: -1,
      message: e || e.message,
    });
  }
}

async function accounttransfer(req, res, orderid, paytmconfig) {
  try {
    return new Promise((resolve, reject) => {
      if (
        !req.body ||
        !req.body.amount ||
        !req.body.accountnumber ||
        !req.body.ifsc ||
        !orderid ||
        !paytmconfig
      ) {
        return res.json({
          message: "Send required data",
          state: -1,
        });
      }
      var paytmParams = {};

      paytmParams["subwalletGuid"] = paytmconfig && paytmconfig.subwalletGuid;
      paytmParams["orderId"] = orderid;
      paytmParams["beneficiaryAccount"] = req.body && req.body.accountnumber;
      paytmParams["beneficiaryIFSC"] = req.body && req.body.ifsc;
      paytmParams["amount"] = req.body && req.body.amount;
      paytmParams["purpose"] = "SALARY_DISBURSEMENT";
      paytmParams["date"] = new Date().toISOString().slice(0, 10);

      var post_data = JSON.stringify(paytmParams);

      PaytmChecksum.generateSignature(
        post_data,
        paytmconfig && paytmconfig.YOUR_MERCHANT_KEY
      )
        .then(function (checksum) {
          var x_mid = paytmconfig && paytmconfig.x_mid;
          var x_checksum = checksum;
          var options = {
            hostname: hostname,
            path: "/bpay/api/v1/disburse/order/bank",
            port: 443,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-mid": x_mid,
              "x-checksum": x_checksum,
              "Content-Length": post_data.length,
            },
          };
          var response = "";
          var post_req = https.request(options, function (post_res) {
            post_res.on("data", function (chunk) {
              response += chunk;
            });

            post_res.on("end", function () {
              resolve(JSON.parse(response));
            });
          });

          post_req.write(post_data);
          post_req.end();
        })
        .catch((err) => {
          reject(err.message || err);
        });
    });
  } catch (e) {
    return res.json({
      state: -1,
      message: e.message || e,
    });
  }
}

async function UPItransfer(req, res, orderid, paytmconfig) {
  try {
    return new Promise((resolve, reject) => {
      if (
        !req.body ||
        !req.body.amount ||
        !req.body.upi ||
        !paytmconfig ||
        !orderid
      ) {
        return res.json({
          message: "Send required data",
          state: -1,
        });
      }
      var paytmParams = {};

      paytmParams["subwalletGuid"] = paytmconfig && paytmconfig.subwalletGuid;
      paytmParams["orderId"] = orderid;
      paytmParams["beneficiaryVPA"] = req.body && req.body.upi;
      paytmParams["transferMode"] = "UPI";
      paytmParams["amount"] = req.body && req.body.amount;
      paytmParams["purpose"] = "BONUS";
      paytmParams["date"] = new Date().toISOString().slice(0, 10);

      var post_data = JSON.stringify(paytmParams);

      PaytmChecksum.generateSignature(
        post_data,
        paytmconfig && paytmconfig.YOUR_MERCHANT_KEY
      )
        .then(function (checksum) {
          var x_mid = paytmconfig && paytmconfig.x_mid;
          var x_checksum = checksum;
          var options = {
            hostname: hostname,
            path: "/bpay/api/v1/disburse/order/bank",
            port: 443,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-mid": paytmconfig && paytmconfig.x_mid,
              "x-checksum": x_checksum,
              "Content-Length": post_data.length,
            },
          };
          var response = "";
          var post_req = https.request(options, function (post_res) {
            post_res.on("data", function (chunk) {
              response += chunk;
            });

            post_res.on("end", function () {
              resolve(JSON.parse(response));
            });
          });

          post_req.write(post_data);
          post_req.end();
        })
        .catch((err) => {
          reject(err.message || err);
        });
    });
  } catch (e) {
    return res.json({
      state: -1,
      message: e.message || e,
    });
  }
}

async function disbursestatus(orderid, paytmconfig) {
  try {
    return new Promise((resolve, reject) => {
      if (!orderid || !paytmconfig) {
        return res.json({
          message: "Send required data",
          state: -1,
        });
      }
      var paytmParams = {};
      paytmParams["orderId"] = orderid;
      var post_data = JSON.stringify(paytmParams);

      PaytmChecksum.generateSignature(
        post_data,
        paytmconfig && paytmconfig.YOUR_MERCHANT_KEY
      )
        .then(function (checksum) {
          //  Disburse Status​ Query​ ​API
          var x_checksum = checksum;
          var options = {
            hostname: hostname,
            path: "/bpay/api/v1/disburse/order/query",
            port: 443,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-mid": paytmconfig && paytmconfig.x_mid,
              "x-checksum": x_checksum,
              "Content-Length": post_data.length,
            },
          };
          var response = "";
          var post_req = https.request(options, function (post_res) {
            post_res.on("data", function (chunk) {
              response += chunk;
            });
            post_res.on("end", function () {
              resolve(JSON.parse(response));
            });
          });
          post_req.write(post_data);
          post_req.end();
        })
        .catch((err) => {
          reject(err.message || err);
        });
    });
  } catch (e) {
    reject(e.message || e);
  }
}

async function pastpayout(req, res) {
  if (!req.body || !req.body.createdby) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.paytm, [obj])
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

async function transactionall(req, res) {
  if (!req.body || !req.body.createdby || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstpaytm, [obj])
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

async function accountdetail(req, res) {
  if (!req.body || !req.body.action || !req.body.userid) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstpaytm, [obj])
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

async function transactiontype(req, res) {
  if (!req.body || !req.body.action || !req.body.createdby) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.paytm, [obj])
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

async function orderlist() {
  try {
    var paytmParams = {};
    let obj = {
      action: "cronepaytmorderlist",
    };
    obj = JSON.stringify(obj);
    commonModel
      .mysqlPromiseModelService(proc.paytm, [obj])
      .then(async (results) => {
        if (
          !(results && results[0] && results[0][0] && results[0][0].paytmkey)
        ) {
          //console.log("Paytm keys not found");
        }
        var paytmconfig = {};
        paytmconfig = results[0][0].paytmkey;
        paytmconfig = JSON.parse(paytmconfig);
        if (
          !paytmconfig.hasOwnProperty("subwalletGuid") ||
          !paytmconfig.hasOwnProperty("x_mid") ||
          !paytmconfig.hasOwnProperty("YOUR_MERCHANT_KEY")
        ) {
          //console.log("All Paytm keys not found");
        }
        paytmParams["subwalletGuid"] = paytmconfig && paytmconfig.subwalletGuid; // account passbook api
        paytmParams["fromDate"] =
          results &&
          results[1] &&
          results[1][0].fromDate &&
          results[1][0].fromDate.toISOString().slice(0, 10);
        paytmParams["toDate"] =
          results &&
          results[1] &&
          results[1][0].toDate &&
          results[1][0].toDate.toISOString().slice(0, 10);
        var post_data = JSON.stringify(paytmParams);

        PaytmChecksum.generateSignature(
          post_data,
          paytmconfig && paytmconfig.YOUR_MERCHANT_KEY
        ).then(function (checksum) {
          var x_mid = paytmconfig && paytmconfig.x_mid;
          var x_checksum = checksum;

          var options = {
            hostname: hostname,
            path: "/bpay/api/v2/report",
            port: 443,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-mid": x_mid,
              "x-checksum": x_checksum,
              "Content-Length": post_data.length,
            },
          };
          var response = "";
          var post_req = https.request(options, function (post_res) {
            post_res.on("data", function (chunk) {
              response += chunk;
            });
            post_res.on("end", function () {
              let data = JSON.parse(response);
              if (data && data.status == "SUCCESS") {
                let obj = {
                  action: "paytmorder",
                  mappingData:
                    (data && data.result && data.result.orders) || [],
                };
                commonModel
                  .mysqlPromiseModelService("call usp_Paytm_order(?)", [
                    JSON.stringify(obj),
                  ])
                  .then((results) => {
                    //console.log("Success", results);
                  })
                  .catch((err) => {
                    //console.log(err.message || err);
                  });
              } else {
                //console.log(data.status || data);
              }
            });
          });
          post_req.write(post_data);
          post_req.end();
        });
      })
      .catch((err) => {
        //console.log(err.message || err);
      });
  } catch (e) {
    //console.log(e.message || e);
  }
}

async function uploadpaytmbudget(req, res) {
  try {
    if (!req.files) throw new Error("File Required!");
    // if (!req.body && !req.body.fy)
    //     throw new Error('Financial Year Required!');
    const exl = req.files.file;
    var fileformat = exl.name.split(".")[1].toLowerCase();
    if (fileformat != "xlsx")
      //|| fileformat != 'csv')
      throw new Error("Unsupported File Format. Upload XLSX File Format!");
    makeDir("uploads");
    let dir = makeDir("uploads/paytmBudget");
    let uploadPath = path.join(dir, `${Date.now()}_${exl.name}`);
    await exl.mv(uploadPath);
    const exlarr = await getbudgetExcelData(uploadPath);
    const x = ["departmentname", "designationname", "username", "bandname"],
      y = Object.keys(exlarr[0]),
      level = _.intersectionWith(x, y, _.isEqual);
    req.body["booklevel"] = level.toString().slice(0, -4);
    req.body["mappingData"] = exlarr;
    req.body["action"] = "addpaytmbudget";
    const reqData = JSON.stringify(req.body);
    let results = await query("call usp_upload_Paytm_budget(?)", [reqData]);
    const re = results && results[1] && results[1][0] && results[1][0];
    if (re && re.state == 1) {
      return res.json({
        state: 1,
        message: re.message || "Success",
        data: results,
      });
    } else {
      return res.json({
        state: -1,
        message: re.message || "something went Wrong",
        data: results,
      });
    }
  } catch (err) {
    return res.json({
      state: -1,
      message: err.message || err,
    });
  }
}

function getbudgetExcelData(filepath) {
  return new Promise((resolve, reject) => {
    const x = ["departmentname", "designationname", "username", "bandname"],
      errb = [],
      errbt = [],
      errtemp = [],
      errusr = [],
      wb = xlsx.readFile(filepath),
      ws = wb.Sheets["data"],
      data = xlsx.utils.sheet_to_json(ws),
      c1 = ws["A1"] ? ws["A1"].v && ws["A1"].v : undefined,
      c2 = ws["B1"] ? ws["B1"].v && ws["B1"].v : undefined,
      c3 = ws["C1"] ? ws["C1"].v && ws["C1"].v : undefined,
      c4 = ws["D1"] ? ws["D1"].v && ws["D1"].v : undefined,
      c5 = ws["E1"] ? ws["E1"].v && ws["E1"].v : undefined,
      c6 = ws["F1"] ? ws["F1"].v && ws["F1"].v : undefined,
      c7 = ws["G1"] ? ws["G1"].v && ws["G1"].v : undefined,
      c8 = ws["H1"] ? ws["H1"].v && ws["H1"].v : undefined,
      c9 = ws["I1"] ? ws["I1"].v && ws["I1"].v : undefined,
      c10 = ws["J1"] ? ws["J1"].v && ws["J1"].v : undefined,
      c11 = ws["K1"] ? ws["K1"].v && ws["K1"].v : undefined,
      c12 = ws["L1"] ? ws["L1"].v && ws["L1"].v : undefined;

    if (
      !c1 ||
      c1.toString().trim() !== "countryname" ||
      !c2 ||
      c2.toString().trim() !== "locationname" ||
      !c3 ||
      c3.toString().trim() !== "businessunitname" ||
      !c4 ||
      c4.toString().trim() !== "workforcename" ||
      !c5 ||
      !x.includes(c5.toString().trim()) ||
      // !c6 || c6.toString().trim() !== "expensetype" ||
      !c7 ||
      c7.toString().trim() !== "Amount_Per_Employee" ||
      // !c8 || c8.toString().trim() !== "Cap_Percent" ||
      !c9 ||
      c9.toString().trim() !== "Cap_Percent" ||
      !c10 ||
      c10.toString().trim() !== "Periodicity" ||
      !c11 ||
      c11.toString().trim() !== "Carry_Forward_Limit" ||
      !c12 ||
      c12.toString().trim() !== "Max_Carry_Forward_Limit"
    ) {
      if (
        !c1 ||
        c1.toString().trim() !== "username" ||
        !c2 ||
        c2.toString().trim() !== "department" ||
        !c3 ||
        c3.toString().trim() !== "designation" ||
        !c4 ||
        c4.toString().trim() !== "Amount_Per_Employee" ||
        // !c5 || c5.toString().trim() !== "Amount_Per_Employee" ||
        !c6 ||
        c6.toString().trim() !== "Cap_Percent" ||
        !c7 ||
        c7.toString().trim() !== "Periodicity" ||
        !c8 ||
        c8.toString().trim() !== "Carry_Forward_Limit" ||
        !c9 ||
        c9.toString().trim() !== "Max_Carry_Forward_Limit"
      ) {
        reject("Invalid Budget Template!");
      }
    }
    if (!data.length)
      reject(
        "Make sure the worksheet named 'data' in the template should not be empty!"
      );

    _.each(data, (item, index) => {
      const y = Object.keys(item),
        level = _.intersectionWith(x, y, _.isEqual).toString();
      if (
        item.username &&
        item.username.includes("(") &&
        item.username.includes(")")
      ) {
        item["ecode"] = item["username"].split("(")[1].split(")")[0];
        delete item.department;
        delete item.designation;
      }
      if (level == "username" && !item["ecode"]) errusr.push(index + 2); // (typeof item['Amount_Per_Employee']) !== "number"
      if (
        item["Amount_Per_Employee"] < 0 ||
        item["Amount_Per_Employee"] > Number.MAX_SAFE_INTEGER
      )
        errb.push(index + 2);
      if (item["Periodicity"] != "Monthly" && item["Periodicity"] != "Yearly")
        errbt.push(index + 2);
      if (
        level != "username" &&
        !(
          item.countryname &&
          item.locationname &&
          item.businessunitname &&
          item.workforcename &&
          level
        )
      ) {
        //&& item['Carry_Forward_Limit'] && item['Max_Carry_Forward_Limit'])) {
        errtemp.push(index + 2);
      } else if (level == "username" && !level) {
        //&& item['Carry_Forward_Limit'] && item['Max_Carry_Forward_Limit'])) {
        errtemp.push(index + 2);
      }
    });
    let m1 = errb.length
      ? `Row no. ${errb.toString()} should have correct Amount_Per_Employee`
      : "";
    let m2 = errbt.length
      ? `Row no. ${errbt.toString()} should have correct Periodicity in Monthly/Yearly`
      : "";
    let m3 = errtemp.length
      ? `Row no. ${errtemp.toString()} have some empty fields`
      : "";
    let m4 = errusr.length
      ? `Row no. ${errusr.toString()} should have username with their ecode`
      : "";

    switch (true) {
      case Boolean(m1 && !m2 && !m3 && !m4):
        reject(m1);
      case Boolean(!m1 && m2 && !m3 && !m4):
        reject(m2);
      case Boolean(!m1 && !m2 && m3 && !m4):
        reject(m3);
      case Boolean(!m1 && !m2 && !m3 && m4):
        reject(m4);
      case Boolean(m1 && m2 && !m3 && !m4):
        reject(`${m1} and ${m2}`);
      case Boolean(!m1 && m2 && m3 && !m4):
        reject(`${m2} and ${m3}`);
      case Boolean(!m1 && !m2 && m3 && m4):
        reject(`${m3} and ${m4}`);
      case Boolean(m1 && !m2 && m3 && m4):
        reject(`${m1} and ${m3}`);
      case Boolean(m1 && !m2 && !m3 && m4):
        reject(`${m1} and ${m4}`);
      case Boolean(!m1 && m2 && !m3 && m4):
        reject(`${m2} and ${m4}`);
      case Boolean(
        (m1 && m2 && m3) ||
          (m2 && m3 && m4) ||
          (m1 && m3 && m4) ||
          (m1 && m2 && m4)
      ):
        reject(
          `Please correct data at row no.  ${_.uniq(
            _.concat(errb, errbt, errtemp, errusr)
          ).toString()}`
        );
      default:
        resolve(data);
    }
  });
}

async function userbudgetvalidate(req, res) {
  if (!req.body || !req.body.createdby || !req.body.userid) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = req.body;
  obj.action = "userbudgetvalidate";
  obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstbudget, [obj])
    .then((results) => {
      return res.json({
        state: results && results[0][0] && results[0][0].state,
        message: results && results[0][0] && results[0][0].message,
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

async function budgetvalidate(validation_obj) {
  return new Promise((resolve, reject) => {
    if (!(validation_obj && validation_obj.createdby)) {
      // !(validation_obj && validation_obj.feedbackreasonid) ||
      reject("Send required data");
    }
    let obj1 = JSON.stringify(validation_obj);
    commonModel
      .mysqlPromiseModelService(proc.feedbackbudgetvalidate, [obj1])
      .then((results) => {
        resolve({
          state: results && results[0][0] && results[0][0].state,
          message: results && results[0][0] && results[0][0].message,
        });
      })
      .catch((err) => {
        reject(err.message || err);
      });
  });
}

async function budgetdashboard(req, res) {
  if (!req.body || !req.body.createdby || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = req.body;
  obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstbudget, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Sucess.",
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

async function xyzdata(req, res) {
  if (!req.body || !req.body.createdby) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstpaytm, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results && results[0],
        toberedeem: results && results[1],
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

async function paytmBalanceValidate(req, res, orderid, paytmconfig) {
  try {
    return new Promise((resolve, reject) => {
      if (!req.body || !req.body.amount || !paytmconfig) {
        return res.json({
          message: "Send required data",
          state: -1,
        });
      }
      var paytmParams = {};
      var post_data = JSON.stringify(paytmParams);
      PaytmChecksum.generateSignature(post_data, paytmconfig.YOUR_MERCHANT_KEY)
        .then(function (checksum) {
          var x_checksum = checksum;
          var options = {
            hostname: hostname,
            path: "/bpay/api/v1/account/list",
            port: 443,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-mid": paytmconfig.x_mid,
              "x-checksum": x_checksum,
              "Content-Length": post_data.length,
            },
          };
          var response = "";
          var post_req = https.request(options, function (post_res) {
            post_res.on("data", function (chunk) {
              response += chunk;
            });

            post_res.on("end", function () {
              var _result = JSON.parse(response);
              if (_result.status == "SUCCESS") {
                var filteredArray =
                  _result &&
                  _result.result.filter(function (itm) {
                    return (
                      (itm && itm.subWalletGuid) ==
                      (paytmconfig && paytmconfig.subwalletGuid)
                    );
                  });
                for (let i = 0, len = filteredArray.length; i < len; i++) {
                  delete filteredArray[i].subWalletGuid;
                }
                resolve(filteredArray);
              } else {
                reject(_result.statusMessage || "payment failed");
              }
            });
          });
          post_req.write(post_data);
          post_req.end();
        })
        .catch((err) => {
          return res.json({
            state: -1,
            message: err.message,
          });
        });
    });
  } catch (e) {
    return res.json({
      state: -1,
      message: e.message || e,
    });
  }
}

async function budgetoperation(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.budgetoperation, [obj])
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
