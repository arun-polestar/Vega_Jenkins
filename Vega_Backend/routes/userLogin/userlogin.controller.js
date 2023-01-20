const commonModel = require("../common/Model");
const proc = require("../common/procedureConfig");
const config = require("../../config/config");
const jwt = require("jsonwebtoken");
var crypto = require("crypto");
const bcrypt = require("bcryptjs");
const moment = require("moment");
var authService = require("../../services/authService");
const _ = require("underscore");
const mailService = require("../../services/mailerService");
const https = require("https");
const { reject } = require("underscore");
const { default: axios } = require("axios");
// const { next } = require("cheerio/lib/api/traversing");
const query = require("../common/Model").mysqlPromiseModelService;
const redisClient = require("../../redisconnect");
const { promisify } = require("util");
const { verify } = require("jsonwebtoken");

module.exports = {
  login: login,
  appLogin: appLogin,
  checkSession: checkSession,
  // Authorize: Authorize,
  logoutFromSingleDevice: logoutFromSingleDevice,
  logoutFromAllDevices: logoutFromAllDevices,
  forgetPassword: forgetPassword,
  changePassword: changePassword,
  forgetPasswordWithOtp: forgetPasswordWithOtp,
  dataonlogin: dataonlogin,
  updateMpin,
  validateMpin,
  validateOtp: validateOtp,
  SSOlogin,
  clearTokenMonthly,
  verifySecurityQuesResponse,
  checkSessionC2C,
  getLoginUserDetails,
  sendOtpForPasswordSetting,
  validateOtpForFirstTimeLogin,
  setPassword,
  updateFirstLogin,
  findUser,
  getUserToken,
};

function login(req, res) {
  if (req.headers.authorization) {
    // verify auth credentials
    const base64Credentials = req.headers.authorization.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "ascii"
    );
    [req.body.useremail, req.body.userpassword] = credentials.split(":");
  }
  if (!req.body.useremail || !req.body.userpassword) {
    return res.json({
      state: -1,
      message: "Don't leave a field empty",
      data: null,
    });
  }
  var obj = JSON.stringify({
    useremail: req.body.useremail,
    isalumni: req.body.isalumni,
  });

  commonModel.mysqlModelService(
    proc.uservalidate,
    [obj],
    function (err, results) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
          data: null,
        });
      }
      var response = results && results[0] && results[0][0];
      bcrypt.compare(
        req.body.userpassword,
        response.userpassword,
        function (err, result) {
          if (!result) {
            return res.json({
              state: -1,
              message: "User name/password is incorrect.",
              data: null,
            });
          }
          obj = JSON.stringify({
            id: response.id,
            createdby: response.id,
            guid: response.guid,
            isalumni: req.body.isalumni,
          });

          commonModel.mysqlModelService(
            proc.userview,
            [obj],
            function (err, results1) {
              if (err) {
                return res.json({
                  state: -1,
                  message: err,
                  data: null,
                });
              }
              var userInfo = results1[0][0];
              if (!userInfo) {
                return res.json({
                  state: -1,
                  message: "Invalid User.",
                  data: null,
                });
              }
              var tokenData = {
                id: userInfo.id,
                email: userInfo.useremail,
                firstname: userInfo.firstname,
                lastname: userInfo.lastname,
                managerid: userInfo.managerid,
                accessType: "user",
                timestamp: moment().format("LLLL"),
                guid: userInfo.guid,
                ssotype: 1,
                ecode: userInfo.ecode,
                client_id: userInfo.client_id,
                client_domain: userInfo.client_domain,
                name: userInfo.firstname + " " + userInfo.lastname,
                role: "Candidate",
                phone_number:
                  userInfo.contactnumber &&
                  userInfo.contactnumber.includes("+91")
                    ? userInfo.contactnumber
                    : `+91${userInfo.contactnumber}`,
                //timestamp:moment().format('MMMM Do YYYY, h:mm:ss a')
              };
              ////console.log('token-data----------',tokenData,'sails.jwtsecret  value----',sails.config.jwtSecret);
              var token = jwt.sign(tokenData, config.jwt.secretcode, {
                expiresIn: config.jwt.expiresin, // expires in 24 hours
              });
              // if (req.body.c2c) {
              //   tokenData['userInformation'] = {
              //     country: userInfo.countryname,
              //     location: userInfo.locationname,
              //     businessunit: userInfo.businessunitname,
              //     workforce: userInfo.workforcename,
              //     department: userInfo.departmentname,
              //     designation: userInfo.designationname
              //   }
              // }
              var tokendata = {
                utoken: token,
                jsondata: tokenData,
                userid: tokenData.id,
                action: "login",
                guid: tokenData.guid,
              };
              var ua = req.headers["user-agent"],
                browserobj = {};
              devicetype = "";
              deviceversion = "";
              browsername = "";
              if (/mobile/i.test(ua)) {
                browserobj.Mobile = true;
                browserobj.browsername = "mobile";
              }

              if (/like Mac OS X/.test(ua)) {
                browserobj.iOS = /CPU( iPhone)? OS ([0-9\._]+) like Mac OS X/
                  .exec(ua)[2]
                  .replace(/_/g, ".");
                browserobj.iPhone = /iPhone/.test(ua);
                browserobj.iPad = /iPad/.test(ua);
              }

              if (/Android/.test(ua))
                browserobj.Android = /Android ([0-9\.]+)[\);]/.exec(ua)[1];

              if (/webOS\//.test(ua))
                browserobj.webOS = /webOS\/([0-9\.]+)[\);]/.exec(ua)[1];

              if (/(Intel|PPC) Mac OS X/.test(ua))
                browserobj.Mac =
                  /(Intel|PPC) Mac OS X ?([0-9\._]*)[\)\;]/
                    .exec(ua)[2]
                    .replace(/_/g, ".") || true;

              if (/Windows NT/.test(ua))
                browserobj.Windows = /Windows NT ([0-9\._]+)[\);]/.exec(ua)[1];

              if (/firefox/i.test(ua)) {
                browser = "firefox";
              } else if (/chrome/i.test(ua)) {
                browser = "chrome";
              } else if (/safari/i.test(ua)) browser = "safari";
              else if (/msie/i.test(ua)) browser = "msie";
              else browser = "chrome";
              tokendata["browserobj"] = browserobj;
              tokendata["browser"] = browser;
              tokendata["devicetype"] = browser;
              tokendata["devicename"] = browser;
              tokendata["browsername"] = browser;

              var tokendataobj = JSON.stringify(tokendata);

              commonModel.mysqlModelService(
                proc.tokenmgm,
                [tokendataobj],
                function (err, results1) {
                  if (err) {
                    return res.json({
                      state: -1,
                      message: err,
                      data: null,
                    });
                  } else {
                    return res.json({
                      state: 1,
                      message: "Success",
                      data: `Bearer ${token}`,
                      token: token,
                      RMSrole: userInfo.RMSrole,
                      defaultrole: userInfo.defaultmodulerole,
                      defaultModule: userInfo.defaultmodulename,
                      isclientadmin: userInfo.isclientadmin,
                      defaultrole: userInfo.defaultmodulerole,
                      defaultModule: userInfo.defaultmodulename,
                      ispremium: userInfo.ispremium,
                      islicense: userInfo.islicense,
                      tokenData: req.body.c2c ? tokenData : null,
                    });
                  }
                }
              );
            }
          );
        }
      );
    }
  );
}

//////////////////////////Mobile App Routes /////////////////////////////
function appLogin(req, res) {
  if (!req.body.useremail || !req.body.userpassword) {
    return res.json({
      state: -1,
      message: "Don't leave a field empty",
      data: null,
    });
  }

  var obj = JSON.stringify({
    useremail: req.body.useremail,
  });
  commonModel.mysqlModelService(
    proc.uservalidate,
    [obj],
    function (err, results) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
          data: null,
        });
      }
      var response = results[0][0];
      bcrypt.compare(
        req.body.userpassword,
        response.userpassword,
        function (err, result) {
          if (!result) {
            return res.json({
              state: -1,
              message: "User name/password is incorrect.",
              data: null,
            });
          }
          var deviceid = Math.random().toString(36).substring(7);
          obj = JSON.stringify({
            id: response.id,
            createdby: response.id,
            reqtype: "app-login",
            isadmin: req.body.isadmin,
            deviceid: deviceid,
          });

          commonModel
            .mysqlPromiseModelService(proc.userview, [obj])
            .then(function (results1) {
              var userInfo = results1;
              userInfo.deviceid = deviceid;
              userInfo.todaydate = moment(userInfo.todaydate).format(
                "YYYY-MM-DD"
              );

              if (!userInfo) {
                return res.json({
                  state: -1,
                  message: "Invalid User.",
                  data: null,
                });
              }
              if (req.body.isadmin == 1) {
                return res.json({
                  state: 1,
                  userDetail: results1[0][0],
                  roleDetail: results1[1],
                  employeeList: results1[1],
                  pendingLocations: results1[2],
                });
              } else {
                return res.json({
                  state: 1,
                  userDetail: results1[0][0],
                  roleDetail: results1[1],
                });
              }
            })
            .catch(function (err) {
              return res.json({
                state: -1,
                message: err,
                data: null,
              });
            });
        }
      );
    }
  );
}

function checkSession(req, res) {
  authService.alumniGetData(req.headers, "user", function (err, data) {
    if (err) {
      return res.json({
        state: 0,
        message: err,
        data: null,
      });
    }
    var userId = data.id;
    obj = JSON.stringify({
      id: userId,
      createdby: userId,
      guid: data.guid,
      apiname: "checksession",
      loginfrom: req.body.loginfrom,
    });
    commonModel.mysqlModelService(
      proc.userview,
      [obj],
      function (err, userData) {
        if (err) {
          return res.json({
            state: 0,
            message: err,
            data: null,
          });
        }
        var userInfo = userData[0][0];
        if (!userInfo) {
          return res.json({
            state: 0,
            message: "Invalid User.",
            data: null,
          });
        }

        ////console.log(data.timestamp, "timestamp...........", moment(data.timestamp).toDate());
        //userInfo.lastLogin = moment(data.timestamp).toDate();
        userInfo.lastLogin = new Date(data.timestamp);

        userInfo.theme = {
          primary: userInfo.primarytheme || "rgb(19,30,37)",
          secondry: userInfo.secondrytheme || "#1ABB9C",
        };
        obj = JSON.stringify({
          userid: userId,
          createdby: userId,
          populate: 1,
          guid: data.guid,
        });
        commonModel.mysqlModelService(
          proc.mstusermoduleView,
          [obj],
          function (err, moduleData) {
            if (err) {
              return res.json({
                state: 0,
                message: err,
                data: null,
              });
            }
            //     errorService.getError(moduleData[0][0],function(err){
            // if(err)  return res.status(422).send(err);
            // userInfo.qlikticket='';
            // ticket.get_ticket_redirect('Polestar', 'qlikproductsdev2', function(ticket){
            // 	//console.log("QlikTicket: "+ticket);
            // 	userInfo['qlikticket']=ticket;
            // 	//console.log('QQQQQQQQQQQQ',userInfo);

            // 	});
            var allModulesList = _.pluck(moduleData[0], "module");
            var userModules = _.mapObject(
              _.groupBy(
                _.where(moduleData[0], {
                  isactive: 1,
                }),
                "module"
              ),
              function (val, key) {
                return val[0];
              }
            );
            if (userModules.Settings) userInfo.isAdmin = true;
            userModules.defaultModule = _.where(moduleData[0], {
              isdefault: 1,
            })[0]
              ? _.where(moduleData[0], {
                  isdefault: 1,
                })[0].module
              : "";
            return res.json({
              state: 1,
              userInfo: userInfo,
              userModules: userModules,
              logo: data.logo,
              singlesignin: data.singlesignin,
              rankingparam: data.rankingparam,
              allModules: allModulesList,
              ssotype: data.ssotype || 1,
            });
          }
        );
        //   });
      }
    );
  });
}
async function getLoginUserDetails(req, res) {
  try {
    let obj = req.body;
    obj.action = "login_user_detail";
    let [result] = await query("call usp_mstuser_data(?)", [
      JSON.stringify(obj),
    ]);
    return res.json({ state: 1, message: "Success", data: result[0] });
  } catch (err) {
    return res.json({ state: -1, message: "Something went wrong!" });
  }
}
function checkSessionC2C(req, res) {
  try {
    authService.getData(req.headers, "user", async function (err, data) {
      if (err) {
        return res.status(403).json({
          state: -1,
          auth_status: -1,
          message: "Session Not Applicable",
        });
      }
      if (
        data.tokenData &&
        data.tokenData.client_id &&
        data.tokenData.countryname
      ) {
        return res.json({
          state: 1,
          auth_status: 1,
          message: "Success",
          data: data.tokenData,
        });
      } else {
        let obj = {
          createdby: data.tokenData.id,
          action: "get_client_details",
        };
        let result = await query("call usp_mstuser_data(?)", [
          JSON.stringify(obj),
        ]);
        let userInfo = result[0][0];
        data.tokenData["client_id"] = userInfo.clientid;
        data.tokenData["client_domain"] = userInfo.domain;
        data.tokenData["name"] = userInfo.firstname + " " + userInfo.lastname;
        data.tokenData["role"] = "Candidate";
        data.tokenData["phone_number"] =
          userInfo.contactnumber && userInfo.contactnumber.includes("+91")
            ? userInfo.contactnumber
            : `+91${userInfo.contactnumber}`;
        data.tokenData["country"] = userInfo.countryname;
        data.tokenData["location"] = userInfo.locationname;
        data.tokenData["businessunit"] = userInfo.businessunitname;
        data.tokenData["workforce"] = userInfo.workforcename;
        data.tokenData["department"] = userInfo.departmentname;
        data.tokenData["designation"] = userInfo.designationname;

        return res.json({
          state: 1,
          auth_status: 1,
          message: "Success",
          data: data.tokenData,
        });
      }
    });
  } catch (err) {
    return res.json({ state: 0, message: "Session Not Applicable" });
  }
}

function logoutFromSingleDevice(req, res) {
  if (!req.body || !req.body.createdby || !req.body.tokenFetchedData) {
    return res.json({
      message: "User authorization failed",
      state: 0,
      data: null,
    });
  }
  var token = req.headers["x-access-token"] || req.headers["token"];
  if (!token) return callback("No Token found");
  var tokendata = {
    utoken: token,
    action: "delete",
    userid: req.body && req.body.createdby,
  };
  var tokendataobj = JSON.stringify(tokendata);
  commonModel
    .mysqlPromiseModelService(proc.tokenmgm, [tokendataobj])
    .then((results) => {
      // //console.log('++++++++++++++++++++++',results);
      if (
        results &&
        results[0] &&
        results[0][0] &&
        results[0][0].state &&
        results[0][0].state == 1
      ) {
        return res.json({
          state: results[0][0].state,
          message: results && results[0][0] && results[0][0].message,
          data: results && results[0][0],
        });
      } else if (
        results &&
        results[0] &&
        results[0][0] &&
        results[0][0].state &&
        results[0][0].state == -1
      ) {
        return res.json({
          state: results[0][0].state,
          message: "Something went wrong",
          data: null,
        });
      }
    })
    .catch((err) => {
      return res.json({
        state: -1,
        message: err,
      });
    });
}

function logoutFromAllDevices(req, res) {
  if (!req.body || !req.body.createdby || !req.body.tokenFetchedData) {
    return res.json({
      message: "User authorization failed",
      state: 0,
      data: null,
    });
  }
  var tokendata = {
    guid: req.body.tokenFetchedData.guid,
    action: "delete",
  };
  var tokendataobj = JSON.stringify(tokendata);
  commonModel
    .mysqlPromiseModelService(proc.tokenmgm, [tokendataobj])
    .then((results) => {
      if (
        results &&
        results[0] &&
        results[0][0] &&
        results[0][0].state &&
        results[0][0].state == 1
      ) {
        return res.json({
          state: 1,
          message: "ssss",
          data: results,
        });
        // return res.json({ state: results[0][0].state, message: results && results[0][0] && results[0][0].message, data: results && results[0][0] });
      } else if (
        results &&
        results[0] &&
        results[0][0] &&
        results[0][0].state &&
        results[0][0].state == -1
      ) {
        return res.json({
          state: results[0][0].state,
          message: "Something went wrong",
          data: null,
        });
      }
    })
    .catch((err) => {
      return res.json({
        state: -1,
        message: err,
      });
    });
}

function dataonlogin(req, res) {
  if (!req.body) {
    return res.json({
      message: "Required data missing ",
      state: -1,
      data: null,
    });
  }
  req.body.createdby =
    req.body.type && (req.body.type == "vendor" || "bgv")
      ? req.body.tokenFetchedData.credentialid
      : req.body.createdby;
  var obj = {
    createdby: req.body.createdby,
    action: "dataonlogin",
  };
  obj = JSON.stringify(obj);

  commonModel
    .mysqlPromiseModelService(proc.tokenmgm, [obj])
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
        message: err,
      });
    });
}

function forgetPassword(req, res) {
  if (!req.body.user_id || !req.body.host) {
    return res.json({
      state: -1,
      message: "please enter email !!!!!!",
      data: null,
    });
  }
  var random = Math.random().toString().substring(5);
  var token = crypto.createHash("sha1").update(random).digest("hex");
  var obj = {
    useremail: req.body.user_id,
    resettoken: token,
  };
  var obj = JSON.stringify(obj);

  commonModel.mysqlModelService(
    proc.forgetpassword,
    [obj],
    function (err, results) {
      if (err) {
        return res.json({
          state: 1,
          message: "Mail sent.",
          data: null,
        });
      } else {
        var emailObj = {
          email: req.body.user_id,
          fullname: req.body.user_id.split("@")[0],
          mailType: "forgetPassword",
          moduleid: "131911",
          resettoken: token,
          linkUrl:
            req.body.host +
            "/resetPassword/validate?sec=" +
            token +
            "&uid=" +
            (req.body && req.body.user_id),
          subjectVariables: {
            subject: "<Reset your password>",
          },
          headingVariables: {
            heading: "Forgot your password?",
          },
          bodyVariables: {
            linkUrl:
              req.body.host +
              "/resetPassword/validate?sec=" +
              token +
              "&uid=" +
              (req.body && req.body.user_id),
          },
        };
        res.json({
          message: "Mail sent.",
          state: 1,
          data: null,
        });
        return mailService.mail(emailObj, function (err) {
          if (err) {
            //console.log("Something went wrong in forget password", err);
          }
        });
      }
    }
  );
}

async function verifySecurityQuesResponse(req, res) {
  try {
    if (!req.body.response) {
      throw new Error("Please provide your answer to security question!");
    }
    let obj = JSON.stringify({
      userid: req.body.createdby,
      action: "emp_security_response",
    });
    let result = await query("call usp_mstuser_data(?)", [obj]);
    let empResponse = result[0][0];
    ////console.log("result", empResponse);
    if (!empResponse) {
      throw new Error("No Record Found for this User!");
    } else {
      if (req.body.response === empResponse.response) {
        return res.json({
          state: 1,
          message: "Verified!",
        });
      } else {
        return res.json({
          state: -1,
          message: "Wrong Answer!",
        });
      }
    }
  } catch (err) {
    //console.log("error", err);
    return res.json({
      state: -1,
      message: err.message,
    });
  }
}

async function changePassword(req, res) {
  // //console.log(req.body,'reqbody');
  try {
    if (!req.body.password && !req.body.oldPassword) {
      throw new Error('Please Provide password and old password"');
    }
    var obj = JSON.stringify({
      useremail: req.body.tokenFetchedData.ecode,
    });
    console.log("obj...........................................->", obj);
    let results = await query("call usp_mstuser_validate(?)", [obj]);
    if (!results) {
      throw new Error("Something went wrong!");
    }
    var response = results[0][0];
    ////console.log("response", response);
    let result = await bcrypt.compare(
      req.body.oldPassword,
      response.userpassword
    );
    if (!result) {
      throw new Error("Old Password is incorrect.");
    }
    let index = -1;
    let lastFewPasswords = results[1];
    for (let i = 0; i < lastFewPasswords.length; i++) {
      let isMatch = await bcrypt.compare(
        req.body.password,
        lastFewPasswords[i].userpassword
      );
      if (isMatch) {
        index = i;
        break;
      }
    }
    let freqName;
    if (index + 1 === 1) {
      freqName = "last";
    } else if (index + 1 === 2) {
      freqName = "second last";
    } else {
      freqName = "third last";
    }

    if (index > -1) {
      throw new Error(`Already used this password ${freqName} time!`);
    }
    var saltRounds = 10;
    let hash = await bcrypt.hash(req.body.password, saltRounds);
    var obj1 = {
      userpassword: hash,
      id: req.body.createdby,
      createdby: req.body.createdby,
    };
    obj1 = JSON.stringify(obj1);
    ////console.log("obj1", obj1);
    let result1 = await query("call usp_mstuser_resetpassword(?)", [obj1]);

    return res.json({
      state: 1,
      message: "Password Successfully Updated",
    });
  } catch (err) {
    console.log("errrorrr", err);
    return res.json({
      state: -1,
      message: err.message,
    });
  }
}

function forgetPasswordWithOtp(req, res) {
  var obj = req.body;
  obj.action = "otp";
  var otp = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
  obj.otp = otp;
  if (obj.useremail) {
    commonModel.mysqlModelService(
      "call usp_mstuser_forgotpassword(?)",
      [JSON.stringify(obj)],
      (err, results) => {
        if (err) {
          return res.json({
            state: -1,
            message: err,
          });
        } else {
          if (results[0][0].state == 1) {
            var options = {
              subject:
                req.body.reqtype && req.body.reqtype == "mpin"
                  ? "OTP for Forget MPIN"
                  : "OTP for Forget password",
              emailid: obj.useremail,
              OTP: obj.otp,
              type: "common",
            };
            res.json({
              state: 1,
              message: "Success",
              data: results[0][0],
            });
            return mailService.sendOTP(options, function (err) {
              if (err) {
                //console.log("Something went wrong!", err);
              } else {
                //console.log("Message");
              }
            });
          } else {
            return res.json({
              state: -1,
              message: "Something Went Wrong",
            });
          }
        }
      }
    );
  } else {
    return res.json({
      state: -1,
      message: "Something Went Wrong",
    });
  }
}

function validateOtp(req, res) {
  var obj = req.body;
  obj.action = "validateotp";
  commonModel.mysqlModelService(
    "call usp_mstuser_forgotpassword(?)",
    [JSON.stringify(obj)],
    (err, results) => {
      if (err) {
        return res.json({
          state: -1,
          message: err,
        });
      } else {
        if (results[0][0].state == 1) {
          return res.json({
            state: 1,
            message: results[0][0].message,
            data: results[0][0],
          });
        } else {
          return res.json({
            state: -1,
            message: results[0][0].message,
            data: null,
          });
        }
      }
    }
  );
}

function updateMpin(req, res) {
  if (!req.body.createdby) {
    return res.json({
      state: -1,
      message: "Not a Valid User",
    });
  }
  try {
    let obj = req.body;
    obj.action = req.body.action ? req.body.action : "update_mpin";
    commonModel.mysqlModelService(
      "call usp_mstuser_operation(?)",
      [JSON.stringify(obj)],
      function (err, result) {
        if (err) {
          return res.json({
            state: -1,
            message: err || "Something went wrong",
          });
        } else {
          return res.json({
            state: 1,
            message: "MPIN Updated Successfully",
          });
        }
      }
    );
  } catch (error) {
    return res.json({
      state: -1,
      message: "Something went wrong",
    });
  }
}

function validateMpin(req, res) {
  if (!req.body.mpin) {
    return res.json({
      state: -1,
      message: "PIN cannot be empty",
    });
  }
  try {
    let obj = req.body;
    obj.action = "validate_mpin";
    commonModel.mysqlModelService(
      "call usp_mstuser_operation(?)",
      [JSON.stringify(obj)],
      function (err, result) {
        if (err) {
          return res.json({
            state: -1,
            message: err || "Something went wrong",
          });
        } else {
          return res.json({
            state: 1,
            message: "MPIN Verified Successfully",
          });
        }
      }
    );
  } catch (error) {
    return res.json({
      state: -1,
      message: "Something went wrong",
    });
  }
}

async function SSOlogin(req, res) {
  const key = "__MicrosoftSSOLogin__";
  const teamsUserId = req.headers.teamsuserid;
  try {
    if (!req.headers.authorization) {
      return res.json({
        state: -1,
        message: "Required Parameters are missing",
        data: null,
      });
    }
    if (teamsUserId) {
      const data = await redisClient.getClientwiseKey(key + teamsUserId);
      if (data && data !== null) {
        let parsedData = JSON.parse(data);
        try {
          await promisify(verify)(parsedData.token, config.jwt.secretcode);
          return res.json(parsedData);
        } catch (e) {
          if (e && e.name !== "TokenExpiredError") {
            throw new Error("Invalid Token");
          }
        }
      }
    }

    const token = req.headers.authorization;
    const urlPath = teamsUserId ? `v1.0/users/${teamsUserId}` : "/v1.0/me";
    const URL = `https://graph.microsoft.com/${urlPath}`;
    const resData = await axios.get(URL, {
      headers: {
        Authorization: token,
      },
    });
    req.body.useremail = resData.data && resData.data.userPrincipalName;
    SSOloginverify(req, res);

    // const options = {
    //   hostname: "graph.microsoft.com",
    //   path: urlPath
    //   headers: {
    //     Authorization: token,
    //   },
    // };
    // https.get(options, (response) => {
    //   var result = "";
    //   response.on("data", function (chunk) {
    //     result += chunk;
    //   });

    //   response.on("end", function () {
    //     try {
    //       console.log("result------->>>>>>", result, options);
    //       let jsondata = JSON.parse(result);
    //       if (
    //         jsondata &&
    //         jsondata.userPrincipalName &&
    //         jsondata.userPrincipalName == req.body.useremail
    //       ) {
    //         SSOloginverify(req, res);
    //       } else {
    //         return res.json({
    //           state: -1,
    //           message: "Authorization Token and User Email did not match",
    //         });
    //       }
    //     } catch (error) {
    //       //console.log(error.message);
    //       return res.json({
    //         state: 0,
    //         message: error.message,
    //       });
    //     }
    //   });
    // });
  } catch (err) {
    console.log("Microsof SSOLogin Error:", err && err.message);
    return res.json({
      state: -1,
      message: (err && err.message) || err,
    });
  }
}

function SSOloginverify(req, res) {
  const key = "__MicrosoftSSOLogin__";
  var obj = JSON.stringify({
    useremail: req.body.useremail,
  });

  commonModel.mysqlModelService(
    "call usp_mstuser_validate_sso(?)",
    [obj],
    function (err, results) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
          data: null,
        });
      }
      var response = results && results[0] && results[0][0];
      if (!response) {
        return res.json({
          state: -1,
          message: "Unauthorized User",
          data: null,
        });
      }
      obj = JSON.stringify({
        id: response.id,
        createdby: response.id,
        guid: response.guid,
      });

      commonModel.mysqlModelService(
        proc.userview,
        [obj],
        function (err, results1) {
          if (err) {
            return res.json({
              state: -1,
              message: err,
              data: null,
            });
          }
          var userInfo = results1[0][0];
          if (!userInfo) {
            return res.json({
              state: -1,
              message: "Invalid User.",
              data: null,
            });
          }
          var tokenData = {
            id: userInfo.id,
            email: userInfo.useremail,
            firstname: userInfo.firstname,
            lastname: userInfo.lastname,
            managerid: userInfo.managerid,
            accessType: "user",
            timestamp: moment().format("LLLL"),
            guid: userInfo.guid,
            ssotype: req.body.ssotype,
            ecode: userInfo.ecode,
            client_id: userInfo.client_id,
            client_domain: userInfo.client_domain,
            name: userInfo.firstname + " " + userInfo.lastname,
            role: "Candidate",
            phone_number:
              userInfo.contactnumber && userInfo.contactnumber.includes("+91")
                ? userInfo.contactnumber
                : `+91${userInfo.contactnumber}`,
          };
          var token = jwt.sign(tokenData, config.jwt.secretcode, {
            expiresIn: config.jwt.expiresin, // expires in 24 hours
          });
          var tokendata = {
            utoken: token,
            jsondata: tokenData,
            userid: tokenData.id,
            action: "login",
            guid: tokenData.guid,
            browserobj: {},
            browser: "",
            devicetype: "",
            devicename: "",
            browsername: "",
          };

          var tokendataobj = JSON.stringify(tokendata);

          commonModel.mysqlModelService(
            proc.tokenmgm,
            [tokendataobj],
            function (err, results1) {
              if (err) {
                return res.json({
                  state: -1,
                  message: err,
                  data: null,
                });
              } else {
                const responseData = {
                  state: 1,
                  message: "Success",
                  data: null,
                  token: token,
                  RMSrole: userInfo.RMSrole,
                  defaultrole: userInfo.defaultmodulerole,
                  defaultModule: userInfo.defaultmodulename,
                  isclientadmin: userInfo.isclientadmin,
                  defaultrole: userInfo.defaultmodulerole,
                  defaultModule: userInfo.defaultmodulename,
                  ispremium: userInfo.ispremium,
                  islicense: userInfo.islicense,
                };
                redisClient.setClientwiseKey(
                  key + req.headers.teamsuserid,
                  JSON.stringify(responseData),
                  172800
                );
                return res.json(responseData);
              }
            }
          );
        }
      );
    }
  );
}

// }

function getUserToken(useremail, ssotype) {
  try {
    return new Promise((resolve, reject) => {
      var obj = JSON.stringify({
        useremail: useremail,
      });
      commonModel.mysqlModelService(
        "call usp_mstuser_validate_sso(?)",
        [obj],
        function (err, results) {
          if (err) {
            reject(err);
          }
          var response = results && results[0] && results[0][0];
          if (!response) {
            // console.log("ERRRRRRRRRRRRRRRRR");
            reject("Unauthorized User");
          }
          console.log("--------------------------------response", response);
          let obj1 = JSON.stringify({
            id: response.id,
            createdby: response.id,
            guid: response.guid,
          });

          commonModel.mysqlModelService(
            proc.userview,
            [obj1],
            function (err, results1) {
              if (err) {
                reject(err);
              }
              var userInfo = results1[0][0];
              if (!userInfo) {
                reject("Invalid User.");
              }
              var tokenData = {
                id: userInfo.id,
                email: userInfo.useremail,
                firstname: userInfo.firstname,
                lastname: userInfo.lastname,
                managerid: userInfo.managerid,
                accessType: "user",
                timestamp: moment().format("LLLL"),
                guid: userInfo.guid,
                ssotype: ssotype,
                ecode: userInfo.ecode,
                client_id: userInfo.client_id,
                client_domain: userInfo.client_domain,
                name: userInfo.firstname + " " + userInfo.lastname,
                role: "Candidate",
                phone_number:
                  userInfo.contactnumber &&
                  userInfo.contactnumber.includes("+91")
                    ? userInfo.contactnumber
                    : `+91${userInfo.contactnumber}`,
              };
              var token = jwt.sign(tokenData, config.jwt.secretcode, {
                expiresIn: config.jwt.expiresin, // expires in 24 hours
              });
              var tokendata = {
                utoken: token,
                jsondata: tokenData,
                userid: tokenData.id,
                action: "login",
                guid: tokenData.guid,
                browserobj: {},
                browser: "",
                devicetype: "",
                devicename: "",
                browsername: "",
              };

              var tokendataobj = JSON.stringify(tokendata);

              commonModel.mysqlModelService(
                proc.tokenmgm,
                [tokendataobj],
                function (err, results1) {
                  if (err) {
                    reject(err);
                  } else {
                    // resolve(token);
                    resolve({
                      state: 1,
                      message: "Success",
                      data: null,
                      token: token,
                      RMSrole: userInfo.RMSrole,
                      defaultrole: userInfo.defaultmodulerole,
                      defaultModule: userInfo.defaultmodulename,
                      isclientadmin: userInfo.isclientadmin,
                      defaultrole: userInfo.defaultmodulerole,
                      defaultModule: userInfo.defaultmodulename,
                      ispremium: userInfo.ispremium,
                      islicense: userInfo.islicense,
                    });
                  }
                }
              );
            }
          );
        }
      );
    });
  } catch (e) {
    reject("Internal Server Error!");
  }
}

function clearTokenMonthly() {
  try {
    let obj = {};
    obj.action = "cleartoken_monthly";
    commonModel.mysqlModelService(
      "call usp_trxtoken_mgm(?)",
      [JSON.stringify(obj)],
      function (err, result) {
        if (err) {
          //console.log("err", err);
        } else {
          //console.log("Success");
        }
      }
    );
  } catch (err) {
    //console.log("Something went wrong");
  }
}

async function sendOtpForPasswordSetting(req, res) {
  var obj = req.body;
  obj.action = "send_otp";
  var otp = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
  obj.otp = otp;
  var random = Math.random().toString().substring(5);
  var token = crypto.createHash("sha1").update(random).digest("hex");
  obj.resettoken = token;

  if (obj.useremail) {
    commonModel.mysqlModelService(
      "call usp_mstuser_forgotpassword(?)",
      [JSON.stringify(obj)],
      (err, results) => {
        if (err) {
          //console.log("errrrr", err);
          return res.json({
            state: -1,
            message: err,
          });
        } else {
          if (results[0][0].state == 1) {
            var options = {
              subject: "OTP for Password Setting",
              emailid: obj.useremail,
              OTP: obj.otp,
              type: "common",
            };

            res.json({
              state: 1,
              message: "Success",
              data: results[0][0],
            });
            return mailService.sendOTP(options, function (err) {
              if (err) {
                //console.log("Something went wrong!", err);
              } else {
                //console.log("Message");
              }
            });
          } else {
            //console.log("bbbbbbbb");
            return res.json({
              state: -1,
              message: "Something Went Wrong",
            });
          }
        }
      }
    );
  } else {
    //console.log("aaaaaa");
    return res.json({
      state: -1,
      message: "Useremail does not exist!",
    });
  }
}

function validateOtpForFirstTimeLogin(req, res) {
  var obj = req.body;
  obj.action = "validateotp_forfirsttime_login";
  commonModel.mysqlModelService(
    "call usp_mstuser_forgotpassword(?)",
    [JSON.stringify(obj)],
    (err, results) => {
      if (err) {
        return res.json({
          state: -1,
          message: err,
        });
      } else {
        if (results[1][0].state == 1) {
          return res.json({
            state: 1,
            message: results[1][0].message,
            data: results[0][0],
          });
        } else {
          return res.json({
            state: -1,
            message: results[1][0].message,
            data: null,
          });
        }
      }
    }
  );
}

async function setPassword(req, res, next) {
  // //console.log(req.body,'reqbody');
  try {
    if (!req.body.userpassword || !req.body.confirm_password) {
      throw new Error('Please Provide both password and confirm password"');
    }
    if (!req.body.resettoken) {
      throw new Error("Already activated user account!");
    }

    if (req.body.userpassword === req.body.confirm_password) {
      var saltRounds = 10;
      let hash = await bcrypt.hash(req.body.userpassword, saltRounds);
      var obj1 = {
        userpassword: hash,
        useremail: req.body.useremail,
        createdby: req.body.createdby,
        action: "set_password",
        resettoken: req.body.resettoken,
      };

      obj1 = JSON.stringify(obj1);
    } else {
      return res.json({
        state: -1,
        message: "Password and Confirm Password must be same!",
      });
    }

    const result = await query("call usp_mstuser_resetpassword(?)", [obj1]);

    return res.json({
      state: result[0][0].state,
      message: result[0][0].message,
      data: result,
    });
  } catch (err) {
    //console.log("errrorrr", err);
    return res.json({
      state: -1,
      message: err.message,
    });
  }
}
async function updateFirstLogin(req, res) {
  try {
    let reqData = req.body;
    reqData.action = "updatefirstlogin";
    let result = await query("call usp_mstuser_operation(?)", [
      JSON.stringify(reqData),
    ]);
    return res.json({ state: 1, message: "Success", data: result[0] });
  } catch (err) {
    //console.log("err", err);
    return res.json({ state: -1, message: "Something went wrong" });
  }
}

async function findUser(username) {
  return new Promise(async (resolve, reject) => {
    try {
      let reqData = {};
      reqData.username = username || "";
      reqData.action = "finduser";
      let result = await query("call usp_mstuser_operation(?)", [
        JSON.stringify(reqData),
      ]);
      console.log("-------------------------------------", result);
      resolve(result[0]);

      // return res.json({ state: 1, message: "Success", data: result[0] });
    } catch (err) {
      reject(err);
    }
  });
}
