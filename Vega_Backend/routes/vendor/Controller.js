// const proc = require('../../common/procedureConfig')
const vendorPolicy = require("./policy");
const commonModel = require("../../routes/common/Model");
const config = require("../../config/config");
const path = require("path");
const jwt = require("jsonwebtoken");
const mailservice = require("../../services/mailerService");
const authServiceVendor = require("../../services/authServiceVendor");
const appRoot = require("app-root-path");
const async = require("async");
const Promise = require("bluebird");
var fs = require("fs");
var fsAsync = Promise.promisifyAll(fs);
const mime = require("mime");
const _ = require("underscore");
const textract = require("textract");
const parserService = require("../../services/parserService");
const stringSimilarity = require("string-similarity");

appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;



var textractConfig = {
  preserveLineBreaks: true,
  tesseract: {
    lang: "eng",
  },
};
var uploadCtrl = require("../vegaHR/upload/Controller");
const rdb = require("../../redisconnect");

module.exports = {
  vendorLogin: vendorLogin,
  vendorRegister: vendorRegister,
  resendVendorOtp: resendVendorOtp,
  validateVendorOtp: validateVendorOtp,
  updateVendorPassword: updateVendorPassword,
  updateVendorTheme: updateVendorTheme,
  changeVendorPassword: changeVendorPassword,
  checkVendorSession: checkVendorSession,
  getVendorMaster: getVendorMaster,
  getCandidateInfo: getCandidateInfo,
  changeVendorStatus: changeVendorStatus,
  deactivateVendor: deactivateVendor,

  /* Recuritment Vendor*/

  getVendorDetails: getVendorDetails,
  updateVendorDetails: updateVendorDetails,
  getVendorData: getVendorData,
  approvalAction: approvalAction,
  getVendorDetailsById: getVendorDetailsById,
  getVendorJD: getVendorJD,
  rmsUploadVendor: rmsUploadVendor,
  getParsedData: getParsedData,
  downloadResumeFile: downloadResumeFile,
  addCandidateVendor: addCandidateVendor,
  getVendorRequisition: getVendorRequisition,
  getCandidateOnBoardData: getCandidateOnBoardData,
  getVendorRequisitionDetails: getVendorRequisitionDetails,
  getVendorCandidateDetails: getVendorCandidateDetails,

  /* Recuritment Vendor*/

  /* BGV Vendor*/

  saveCandidateDetailBGV: saveCandidateDetailBGV,
  getCandidateDetailBGV: getCandidateDetailBGV,
  getBgvCandidateData: getBgvCandidateData,
  updateBgvVendorDetails: updateBgvVendorDetails,
  getBgvVendorDetails: getBgvVendorDetails,

  /* vendor payment*/
  vendorPaymentOperations: vendorPaymentOperations,
  vendorCandidatePayment: vendorCandidatePayment,
};

function vendorLogin(req, res) {
  if (
    !req.body ||
    !req.body.username ||
    !req.body.password ||
    !req.body.role_name
  ) {
    res.json({
      state: -1,
      message: "invalid Operation",
      data: null,
    });
  } else {
    commonModel.mysqlModelService(
      "Call usp_vendor_login(?,?,?)",
      [req.body.username, req.body.password, req.body.role_name],
      (err, result) => {
        if (err) {
          res.json({
            state: -1,
            message: err,
            data: null,
          });
        } else {
          if (result && result[0] && result[0][0]) {
            if (result[0][0].status == 0) {
              res.json({
                state: 0,
                message: "Invalid Credentials",
                data: result,
              });
            } else {
              var userInfo = {
                vendorcredentialid: result[0][0].id,
                credentialid: result[0][0].id,
                vendorrole_id: result[0][0].role_id,
                vendorrole_name: result[0][0].role,
                vendoruser_id: result[0][0].userid,
                vendoruser_name: result[0][0].name,
                firstname: result[0][0].name,
                lastlogin: result[0][0].logintime,
                vendor_state: result[0][0].vendorstate,
                vendor_status: result[0][0].vendorstatus,
                vendortheme: {
                  primary: result[0][0].primarytheme,
                  secondry: result[0][0].secondarytheme,
                  themeimage: result[0][0].themeimage,
                },
                accessType: "vendor",
              };
              var token = jwt.sign(userInfo, config.jwt.secretcode, {
                expiresIn: 86400, // expires in 24 hours
              });
              var vuserid = "v" + userInfo.vendorcredentialid;
              var tokendata = {
                utoken: token,
                jsondata: userInfo,
                userid: vuserid,
                action: "login",
              };
              var tokendataobj = JSON.stringify(tokendata);
              commonModel.mysqlModelService(
                "call usp_trxtoken_mgm(?)",
                [tokendataobj],
                (err, results) => {
                  if (err) {
                    res.json({
                      state: -1,
                      message: err,
                      data: null,
                    });
                  } else {
                    res.json({
                      state: 1,
                      message: "Done",
                      data: results,
                      credentialid: userInfo.id,
                      role_name: userInfo.vendorrole_name,
                      vendor_status: userInfo.vendor_status,
                      token: token,
                    });
                  }
                }
              );
            }
          } else {
            res.json({
              state: -1,
              message: "Data Lost",
              data: null,
            });
          }
        }
      }
    );
  }
}

function vendorRegister(req, res) {
  if (req.body.email_id && req.body.role_name) {
    var emailregx =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (req.body.email_id.match(emailregx)) {
      var otp = (Math.floor(Math.random() * 10000) + 10000)
        .toString()
        .substring(1);
      commonModel.mysqlModelService(
        "Call usp_vendor_add(?,?,?,?)",
        [req.body.email_id, otp, req.body.id, req.body.role_name],
        (err, result) => {
          if (err) {
            res.json({
              state: -1,
              message: err,
              data: null,
            });
          } else if (result && result[0] && result[0][0]) {
            if (result[0][0].isnewuser == "true") {
              var options = {
                emailid: req.body.email_id,
                OTP: otp,
                type: "common",
              };
              mailservice.sendOTP(options, function (err) {
                if (err) {
                  //console.log(err);
                }
              });
              res.json({
                state: 1,
                message: "Success",
                data: result[0],
              });
            } else {
              res.json({
                state: -1,
                message: "Your E-mail Id Already Exist",
                data: result[0],
              });
            }
          }
        }
      );
    } else {
      res.json({
        state: -1,
        message: "E-mail is not Vaild",
        data: null,
      });
    }
  } else {
    res.json({
      state: -1,
      message: "Data Lost",
      data: null,
    });
  }
}

function resendVendorOtp(req, res) {
  if (req.body.email_id && req.body.role_name) {
    var emailregx =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (req.body.email_id.match(emailregx)) {
      var otp = (Math.floor(Math.random() * 10000) + 10000)
        .toString()
        .substring(1);
      commonModel.mysqlModelService(
        "Call usp_vendor_add(?,?,?,?)",
        [req.body.email_id, otp, "yes", req.body.role_name],
        function (err, result) {
          if (err) {
            return res.json({
              state: -1,
              message: err,
              data: null,
            });
          } else {
            if (result && result[0] && result[0][0]) {
              if (result[0][0].state == -1) {
                return res.json({
                  state: -1,
                  message: result[0][0].message,
                  data: null,
                });
              } else if (result[0][0].isnewuser == "true") {
                var options = {
                  emailid: req.body.email_id,
                  OTP: otp,
                  type: "common",
                };
                mailservice.sendOTP(options, function (err) {
                  if (err) {
                    return res.json({
                      state: -1,
                      message: err.msg || err,
                      data: null,
                    });
                  } else {
                    return res.json({
                      state: 1,
                      message: "Success",
                      data: result[0][0],
                    });
                  }
                });
              } else {
                return res.json({
                  state: -1,
                  message: "User Not Exist",
                  data: result[0][0],
                });
              }
            } else {
              return res.json({
                state: -1,
                message: "Data Lost",
                data: null,
              });
            }
          }
        }
      );
    } else {
      return res.json({
        state: -1,
        message: "Something Went Wrong with E-mail",
        data: null,
      });
    }
  } else {
    return res.json({
      state: -1,
      message: "Something Went Wrong",
      data: null,
    });
  }
}

function validateVendorOtp(req, res) {
  if (req.body.userid && req.body.otp) {
    if (Number(req.body.userid) && Number(req.body.otp)) {
      commonModel.mysqlModelService(
        "Call usp_validate_otp(?,?)",
        [req.body.userid, req.body.otp],
        function (err, result) {
          if (err) {
            return res.json({
              state: -1,
              message: err,
              data: null,
            });
          } else {
            if (result && result[0] && result[0][0]) {
              if (result[0][0].state == 0) {
                res.json({
                  state: result[0][0].state,
                  message: result[0][0].messages,
                  data: result,
                });
              } else {
                res.json({
                  state: 1,
                  message: "Success",
                  data: result,
                });
              }
            } else {
              return res.json({
                state: -1,
                message: "Data lost",
                data: null,
              });
            }
          }
        }
      );
    } else {
      return res.json({
        state: -1,
        message: "Not a Correct Format",
        data: null,
      });
    }
  } else {
    return res.json({
      state: -1,
      message: "Please provide the User id and OTP of vendor",
      data: null,
    });
  }
}

function updateVendorPassword(req, res) {
  if (req.body.userid && req.body.password) {
    if (Number(req.body.userid)) {
      commonModel.mysqlModelService(
        "Call usp_update_vandor_password(?,?)",
        [req.body.userid, req.body.password],
        function (err, result) {
          if (err) {
            return res.json({
              state: -1,
              message: err,
              data: null,
            });
          } else {
            if (result && result[0] && result[0][0]) {
              if (result[0][0].state == 0) {
                return res.json({
                  state: 1,
                  message: "Success",
                  data: result,
                });
              } else {
                return res.json({
                  state: 1,
                  message: "Success",
                  data: result,
                });
              }
            } else {
              return res.json({
                state: -1,
                message: "Data lost",
                data: null,
              });
            }
          }
        }
      );
    } else {
      return res.json({
        state: -1,
        message: "User Id should be number",
        data: null,
      });
    }
  } else {
    return res.json({
      state: -1,
      message: "Please provide the User id and password of vendor",
      data: null,
    });
  }
}

function updateVendorTheme(req, res) {
  if (!req.body.tokenFetchedData) {
    return res.json({
      state: -1,
      message: "User authorization failed",
      data: null,
    });
  }
  if (req.body.themedata) {
    var data = req.body.themedata;
    if (data.credential_id && Number(data.credential_id)) {
      var cid = req.body.tokenFetchedData.vendorcredentialid;
      if (!(cid == data.credential_id)) {
        return res.json({
          state: -1,
          message: "You are not authorized for this operation",
          data: null,
        });
      }
    } else {
      return res.json({
        state: -1,
        message:
          "Please provide the credential id of vendor and credential id should be number",
        data: null,
      });
    }
    var dbdata = {
      cid: data.credential_id,
    };
    if (data.primarytheme) {
      dbdata.ptheme = data.primarytheme;
    }
    if (data.secondarytheme) {
      dbdata.stheme = data.secondarytheme;
    }
    if (data.themeimage) {
      dbdata.timage = data.themeimage;
    }
    var obj = JSON.stringify(dbdata);
    commonModel.mysqlModelService(
      "call usp_update_vendortheme(?)",
      [obj],
      function (err, result) {
        if (err) {
          return res.json({
            state: -1,
            message: err,
            data: null,
          });
        } else {
          if (result && result[0] && result[0][0]) {
            if (result[0][0].state == 1) {
              req.body.tokenFetchedData.vendortheme.primary =
                result[0][0].primarytheme;
              req.body.tokenFetchedData.vendortheme.secondry =
                result[0][0].secondarytheme;
              req.body.tokenFetchedData.vendortheme.themeimage =
                result[0][0].themeimage;
            }
            var token = jwt.sign(req.body.tokenFetchedData, config.jwtSecret);
            var obj = JSON.stringify({
              themedata: result[0][0],
              token: token,
            });
            return res.json({
              state: 1,
              message: "success",
              data: obj,
            });
          } else {
            return res.json({
              state: -1,
              message: "Data Lost",
              data: null,
            });
          }
        }
      }
    );
  } else {
    return res.json({
      state: -1,
      message: "Please provide the vendor data",
      data: null,
    });
  }
}

function changeVendorPassword(req, res) {
  if (!req.body.tokenFetchedData || !req.body.passwordInfo) {
    return res.json({
      state: -1,
      message: "User authorization failed",
      data: null,
    });
  }
  var data = req.body.passwordInfo;
  if (
    data.credentialid &&
    Number(data.credentialid) &&
    data.oldPassword &&
    data.password
  ) {
    var cid = req.body.tokenFetchedData.vendorcredentialid;
    if (!(cid == data.credentialid)) {
      return res.json({
        state: -1,
        message: "You are not authorized for this operation",
        data: null,
      });
    }
    commonModel.mysqlModelService(
      "call usp_change_vandor_password(?,?,?)",
      [data.credentialid, data.oldPassword, data.password],
      function (err, result) {
        if (err) {
          return res.json({
            state: -1,
            message: err,
            data: null,
          });
        } else {
          if (result && result[0] && result[0][0]) {
            if (result[0][0].state == 1) {
              return res.json({
                state: 1,
                message: "Success",
                data: result,
              });
            } else {
              return res.json({
                state: 1,
                message: "Success",
                data: result,
              });
            }
          } else {
            return res.json({
              state: 1,
              message: "Data lost",
              data: null,
            });
          }
        }
      }
    );
  } else {
    return res.json({
      state: -1,
      message:
        "Please provide Vendron credential id, Vendron old password, Vendron new password and Vendor credential id should ne number",
      data: null,
    });
  }
}

function checkVendorSession(req, res) {
  vendorPolicy(req, "vendor", function (err, data) {
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
      userInfo: data,
      logo: data.logo,
    });
  });
}

function getVendorMaster(req, res) {
  if (!req.body.tokenFetchedData) {
    return res.json({
      state: -1,
      message: "User authorization failed",
      data: null,
    });
  }
  if (!req.body.configcode) {
    return res.json({
      state: -1,
      message: "Config Code is missing",
      data: null,
    });
  }
  commonModel.mysqlModelService(
    "call usp_get_vendor_master(?)",
    [req.body.configcode],
    function (err, result) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
          data: null,
        });
      } else {
        if (result && result[0]) {
          res.json({
            state: 1,
            message: "Success",
            data: result[0],
          });
        } else {
          return res.json({
            state: -1,
            message: "Data lost",
            data: null,
          });
        }
      }
    }
  );
}

function getCandidateInfo(req, res) {
  // if (!req.body.tokenFetchedData) {
  //     return res.json({
  //         "state": -1,
  //         "message": "User authorization failed",
  //         "data": null
  //     });

  var obj = JSON.stringify({
    token: req.body.token,
    action: "linktoupload",
  });
  commonModel.mysqlModelService(
    "call usp_trxonlinecandidate_view(?)",
    [obj],
    function (err, results) {
      if (err) {
        return res.json({
          state: -1,
          message: "failure",
          data: null,
        });
      }
      return res.json({
        state: 1,
        message: "Success",
        data: results,
      });
    }
  );
}

/*--------------------------------------------------------------------------------------*/
/*------------------------Start RecruitmentVendorController-----------------------------*/
/*--------------------------------------------------------------------------------------*/

async function getVendorDetailsById(req, res) {
  try {
    if (!req.body.tokenFetchedData) {
      throw new Error("User authorization failed");
    }
    let result = await commonModel.mysqlPromiseModelService(
      "Call usp_get_vendor_details(?,?,?)",
      [null, req.body.vendorid, req.body.createdby]
    );
    if (result && result[0] && result[0][0]) {
      var finaldata = {
        countryid: result[0][0].countryid,
        workforceid: result[0][0].workforceid,
        locationid: result[0][0].locationid,
        businessunitid: result[0][0].businessunitid,
        state: result[0][0].state,
        user_id: result[0][0].id,
        name: result[0][0].vendorname,
        address: result[0][0].address,
        city: result[0][0].city,
        pincode: result[0][0].pincode,
        pan: result[0][0].pan,
        registrationno: result[0][0].registrationno,
        servicetaxrno: result[0][0].servicetaxrno,
        cstno: result[0][0].cstno,
        tin: result[0][0].tin,
        bankname: result[0][0].bankname,
        bankbranch: result[0][0].bankbranch,
        bankaccountno: result[0][0].bankaccountno,
        bankifsccode: result[0][0].bankifsccode,
        emailid: result[0][0].emailid,
        contactnumber: result[0][0].contactnumber,
        vendorstate: result[0][0].vendorstate,
        attachment: {
          panfile: result[0][0].panfilepath,
          registrationfile: result[0][0].registrationfilepath,
          servicetaxfile: result[0][0].servicetaxfilepath,
          cancelledchequefile: result[0][0].cancelledchequefilepath,
          cstregistrationfile: result[0][0].cstregistrationfilepath,
        },
        levelonecomment: result[0][0].levelonecomment,
        leveltwocomment: result[0][0].leveltwocomment,
        levelonestatevalue: result[0][0].levelonestatevalue,
        cityvalue: result[0][0].cityvalue,
        vendorskills: result[0][0].vendorskills,
        skillsvalue: result[0][0].skillsvalue,
        source: result[0][0].resumesourceid,
        vendortype: result[0][0].vendortype,
      };
      return res.json({
        state: 1,
        message: "Success",
        data: finaldata,
      });
    } else {
      return res.json({
        state: 1,
        message: "Success",
        data: [],
      });
    }
  } catch (err) {
    return res.json({
      state: 0,
      message: err.message || err,
      data: null,
    });
  }
}

function getVendorDetails(req, res) {
  if (!req.body.tokenFetchedData) {
    return res.json({
      state: 0,
      message: "User authorization failed",
      data: results,
    });
  }
  if (req.body.credential_id && Number(req.body.credential_id)) {
    var cid = req.body.tokenFetchedData.vendorcredentialid;
    if (cid == req.body.credential_id) {
      commonModel.mysqlModelService(
        "Call usp_get_vendor_details(?,?,?)",
        [req.body.credential_id, null, req.body.createdby],
        function (err, result) {
          if (err) {
            return res.json({
              state: -1,
              message: err,
              data: null,
            });
          } else {
            if (result && result[0] && result[0][0]) {
              if (result[0][0].state == 1) {
                req.body.tokenFetchedData.vendoruser_id = result[0][0].id;
                req.body.tokenFetchedData.vendoruser_name =
                  result[0][0].vendorname;
                req.body.tokenFetchedData.vendor_state =
                  result[0][0].vendorstate;
              }
              var token = jwt.sign(req.body.tokenFetchedData, config.jwtSecret);
              var finaldata = {
                state: result[0][0].state,
                user_id: result[0][0].id,
                name: result[0][0].vendorname,
                address: result[0][0].address,
                city: result[0][0].city,
                pincode: result[0][0].pincode,
                pan: result[0][0].pan,
                registrationno: result[0][0].registrationno,
                servicetaxrno: result[0][0].servicetaxrno,
                cstno: result[0][0].cstno,
                tin: result[0][0].tin,
                bankname: result[0][0].bankname,
                bankbranch: result[0][0].bankbranch,
                bankaccountno: result[0][0].bankaccountno,
                bankifsccode: result[0][0].bankifsccode,
                emailid: result[0][0].emailid,
                contactnumber: result[0][0].contactnumber,
                // skills: result[0][0].vendorskills && result[0][0].vendorskills.replace(/[\[\]']/g,''),
                skills: result[0][0].vendorskills,
                vendorstatus: result[0][0].vendorstatus,
                vendorstate: result[0][0].vendorstate,
                attachment: {
                  panfile: result[0][0].panfilepath,
                  registrationfile: result[0][0].registrationfilepath,
                  servicetaxfile: result[0][0].servicetaxfilepath,
                  cancelledchequefile: result[0][0].cancelledchequefilepath,
                  cstregistrationfile: result[0][0].cstregistrationfilepath,
                },
                levelonecomment: result[0][0].levelonecomment,
              };
              return res.json({
                state: 1,
                message: "Success",
                data: finaldata,
                token: token,
              });
            } else {
              return res.json({
                state: -1,
                message: "Data Lost",
                data: null,
              });
            }
          }
        }
      );
    } else {
      return res.json({
        state: 0,
        message: "User authorization failed",
        data: null,
      });
    }
  } else {
    return res.json({
      state: 0,
      message:
        "Please provide the credential id of vendor and credential id should be number",
      data: null,
    });
  }
}

function updateVendorDetails(req, res) {
  if (!req.body.tokenFetchedData) {
    return res.json({
      state: 0,
      message: "User authorization failed",
      data: null,
    });
  }
  if (!req.body.vendordata) {
    return res.json({
      state: -1,
      message: "Please provide complete details",
      data: null,
    });
  }
  var data = JSON.parse(req.body.vendordata);
  if (data.credential_id || data.user_id) {
    var cid = req.body.tokenFetchedData.vendorcredentialid;
    var uid = req.body.tokenFetchedData.vendoruser_id;
    if (data.credential_id) {
      if (!Number(data.credential_id)) {
        return res.json({
          state: -1,
          message: "Vendor credential id should ne number",
          data: null,
        });
      }
      if (!(cid == data.credential_id)) {
        return res.json({
          state: -1,
          message: "You are not authorized for this operation",
          data: null,
        });
      }
    } else if (data.user_id) {
      if (!Number(data.user_id)) {
        return res.json({
          state: -1,
          message: "Vendor user id should ne number",
          data: null,
        });
      }
      if (!(uid == data.user_id)) {
        return res.json({
          state: -1,
          message: "YYou are not authorized for this operation",
          data: null,
        });
      }
    }
    var fdata = {};
    var filenames = [
      "panfile",
      "registrationfile",
      "servicetaxfile",
      "cancelledchequefile",
      "cstregistrationfile",
    ];
    var filekeys = [
      "panpath",
      "regpath",
      "servicepath",
      "chequepath",
      "cstregpath",
    ];
    if (data.user_id) {
      fdata["userid"] = data.user_id;
    } else if (data.credential_id) {
      fdata["credentialid"] = data.credential_id;
    }
    if (data.name) {
      fdata["name"] = data.name;
    }
    if (data.address) {
      fdata["address"] = data.address;
    }
    if (data.city) {
      fdata["city"] = data.city;
    }
    if (data.pincode) {
      if (Number(data.pincode)) {
        fdata["pincode"] = data.pincode;
      } else {
        return res.json({
          state: -1,
          message: "Vendor pincode should ne number",
          data: null,
        });
      }
    }
    if (data.pan) {
      fdata["pan"] = data.pan;
    }
    if (data.registrationno) {
      fdata["registrationno"] = data.registrationno;
    }
    if (data.servicetaxrno) {
      fdata["servicetaxrno"] = data.servicetaxrno;
    }
    if (data.cstno) {
      fdata["cstno"] = data.cstno;
    }
    if (data.tin) {
      fdata["tin"] = data.tin;
    }
    if (data.bankname) {
      fdata["bankname"] = data.bankname;
    }
    if (data.bankbranch) {
      fdata["bankbranch"] = data.bankbranch;
    }
    if (data.bankaccountno) {
      fdata["bankaccountno"] = data.bankaccountno;
    }
    if (data.bankifsccode) {
      fdata["bankifsccode"] = data.bankifsccode;
    }
    if (data.emailid) {
      var emailregx =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if (data.emailid.match(emailregx)) {
        fdata["emailid"] = data.emailid;
      } else {
        return res.json({
          state: -1,
          message: "Vendor email id should be in proper format",
          data: null,
        });
      }
    }
    if (data.contactnumber) {
      fdata["contactnumber"] = data.contactnumber;
    }
    if (data.skills) {
      fdata["skills"] = data.skills;
    }
    if (data.submit) {
      if (
        data.name &&
        data.address &&
        data.city &&
        data.pincode &&
        data.pan &&
        data.servicetaxrno &&
        data.cstno &&
        data.bankname &&
        data.bankbranch &&
        data.bankaccountno &&
        data.bankifsccode &&
        data.emailid &&
        data.contactnumber &&
        data.skills
      ) {
        fdata["submit"] = data.submit;
      } else {
        return res.json({
          state: -1,
          message: "For submission you have to give complete data of vendor",
          data: null,
        });
      }
    }
    var checkdir2 = path.join(appRoot.path, "uploads/vendor/documents");
    var checkdir1 = path.join(appRoot.path, "uploads/vendor");
    if (!fs.existsSync(checkdir1)) {
      fs.mkdirSync(checkdir1);
    }
    if (!fs.existsSync(checkdir2)) {
      fs.mkdirSync(checkdir2);
    }
    async.times(
      5,
      function (n, next) {
        if (req.body.attachCount && req.body.attachCount != "0") {
          var sampleFile = {};
          sampleFile = req.files["file[" + filenames[n] + "]"];
          var uploadPath = path.join(
            appRoot.path,
            "uploads/vendor/documents",
            cid.toString()
          );

          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
          }
          if (sampleFile) {
            let filepath = path.join(uploadPath, sampleFile["name"]);
            sampleFile.mv(filepath, (err) => {
              if (!err) {
                fdata[filekeys[n]] = path.join(
                  "vendor/documents",
                  cid.toString(),
                  sampleFile["name"]
                );
              }
              next(null, "success");
            });
          } else {
            next(null, "success");
          }
        } else {
          next(null, "success");
        }
      },
      function (err, files) {
        if (err) {
          //console.log(err);
        } else {
          var obj = JSON.stringify(fdata);
          commonModel.mysqlModelService(
            "call usp_update_vendordetails(?)",
            [obj],
            function (err, result) {
              if (err) {
                return res.json({
                  state: -1,
                  message: err,
                  data: null,
                });
              } else {
                if (result && result[0] && result[0][0]) {
                  if (result[0][0].id) {
                    req.body.tokenFetchedData.vendoruser_id = result[0][0].id;
                    req.body.tokenFetchedData.vendoruser_name =
                      result[0][0].vendorname;
                    req.body.tokenFetchedData.vendor_state =
                      result[0][0].vendorstate;
                  }
                  var token = jwt.sign(
                    req.body.tokenFetchedData,
                    config.jwtSecret
                  );
                  var finaldata = {
                    state: result[0][0].status,
                    message: result[0][0].message,
                    user_id: result[0][0].id,
                    name: result[0][0].vendorname,
                    address: result[0][0].address,
                    city: result[0][0].city,
                    pincode: result[0][0].pincode,
                    pan: result[0][0].pan,
                    registrationno: result[0][0].registrationno,
                    servicetaxrno: result[0][0].servicetaxrno,
                    cstno: result[0][0].cstno,
                    tin: result[0][0].tin,
                    bankname: result[0][0].bankname,
                    bankbranch: result[0][0].bankbranch,
                    bankaccountno: result[0][0].bankaccountno,
                    bankifsccode: result[0][0].bankifsccode,
                    emailid: result[0][0].emailid,
                    contactnumber: result[0][0].contactnumber,
                    skills: result[0][0].vendorskills,
                    vendorstate: result[0][0].vendorstate,
                    attachment: {
                      panfile: result[0][0].panfilepath,
                      registrationfile: result[0][0].registrationfilepath,
                      servicetaxfile: result[0][0].servicetaxfilepath,
                      cancelledchequefile: result[0][0].cancelledchequefilepath,
                      cstregistrationfile: result[0][0].cstregistrationfilepath,
                    },
                  };
                  return res.json({
                    state: result[0][0].status,
                    message: result[0][0].message,
                    data: finaldata,
                    token: token,
                  });
                } else {
                  return res.json({
                    state: -1,
                    message: "Something Went Wrong",
                    data: null,
                  });
                }
              }
            }
          );
        }
      }
    );
  } else {
    return res.json({
      state: -1,
      message: "Please provide the vendor credential id or user id",
      data: null,
    });
  }
}

function getVendorData(req, res) {
  if (!req.body.tokenFetchedData) {
    return res.json({
      state: 0,
      message: "User authorization failed",
      data: null,
    });
  }
  var body = req.body;
  body.createdby = req.body.tokenFetchedData.id;
  var obj = JSON.stringify(body);

  commonModel.mysqlModelService(
    "call usp_vendor_view(?)",
    [obj],
    function (err, results) {
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
          data: results,
        });
      }
    }
  );
}

function getVendorJD(req, res) {
  var body = req.body;
  body.createdby = req.body.tokenFetchedData.vendorcredentialid;
  body.id = req.body.tokenFetchedData.vendorcredentialid;
  body.reqtype = "jobopening";
  var obj = JSON.stringify(body);

  commonModel.mysqlModelService(
    "call usp_vendor_view(?)",
    [obj],
    function (err, results) {
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
          data: results,
        });
      }
    }
  );
}

function approvalAction(req, res) {
  let body = req.body;
  body.createdby = req.body.tokenFetchedData.id;
  // if (!body.countryid && !body.locationid && !body.businessunitid && !body.workforceid) {
  //     return res.json({
  //         "state": -1,
  //         "message": 'Country,Location, BU And Workforce Required for this action!',
  //         "data": null
  //     });
  // }
  var obj = JSON.stringify(body);
  commonModel.mysqlModelService(
    "call usp_vendor_view(?)",
    [obj],
    async (err, results) => {
      // let dbres = results && results[0] && results[0][0];
      if (err) {
        return res.json({
          state: -1,
          message: err,
          data: null,
        });
      } else {
        // if (dbres.state >0 && body.countryid && body.locationid && body.businessunitid && body.workforceid) {
        //     //console.log('Adding Data For Mapping')
        //     body.configcode = 'approvedvendor';
        //     body.mapaction = dbres.message;
        //     body.id = dbres.state
        //     await commonModel.mysqlPromiseModelService('call usp_rms_mapping_operations(?)', [JSON.stringify(body)]);
        // }
        return res.json({
          state: 1,
          message: "Success",
          data: results,
        });
      }
    }
  );
}
//upload vendor

function rmsUploadVendor(req, res) {
  if (!req.body || !req.body.tokenFetchedData) {
    return res.json({
      state: -1,
      message: "User authorization failed",
      data: null,
    });
  }
  var checkdir1 = path.join(appRoot.path, "uploads/vendor");
  var checkdir2 = path.join(appRoot.path, "uploads/vendor/resumes");
  if (!fs.existsSync(checkdir1)) {
    fs.mkdirSync(checkdir1);
  }
  if (!fs.existsSync(checkdir2)) {
    fs.mkdirSync(checkdir2);
  }
  var credentialid =
    req.body.tokenFetchedData && req.body.tokenFetchedData.vendorcredentialid;
  let sampleFile;
  let uploadPath;
  sampleFile = req.files.file;
  uploadPath = path.join(
    appRoot.path,
    "uploads/vendor/resumes",
    credentialid.toString()
  );
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
  }
  if (sampleFile) {
    let filepath = path.join(uploadPath, sampleFile["name"]);
    sampleFile.mv(filepath, (err) => {
      if (!err) {
        var uploadedData = {
          filename: sampleFile.name,
          uploadedpath: filepath,
        };
        parseData(uploadedData, credentialid, req.body.sourceId, null)
          .then((result) => {
            return res.json({
              state: 1,
              message: "Success",
              data: JSON.parse(result.result),
            });
          })
          .catch((e) => {
            return res.json({
              state: -1,
              message: e.reason || "Error in uploading File",
              data: null,
            });
          });
      } else {
        res.json({
          state: -1,
          message: err.message || "Error in uploading File",
        });
      }
    });
  } else {
    return res.json({
      state: -1,
      message:
        "Invalid file format.The allowed format is pdf,zip,doc,docx,rtf.",
      data: null,
    });
  }
}

function regCheck(text, cb) {
  var textLowerCase = text
    .toLowerCase()
    .replace(/,/g, " ")
    .replace(/-/g, " ")
    .replace(/:/g, " ")
    .replace(/\n/g, " ")
    .replace(/\./g, " ");
  textLowerCase = textLowerCase.replace(/ +/g, " ").replace(/\+/g, "");
  text = text
    .replace(/:/g, " ")
    .replace(/-/g, " ")
    .replace(/,/g, " ")
    .replace(/ +/g, " ")
    .replace(/\+/g, "");
  var textarr = text.split("\n");
  textarr.forEach(function (element, index) {
    textarr[index] = element.concat(" EOL");
  });
  cb(textarr, textLowerCase);
}

function getParsedData(req, res) {
  var obj = JSON.stringify({
    createdby: req.body.tokenFetchedData.vendorcredentialid,
    populate: req.body.populate || 0,
    id: req.body.id,
  });
  commonModel.mysqlModelService(
    "call usp_rmstempcandidate_view(?)",
    [obj],
    function (err, results) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
          data: null,
        });
      }
      //var successData=_.where(results[0], {uploadstate: "success"});
      var successData = _.filter(results[0], (item) => {
        return item.uploadstate == "success" && !item.referredby;
      });
      var failureData = _.where(results[0], {
        uploadstate: "failure",
      });
      var referredData = _.filter(results[0], (item) => {
        return item.referredby;
      });
      return res.json({
        state: 1,
        message: "Success",
        data: {
          success: successData,
          failure: failureData,
          referred: referredData,
        },
      });
    }
  );
}

function downloadResumeFile(req, res) {
  var body = req.body;
  var file = path.join(appRoot.path, "uploads", body.url);
  var filename = path.basename(file);
  var type = mime.lookup(file);
  return fsAsync
    .readFileAsync(file)
    .then(function (result) {
      return res.json({
        state: 1,
        message: "success",
        data: result,
        filename: filename,
        type: type,
      });
    })
    .catch(function (e) {
      return res.json({
        state: -1,
        message: e,
        data: null,
        filename: filename,
        type: type,
      });
      //res.ok({ msg: 'failed', error: e, filename: filename, filetype: type });
    });
}

function addCandidateVendor(req, res) {
  var body = req.body;
  body.createdby = body.tokenFetchedData.vendorcredentialid;
  body.skills = body.skillText && body.skillText.toString();
  body.qualification = body.qualification && body.qualification.toString();
  body.institutes = body.institutes && body.institutes.toString();
  body.type = "getExperienceMasterData";
  body.isactive = 1;
  body.requisitionid = body.requisitionid;

  var obj = JSON.stringify(body);
  commonModel.mysqlModelService(
    "call usp_getexternalmaster_data(?)",
    [obj],
    function (err, result) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
          data: null,
        });
      } else {
        var experienceFromDb;
        experienceFromDb = result;

        var rankingParameters = uploadCtrl.getCandidateRanking(
          body,
          experienceFromDb
        );

        body.skills = body.skills ? body.skills.toString() : "";
        body.qualification = body.qualification
          ? body.qualification.toString()
          : "";
        body.dmltype = req.body.id ? "U" : undefined;
        body.ranking = rankingParameters.ranking || 0;
        body.tenthScore = rankingParameters.tenthScore || 0;
        body.twelfthScore = rankingParameters.twelfthScore || 0;
        body.highestDegreeScore = rankingParameters.highestDegreeScore || 0;
        body.yearsWithCompanyScore =
          rankingParameters.yearsWithCompanyScore || 0;
        body.collegeTierScore = rankingParameters.collegeTierScore || 0;
        body.experienceScore = rankingParameters.experienceScore || 0;
        body.skillsScore = rankingParameters.skillsScore || 0;
        body.ctcExpectationScore = rankingParameters.ctcExpectationScore || 0;
        body.uploadstatus = rankingParameters.uploadstatus;
        body.uploadreason = rankingParameters.uploadreason;

        var data = body;
        // data.reqtype = req.body.id ? 'edit' : 'add'
        var obj = JSON.stringify(data);

        commonModel
          .mysqlPromiseModelService("call usp_rms_resume_duplicacy(?)", [obj])
          .then((results) => {
            let duplicayResults = JSON.parse(
              JSON.stringify(results && results[0] && results[0][0])
            );
            let oldText = JSON.stringify(body.Resume);
            body.isResumeMatched = duplicayResults.isDuplicate;
            //console.log(results, "---------duplcate resulttttt------");
            if (duplicayResults.isDuplicate == 0) {
              let bestMatch = 0.9;
              let tempCandidateIndex = null;
              let rmsCandidateIndex = null;
              if (results && results[1] && results[1].length > 0) {
                results[1].forEach((data, index) => {
                  // //console.log(oldText,data.parsedJsonData, "dataaaa");
                  let compareResult = stringSimilarity.compareTwoStrings(
                    oldText,
                    data.parsedJsonData || ""
                  );
                  if (compareResult > bestMatch) {
                    bestMatch = compareResult;
                    tempCandidateIndex = index;
                  }
                  //console.log(compareResult, "compareResultt11------");
                });
              }

              if (results && results[2] && results[2].length > 0) {
                results[2].forEach((data, index) => {
                  // //console.log(text,data.parsedJsonData, "dataaaa2-----------======");
                  let compareResult = stringSimilarity.compareTwoStrings(
                    oldText,
                    data.parsedJsonData || ""
                  );
                  if (compareResult > bestMatch) {
                    bestMatch = compareResult;
                    rmsCandidateIndex = index;
                    tempCandidateIndex = null;
                  }
                  //console.log(compareResult, "compareResultt 22------");
                });
              }

              if (bestMatch > 0.9) {
                // duplicateData.isDuplicate = true;
                body.matchflag = 1;
                body.resumeMatchingPercentage = bestMatch * 100;
                if (tempCandidateIndex != null) {
                  body.tempCandidateId = results[1][tempCandidateIndex].id;
                  body.resumeMatchingPath =
                    results[1][tempCandidateIndex].filepath;
                } else {
                  body.rmsCandidateId = results[2][rmsCandidateIndex].id;
                  body.resumeMatchingPath =
                    results[2][rmsCandidateIndex].filepath;
                }
              }
              //console.log(bestMatch, "Matchingg--------");
            } else {
              body.matchflag = 0;
            }

            let finalObj = JSON.stringify(body);
            //console.log(finalObj, "------------finalObj-----------");
            commonModel.mysqlModelService(
              "call usp_vendorcandidate_add(?)",
              [finalObj],
              function (err, results) {
                //console.log(
                // "let final insertion candidate vendor results---------",
                //  err,
                //  results
                // );
                if (err) {
                  return res.json({
                    state: -1,
                    message: err,
                    data: null,
                  });
                } else {
                  results.pop();
                  let responseData = results.pop();
                  for (let i = 0; i < results.length; i++) {
                    rdb.setCandidate(
                      "candidates",
                      results[i][0].id,
                      JSON.stringify(results[i][0])
                    );
                  }
                  return res.json({
                    state: 1,
                    message: "success",
                    data: [responseData],
                  });
                }
              }
            );
          });
      }
    }
  );
}

function getVendorRequisition(req, res) {
  var obj = JSON.stringify({
    reqtype: "tagged",
    reqid: req.body.reqid,
    createdby: req.body.tokenFetchedData.vendorcredentialid,
  });
  commonModel.mysqlModelService(
    "call usp_vendor_view(?)",
    [obj],
    function (err, results) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
          data: null,
        });
      } else {
        return res.json({
          state: 1,
          message: "success",
          data: results,
        });
      }
    }
  );
}

function getCandidateOnBoardData(req, res) {
  var obj = JSON.stringify({
    reqtype: "onboard",
    createdby: req.body.tokenFetchedData.vendorcredentialid,
    id: req.body.tokenFetchedData.vendorcredentialid,
  });
  commonModel.mysqlModelService(
    "call usp_vendor_view(?)",
    [obj],
    function (err, results) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
          data: null,
        });
      } else {
        _.map(results[0], (item) => {
          item.resumesource = item.resumesource.toString();
        });
        return res.json({
          state: 1,
          message: "success",
          data: results,
        });
      }
    }
  );
}
// view requisition details
function getVendorRequisitionDetails(req, res) {
  var obj = JSON.stringify({
    reqtype: "requisition",
    createdby: req.body.tokenFetchedData.vendorcredentialid,
    reqid: req.body.requisitionid,
  });
  commonModel.mysqlModelService(
    "call usp_vendor_view(?)",
    [obj],
    function (err, results) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
          data: null,
        });
      } else {
        return res.json({
          state: 1,
          message: "success",
          data: results,
        });
      }
    }
  );
}

// view getVendorCandidateDetails
function getVendorCandidateDetails(req, res) {
  var obj = JSON.stringify({
    reqtype: "candidatedetail",
    populate: 0,
    createdby: req.body.tokenFetchedData.vendorcredentialid,
    id: req.body.candidateid,
    email: req.body.email,
  });
  commonModel.mysqlModelService(
    "call usp_vendor_view(?)",
    [obj],
    function (err, results) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
          data: null,
        });
      } else {
        return res.json({
          state: 1,
          message: "success",
          data: results,
        });
      }
    }
  );
}

/*--------------------------------------------------------------------------------------*/
/*------------------------End RecruitmentVendorController-----------------------------*/
/*--------------------------------------------------------------------------------------*/

// Migration not possible
function parseData(uploadedData, currentUser, resumesource, referredby) {
  return new Promise((resolve, reject) => {
    var skillsIdfromdbSess = [],
      skillsfromdbSess = [],
      locationsess = [],
      locationIdSess = [],
      instititueIdfromdbSess = [],
      institituefromdb = [],
      institituefromdbSess = [],
      skillsfromdb = [],
      skillsIdfromdb = [],
      institituefromdb = [],
      instititueIdfromdb = [],
      location = [],
      locationId = [],
      instititueNamefromdb = [],
      nameExclusions = [],
      nameArrForFile = [],
      result = ["", "", "", "", "", ""],
      extSupported = ["pdf", "doc", "docx", "rtf"],
      mineSupported = [
        "text/rtf",
        "application/rtf",
        "application/x-rtf",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      dataTrack = [],
      qualificationFromDb = [],
      qualificationIdFromDb = [];
    var obj = JSON.stringify({
      configcode: "technology,location,rmsJobType,rmsInstitute,qualification",
      createdby: currentUser,
    });
    commonModel.mysqlModelService(
      "call usp_get_vendor_master(?)",
      ["technology,location,rmsJobType,rmsInstitute,qualification"],
      function (err, results) {
        if (err) {
          reject({
            msg: "failure",
            reason: err,
          });
        }
        for (var i = 0; i < results[0].length; i++) {
          if (results[0][i].configcode === "technology") {
            skillsfromdb.push(results[0][i].configvalue1);
            skillsIdfromdb.push(results[0][i].id);
          }
          if (results[0][i].configcode === "location") {
            location.push(results[0][i].configvalue1);
            locationId.push(results[0][i].id);
          }
          if (results[0][i].configcode === "rmsInstitue") {
            institituefromdb.push(results[0][i].configvalue1);
            instititueIdfromdb.push(results[0][i].id);
          }
          if (results[0][i].configcode === "qualification") {
            qualificationFromDb.push(results[0][i].configvalue1);
            qualificationIdFromDb.push(results[0][i].id);
          }
        }
        var totalVal = {
          skillsfromdb: skillsfromdb,
          skillsIdfromdb: skillsIdfromdb,
          location: location,
          locationId: locationId,
          institituefromdb: institituefromdb,
          instititueIdfromdb: instititueIdfromdb,
          qualificationFromDb: qualificationFromDb,
          qualificationIdFromDb: qualificationIdFromDb,
        };
        /*************part 2*/
        var flag = true;
        var now = Date.now();
        if (uploadedData != undefined) {
          var name = "",
            emailId = "",
            phoneno = "",
            flag = true,
            skills = "",
            fname = uploadedData.filename,
            exet = fname.split("."),
            exe = exet[exet.length - 1],
            ffname = exet[0] + "_" + now,
            newpath = uploadedData.uploadedpath;
          var splitpath = newpath.split("uploads");
          var sPath = splitpath[splitpath.length - 1];
          if (extSupported.indexOf(exe.toLowerCase()) > -1) {
            var result = mime.lookup(newpath);
            if (mineSupported.indexOf(result) > -1) {
              textract.fromFileWithPath(
                newpath,
                textractConfig,
                function (error, text) {
                  if (error) {
                    var error = dataTrack.push({
                      filename: fname,
                      filepath: sPath,
                      uploadstate: "failure",
                      uploadreason: "file cannot be parsed",
                      candidatename: "",
                      email: "",
                      phone: "",
                      skills: "",
                      permanentaddress: "",
                      qualification: "",
                      location: "",
                      years: "",
                      months: "",
                      institutes: "",
                      organization: "",
                      createdby: currentUser || 0,
                      resumesource: resumesource,
                      //referredby: referredby || undefined
                    });
                    var obj = JSON.stringify(dataTrack);
                    reject({
                      msg: "failure",
                      reason: "file cannot be parsed",
                      result: obj,
                    });
                  } else if (typeof text != undefined) {
                    regCheck(text, function (textarr, textLowerCase) {
                      parserService
                        .parseAllHr(
                          text,
                          textLowerCase,
                          textarr,
                          "uploads/" + fname,
                          [],
                          totalVal
                        )
                        .then((result) => {
                          dataTrack.push({
                            filename: fname,
                            filepath: sPath,
                            uploadstate: "success",
                            uploadreason: "",
                            candidatename: result.name,
                            email: result.email,
                            phone: result.phone,
                            skills: result.skillarrId,
                            permanentaddress: result.permanentAddress,
                            qualification: result.Qualification,
                            location: result.currentlocation,
                            years: result.years,
                            months: result.months,
                            institutes: result.instititutes,
                            organization: "",
                            createdby: currentUser || 0,
                            resumesource: resumesource,
                            Resume:
                              text && text.toLowerCase().replace(/\n/g, " "),
                            //referredby: referredby || undefined
                          });

                          var request = JSON.stringify({
                            reqtype: "existingcandidate",
                            createdby: currentUser,
                          });
                          commonModel.mysqlModelService(
                            "call usp_vendor_view(?)",
                            [request],
                            function (err, results) {
                              let newdataTrack = _.map(
                                dataTrack,
                                function (item) {
                                  try {
                                    if (!item.email) {
                                      item.uploadstate = "success";
                                    } else if (
                                      (results[0][0].email &&
                                        results[0][0].email.indexOf(
                                          item.email
                                        ) > -1) ||
                                      (results[0][0].phone &&
                                        results[0][0].phone.indexOf(
                                          item.phone
                                        ) > -1)
                                    ) {
                                      item.uploadstate = "failure";

                                      item.uploadreason =
                                        "Candidate already exist";
                                    } else {
                                      item.uploadstate = "success";
                                    }
                                    return item;
                                  } catch (error) {
                                    item.uploadstate = "failure";
                                    item.uploadreason = "File cannot be parsed";
                                    return item;
                                  }
                                }
                              );
                              var obj = JSON.stringify(newdataTrack);
                              if (
                                newdataTrack &&
                                newdataTrack[0].uploadstate == "success"
                              ) {
                                resolve({
                                  msg: "success",
                                  result: obj,
                                });
                              } else {
                                reject({
                                  msg: "failure",
                                  reason:
                                    (newdataTrack &&
                                      newdataTrack[0].uploadreason) ||
                                    "File cannot be parsed",
                                  result: obj,
                                });
                              }
                            }
                          );
                        })
                        .catch((error) => {
                          dataTrack.push({
                            filename: fname,
                            filepath: sPath,
                            uploadstate: "failure",
                            uploadreason: "file cannot be parsed",
                            candidatename: "",
                            email: "",
                            phone: "",
                            skills: "",
                            permanentaddress: "",
                            qualification: "",
                            location: "",
                            years: "",
                            months: "",
                            institutes: "",
                            organization: "",
                            createdby: currentUser || 0,
                            resumesource: resumesource,
                            //referredby: referredby || undefined
                          });
                          var obj = JSON.stringify(dataTrack);
                          reject({
                            msg: "failure",
                            reason: "file cannot be parsed",
                            result: obj,
                          });
                        });
                    });
                  } else {
                    dataTrack.push({
                      filename: fname,
                      filepath: sPath,
                      uploadstate: "failure",
                      uploadreason: "file cannot be parsed",
                      candidatename: "",
                      email: "",
                      phone: "",
                      skills: "",
                      permanentaddress: "",
                      qualification: "",
                      location: "",
                      years: "",
                      months: "",
                      institutes: "",
                      organization: "",
                      createdby: currentUser || 0,
                      resumesource: resumesource,
                      //referredby: referredby || undefined
                    });
                    var obj = JSON.stringify(dataTrack);
                    reject({
                      msg: "failure",
                      reason: "file cannot be parsed",
                      result: obj,
                    });
                  }
                }
              );
            } else {
              dataTrack.push({
                filename: fname,
                filepath: sPath,
                uploadstate: "failure",
                uploadreason:
                  "Invalid file format.The allowed format is pdf,zip,doc,docx,rtf.",
                candidatename: "",
                email: "",
                phone: "",
                skills: "",
                permanentaddress: "",
                qualification: "",
                location: "",
                years: "",
                months: "",
                institutes: "",
                organization: "",
                createdby: currentUser || 0,
                resumesource: resumesource,
                //referredby: referredby || undefined
              });
              var obj = JSON.stringify(dataTrack);
              reject({
                msg: "failure",
                reason: "file can't parse",
                result: obj,
              });
            }
          } else if (exe.toLowerCase() == "zip") {
            var start = new Date().getTime();
            var folderpath = path.join(__dirname, "../../uploads/" + ffname);
            //var foldername = exet[0] + '_' + now;
            var zip = new AdmZip(newpath);
            zip.extractAllTo(folderpath, false);
            var zipEntries = zip.getEntries();
            var textLowerCase = "";
            var count = 1;
            async.each(
              zipEntries,
              function (zipEntry, callback) {
                var namefile = zipEntry["name"],
                  entryName = zipEntry["entryName"],
                  isDirectory = zipEntry["isDirectory"];
                var namearr = namefile.split(".");
                var now = Date.now();
                var exe = namearr[namearr.length - 1].toLowerCase();
                var newpath = folderpath + "/" + entryName;
                var splitPath = newpath.split("uploads");
                var sharePath = splitPath[splitPath.length - 1];
                if (!isDirectory) {
                  if (extSupported.indexOf(exe.toLowerCase()) > -1) {
                    var result = mime.lookup(newpath);
                    if (mineSupported.indexOf(result) > -1) {
                      textract.fromFileWithPath(
                        newpath,
                        textractConfig,
                        function (error, text) {
                          if (error) {
                            dataTrack.push({
                              filename: namefile,
                              filepath: sharePath,
                              uploadstate: "failure",
                              uploadreason: "file cannot process",
                              candidatename: "",
                              email: "",
                              phone: "",
                              skills: "",
                              permanentaddress: "",
                              qualification: "",
                              location: "",
                              years: "",
                              months: "",
                              institutes: "",
                              organization: "",
                              createdby: currentUser || 0,
                              resumesource: resumesource,
                              //referredby: referredby || undefined
                            });
                            callback();
                          } else if (typeof text != undefined) {
                            regCheck(text, function (textarr, textLowerCase) {
                              parserService
                                .parseAllHr(
                                  text,
                                  textLowerCase,
                                  textarr,
                                  newpath,
                                  [],
                                  totalVal
                                )
                                .then((result) => {
                                  dataTrack.push({
                                    filename: namefile,
                                    filepath: sharePath,
                                    uploadstate: "success",
                                    uploadreason: "",
                                    candidatename: result.name,
                                    email: result.email,
                                    phone: result.phone,
                                    skills: result.skillarrId,
                                    permanentaddress: result.permanentAddress,
                                    qualification: result.Qualification,
                                    location: result.currentlocation,
                                    years: result.years,
                                    months: result.months,
                                    institutes: result.instititutes,
                                    organization: "",
                                    createdby: currentUser || 0,
                                    resumesource: resumesource,
                                    Resume:
                                      text &&
                                      text.toLowerCase().replace(/\n/g, " "),
                                    //referredby: referredby || undefined
                                  });
                                  callback();
                                })
                                .catch((error) => {
                                  //console.332log('File cannot process:',namefile,'Error:',error);
                                  dataTrack.push({
                                    filename: namefile,
                                    filepath: sharePath,
                                    uploadstate: "failure",
                                    uploadreason: "file cannot process",
                                    candidatename: "",
                                    email: "",
                                    phone: "",
                                    skills: "",
                                    permanentaddress: "",
                                    qualification: "",
                                    location: "",
                                    years: "",
                                    months: "",
                                    institutes: "",
                                    organization: "",
                                    createdby: currentUser || 0,
                                    resumesource: resumesource,
                                    //referredby: referredby || undefined
                                  });
                                  callback();
                                });
                            });
                          } else {
                            dataTrack.push({
                              filename: namefile,
                              filepath: sharePath,
                              uploadstate: "failure",
                              uploadreason: "file cannot be parsed",
                              candidatename: "",
                              email: "",
                              phone: "",
                              skills: "",
                              permanentaddress: "",
                              qualification: "",
                              location: "",
                              years: "",
                              months: "",
                              institutes: "",
                              organization: "",
                              createdby: currentUser || 0,
                              resumesource: resumesource,
                              //referredby: referredby || undefined
                            });
                            callback();
                          }
                        }
                      );
                    } else {
                      dataTrack.push({
                        filename: namefile,
                        filepath: sharePath,
                        uploadstate: "failure",
                        uploadreason:
                          "Invalid file format.The allowed format is pdf,zip,doc,docx,rtf.",
                        candidatename: "",
                        email: "",
                        phone: "",
                        skills: "",
                        permanentaddress: "",
                        qualification: "",
                        location: "",
                        years: "",
                        months: "",
                        institutes: "",
                        organization: "",
                        createdby: currentUser || 0,
                        resumesource: resumesource,
                        //referredby: referredby || undefined
                      });
                      callback();
                    }
                  } else {
                    dataTrack.push({
                      filename: namefile,
                      filepath: sharePath,
                      uploadstate: "failure",
                      uploadreason:
                        "Invalid file format.The allowed format is pdf,zip,doc,docx,rtf.",
                      candidatename: "",
                      email: "",
                      phone: "",
                      skills: "",
                      permanentaddress: "",
                      qualification: "",
                      location: "",
                      years: "",
                      months: "",
                      institutes: "",
                      organization: "",
                      createdby: currentUser || 0,
                      resumesource: resumesource,
                      //referredby: referredby || undefined
                    });
                    callback();
                  }
                } else {
                  callback();
                }
              },
              function (err) {
                if (err) {
                  reject({
                    msg: "failure",
                    reason: err,
                  });
                } else {
                  var end = new Date().getTime();
                  var time = end - start;
                  var request = JSON.stringify({
                    reqtype: "existingcandidate",
                    createdby: currentUser,
                  });
                  commonModel.mysqlModelService(
                    "call usp_vendor_view(?)",
                    [request],
                    function (err, results) {
                      _.map(dataTrack, function (item) {
                        try {
                          if (!item.email) {
                            item.uploadstate = "success";
                          } else if (
                            (results[0][0].email &&
                              results[0][0].email.indexOf(item.email) > -1) ||
                            (results[0][0].phone &&
                              results[0][0].phone.indexOf(item.phone) > -1)
                          ) {
                            item.uploadstate = "failure";
                            item.uploadreason = "Candidate already exist";
                          } else {
                            item.uploadstate = "success";
                          }
                        } catch (error) {
                          item.uploadstate = "failure";
                          item.uploadreason = "File cannot be parsed";
                        }
                      });
                      var obj = JSON.stringify(dataTrack);
                      resolve({
                        msg: "success",
                        result: obj,
                      });
                    }
                  );

                  // var obj = JSON.stringify(dataTrack);
                  // resolve({msg: 'success', result: obj});
                }
              }
            );
          } else {
            reject({
              msg: "failure",
              reason:
                "Invalid file format.The allowed format is pdf,zip,doc,docx,rtf.",
            });
          }
        }
      }
    );
  });
}

// Migration not possible

/*--------------------------------------------------------------------------------------*/
/*--------------------------------Start BGVVendorController-----------------------------*/
/*--------------------------------------------------------------------------------------*/

function getBgvVendorDetails(req, res) {
  if (!req.body.tokenFetchedData) {
    return res.json({
      state: -1,
      message: "User authorization failed",
      data: null,
    });
  }
  if (req.body.credential_id && Number(req.body.credential_id)) {
    var cid = req.body.tokenFetchedData.vendorcredentialid;
    if (cid == req.body.credential_id) {
      commonModel.mysqlModelService(
        "Call usp_get_vendor_details(?,?,?)",
        [req.body.credential_id, null, req.body.createdby],
        function (err, result) {
          if (err) {
            return res.json({
              state: -1,
              message: err,
              data: null,
            });
          } else {
            if (result && result[0] && result[0][0]) {
              if (result[0][0].state == 1) {
                req.body.tokenFetchedData.vendoruser_id = result[0][0].id;
                req.body.tokenFetchedData.vendoruser_name =
                  result[0][0].vendorname;
                req.body.tokenFetchedData.vendor_state =
                  result[0][0].vendorstate;
              }
              var token = jwt.sign(req.body.tokenFetchedData, config.jwtSecret);
              var finaldata = {
                state: result[0][0].state,
                user_id: result[0][0].id,
                name: result[0][0].vendorname,
                address: result[0][0].address,
                city: result[0][0].city,
                pincode: result[0][0].pincode,
                pan: result[0][0].pan,
                registrationno: result[0][0].registrationno,
                servicetaxrno: result[0][0].servicetaxrno,
                cstno: result[0][0].cstno,
                tin: result[0][0].tin,
                bankname: result[0][0].bankname,
                bankbranch: result[0][0].bankbranch,
                bankaccountno: result[0][0].bankaccountno,
                bankifsccode: result[0][0].bankifsccode,
                emailid: result[0][0].emailid,
                contactnumber: result[0][0].contactnumber,
                skills: result[0][0].vendorskills,
                vendorstate: result[0][0].vendorstate,
                vendorstatus: result[0][0].vendorstatus,
                attachment: {
                  panfile: result[0][0].panfilepath,
                  registrationfile: result[0][0].registrationfilepath,
                  servicetaxfile: result[0][0].servicetaxfilepath,
                  cancelledchequefile: result[0][0].cancelledchequefilepath,
                  cstregistrationfile: result[0][0].cstregistrationfilepath,
                },
                levelonecomment: result[0][0].levelonecomment,
              };
              return res.json({
                state: 1,
                message: "Success",
                data: finaldata,
                token: token,
              });
            } else {
              return res.json({
                state: -1,
                message: "Data lost",
                data: null,
              });
            }
          }
        }
      );
    } else {
      return res.json({
        state: -1,
        message: "User not authorized for this process",
        data: null,
      });
    }
  } else {
    return res.json({
      state: -1,
      message:
        "Please provide the credential id of vendor and credential id should be number",
      data: null,
    });
  }
}

function updateBgvVendorDetails(req, res) {
  if (!req.body.tokenFetchedData) {
    return res.json({
      state: -1,
      message: "User authorization failed",
      data: null,
    });
  }
  if (!req.body.vendordata) {
    return res.json({
      state: -1,
      message: "Please provide complete details.",
      data: null,
    });
  }
  var data = JSON.parse(req.body.vendordata);
  if (data.credential_id || data.user_id) {
    var cid = req.body.tokenFetchedData.vendorcredentialid;
    var uid = req.body.tokenFetchedData.vendoruser_id;
    if (data.credential_id) {
      if (!Number(data.credential_id)) {
        return res.json({
          state: -1,
          message: "Vendor credential id should ne number",
          data: null,
        });
      }
      if (!(cid == data.credential_id)) {
        return res.json({
          state: -1,
          message: "You are not authorized for this operation",
          data: null,
        });
      }
    } else if (data.user_id) {
      if (!Number(data.user_id)) {
        return res.json({
          state: -1,
          message: "Vendor user id should ne number",
          data: null,
        });
      }
      if (!(uid == data.user_id)) {
        return res.json({
          state: -1,
          message: "You are not authorized for this operation",
          data: null,
        });
      }
    }
    var fdata = {};
    var filenames = [
      "panfile",
      "registrationfile",
      "servicetaxfile",
      "cancelledchequefile",
      "cstregistrationfile",
    ];
    var filekeys = [
      "panpath",
      "regpath",
      "servicepath",
      "chequepath",
      "cstregpath",
    ];
    if (data.user_id) {
      fdata["userid"] = data.user_id;
    } else if (data.credential_id) {
      fdata["credentialid"] = data.credential_id;
    }
    if (data.name) {
      fdata["name"] = data.name;
    }
    if (data.address) {
      fdata["address"] = data.address;
    }
    if (data.city) {
      fdata["city"] = data.city;
    }
    if (data.pincode) {
      if (Number(data.pincode)) {
        fdata["pincode"] = data.pincode;
      } else {
        return res.json({
          state: -1,
          message: "Vendor pincode should ne number",
          data: null,
        });
      }
    }
    if (data.pan) {
      fdata["pan"] = data.pan;
    }
    if (data.registrationno) {
      fdata["registrationno"] = data.registrationno;
    }
    if (data.servicetaxrno) {
      fdata["servicetaxrno"] = data.servicetaxrno;
    }
    if (data.cstno) {
      fdata["cstno"] = data.cstno;
    }
    if (data.tin) {
      fdata["tin"] = data.tin;
    }
    if (data.bankname) {
      fdata["bankname"] = data.bankname;
    }
    if (data.bankbranch) {
      fdata["bankbranch"] = data.bankbranch;
    }
    if (data.bankaccountno) {
      fdata["bankaccountno"] = data.bankaccountno;
    }
    if (data.bankifsccode) {
      fdata["bankifsccode"] = data.bankifsccode;
    }
    if (data.emailid) {
      var emailregx =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if (data.emailid.match(emailregx)) {
        fdata["emailid"] = data.emailid;
      } else {
        return res.json({
          state: -1,
          message: "Vendor email id should be in proper format",
          data: null,
        });
      }
    }
    if (data.contactnumber) {
      fdata["contactnumber"] = data.contactnumber;
    }
    if (data.skills) {
      fdata["skills"] = data.skills;
    }
    if (data.submit) {
      if (
        data.name &&
        data.address &&
        data.city &&
        data.pincode &&
        data.pan &&
        data.servicetaxrno &&
        data.cstno &&
        data.bankname &&
        data.bankbranch &&
        data.bankaccountno &&
        data.bankifsccode &&
        data.emailid &&
        data.contactnumber &&
        data.skills
      ) {
        fdata["submit"] = data.submit;
      } else {
        return res.json({
          state: -1,
          message: "For submission you have to give complete data of vendor",
          data: null,
        });
      }
    }
    var checkdir1 = path.join(appRoot.path, "uploads/vendor");
    var checkdir2 = path.join(appRoot.path, "uploads/vendor/documents");
    if (!fs.existsSync(checkdir1)) {
      fs.mkdirSync(checkdir1);
    }
    if (!fs.existsSync(checkdir2)) {
      fs.mkdirSync(checkdir2);
    }
    async.times(
      5,
      function (n, next) {
        if (req.body.attachCount && req.body.attachCount != 0) {
          var sampleFile = {};
          sampleFile = req.files["file[" + filenames[n] + "]"];
          var uploadPath = path.join(
            appRoot.path,
            "uploads/vendor/documents",
            cid.toString()
          );

          ////console.log('req.filesssssssssss',req.files['file[' + filenames[n]+ ']']);
          ////console.log('filenamessssssssss',filenames[n]);
          // //console.log("UPLOADEDD PATH",uploadPath)
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
          }
          if (sampleFile) {
            let filepath = path.join(uploadPath, sampleFile["name"]);
            sampleFile.mv(filepath, (err) => {
              if (!err) {
                fdata[filekeys[n]] = path.join(
                  "vendor/documents",
                  cid.toString(),
                  sampleFile["name"]
                );
                // //console.log("1111111",fdata[filekeys[n]]);
              }
              //  //console.log('ERRRRRRRRRR',err)
              next(null, "success");
            });
          } else {
            next(null, "success");
          }
        } else {
          next(null, "success");
        }
      },
      function (err, files) {
        if (err) {
          return res.json({
            state: -1,
            message: err,
            data: null,
          });
        } else {
          var obj = JSON.stringify(fdata);
          commonModel.mysqlModelService(
            "call usp_update_vendordetails(?)",
            [obj],
            function (err, result) {
              if (err) {
                return res.json({
                  state: -1,
                  message: err,
                  data: null,
                });
              } else {
                if (result && result[0] && result[0][0]) {
                  if (result[0][0].id) {
                    req.body.tokenFetchedData.vendoruser_id = result[0][0].id;
                    req.body.tokenFetchedData.vendoruser_name =
                      result[0][0].vendorname;
                    req.body.tokenFetchedData.vendor_state =
                      result[0][0].vendorstate;
                  }
                  var token = jwt.sign(
                    req.body.tokenFetchedData,
                    config.jwtSecret
                  );
                  var finaldata = {
                    state: result[0][0].status,
                    message: result[0][0].message,
                    user_id: result[0][0].id,
                    name: result[0][0].vendorname,
                    address: result[0][0].address,
                    city: result[0][0].city,
                    pincode: result[0][0].pincode,
                    pan: result[0][0].pan,
                    registrationno: result[0][0].registrationno,
                    servicetaxrno: result[0][0].servicetaxrno,
                    cstno: result[0][0].cstno,
                    tin: result[0][0].tin,
                    bankname: result[0][0].bankname,
                    bankbranch: result[0][0].bankbranch,
                    bankaccountno: result[0][0].bankaccountno,
                    bankifsccode: result[0][0].bankifsccode,
                    emailid: result[0][0].emailid,
                    contactnumber: result[0][0].contactnumber,
                    skills: result[0][0].vendorskills,
                    vendorstatus: result[0][0].vendorstatus,
                    vendorstate: result[0][0].vendorstate,
                    attachment: {
                      panfile: result[0][0].panfilepath,
                      registrationfile: result[0][0].registrationfilepath,
                      servicetaxfile: result[0][0].servicetaxfilepath,
                      cancelledchequefile: result[0][0].cancelledchequefilepath,
                      cstregistrationfile: result[0][0].cstregistrationfilepath,
                    },
                  };
                  return res.json({
                    state: finaldata.state,
                    message: finaldata.message,
                    data: finaldata,
                    token: token,
                  });
                } else {
                  return res.json({
                    state: -1,
                    message: "Data lost",
                    data: null,
                  });
                }
              }
            }
          );
        }
      }
    );
  } else {
    return res.json({
      state: -1,
      message: "Please provide the vendor credential id or user id",
      data: null,
    });
  }
}

function getBgvCandidateData(req, res) {
  var obj = JSON.stringify({
    createdby: req.body.tokenFetchedData.vendorcredentialid,
    reqtype: req.body.reqtype,
    candidateid: req.body.candidateid,
    bgvtypeid: req.body.bgvtypeid,
    headerid: req.body.headerid,
  });
  commonModel.mysqlModelService(
    "call usp_vendorbgv_view(?)",
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
        data: results,
      });
    }
  );
}

function getCandidateDetailBGV(req, res) {
  var obj = JSON.stringify({
    createdby: req.body.tokenFetchedData.vendorcredentialid,
    reqtype: req.body.reqtype,
    id: req.body.id,
  });
  commonModel.mysqlModelService(
    "call usp_vendorbgv_view(?)",
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
        data: results,
      });
    }
  );
}

function saveCandidateDetailBGV(req, res) {
  var obj = req.body;
  var cid = "";
  if (!(obj.tokenFetchedData && obj.tokenFetchedData.vendorcredentialid)) {
    return res.json({
      state: -1,
      message: "Authentication Failed !",
      data: null,
    });
  }
  cid = obj.tokenFetchedData.vendorcredentialid;
  var fdata = {
    image_path: [],
  };
  ////console.log(obj,'getCandidateDetailBGVgetCandidateDetailBGVgetCandidateDetailBGV');
  // commonModel.mysqlModelService('call usp_vendorbgv_view(?)', [obj], function(err, results) {
  // 	//console.log('err,result================================',err,results)
  // 	if (err) {
  // 		return res.badRequest({msg: 'failure'});
  // 	}
  // 	res.ok({msg: 'success', result:results[0]});
  // 	//console.log('reeeeeee',results);
  // });
  var checkdir1 = path.join(appRoot.path, "uploads/vendor");
  var checkdir2 = path.join(appRoot.path, "uploads/vendor/BGVreports");
  if (!fs.existsSync(checkdir1)) {
    fs.mkdirSync(checkdir1);
  }
  if (!fs.existsSync(checkdir2)) {
    fs.mkdirSync(checkdir2);
  }
  async.times(
    5,
    function (n, next) {
      if (req.body.attachCount) {
        var sampleFile = {};
        sampleFile = req.files["file[" + n + "]"];
        var uploadPath = path.join(
          appRoot.path,
          "uploads/vendor/BGVreports/",
          cid.toString()
        );

        ////console.log('req.filesssssssssss',req.files['file[' + filenames[n]+ ']']);
        ////console.log('filenamessssssssss',filenames[n]);
        // //console.log("UPLOADEDD PATH",uploadPath)
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath);
        }
        if (sampleFile) {
          let filepath = path.join(uploadPath, sampleFile["name"]);
          sampleFile.mv(filepath, (err) => {
            if (!err) {
              fdata.image_path.push(
                path.join(
                  "vendor/BGVreports/",
                  cid.toString(),
                  sampleFile["name"]
                )
              );
            }
            next(null, "success");
          });
        } else {
          next(null, "success");
        }
      } else {
        next(null, "success");
      }
    },
    function (err, files) {
      if (err) {
        return res.json({
          state: -1,
          message: "Something Went wrong with Files",
          data: null,
        });
      } else {
        req.body.bgvreport = fdata["image_path"].toString();

        req.body.createdby = cid;
        if (!req.body.bgvreport) {
          return res.json({
            state: -1,
            message: "File could not upload !",
            data: null,
          });
        }
        var objData = JSON.stringify(req.body);
        commonModel.mysqlModelService(
          "call usp_vendorbgv_view(?)",
          [objData],
          function (err, results) {
            if (err) {
              return res.json({
                state: -1,
                message: "failure",
                data: null,
              });
            }
            return res.json({
              state: 1,
              message: "Success",
              data: results,
            });
          }
        );
      }
    }
  );
}
/*--------------------------------------------------------------------------------------*/
/*----------------------------------End BGVVendorController-----------------------------*/
/*--------------------------------------------------------------------------------------*/

/*----------------------------------------------------------------------------------------
-----------------------------------Vendor Payment Options---------------------------------
------------------------------------------------------------------------------------------ */
function vendorPaymentOperations(req, res) {
  if (
    req.body.reqtype &&
    (req.body.reqtype == "add" || req.body.reqtype == "view") &&
    !req.body.vendorid
  ) {
    return res.json({
      state: -1,
      message: "Required parameters are missing",
      data: null,
    });
  } else {
    var objData = req.body;
    commonModel.mysqlModelService(
      "call usp_vendorpayment_operations(?)",
      [JSON.stringify(objData)],
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
  }
}

function vendorCandidatePayment(req, res) {
  var objData = req.body;
  commonModel.mysqlModelService(
    "call usp_vendorcandidatepayment_operations(?)",
    [JSON.stringify(objData)],
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
}
function changeVendorStatus(req, res) {
  if (!req.body.vendorid) {
    return res.json({ state: -1, message: "Required Parameters are missing" });
  } else {
    let obj = req.body;
    let reqtype = "changestatus";
    commonModel.mysqlModelService(
      "call usp_vendor_edit(?,?,?,?)",
      [JSON.stringify(obj), reqtype, "", ""],
      function (err, results) {
        //console.log("errrrrrrrrrrrrrrrrr", err, results);
        if (err) {
          return res.json({
            state: -1,
            message: err,
            data: null,
          });
        } else {
          // //console.log('ressssssssssss',results)
          if (
            results[1] &&
            results[1][0] &&
            results[1][0].state &&
            results[1][0].state == -1
          ) {
            return res.json({
              state: -1,
              message: results[1][0].message,
              data: results[0],
            });
          } else {
            return res.json({
              state: 1,
              message: "Success",
              data: null,
            });
          }
        }
      }
    );
  }
}

function deactivateVendor(req, res) {
  let obj = req.body.data;
  let vid = req.body.vid;
  let remark = req.body.comment;
  let reqtype = "deactivate";
  commonModel.mysqlModelService(
    "call usp_vendor_edit(?,?,?,?)",
    [JSON.stringify(obj), reqtype, vid, remark],
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
}
