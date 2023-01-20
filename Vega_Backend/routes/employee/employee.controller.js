// 'use strict';
const commonModel = require("../common/Model");
const mailservice = require("../../services/mailerService");
const crypto = require("crypto");
const path = require("path");
const appRoot = require("app-root-path");
const fs = require("fs");
const commonCtrl = require("../common/Controller");
const image2base64 = require("image-to-base64");
const _ = require("underscore");
const feedbackController = require("../feedback/Controller");
const xlsx = require("xlsx");
const moment = require("moment");
var mysqlserv = require("../../services/mysqlService");
const mysql = require("mysql");
const optionConfig = require("../../config/config");
const superadminController = require("../superAdmin/Controller");
const log = require("log-to-file");
const async = require("async");
const config = require("../../config/config");
const bcrypt = require("bcryptjs");
var nodemailer = require("nodemailer");
//const validator = require("email-validator");
const fusionconfig = config.fusionmysqlconfig;
const http = require("http");
const htmlpdf = require("html-pdf");
const axios = require("axios");
const utils = require("../common/utils");
const query = require("../common/Model").mysqlPromiseModelService;
const { content } = require("googleapis/build/src/apis/content");
const x = require("uniqid");
const { indexOf } = require("underscore");
appRoot.originalPath = appRoot.path;
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;

module.exports = {
  getEmployeeList: getEmployeeList,
  changeEmployeeStatus: changeEmployeeStatus,
  createEmployee: createEmployee,
  validateEmployeeEmailEcode: validateEmployeeEmailEcode,
  getEmployeeInfo: getEmployeeInfo,
  validateEmployeeToken: validateEmployeeToken,
  editEmployee: editEmployee,
  getNewEmpDetail: getNewEmpDetail,
  getReportee: getReportee,
  gethrrefer: gethrrefer,
  searchEmployeeList,
  getEmployeeDetails,
  getEmployeeLeavesTrend,
  getProjectBillingDataTrend,
  getWorkExperienceAnalysis,
  getPromotionDataAnalysis,
  getEmployeeAdditionalDetails,
  getEmployeeReactionAverage,
  uploadEmployeeExcel,
  getEmployeeReactions,
  getempList,
  saveNitcoEmployeeJson,
  getEmpShiftByDate,
  getEmployeeByID,
  empConfirmationReminder,
  nitcoFailureNotification,
  generateSalarySlip,
  deactivatedEmployeeExcel,
  supervisorEmployeeExcel,
  employeetaxoperation,
  clientWiseEmployeeSync,
  publicEmpDataApi,
  sendNotificationEmpApiErr,
  getAlumniEmployees,
};

function getEmployeeList(req, res) {
  if (!req.body.createdby) {
    return res.json({
      state: 0,
      message: "Not a valid user",
    });
  }
  var myJson = JSON.stringify(req.body);

  commonModel.mysqlModelService(
    "call usp_mstemployee_data(?)",
    [myJson],
    function (err, results) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
        });
      } else {
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
            message: "No Lazy Data",
          });
        }
      }
    }
  );
}
async function getAlumniEmployees(req, res) {
  try {
    let reqObj = req.body;
    let results = await query("call usp_mstemployee_data(?)", [
      JSON.stringify(reqObj),
    ]);
    return res.json({ state: 1, message: "Success", data: results[0] });
  } catch (err) {
    return res.json({ state: -1, message: "Something went wrong!" });
  }
}

function getReportee(req, res) {
  if (!req.body.createdby) {
    return res.json({
      state: 0,
      message: "Not a valid user",
    });
  }
  var myJson = JSON.stringify(req.body);

  commonModel.mysqlModelService(
    "call usp_mstemployee_data(?)",
    [myJson],
    function (err, results) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
        });
      } else {
        // var dbresult = commonCtrl.lazyLoading(results[0], req.body);
        // if (dbresult && "data" in dbresult && "count" in dbresult) {
        return res.json({
          state: 1,
          message: "success",
          data: results[0],
          // count: dbresult.count,
        });
        // } else {
        //   return res.json({ state: -1, message: "No Lazy Data" });
        // }
        //return res.json({ "state": 1, message: "success", "data": results && results[0] });
      }
    }
  );
}

function changeEmployeeStatus(req, res) {
  if (!req.body || !req.body.guid) {
    return res.json({
      state: -1,
      message: "Required parameters are missing",
      data: null,
    });
  }
  var obj = req.body;
  obj.action = "editemployee";
  commonModel.mysqlModelService(
    "call usp_mstemployee_operation(?)",
    [JSON.stringify(obj)],
    function (err, results) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
        });
      }
      return res.json({
        state: 1,
        message: "success",
        data: results && results[0],
      });
    }
  );
}

function createEmployee(req, res) {
  //const errors = req.validationErrors();
  if (
    !req.body ||
    !req.body.userData ||
    !req.body.assignedModules ||
    !req.body.urllink
  ) {
    return res.json({
      message: "required parameters are missing",
      state: -1,
      data: null,
    });
  }

  req.body.userData = JSON.parse(req.body.userData);
  req.body.userData["orgstructureid"] = req.body.verticals
    ? JSON.parse(req.body.verticals)
    : null;
  req.body.userData["orgtypeid"] = req.body.orgtypeid;
  req.body.assignedModules = JSON.parse(req.body.assignedModules);
  req.body.urllink = JSON.parse(req.body.urllink);
  let userData = req.body.userData;
  if (
    !userData.firstname ||
    !userData.lastname ||
    !userData.ecode ||
    !userData.useremail ||
    !userData.managerid
  ) {
    return res.json({
      message: "required parameters are missing",
      state: -1,
      data: null,
    });
  }
  // if (errors) {
  //     let errorMsg = errors.map(({ msg }) => msg);
  //     return res.json({ message: errorMsg && errorMsg.toString(), state: -1, data: null });
  // }
  if (req.body.userData.guid) {
    editEmployee(req, res);
  } else {
    var random = Math.random().toString().substring(5);
    var token = crypto.createHash("sha1").update(random).digest("hex");
    req.body.userData.resettoken = token;
    req.body.userData.createdby = req.body.createdby;
    req.body.userData.action = "createEmployee";
    let dirname;
    if (req.files) {
      if (req.files["file"]) {
        let file = req.files.file;
        var filename = file.name.split(".");
        var profilePic = path.join(
          "profilePic/" + filename[0] + Date.now() + "." + filename[1]
        );
        dirname = path.join(appRoot && appRoot.path, "/uploads", profilePic);
        utils.makeDirectories(path.join("uploads", "profilePic"));

        file.mv(dirname, function (err) {
          if (err) {
            return res.json({
              state: -1,
              message: err.message || "Error in uploading File",
              data: null,
            });
          } else {
            req.body.userData.profilepic = profilePic;
            var profileblob;
            let cid =
              `data:image/` +
              path.extname(file.name).replace(".", "") +
              `;base64,`;
            image2base64(dirname) // you can also  use url
              .then((response) => {
                profileblob = response;
                req.body.userData.profileblob = cid + profileblob;
                add_employee(req.body.userData)
                  .then((userData) => {
                    return res.json({
                      message: "Employee created.",
                      state: 1,
                      guid: userData && userData[0].state,
                      userid: userData && userData[0].userid,
                      data: null,
                    });
                  })
                  .catch((erorr) => {
                    //console.log(erorr);
                    return res.json({
                      message: erorr.toString(),
                      state: -1,
                      data: null,
                    });
                  });
              });
          }
        });
      } else {
        res.json({
          state: -1,
          message: "file is not valid",
          data: null,
        });
      }
    } else {
      add_employee(req.body.userData)
        .then((userData) => {
          return res.json({
            message: "Employee created.",
            state: 1,
            guid: userData && userData[0].state,
            userid: userData && userData[0].userid,
            data: null,
          });
        })
        .catch((erorr) => {
          //console.log(erorr);
          return res.json({
            message: erorr.toString(),
            state: -1,
            data: null,
          });
        });
      // res.json({ state: -1, message: 'please select a file!!!', data: null });
    }
  }
}

const assign_module_to_user = (usermodules, createdby) => {
  return new Promise((resolve, reject) => {
    _.each(usermodules, function (item) {
      item.userid = usermodules.userId;
      item.createdby = usermodules.createdby;
      item.roleid = usermodules.roleid;
      if (!item.isdefault) delete item.isdefault;
    });
    let obj = JSON.stringify(usermodules);
    ////console.log("ahdshjashjsd", obj);
    commonModel.mysqlModelService(
      "call usp_mstemployeemodule_add(?)",
      [obj],
      function (err, result) {
        ////console.log("errrrrrr", err, result);
        if (err) reject(err);
        else resolve(result[0]);
      }
    );
  });
};

const add_employee = (userInformation) => {
  return new Promise((resolve, reject) => {
    var urllink = config.webUrlLink;
    ////console.log("url", urllink);
    const dd = commonCtrl.verifyNull(userInformation);
    let obj = JSON.stringify(dd);
    commonModel.mysqlModelService(
      "call usp_mstemployee_operation(?)",
      [obj],
      function (err, result) {
        if (err) reject(err);
        else if (urllink && urllink.indexOf("polestar") != -1) {
          if (config.env && config.env == "development") {
            ////console.log("not for fusion");
          } else {
            fusionEmployeeDataSync(userInformation);
          }
        }

        resolve(result && result[0]);
      }
    );
  });
};

function validateEmployeeEmailEcode(req, res) {
  if (!req.body.useremail || !req.body.ecode) {
    return res.json({
      state: 0,
      message: "Not a valid user",
    });
  }
  req.body.guid = req.body.tokenFetchedData.guid;
  var obj = JSON.stringify(req.body);

  // //console.log("REQBODYYYYYYYYYYYYYYYYYYY1111", req.body);
  commonModel.mysqlModelService(
    "call usp_mstemployee_view(?)",
    [obj],
    function (err, results) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
        });
      }
      // errorService.getError(results[0][0],function(err){
      //     if(err)  return res.status(422).send(err);
      return res.json({
        state: 1,
        message: "success",
        data: results && results[0],
      });
    }
  );
  //});
}

function getEmployeeInfo(req, res) {
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService(
    "call usp_mstemployee_view(?)",
    [obj],
    function (err, results) {
      ////console.log("RRRRRRRRRRRRRRRRR", results);
      if (err) {
        return res.json({
          state: -1,
          message: err,
        });
      }
      return res.json({
        state: 1,
        message: "success",
        data: results && results[0],
      });
    }
  );
}

const send_mail = (emailObj) => {
  return new Promise((resolve, reject) => {
    mailservice.mail(emailObj, function (err, response) {
      ////console.log(err, response);
      if (err) {
        reject("User created. Failed to send mail !");
      } else
        resolve({
          msg: "Mail Sent. ",
        });
    });
  });
};

function validateEmployeeToken(req, res) {
  // if(!req.body.id){
  //     return res.json({ "state": 0, "message": 'Not a valid user' });
  // }
  // var obj=JSON.stringify(req.body);//console.log('asdjsadksad',obj)
  // commonModel.mysqlModelService('call usp_mstuser_validatetoken(?)',[obj], function(err, results) {
  //     if (err) {
  //         return res.json({ "state": -1, "message": err });
  //     }
  //     return res.json({ "state": 1, message: "success", "data": results && results[0] });
  // });
}

function editEmployee(req, res) {
  var userInfo = req.body.userData;
  userInfo = _.mapObject(userInfo, function (val, key) {
    return val == null ? undefined : val;
  });
  ////console.log("Eeeeeee", userInfo.orgstructureid);
  userInfo.createdby = req.body.createdby;
  userInfo.action = "editemployee";
  userInfo.guid = req.body.userData.guid;
  let dirname;
  if (req.files) {
    if (req.files["file"]) {
      let file = req.files.file;
      var filename = file.name.replace(path.extname(file.name), "");
      var ext = path.extname(file.name);
      //    var filename = file.name.split('.');
      var profilePic = path.join("profilePic/" + filename + Date.now() + ext);

      //    var profilePic = path.join('profilePic/' + filename[0] + Date.now() + '.' + filename[1]);
      dirname = path.join(appRoot && appRoot.path, "/uploads", profilePic);
      let dirName1 = path.join(appRoot && appRoot.path, "/uploads");
      let dirName2 = path.join(appRoot && appRoot.path, "/uploads/profilePic");
      utils.makeDirectories("/uploads/profilePic");

      file.mv(dirname, function (err) {
        if (err) {
          return res.json({
            state: -1,
            message: err.message || "Error in uploading File",
            data: null,
          });
        } else {
          userInfo.profilepic = profilePic;
          //var profileblob;
          //    let cid = `data:image/` + (path.extname(file.name)).replace('.', "") + `;base64,`
          //    image2base64(dirname) // you can also  use url
          //        .then(
          //            (response) => {
          //                profileblob = response;
          //                userInfo.profileblob = cid + profileblob
          var obj = JSON.stringify(userInfo);
          commonModel.mysqlModelService(
            "call usp_mstemployee_operation(?)",
            [obj],
            function (err, results) {
              ////console.log("R1", results);

              if (err) {
                return res.json({
                  state: -1,
                  message: err,
                });
              }
              return res.json({
                state: 1,
                message: "User updated successfully",
                data: null,
                guid:
                  results && results[0] && results[0][0] && results[0][0].state,
                userid:
                  results &&
                  results[0] &&
                  results[0][0] &&
                  results[0][0].userid,
              });

              //                });
            }
          );
          // .catch((err)=>{
          //     return res.json({ "state": -1, "message": err })
          // })
        }
      });
    }
  } else {
    var obj = JSON.stringify(userInfo);
    commonModel.mysqlModelService(
      "call usp_mstemployee_operation(?)",
      [obj],
      function (err, results) {
        ////console.log("R2", results);
        if (err) {
          return res.json({
            state: -1,
            message: err,
          });
        }
        return res.json({
          state: 1,
          message: "User updated successfully",
          data: null,
          guid: results && results[0] && results[0][0] && results[0][0].state,
          userid:
            results && results[0] && results[0][0] && results[0][0].userid,
        });
      }
    );
    // return res.json({ "state": -1,message : "Please Select a Profile Pic" })
  }
}

function getNewEmpDetail(req, res) {
  if (!req.body.id) {
    return res.json({
      message: "Required parameter is missing",
      state: -1,
      data: null,
    });
  }
  let obj = req.body;
  obj.action = "newUser";
  obj.reqtype = "view";
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService("call usp_rmscandidate_operations(?)", obj)
    .then((result) => {
      return res.json({
        message: "success",
        state: 1,
        data: result[0],
      });
    })
    .catch((err) => {
      return res.json({
        message: err,
        state: -1,
        data: null,
      });
    });
}

function gethrrefer(req, res) {
  if (!req.body.createdby) {
    return res.json({
      state: 0,
      message: "Not a valid user",
    });
  }
  var myJson = JSON.stringify(req.body);

  commonModel.mysqlModelService(
    "call usp_mstemployee_data(?)",
    [myJson],
    function (err, results) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
        });
      } else {
        if (
          results &&
          results[1] &&
          results[1][0].state &&
          results[1][0].state == 1
        ) {
          return res.json({
            state: 1,
            message: "success",
            data: results,
          });
        } else {
          return res.json({
            state: -1,
            message: "Something went wrong",
          });
        }
      }
    }
  );
}

function searchEmployeeList(req, res) {
  try {
    feedbackController.userhierarcy(req, res).then((data) => {
      req.body.all_reportees = data;
      req.body.action = "search_employee";
      let obj = JSON.stringify(req.body);
      ////console.log(obj, "request--search---emp--------");

      commonModel.mysqlModelService(
        "call usp_mstemployee_data(?)",
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
    });
  } catch (error) {
    throw error;
  }
}

function getEmployeeDetails(req, res) {
  try {
    // req.body.createdby = req.body.user_id || req.body.createdby;
    feedbackController.userhierarcy(req, res).then((data) => {
      req.body.all_reportees = data;
      req.body.action = "employee_details";
      let obj = JSON.stringify(req.body);
      let total_reportee_count = 0;
      if (req.body.user_id) {
        req.body.createdby = req.body.user_id;
        feedbackController.userhierarcy(req, res).then((data) => {
          total_reportee_count = data === "" ? 0 : data.split(",").length;
          //console.log(
          // data,
          // "inside --iffff ----------hierrarchy",
          // total_reportee_count,
          // "totl cnt------"
          //  );
        });
      } else total_reportee_count = data === "" ? 0 : data.split(",").length;
      ////console.log(obj, "request--emp--details---emp--------");

      commonModel.mysqlModelService(
        "call usp_mstemployee_data(?)",
        [obj],
        function (err, results) {
          if (err) {
            return res.json({
              state: -1,
              message: err,
              data: null,
            });
          }
          if (results[0] && results[0][0])
            results[0][0].total_reportee_count = total_reportee_count;
          return res.json({
            state: 1,
            message: "Success",
            data: results && results[0],
          });
        }
      );
    });
  } catch (error) {
    throw error;
  }
}

function getEmployeeLeavesTrend(req, res) {
  try {
    feedbackController.userhierarcy(req, res).then((data) => {
      req.body.all_reportees = data;
      req.body.action = "leaves_trend";
      let obj = JSON.stringify(req.body);
      ////console.log(obj, "request--leave ---trend---emp--------");

      commonModel.mysqlModelService(
        "call usp_mstemployee_data(?)",
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
    });
  } catch (error) {
    throw error;
  }
}

function getProjectBillingDataTrend(req, res) {
  try {
    feedbackController.userhierarcy(req, res).then((data) => {
      req.body.all_reportees = data;
      req.body.action = "project_billing_data_trend";
      let obj = JSON.stringify(req.body);
      ////console.log(obj, "request--project--billing---trend---emp--------");

      commonModel.mysqlModelService(
        "call usp_mstemployee_data(?)",
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
    });
  } catch (error) {
    throw error;
  }
}

function getWorkExperienceAnalysis(req, res) {
  try {
    feedbackController.userhierarcy(req, res).then((data) => {
      req.body.all_reportees = data;
      req.body.action = "work_experience_data";
      let obj = JSON.stringify(req.body);
      ////console.log(obj, "request--work_exppp--emp--------");

      commonModel.mysqlModelService(
        "call usp_mstemployee_data(?)",
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
    });
  } catch (error) {
    throw error;
  }
}

function getPromotionDataAnalysis(req, res) {
  try {
    feedbackController.userhierarcy(req, res).then((data) => {
      req.body.all_reportees = data;
      req.body.action = "promotion_data_analysis";
      let obj = JSON.stringify(req.body);
      ////console.log(obj, "request--promotion--emp--------");

      commonModel.mysqlModelService(
        "call usp_mstemployee_data(?)",
        [obj],
        function (err, results) {
          if (err) {
            return res.json({
              state: -1,
              message: err,
              data: null,
            });
          }
          let promotionData = {};
          promotionData.emp_promotion_details = results[0];
          promotionData.next_desig_details = results[1];
          promotionData.upcoming_promotion_avg = results[2];
          promotionData.previous_promotion_avg = results[3];
          return res.json({
            state: 1,
            message: "Success",
            data: promotionData,
          });
        }
      );
    });
  } catch (error) {
    throw error;
  }
}

function getEmployeeAdditionalDetails(req, res) {
  try {
    feedbackController.userhierarcy(req, res).then((data) => {
      req.body.all_reportees = data;
      // req.body.action = 'work_experience_data'
      let obj = JSON.stringify(req.body);
      ////console.log(obj, "request--get_emp_additional----------");

      commonModel.mysqlModelService(
        "call usp_employee_scorecard(?)",
        [obj],
        function (err, results) {
          if (err) {
            return res.json({
              state: -1,
              message: err,
              data: null,
            });
          }
          let additional_info = {};
          additional_info.basic_info = results[0];
          // additional_info.feedback_info = results[1];
          additional_info.performance_info = results[1];
          additional_info.billing_info = results[2];
          return res.json({
            state: 1,
            message: "Success",
            data: additional_info,
          });
        }
      );
    });
  } catch (error) {
    throw error;
  }
}

function getEmployeeReactionAverage(req, res) {
  try {
    feedbackController.userhierarcy(req, res).then((data) => {
      req.body.all_reportees = data;
      req.body.action = "reaction_average";
      let obj = JSON.stringify(req.body);
      ////console.log(obj, "request--reaction---trend---emp--------");

      commonModel.mysqlModelService(
        "call usp_mstemployee_data(?)",
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
    });
  } catch (error) {
    throw error;
  }
}

function getEmployeeReactions(req, res) {
  try {
    req.body.action = "get_reaction_data";
    if (!req.body.is_reportees) {
      let obj = JSON.stringify(req.body);
      commonModel.mysqlModelService(
        "call usp_mstemployee_data(?)",
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
    } else {
      feedbackController.userhierarcy(req, res).then((data) => {
        req.body.all_reportees = data;
        let obj = JSON.stringify(req.body);
        commonModel.mysqlModelService(
          "call usp_mstemployee_data(?)",
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
      });
    }
  } catch (error) {
    ////console.log(error, "errorr in emp rxn");
    return res.json({
      state: -1,
      message: "Something went wrong",
      data: null,
    });
  }
}

function getEmployeeExcelData(filepath) {
  return new Promise((resolve, reject) => {
    let isErrorInMandatoryField = false;
    let isErrorInDate = false;

    const errc1 = [],
      errc2 = [],
      errc3 = [],
      errc4 = [],
      errc5 = [],
      errc6 = [],
      errc7 = [],
      errc8 = [],
      errc9 = [],
      errc10 = [],
      errc11 = [],
      errc12 = [],
      errc13 = [],
      errc14 = [],
      errc15 = [],
      wb = xlsx.readFile(filepath),
      sheet_name_list = wb.SheetNames,
      ws = wb.Sheets[sheet_name_list[0]],
      data = xlsx.utils.sheet_to_json(ws),
      //  ws = wb.Sheets["data"],
      //   data = xlsx.utils.sheet_to_json(ws),
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
      c12 = ws["L1"] ? ws["L1"].v && ws["L1"].v : undefined,
      c13 = ws["M1"] ? ws["M1"].v && ws["M1"].v : undefined,
      c14 = ws["N1"] ? ws["N1"].v && ws["N1"].v : undefined,
      c15 = ws["O1"] ? ws["O1"].v && ws["O1"].v : undefined,
      c16 = ws["P1"] ? ws["P1"].v && ws["P1"].v : undefined,
      c17 = ws["Q1"] ? ws["Q1"].v && ws["Q1"].v : undefined,
      c18 = ws["R1"] ? ws["R1"].v && ws["R1"].v : undefined,
      c19 = ws["S1"] ? ws["S1"].v && ws["S1"].v : undefined,
      c20 = ws["T1"] ? ws["T1"].v && ws["T1"].v : undefined,
      c21 = ws["U1"] ? ws["U1"].v && ws["U1"].v : undefined,
      c22 = ws["V1"] ? ws["V1"].v && ws["V1"].v : undefined,
      c23 = ws["W1"] ? ws["W1"].v && ws["W1"].v : undefined,
      c24 = ws["X1"] ? ws["X1"].v && ws["X1"].v : undefined,
      c25 = ws["Y1"] ? ws["Y1"].v && ws["Y1"].v : undefined,
      c26 = ws["Z1"] ? ws["Z1"].v && ws["Z1"].v : undefined;

    if (
      !c1 ||
      c1.toString().trim() !== "First_Name" ||
      !c2 ||
      c2.toString().trim() !== "Last_Name" ||
      !c3 ||
      c3.toString().trim() !== "Official_Email" ||
      !c4 ||
      c4.toString().trim() !== "Personal_Email" ||
      !c5 ||
      c5.toString().trim() !== "Employee_Code" ||
      !c6 ||
      c6.toString().trim() !== "Gender(M/F)" ||
      !c7 ||
      c7.toString().trim() !== "Reporting_To(ID)" ||
      !c8 ||
      c8.toString().trim() !== "Contact_Number" ||
      !c9 ||
      c9.toString().trim() !== "Date_Of_Birth(DD.MM.YYYY)" ||
      !c10 ||
      c10.toString().trim() !== "Country" ||
      !c11 ||
      c11.toString().trim() !== "Location" ||
      !c12 ||
      c12.toString().trim() !== "Business_Unit" ||
      !c13 ||
      c13.toString().trim() !== "Workforce" ||
      !c14 ||
      c14.toString().trim() !== "Work_Location" ||
      !c15 ||
      c15.toString().trim() !== "Verticals" ||
      !c16 ||
      c16.toString().trim() !== "Department" ||
      !c17 ||
      c17.toString().trim() !== "Designation" ||
      !c18 ||
      c18.toString().trim() !== "Employee_Shift" ||
      !c19 ||
      c19.toString().trim() !== "HR_Representative(ID)" ||
      !c20 ||
      c20.toString().trim() !== "Date_Of_Joining(DD.MM.YYYY)" ||
      !c21 ||
      c21.toString().trim() !== "Date_Of_Confirmation(DD.MM.YYYY)" ||
      !c22 ||
      c22.toString().trim() !== "Resource_Type" ||
      !c23 ||
      c23.toString().trim() !== "Employee_Type" ||
      !c24 ||
      c24.toString().trim() !== "Relieving_Date(DD.MM.YYYY)" ||
      !c25 ||
      c25.toString().trim() !== "Cost_Center" ||
      !c26 ||
      c26.toString().trim() !== "Tax_Slab(%)"
    ) {
      reject("Invalid Excel Template!");
    }
    if (!data.length) reject("Make sure template should not be empty!");
    var mandatoryFieldMissing = [],
      dateFieldError = [];
    _.each(data, (item, index) => {
      if (!item.First_Name) {
        errc1.push(index + 2);
        isErrorInMandatoryField = true;
        mandatoryFieldMissing.indexOf("First_Name") === -1
          ? mandatoryFieldMissing.push("First_Name")
          : "";
      }
      if (!item.Official_Email) {
        errc2.push(index + 2);
        isErrorInMandatoryField = true;
        mandatoryFieldMissing.indexOf("Official_Email") === -1
          ? mandatoryFieldMissing.push("Official_Email")
          : "";
      }
      if (!item.Employee_Code) {
        errc3.push(index + 2);
        isErrorInMandatoryField = true;
        mandatoryFieldMissing.indexOf("Employee_Code") === -1
          ? mandatoryFieldMissing.push("Employee_Code")
          : "";
      }

      if (!item["Gender(M/F)"]) {
        errc4.push(index + 2);
        isErrorInMandatoryField = true;
        mandatoryFieldMissing.indexOf("Gender(M/F)") === -1
          ? mandatoryFieldMissing.push("Gender(M/F)")
          : "";
      } else if (
        item["Gender(M/F)"].toUpperCase() !== "F" &&
        item["Gender(M/F)"].toUpperCase() !== "M" &&
        item["Gender(M/F)"].toUpperCase() !== "O"
      ) {
        errc4.push(index + 2);
        isErrorInMandatoryField = true;
        mandatoryFieldMissing.indexOf("Gender(M/F)") === -1
          ? mandatoryFieldMissing.push("Gender(M/F)")
          : "";
      }
      if (!item["Reporting_To(ID)"]) {
        errc5.push(index + 2);
        isErrorInMandatoryField = true;
        mandatoryFieldMissing.indexOf("Reporting_To(ID)") === -1
          ? mandatoryFieldMissing.push("Reporting_To(ID)")
          : "";
      }
      if (!item.Country) {
        errc6.push(index + 2);
        isErrorInMandatoryField = true;
        mandatoryFieldMissing.indexOf("Country") === -1
          ? mandatoryFieldMissing.push("Country")
          : "";
      }
      if (!item.Location) {
        errc7.push(index + 2);
        isErrorInMandatoryField = true;
        mandatoryFieldMissing.indexOf("Location") === -1
          ? mandatoryFieldMissing.push("Location")
          : "";
      }
      if (!item.Business_Unit) {
        errc8.push(index + 2);
        isErrorInMandatoryField = true;
        mandatoryFieldMissing.indexOf("Business_Unit") === -1
          ? mandatoryFieldMissing.push("Business_Unit")
          : "";
      }
      if (!item.Workforce) {
        errc9.push(index + 2);
        isErrorInMandatoryField = true;
        mandatoryFieldMissing.indexOf("Workforce") === -1
          ? mandatoryFieldMissing.push("Workforce")
          : "";
      }
      if (!item.Work_Location) {
        errc10.push(index + 2);
        isErrorInMandatoryField = true;
        mandatoryFieldMissing.indexOf("Work_Location") === -1
          ? mandatoryFieldMissing.push("Work_Location")
          : "";
      }
      if (!item.Department) {
        errc11.push(index + 2);
        isErrorInMandatoryField = true;
        mandatoryFieldMissing.indexOf("Department") === -1
          ? mandatoryFieldMissing.push("Department")
          : "";
      }
      if (!item.Designation) {
        errc12.push(index + 2);
        isErrorInMandatoryField = true;
        mandatoryFieldMissing.indexOf("Designation") === -1
          ? mandatoryFieldMissing.push("Designation")
          : "";
      }
      if (!item.Workforce) {
        errc13.push(index + 2);
        isErrorInMandatoryField = true;
        mandatoryFieldMissing.indexOf("Workforce") === -1
          ? mandatoryFieldMissing.push("Workforce")
          : "";
      }
      if (!item["Employee_Shift"]) {
        errc14.push(index + 2);
        isErrorInMandatoryField = true;
        mandatoryFieldMissing.indexOf("Employee_Shift") === -1
          ? mandatoryFieldMissing.push("Employee_Shift")
          : "";
      }
      if (!item["Date_Of_Joining(DD.MM.YYYY)"]) {
        errc15.push(index + 2);
        isErrorInMandatoryField = true;
        mandatoryFieldMissing.indexOf("Date_Of_Joining(DD.MM.YYYY)") === -1
          ? mandatoryFieldMissing.push("Date_Of_Joining(DD.MM.YYYY)")
          : "";
      }

      if (!item.Contact_Number) {
        errc3.push(index + 2);
        isErrorInMandatoryField = true;
        mandatoryFieldMissing.indexOf("Contact_Number") === -1
          ? mandatoryFieldMissing.push("Contact_Number")
          : "";
      }

      // Above all filed are mandatory
      if (
        moment(
          item["Date_Of_Birth(DD.MM.YYYY)"],
          ["DD.MM.YYYY", "DD-MM-YYYY", "DD/MM/YYYY"],
          true
        ).isValid()
      ) {
        item["Date_Of_Birth(DD.MM.YYYY)"] =
          moment(item["Date_Of_Birth(DD.MM.YYYY)"], "DD.MM.YYYY").format(
            "YYYY-MM-DD"
          ) ||
          moment(item["Date_Of_Birth(DD.MM.YYYY)"], "DD-MM-YYYY").format(
            "YYYY-MM-DD"
          ) ||
          moment(item["Date_Of_Birth(DD.MM.YYYY)"], "DD/MM/YYYY").format(
            "YYYY-MM-DD"
          );
      } else if (
        moment(
          item["Date_Of_Birth(DD.MM.YYYY)"],
          ["YYYY-MM-DD"],
          true
        ).isValid()
      ) {
        item["Date_Of_Birth(DD.MM.YYYY)"] = item["Date_Of_Birth(DD.MM.YYYY)"];
      } else if (
        item["Date_Of_Birth(DD.MM.YYYY)"] == "" ||
        item["Date_Of_Birth(DD.MM.YYYY)"] == undefined
      ) {
        delete item["Date_Of_Birth(DD.MM.YYYY)"]; //Date
      } else {
        isErrorInDate = true;
        dateFieldError.indexOf("Date_Of_Birth(DD.MM.YYYY)") === -1
          ? dateFieldError.push("Date_Of_Birth(DD.MM.YYYY)")
          : "";
      }

      if (
        moment(
          item["Date_Of_Joining(DD.MM.YYYY)"],
          ["DD.MM.YYYY", "DD-MM-YYYY", "DD/MM/YYYY"],
          true
        ).isValid()
      ) {
        item["Date_Of_Joining(DD.MM.YYYY)"] =
          moment(item["Date_Of_Joining(DD.MM.YYYY)"], "DD.MM.YYYY").format(
            "YYYY-MM-DD"
          ) ||
          moment(item["Date_Of_Joining(DD.MM.YYYY)"], "DD-MM-YYYY").format(
            "YYYY-MM-DD"
          ) ||
          moment(item["Date_Of_Joining(DD.MM.YYYY)"], "DD/MM/YYYY").format(
            "YYYY-MM-DD"
          );
      } else if (
        moment(
          item["Date_Of_Joining(DD.MM.YYYY)"],
          ["YYYY-MM-DD"],
          true
        ).isValid()
      ) {
        item["Date_Of_Joining(DD.MM.YYYY)"] =
          item["Date_Of_Joining(DD.MM.YYYY)"];
      } else if (
        item["Date_Of_Joining(DD.MM.YYYY)"] == "" ||
        item["Date_Of_Joining(DD.MM.YYYY)"] == undefined
      ) {
        delete item["Date_Of_Joining(DD.MM.YYYY)"]; //Date
      } else {
        isErrorInDate = true;
        dateFieldError.indexOf("Date_Of_Joining(DD.MM.YYYY)") === -1
          ? dateFieldError.push("Date_Of_Joining(DD.MM.YYYY)")
          : "";
      }

      if (
        moment(
          item["Date_Of_Confirmation(DD.MM.YYYY)"],
          ["DD.MM.YYYY", "DD-MM-YYYY", "DD/MM/YYYY"],
          true
        ).isValid()
      ) {
        item["Date_Of_Confirmation(DD.MM.YYYY)"] =
          moment(item["Date_Of_Confirmation(DD.MM.YYYY)"], "DD.MM.YYYY").format(
            "YYYY-MM-DD"
          ) ||
          moment(item["Date_Of_Confirmation(DD.MM.YYYY)"], "DD-MM-YYYY").format(
            "YYYY-MM-DD"
          ) ||
          moment(item["Date_Of_Confirmation(DD.MM.YYYY)"], "DD/MM/YYYY").format(
            "YYYY-MM-DD"
          );
      } else if (
        moment(
          item["Date_Of_Confirmation(DD.MM.YYYY)"],
          ["YYYY-MM-DD"],
          true
        ).isValid()
      ) {
        item["Date_Of_Confirmation(DD.MM.YYYY)"] =
          item["Date_Of_Confirmation(DD.MM.YYYY)"];
      } else if (
        item["Date_Of_Confirmation(DD.MM.YYYY)"] == "" ||
        item["Date_Of_Confirmation(DD.MM.YYYY)"] == undefined
      ) {
        delete item["Date_Of_Confirmation(DD.MM.YYYY)"]; //Date
      } else {
        isErrorInDate = true;
        dateFieldError.indexOf("Date_Of_Confirmation(DD.MM.YYYY)") === -1
          ? dateFieldError.push("Date_Of_Confirmation(DD.MM.YYYY)")
          : "";
      }

      if (
        moment(
          item["Relieving_Date(DD.MM.YYYY)"],
          ["DD.MM.YYYY", "DD-MM-YYYY", "DD/MM/YYYY"],
          true
        ).isValid()
      ) {
        item["Relieving_Date(DD.MM.YYYY)"] =
          moment(item["Relieving_Date(DD.MM.YYYY)"], "DD.MM.YYYY").format(
            "YYYY-MM-DD"
          ) ||
          moment(item["Relieving_Date(DD.MM.YYYY)"], "DD-MM-YYYY").format(
            "YYYY-MM-DD"
          ) ||
          moment(item["Relieving_Date(DD.MM.YYYY)"], "DD/MM/YYYY").format(
            "YYYY-MM-DD"
          );
      } else if (
        moment(
          item["Relieving_Date(DD.MM.YYYY)"],
          ["YYYY-MM-DD"],
          true
        ).isValid()
      ) {
        item["Relieving_Date(DD.MM.YYYY)"] = item["Relieving_Date(DD.MM.YYYY)"];
      } else if (
        item["Relieving_Date(DD.MM.YYYY)"] == "" ||
        item["Relieving_Date(DD.MM.YYYY)"] == undefined
      ) {
        delete item["Relieving_Date(DD.MM.YYYY)"]; //Date
      } else {
        isErrorInDate = true;
        dateFieldError.indexOf("Relieving_Date(DD.MM.YYYY)") === -1
          ? dateFieldError.push("Relieving_Date(DD.MM.YYYY)")
          : "";
      }
    });

    if (isErrorInMandatoryField && isErrorInDate) {
      reject(`${mandatoryFieldMissing} Mandatory Column contains empty or invalid data And  
            ${dateFieldError}  Column contains invalid data`);
    } else if (isErrorInDate) {
      reject(`${dateFieldError} Column contains invalid Date`);
    } else if (isErrorInMandatoryField) {
      reject(
        `${mandatoryFieldMissing} Mandatory Column contains empty or invalid data`
      );
    } else {
      resolve(data);
    }
  });
}

async function uploadEmployeeExcel(req, res) {
  try {
    req.setTimeout(1000 * 60 * 20);
    // setTimeout(() => {}, 0);
    if (!req.files) {
      return res.json({
        state: -1,
        message: "No File uploaded",
      });
    }
    if (!fs.existsSync(path.join(appRoot.path, "uploads/employeeexcel"))) {
      fs.mkdirSync(path.join(appRoot.path, "uploads/employeeexcel"));
    }
    let timestamp = Date.now();
    var sampleFile = {};
    sampleFile = req.files["file"];
    if (path.extname(sampleFile.name) != ".xlsx") {
      return res.json({
        state: -1,
        message: "Unsupported file format.Required .xlsx file format",
      });
    }
    let filepath = path.join(
      appRoot.path,
      "uploads/employeeexcel",
      timestamp + sampleFile.name
    );
    await sampleFile.mv(filepath);
    let exlarr = await getEmployeeExcelData(filepath);

    fs.unlink(filepath, function (err) {
      if (err) {
        //console.log("err", err);
      }
    });
    let objaction = req.body;
    ////console.log("employeeArr", JSON.stringify(exlarr));
    commonModel.mysqlModelService(
      "call usp_employeexls_upload_new(?,?)",
      [JSON.stringify(exlarr), JSON.stringify(objaction)],
      function (err, result) {
        if (err) {
          //console.log("err", err);
          return res.json({
            state: -1,
            message: err.message || err,
          });
        } else {
          return res.json({
            state: 1,
            message: "Success",
            data: result,
          });
        }
      }
    );
  } catch (err) {
    return res.json({
      state: -1,
      message: err.message || err,
    });
  }
}

function getempList(req, res) {
  if (!req.body.createdby) {
    return res.json({
      state: 0,
      message: "Not a valid user",
    });
  }
  var myJson = JSON.stringify(req.body);

  commonModel.mysqlModelService(
    "call usp_mstemployee_data(?)",
    [myJson],
    function (err, results) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
        });
      } else {
        var dbresult = commonCtrl.lazyLoading(results[0], req.body);
        if (dbresult && "data" in dbresult && "count" in dbresult) {
          return res.json({
            state: 1,
            message: "success",
            data: dbresult && dbresult.data,
            count: dbresult.count,
          });
        } else {
          return res.json({
            state: -1,
            message: "No Lazy Data",
          });
        }
      }
    }
  );
}

async function saveNitcoEmployeeJson(jsondata, status) {
  /*let sampleJson = {
    "FName": "Tejpal",
    "LName": "Puthran",
    "W_Email": "",
    "P_Email": "",
    "Emp_Code": 107.0,
    "GENDER": "Male",
    "ReportTo_Name": "Reema Remy",
    "Contact_No": "7738184400",
    "Birth_Date": "24.09.1971",
    "Country": "India",
    "Location": "Thane",
    "Bus_Unit": "Real Estate",
    "Workforce": "NITCO",
    "Work_Location": "Thane",
    "Verticals": "",
    "Department": "Materials",
    "Designation": "Head - Procurement",
    "Employee_Shift": "",
    "HR_RepresentativeID": "",
    "Date_of_joining": "25.02.2008",
    "Date_of_confirmation": "",
    "Resource_Type": "",
    "Employee_Type": "",
    "Relieving_Date": "",
    "Cost_Center": "",
    "Portal_License": "Yes"
  }

  let sampleData2 = {

    "empcode": "107",
    "fname": "Tejpal",
    "lname": "Puthran",
    "officialemail": "TEJPALPUTHRAN@NITCO.IN",
    "personalemail": "TEJPALPUTHRAN@NITCO.IN",
    "gender": "Male",
    "dateofjoining": "2008-02-25",
    "costcenter": "180051050A",
    "contactnumber": "7738184400",
    "dateofbirth": "1971-09-24",
    "country": "India",
    "location": "Thane",
    "worklocation": "Thane",
    "departmentCode": "048",
    "departmentName": "Projects",
    "designation": "Dy.Manager-Commercial &Administration",
    "reportingmanager": "815",
    "businessunit": "Real Estate",
    "dateofconfirmation": "1900-01-01",
    "relievingdate": "1900-01-01",
    "portallicense": "YES"
  }
*/
  const newnow = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
  });
  try {
    if (!fs.existsSync(path.join(appRoot.path, "uploads/errorlogs"))) {
      fs.mkdirSync(path.join(appRoot.path, "uploads/errorlogs"));
    }
    var errlogfile = path.join(
      appRoot.path,
      "uploads/errorlogs",
      "nitcoservice.log"
    );
    log("Nitco active employee json service ," + newnow, errlogfile);
    if (!Object.keys(jsondata).length) {
      log("Nitco " + status + " data is empty ," + newnow, errlogfile);
      return "Empty data";
    } else {
      log(
        "Nitco " +
          status +
          " Data Length :" +
          Object.keys(jsondata["empdetails"]).length +
          " ," +
          newnow,
        errlogfile
      );
      var options = {
        method: "POST",
        rejectUnauthorized: false,
      };
      let domain = optionConfig.webUrlLink.substring(
        optionConfig.webUrlLink.indexOf("/") + 2,
        optionConfig.webUrlLink.indexOf(".")
      );
      var data = JSON.stringify({
        domain: domain,
      });
      options.path = "/getfeatures";
      options.data = data;
      headers = {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      };
      options.headers = headers;
      var licensedusers = 0;
      if (!fs.existsSync(path.join(appRoot.path, "uploads/jsonarrays"))) {
        fs.mkdirSync(path.join(appRoot.path, "uploads/jsonarrays"));
      }

      let finalArr = [];
      const filename = "nitcoEmployee" + status + ".json";
      let rawdata;
      var jsondataold = [];
      var filepath = path.join(appRoot.path, "uploads/jsonarrays", filename);
      if (fs.existsSync(filepath)) {
        //file exists
        rawdata = fs.readFileSync(filepath);
        let parsedata = JSON.parse(rawdata);
        jsondataold = parsedata; //["empdetails"]
      }

      var jsondatanew = jsondata["empdetails"];
      if (
        !fs.existsSync(filepath) &&
        !jsondataold &&
        !Object.keys(jsondataold).length
      ) {
        log("Write new json in file " + filepath + ", " + newnow, errlogfile);
        let userdata = JSON.stringify(jsondata["empdetails"]);
        fs.writeFileSync(filepath, userdata); //undo
      } else {
        log(
          "Update existing json in file " + filepath + ", " + newnow,
          errlogfile
        );
        const filterdrec = jsondatanew.filter(
          ({
            empcode,
            fname,
            lname,
            officialemail,
            personalemail,
            gender,
            dateofjoining,
            costcenter,
            contactnumber,
            dateofbirth,
            country,
            location,
            worklocation,
            departmentCode,
            departmentName,
            designation,
            reportingmanager,
            businessunit,
            dateofconfirmation,
            relievingdate,
            portallicense,
          }) =>
            !jsondataold.some(
              (exclude) =>
                exclude.empcode === empcode &&
                exclude.fname === fname &&
                exclude.lname === lname &&
                exclude.officialemail === officialemail &&
                exclude.personalemail === personalemail &&
                exclude.gender === gender &&
                exclude.dateofjoining === dateofjoining &&
                exclude.costcenter === costcenter &&
                exclude.contactnumber === contactnumber &&
                exclude.dateofbirth === dateofbirth &&
                exclude.country === country &&
                exclude.location === location &&
                exclude.worklocation === worklocation &&
                //exclude.departmentCode === departmentCode &&
                exclude.departmentName === departmentName &&
                exclude.designation === designation &&
                exclude.reportingmanager === reportingmanager &&
                exclude.businessunit === businessunit &&
                exclude.dateofconfirmation === dateofconfirmation &&
                exclude.relievingdate === relievingdate &&
                exclude.portallicense === portallicense
            )
        );
        finalArr.push(filterdrec);
        let userdata = JSON.stringify(jsondata["empdetails"]);
        fs.writeFileSync(filepath, userdata); //undo
      }

      let saturdayShift = [
        1154, 1155, 1170, 1540, 1653, 7921, 1548, 1245, 1374,
      ];
      _.each(saturdayShift, (value) => {
        jsondata["empdetails"] =
          jsondata["empdetails"] &&
          jsondata["empdetails"].filter(function (item) {
            if (item.empcode == value) {
              item["empshift"] = "Saturday Shift";
            }
            return item;
          });
      });
      var result1 = jsondata["empdetails"];
      let datesindex = [
        "dateofjoining",
        "dateofconfirmation",
        "relievingdate",
        "dateofbirth",
      ];
      let mandatoryfields = [
        "fname",
        "lname",
        "empcode",
        "gender",
        "reportingmanager",
        "country",
        "businessunit",
        "worklocation",
        "location",
        "departmentName",
        "designation",
        "dateofjoining",
        "empshift",
        "workforce",
      ];
      let emptyfields = [
        "personalemail",
        "contactnumber",
        "costcenter",
        "portallicense",
      ];
      let salesDepartments = [
        "Sales",
        "Franchise",
        "Trade Marketing",
        "Business Development",
      ];
      let saturdayDepartments = [
        "Accounts & Finance",
        "Administration",
        "Commercial",
        "CEO's Office,Corp. - Sales & Mktg.",
        "EDP",
        "Export",
        "HR",
        "International Business",
        "IT",
        "Legal",
        "Liaison & land acqui",
        "MD's Office",
        "Operations",
        "Procurement",
        "Sales Support",
        "Secretarial",
        "Taxation",
      ];
      let thaneDept = ["Projects", "Administration"];
      var countinvalid = 0;
      if (result1 && result1.length > 0) {
        _.each(result1, (item, index) => {
          _.forEach(item, (value, key) => {
            item[key.trim()] = value.toString().trim();
          });
          var salescategory = salesDepartments.includes(item["departmentName"]);
          var saturdayoff = saturdayDepartments.includes(
            item["departmentName"]
          );
          var thaneSatOff = thaneDept.includes(item["departmentName"]);
          if (
            salescategory &&
            item["location"] == "Kanjurmarg" &&
            item["Region"]
          ) {
            item["location"] = "Mumbai(Regional)";
          }
          if (item["location"] == "Silvassa" && item["Region"]) {
            item["location"] = "Gujrat(Silvassa)";
          }
          if (item["location"] == "Wankaner" && item["Region"]) {
            item["location"] = "Gujrat(Wankaner)";
          }

          /*
                   
          First shift       -  07.00 to15.00 (Silvassa)
          Second shift  - 15.00  to 23.00 (Silvassa)
          Third shift     -   23.00 to 07.00 (Silvassa)
          
          General Shift -  9.30  to 18.00 (Wankaner)
          Second  Shift   -  14.00 to 22.30 (Wankaner)  
            Second  Shift   -  14.00 to 22.30 (Wankaner)  
          Second  Shift   -  14.00 to 22.30 (Wankaner)  
            Second  Shift   -  14.00 to 22.30 (Wankaner)  
          Second  Shift   -  14.00 to 22.30 (Wankaner)  
                   */

          if (item["location"] == "Silvassa") {
            item["empshift"] = item["empshift"]
              ? item["empshift"]
              : "First shift,Second shift,Third shift";
          } else if (item["location"] == "Wankaner") {
            item["empshift"] = item["empshift"]
              ? item["empshift"]
              : "General Shift,Second  Shift";
          } else if (
            (item["location"] == "Kanjurmarg" && saturdayoff) ||
            (item["location"] == "Thane" && thaneSatOff)
          ) {
            item["empshift"] = item["empshift"]
              ? item["empshift"]
              : "Saturday Weekoff";
          } else {
            item["empshift"] = item["empshift"]
              ? item["empshift"]
              : "General Shift";
          }
          // if (item['relievingdate'] =='1900-01-01'){
          //   delete item['relievingdate'];
          // }
          item["workforce"] = "NITCO";
          item["contactnumber"] = item["contactnumber"]
            .replace(/\D/g, "")
            .toString();
          //   //console.log("contactnumber", item['contactnumber'])
          //item["departmentCode"] = item["departmentCode"].replace(/\D/g, "");
          //item["departmentCode"] = item["departmentCode"].toString();
          // //console.log("item['departmentCode']", item['departmentCode']);
          const emailRegexp =
            /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

          ////console.log(emailRegexp.test(emailToValidate));

          if (!emailRegexp.test(item["officialemail"])) {
            countinvalid = countinvalid + 1;
            delete item["officialemail"];
            errorloop = true;
          }
          _.each(datesindex, (id) => {
            if (item[id] == "") {
              delete item[id];
            } else {
              item[id] = moment(item[id], "DD.MM.YYYY").format("YYYY-MM-DD");
              if (item[id] == "1900-01-01") {
                delete item[id];
              }
            }
          });

          _.each(mandatoryfields, (id) => {
            if (item[id] == null) {
              errorloop = true;
              excelcolm = id + " in record no." + index;
            }
          });
          _.each(emptyfields, (id) => {
            if (item[id] == "") {
              delete item[id];
            }
          });
          if (item["location"] == "Gurgaon") {
            item["location"] = "Delhi / Gurgaon";
          }
          // if (item["worklocation"] == "Gurgaon") {
          item["worklocation"] = item["location"];
          // }
          if (
            item["gender"].toLowerCase() == "male" ||
            item["gender"].toLowerCase() == "m"
          ) {
            item["gender"] = "M";
          } else if (
            item["gender"].toLowerCase() == "female" ||
            item["gender"].toLowerCase() == "f"
          ) {
            item["gender"] = "F";
          } else {
            errorloop = true;
            excelcolm = "Gender in record " + index;
          }
          //  //console.log("portallicense",item["portallicense"])
          item["portallicenseyn"] = item["portallicense"].toLowerCase();
          //  //console.log("portallicenseyn", item["portallicenseyn"])
          if (
            item["portallicense"] == "Yes" ||
            item["portallicense"] == "yes"
          ) {
            item["portallicense"] = 1;
            licensedusers += 1;
          } else {
            item["portallicense"] = 0;
          }
          //   //console.log("lic",item[records[0].indexOf("portallicense")])
          if (!(item["portallicense"] == 0 || item["portallicense"] == 1)) {
            errorloop = true;
            excelcolm = "Portal License in record " + index;
          }
          //var password = Math.random().toString(36).substring(2);
          var random = Math.random().toString().substring(5);
          var token = crypto.createHash("sha1").update(random).digest("hex");
          const passwordHash = bcrypt.hashSync("India@123", 10);
          item.userpassword = passwordHash;
          item.resettoken = token;
        });
      }
      log(
        "Valid " + status + " json length " + result1.length + ", " + newnow,
        errlogfile
      );
      var groupedbyLicense = _.groupBy(result1, "portallicenseyn");
      let nonlicensearr = groupedbyLicense["no"] ? groupedbyLicense["no"] : [];
      let licensearr = groupedbyLicense["yes"] ? groupedbyLicense["yes"] : [];
      var proc = "";
      var objarr = [];
      //console.log("st", status);
      if (status == "Active") {
        proc = "call usp_nitcojson_upload(?,?)";
        objarr = licensearr;
      } else if (status == "Inactive") {
        proc = "call usp_nitcoinactivejson_upload(?,?)";
        objarr = nonlicensearr;
      }
      if (objarr.length > 0) {
        superadminController
          .commonfunc(options)
          .then((res33) => {
            if (res33) {
              let objaction = {
                action: "uploadmultipleuser",
                totallicense: 100000, // res33 && res33.expire && res33.expire[0]["usercount"],
                licensedusers: licensedusers,
              };
              commonModel.mysqlModelService(
                proc,
                [JSON.stringify(objarr), JSON.stringify(objaction)],
                function (err, results) {
                  if (err) {
                    console.log("err", err);
                    log("Write error " + err + ", " + newnow, errlogfile);
                    if (filepath) {
                      fs.unlink(filepath, function (err) {
                        if (err) {
                        }
                      });
                    }
                    //nitcoFailureNotification(err, "server");
                  }
                  if (results) {
                    console.log(results[0][0].overview);
                    log(
                      "Write result " + results[0][0].overview + ", " + newnow,
                      errlogfile
                    );
                    log(
                      "Write error empcodes " +
                        results[0][0].empcodes +
                        ", " +
                        newnow,
                      errlogfile
                    );
                    if (
                      results &&
                      results[0] &&
                      results[0][0] &&
                      results[0][0].empcodes
                    ) {
                      let errecodes = [];
                      errecodes =
                        results[0][0].empcodes &&
                        results[0][0].empcodes.split(",");
                      errecodes =
                        errecodes &&
                        errecodes.filter(function (el) {
                          return el != null;
                        });
                      let parsedjson = jsondata["empdetails"];
                      _.each(errecodes, (value) => {
                        parsedjson =
                          parsedjson &&
                          parsedjson.filter(function (item) {
                            return item.empcode !== value;
                          });
                      });
                      var updatejsonfile = JSON.stringify(parsedjson);
                      if (updatejsonfile) {
                        fs.writeFileSync(filepath, updatejsonfile);
                      }
                    }
                  }
                }
              );
            }
          })
          .catch((err) => {
            console.log("err", err);
            log(
              "err in retrieving total license " + err + ", " + newnow,
              errlogfile
            );
            if (filepath) {
              fs.unlink(filepath, function (err) {
                if (err) {
                  //console.log("err", err);
                }
              });
            }
            //############ nitcoFailureNotification(err, "server");
          });
      } else {
        console.log("No Updates");
        log("No updates" + ", " + newnow, errlogfile);
      }
    }
  } catch (err) {
    console.log("err", err);

    log("Inside Catch " + err + ", " + newnow, errlogfile);
    if (filepath) {
      fs.unlink(filepath, function (err) {
        if (err) {
        }
      });
    }
    //############ nitcoFailureNotification(err, "server");
    return err;
  }
}

function fusionEmployeeDataSync(userdata) {
  //console.log("fusion------->", userdata);
  let connection = mysql.createConnection(fusionconfig);
  var obj = commonCtrl.verifyNull(userdata);
  obj = JSON.stringify(obj);
  connection.query(
    "call usp_fusionvega_empsync(?)",
    [obj],
    (error, results) => {
      if (error) {
        //console.log(error.message);
        return console.error(error.message);
      }
      //console.log(results[0]);
    }
  );

  connection.end();
}

function getEmpShiftByDate(req, res) {
  try {
    if (!req.body.fromdate || !req.body.todate) {
      return res.json({
        state: -1,
        message: "Required Parameters are missing",
      });
    }
    let rq = req.body;
    rq.action = "shift_bydate";
    commonModel.mysqlModelService(
      "call usp_mstemployee_data(?)",
      [JSON.stringify(rq)],
      function (err, result) {
        if (err) {
          return res.json({
            state: -1,
            message: err || "Something went wrong",
          });
        } else {
          return res.json({
            state: 1,
            message: "Success",
            data: result[0],
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

function getEmployeeByID(req, res) {
  try {
    if (!req.body.employeeid) {
      return res.json({
        state: -1,
        message: "Employee ID is missing",
      });
    }
    let rq = req.body;
    rq.user_id = req.body.employeeid;
    rq.action = "getempby_id";
    commonModel.mysqlModelService(
      "call usp_mstemployee_data(?)",
      [JSON.stringify(rq)],
      function (err, result) {
        if (err) {
          return res.json({
            state: -1,
            message: err || "Something went wrong",
          });
        } else {
          return res.json({
            state: 1,
            message: "Success",
            data: result[0],
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

function empConfirmationReminder() {
  try {
    let rq = JSON.stringify({
      createdby: 1,
      action: "confirm_reminder",
    });
    commonModel
      .mysqlPromiseModelService("call usp_mstemployee_data(?)", [rq])
      .then((results) => {
        if (results[0] && results[0].length > 0) {
          let managerList = _.groupBy(results[0], "manageremail");
          let HRList = _.groupBy(results[0], "HRemail");

          //console.log("GRLISTT", HRList);
          //console.log("managerlist", managerList);
          async.eachSeries(
            Object.keys(managerList),
            (item) => {
              let subjecttype =
                "<Reminder> Employee Confirmation of your reportee(s) are due";
              let headingtype = "Details";
              let dsrBody = "";
              let counter = 1;
              managerList[item].forEach((user) => {
                let paragraph =
                  '<p class="message">' + "Confirmation Pending" + "</p>";
                let profilepic = "";
                let profilepath = path.join(
                  appRoot && appRoot.path,
                  "/uploads/" + user.profilepic
                );
                if (fs.existsSync(profilepath)) {
                  profilepic = config.webUrlLink + "/webapi/" + user.profilepic;
                } else {
                  profilepic =
                    config.webUrlLink + "/webapi/img/user-placeholder.png";
                }
                dsrBody +=
                  `<li style="display: list-item;text-align: -webkit-match-parent;border-bottom: 1px dotted #e6e6e6;padding-bottom: 10px;margin-bottom: 10px;position: relative;display: block;text-align: left;">
															    <img src="${profilepic}" class="user-profile-img" style="height: 45px;width: 45px;float: left;display: inline-block;border-radius: 50%;padding: 2px;background: #f7f7f7;border: 1px solid #e6e6e6;">
															    <div class="message_wrapper" style="margin-left: 50px;">
															      <h4 class="heading" style="font-size: 16px;font-weight: 600;margin: 0;cursor: pointer;line-height: 100%;">` +
                  user.username +
                  `</h4>
															      <p style="margin: 10px 0px;">` +
                  moment(user.proposedDOC).format("DD-MM-YYYY") +
                  `</p>
															      ` +
                  paragraph +
                  `
															    </div>
                          </li>`;
              });
              let emailObj = {
                email: item,
                mailType: "empconfirmation",
                subjectVariables: {
                  subject: subjecttype,
                },

                headingVariables: {
                  heading: headingtype,
                },

                bodyVariables: {
                  dsrMailBody: dsrBody,
                },
              };
              counter = counter + 1;
              setTimeout(() => {
                mailservice.mail(
                  emailObj,
                  function (err, response) {
                    cb();
                    if (err) {
                      //console.log(
                      // "error while sending confirmation reminder email to supervisors."
                      // );
                    }
                  },
                  counter * 3000
                );
              });
            },
            function (err) {
              if (err) {
                //console.log(
                //"error while sending confirmation reminder email to supervisors."
                //        );
              }
            }
          );
          async.eachSeries(
            Object.keys(HRList),
            (item) => {
              let subjecttype =
                "<Reminder> Confirmation of employee(s) are due";
              let headingtype = "Details";
              let dsrBody = "";
              let counter = 1;
              HRList[item].forEach((user) => {
                let paragraph =
                  '<p class="message">' + "Confirmation Pending" + "</p>";
                let profilepic = "";
                let profilepath = path.join(
                  appRoot && appRoot.path,
                  "/uploads/" + user.profilepic
                );
                if (fs.existsSync(profilepath)) {
                  profilepic = config.webUrlLink + "/webapi/" + user.profilepic;
                } else {
                  profilepic =
                    config.webUrlLink + "/webapi/img/user-placeholder.png";
                }
                dsrBody +=
                  `<li style="display: list-item;text-align: -webkit-match-parent;border-bottom: 1px dotted #e6e6e6;padding-bottom: 10px;margin-bottom: 10px;position: relative;display: block;text-align: left;">
															    <img src="${profilepic}" class="user-profile-img" style="height: 45px;width: 45px;float: left;display: inline-block;border-radius: 50%;padding: 2px;background: #f7f7f7;border: 1px solid #e6e6e6;">
															    <div class="message_wrapper" style="margin-left: 50px;">
															      <h4 class="heading" style="font-size: 16px;font-weight: 600;margin: 0;cursor: pointer;line-height: 100%;">` +
                  user.username +
                  `</h4>
															      <p style="margin: 10px 0px;">` +
                  moment(user.proposedDOC).format("DD-MM-YYYY") +
                  `</p>
															      ` +
                  paragraph +
                  `
															    </div>
                          </li>`;
              });
              let emailObj = {
                email: item,
                mailType: "empconfirmation",
                subjectVariables: {
                  subject: subjecttype,
                },

                headingVariables: {
                  heading: headingtype,
                },

                bodyVariables: {
                  dsrMailBody: dsrBody,
                },
              };

              counter = counter + 1;
              setTimeout(() => {
                mailservice.mail(
                  emailObj,
                  function (err, response) {
                    cb();
                    if (err) {
                      //console.log(
                      // "error while sending confirmation reminder email to HR."
                      // );
                    }
                  },
                  counter * 3000
                );
              });
            },
            function (err) {
              if (err) {
                //console.log(
                // "error while sending confirmation reminder email to HR."
                // );
              }
            }
          );
        } else {
          //console.log("No record for confirmation reminder email ");
        }
      })
      .catch((err) => {
        //console.log("SOmething went wrong", err);
      });
  } catch (err) {
    //console.log("Something went wrong in emp Confirmation Reminder", err);
  }
}

async function nitcoFailureNotification(error, type) {
  try {
    //console.log("noti", error);
    //console.log("noti1", type);

    const transporter = nodemailer.createTransport({
      pool: true,
      service: config.mailconfig && config.mailconfig.service,
      auth: {
        user: config.mailconfig && config.mailconfig.user,
        pass: config.mailconfig && config.mailconfig.password,
      },
    });

    if (type == "client") {
      var emails = "nivedita.verma@polestarllp.com";
    } else if (type == "server") {
      var emails = "nivedita.verma@polestarllp.com";
    }
    let info = await transporter.sendMail({
      from: '"Nitco-Vega" <Support@nitco.vega-hr.com>',
      to: emails,
      cc: "nivedita.verma@polestarllp.com",
      subject: "Employee Data Api Faliure",
      text: "Error while syncing employee data /n" + error,
    });

    //console.log("Message sent: %s", info.messageId);
  } catch {
    console.error;
  }
}

async function generateSalarySlip(req, res) {
  let weburl = config.webUrlLink
    .split(".")
    .slice(0, -2)
    .join(".")
    .slice(config.webUrlLink.indexOf(":") + 3);
  if (weburl !== "mawai") {
    return res.json({
      state: -1,
      message: "Access Denied!",
    });
  }
  if (req.body.ecode && req.body.ecode != req.body.tokenFetchedData.ecode) {
    //Check if login user is admin
    try {
      let rq = {
        createdby: req.body.createdby,
        modulename: "Payslip",
        action: "module_role",
      };
      let [result] = await query("call usp_mstuser_data(?)", [
        JSON.stringify(rq),
      ]);
      if (result[0] && result[0].role && result[0].role == "USER") {
        throw Error("User Unauthorize!");
      }
    } catch (err) {
      return res.json({
        state: -1,
        message: err.message || err || "Something went wrong!",
      });
    }
  }
  req.setTimeout(300 * 1000);
  let d = new Date();
  let prvmonth;
  let prvmonthid;
  let prvyear;
  let guid = req.body.tokenFetchedData.guid;
  if (new Date().getDate() < 7) {
    prvmonth = moment().subtract(2, "month").format("MMM");
    prvmonthid = moment().subtract(2, "month").format("MM");
    prvyear = new Date(d.setMonth(d.getMonth() - 2)).getFullYear().toString();
  } else {
    prvmonth = moment().subtract(1, "month").format("MMM");
    prvmonthid = moment().subtract(1, "month").format("MM");
    prvyear = new Date(d.setMonth(d.getMonth() - 1)).getFullYear().toString();
  }

  let month =
    (req.body &&
      req.body.monthyear &&
      req.body.monthyear.split(" ") &&
      req.body.monthyear.split(" ")[0] &&
      req.body.monthyear.split(" ")[0].toUpperCase()) ||
    prvmonth;
  let year =
    (req.body &&
      req.body.monthyear &&
      req.body.monthyear.split(" ") &&
      req.body.monthyear.split(" ")[1]) ||
    prvyear;
  let ecode = req.body.ecode || (req.body && req.body.tokenFetchedData.ecode); //'SWE024'

  // let rq = { month: prvmonthid, year, ecode, action: "leave_emp_month" };
  // let [leaveType, leaveTaken] = await query("call usp_leave_reports(?)", [
  //   JSON.stringify(rq),
  // ]);

  // let leaveArr = leaveType.map((item) => {
  //   let index = leaveTaken.findIndex((l) => l.leaveid == item.leaveid);
  //   if (index > -1) {
  //     item.leavetaken = leaveTaken[index].leavetaken;
  //   } else {
  //     item.leavetaken = 0;
  //   }
  //   return item;
  // });

  var reqdata = {
    eng_cd: ecode, //req.body && req.body.tokenFetchedData.ecode,
    month: month,
    year: year,
  };

  if (!fs.existsSync(path.join(appRoot.path, "uploads/mawaisalaryslip"))) {
    fs.mkdirSync(path.join(appRoot.path, "uploads/mawaisalaryslip"));
  }
  let method = "post";
  let url = "http://vegahr.mawaiweb.com/api/Employee/salaryslip";
  let data = reqdata;
  let encEcode = Buffer.from(ecode).toString("hex");
  axios({
    method,
    url,
    data,
  })
    .then(async (jsondata) => {
      const contentfilename = "mawaisalaryslip".concat(".html").toLowerCase();
      const contentfilepath = path.join(
        appRoot.originalPath,
        "assets",
        "mailtemplate",
        "contenttype",
        contentfilename
      );
      var contentread = fs.readFileSync(contentfilepath).toString();
      if (!fs.existsSync(contentfilepath)) {
        throw new Error("Template Not Found");
      }
      if (contentread) {
        let logo;
        logo = config.webUrlLink + "/webapi/" + "img/mawailogo.jpg";
        var salaryData =
          jsondata["data"] && jsondata["data"].data && jsondata["data"].data[0];
        if (salaryData && salaryData.year) {
          salaryData["total_total_earning"] =
            parseFloat(salaryData["total_earning_earn"]) +
            parseFloat(salaryData["total_earning_arrear"]);
          salaryData["total_total_deduction"] =
            parseFloat(salaryData["total_deduction_amount"]) +
            parseFloat(salaryData["total_deduction_arrear"]);
          salaryData["salary_words"] = utils.numberInWords(
            parseFloat(salaryData["net_salary_payable"])
          );
          salaryData["amount_words"] = utils.numberInWords(
            parseFloat(salaryData["amount_credited"])
          );

          let paramArr = _.keys(salaryData);

          paramArr.forEach((item) => {
            if (!isNaN(salaryData[item])) {
              salaryData[item] = parseFloat(salaryData[item]);
            }
          });

          let earningArr = [
            "basic",
            "hra",
            "standard_ded",
            "unif_allow",
            "convey_reimb",
            "attd_allow",
            "tele_allow",
            "assist_allow",
            "trans_allow",
            "spl_allow",
            "exp_reimb",
            "others_allow",
          ];
          let dedArr = [
            "employee_pf_ded",
            "employer_pf_ded",
            "employee_esi_ded",
            "employer_esi_ded",
            "salary_advance_ded",
            "loan_ded",
            "tds_ded",
            "med_ins_ded",
            "other_ded",
          ];
          let workAttributes = [
            "ab_day",
            "pr_day",
            "wo_day",
            "cl_day",
            "em_day",
            "lw_day",
            "pl_day",
            "ml_day",
            "co_day",
            "fo_day",
            "ho_day",
            "sl_day",
            "cp_day",
            "mg_day",
            "pt_day",
            "sh_day",
            "ot_day",
            "nh_day",
          ];
          let workArr = [];
          let workIndex = 0;
          workAttributes.map((work) => {
            if (salaryData[`${work}`]) {
              workArr[workIndex] = {};
              workArr[workIndex].name = work.replace("_day", "").toUpperCase();
              workArr[workIndex].count = salaryData[`${work}`];
              workIndex++;
            }
          });

          let salaryArr = [];

          let index = 0;
          earningArr.map((item) => {
            if (salaryData[`${item}_earn`]) {
              salaryArr[index] = {};
              salaryArr[index].head = item.replace(/_/g, " ").toUpperCase(); //salaryData[`${item}_name`];
              salaryArr[index].rate = salaryData[`${item}_rate`];
              salaryArr[index].eamount = salaryData[`${item}_earn`];
              salaryArr[index].earrear = salaryData[`${item}_arrear`];
              salaryData[`${item}_total`] = salaryArr[index].total_e =
                parseFloat(salaryData[`${item}_earn`]) +
                parseFloat(salaryData[`${item}_arrear`]);
              index++;
            }
          });

          let index2 = 0;
          dedArr.map((item) => {
            if (salaryData[item]) {
              if (!salaryArr[index2]) {
                salaryArr[index2] = {};
              }
              salaryArr[index2].deductions = item
                .replace(/_/g, " ")
                .replace("employee", "")
                .replace("ded", "")
                .toUpperCase(); //salaryData[`${item}_name`]
              salaryArr[index2].damount = salaryData[`${item}`];
              salaryArr[index2].darrear = salaryData[`${item}_arrear`];
              salaryData[`${item}_total`] = salaryArr[index2].total_d =
                parseFloat(salaryData[`${item}`]) +
                parseFloat(salaryData[`${item}_arrear`]);
              index2++;
            }
          });

          let salaryAttribute = [];
          salaryArr.map((item) => {
            salaryAttribute.push(`
            <tr>
          <td style="font-family: arial;border: none;border-left: 1px solid #000;border-right: 1px solid #000;font-size: 12px;padding: 5px 5px; text-align:left;">${
            item.head ? item.head : " "
          }</td>
          <td style="font-family: arial;border: none;border-left: 1px solid #000;border-right: 1px solid #000;font-size: 12px;padding: 5px 5px; text-align:right;">${
            item.rate ? parseInt(item.rate).toLocaleString() : " "
          }</td>
          <td style="font-family: arial;border: none;border-left: 1px solid #000;border-right: 1px solid #000;font-size: 12px;padding: 5px 5px; text-align:right;">${
            item.eamount ? parseInt(item.eamount).toLocaleString() : " "
          }</td>
          <td style="font-family: arial;border: none;border-left: 1px solid #000;border-right: 1px solid #000;font-size: 12px;padding: 5px 5px; text-align:right;">${
            item.earrear || item.earrear == 0
              ? parseInt(item.earrear).toLocaleString()
              : " "
          }</td>
          <td style="font-family: arial;border: none;border-left: 1px solid #000;border-right: 1px solid #000;font-size: 12px;padding: 5px 5px; text-align:right;">${
            item.total_e ? parseInt(item.total_e).toLocaleString() : " "
          }</td>
          <td style="font-family: arial;border: none;border-left: 1px solid #000;border-right: 1px solid #000;font-size: 12px;padding: 5px 5px; text-align:center;">${
            item.deductions ? item.deductions : " "
          }</td>
          <td style="font-family: arial;border: none;border-left: 1px solid #000;border-right: 1px solid #000;font-size: 12px;padding: 5px 5px; text-align:right;">${
            item.damount ? parseInt(item.damount).toLocaleString() : " "
          }</td>
          <td style="font-family: arial;border: none;border-left: 1px solid #000;border-right: 1px solid #000;font-size: 12px;padding: 5px 5px; text-align:right;">${
            item.darrear || item.darrear == 0
              ? parseInt(item.darrear).toLocaleString()
              : " "
          }</td>
          <td style="font-family: arial;border: none;border-left: 1px solid #000;border-right: 1px solid #000;font-size: 12px;padding: 5px 5px; text-align:right;">${
            item.total_d ? parseInt(item.total_d).toLocaleString() : " "
          }</td>

          </tr>`);
          });

          //   let leaveAttribute = [];
          //   leaveArr.map((item) => {
          //     leaveAttribute.push(`
          // <tr>
          // <td style="font-family: arial; font-size: 12px;font-weight: 600;padding: 1px 5px;">${item.leavetype}</td>
          // <td style="font-family: arial; font-size: 12px;font-weight: 400;padding: 1px 5px;">-</td>
          // <td style="font-family: arial; font-size: 12px;font-weight: 400;padding: 1px 5px;">${item.leavetaken}</td>
          // <td style="font-family: arial; font-size: 12px;font-weight: 400;padding: 1px 5px;">-</td>
          //   </tr>`);
          //   });

          let workHTML = [];
          workArr.map((item) => {
            workHTML.push(`
            <tr>
                    <td
                      style="
                        font-family: arial;
                        font-size: 12px;
                        font-weight: 600;
                        padding: 0px 5px;
                      "
                    >
                      ${item.name}
                    </td>
                    <td
                      style="
                        font-family: arial;
                        font-size: 12px;
                        font-weight: 600;
                        padding: 0px 5px;
                      "
                    >
                      ${item.count}
                    </td>
                  </tr>`);
          });

          paramArr = _.keys(salaryData);
          paramArr.forEach((item) => {
            let match = new RegExp("\\b" + item + "\\b", "g");
            if (item == "doj") {
              salaryData[item] = moment(salaryData[item]).format("DD-MMM-YY");
            }

            if (
              !isNaN(salaryData[item]) &&
              salaryData[item] != " " &&
              !(
                item == "year" ||
                item == "pf_no" ||
                item == "bank_ac_no" ||
                item == "uan_no" ||
                item == "pan_no" ||
                item == "adhaar_no"
              )
            ) {
              salaryData[item] = parseFloat(salaryData[item]).toLocaleString();
            }
            if (item == "year") {
              salaryData[item] = parseInt(salaryData[item]);
            }
            salaryData[item] =
              salaryData[item] || salaryData[item] == 0 ? salaryData[item] : "";
            contentread = contentread.replace(match, salaryData[item]);
          });

          contentread = contentread.replace("trxmawailogo", logo);
          contentread = contentread.replace(
            "salaryAttribute",
            salaryAttribute.join(",").replace(/<\/tr>,/g, "</tr>")
          );
          // contentread = contentread.replace(
          //   "leaveAttribute",
          //   leaveAttribute.join(",").replace(/<\/tr>,/g, "</tr>")
          // );
          contentread = contentread.replace(
            "workHTML",
            workHTML.join(",").replace(/<\/tr>,/g, "</tr>")
          );

          let htmloptions = {
            format: "A2",
          };
          let filepath = path.join(
            "mawaisalaryslip",
            encEcode + "_" + month + "_" + year + "_" + guid + ".pdf"
          );

          htmlpdf
            .create(contentread, htmloptions)
            .toFile(
              path.resolve(appRoot.path, `uploads/${filepath}`),
              function (err, response) {
                if (err) {
                  return res.json({
                    meesage: err,
                    state: -1,
                    data: null,
                  });
                }
                return res.json({
                  message: "success",
                  state: 1,
                  data: salaryData,
                  filepath,
                });
              }
            );
        } else {
          return res.json({
            message: "Payslip Not Generated for Selected Month",
            state: -1,
          });
        }
      }
    })
    .catch((err) => {
      //console.log("err", err);
      return res.json({
        state: -1,
        message: "Something went wrong",
      });
    });
}

function deactivatedEmployeeExcel(req, res) {
  try {
    req.setTimeout(1000 * 60 * 20);
    ////console.log("req",req.body)
    if (!req.files) {
      return res.json({
        state: -1,
        message: "No File uploaded",
      });
    } else {
      if (!fs.existsSync(path.join(appRoot.path, "uploads/employeeexcel"))) {
        fs.mkdirSync(path.join(appRoot.path, "uploads/employeeexcel"));
      }
      let timestamp = Date.now();
      var sampleFile = {};
      sampleFile = req.files["file"]; // //console.log("sampleFile", sampleFile)
      if (
        sampleFile &&
        sampleFile.name &&
        path.extname(sampleFile.name) == ".xlsx"
      ) {
        let filepath = path.join(
          appRoot.path,
          "uploads/employeeexcel",
          timestamp + sampleFile.name
        );
        sampleFile.mv(filepath, (err) => {
          if (err) {
            //console.log("err", err);
            return res.json({
              state: -1,
              message: err.message || err,
            });
          }
          var employeeArr = [];
          let workbook = xlsx.readFile(filepath, {
            cellDates: true,
            cellNF: false,
            cellText: false,
          });
          let sheet_name_list = workbook.SheetNames;
          let records = xlsx.utils.sheet_to_json(
            workbook.Sheets[sheet_name_list[0]],
            {
              header: 1,
              blankrows: false,
              raw: false,
            }
          );
          // { header: 1, skipHeader:true, blankrows: false, raw: false, dateNF: 'yyyy-mm-dd hh:mm:ss' });

          if (records && records && records[0].length != 3) {
            //console.log("err", records[0].length);
            return res.json({
              state: -1,
              message: "Some columns are missing in excel file",
            });
          } else if (records && records.length == 0) {
            return res.json({
              state: -1,
              message: "Empty File(s), No Record parsed",
            });
          } else if (records && records.length > 1000) {
            return res.json({
              state: -1,
              message: "Maximum 1000 records are allowed",
            });
          }

          //        //console.log("rec",(records[0].toString()).replace(/[()#!@%^&*=_./]/g, '').replace(/[+-]/g, '').replace(/\s/g, '').toLowerCase())
          records[0] = records[0]
            .toString()
            .replace(/ *\([^)]*\) */g, "")
            .replace(/[()#!@%^&*=_./]/g, "")
            .replace(/[+-]/g, "")
            .replace(/\s/g, "")
            .toLowerCase()
            .split(",");
          ////console.log("rec",records[0][23]);
          // let keyarr = (records[0].toString());
          // //console.log("keyarr",keyarr)
          var keycount = records[0].length;
          let objprep = [];
          var errorloop = false;
          var excelcolm;
          let datesindex = [];
          let mandatoryfields = [];
          datesindex.push(records[0].indexOf("relievingdate"));
          mandatoryfields.push(records[0].indexOf("relievingdate"));
          mandatoryfields.push(records[0].indexOf("email"));
          mandatoryfields.push(records[0].indexOf("ecode"));

          if (records && records.length > 0) {
            _.each(records, (item, index) => {
              if (index > 0) {
                _.each(datesindex, (id) => {
                  item[id] = moment(
                    item[id],
                    ["DD.MM.YYYY", "YYYY-MM-DD", "DD-MM-YYYY"],
                    true
                  ).isValid()
                    ? moment(item[id], "DD.MM.YYYY").format("YYYY-MM-DD")
                    : "";
                  if (item[id] == "") {
                    delete item[id]; //DOB
                  }
                });
                _.each(mandatoryfields, (id) => {
                  if (item[id] == null) {
                    errorloop = true;
                    excelcolm = records[0][id];
                  }
                });

                objprep.push({
                  emailid: item[records[0].indexOf("email")],
                  empcode: item[records[0].indexOf("ecode")],
                  relievingdate: item[records[0].indexOf("relievingdate")],
                });
              }
            });
          }
          records.shift();
          employeeArr = employeeArr.concat(records);
          if (errorloop == false) {
            let hasDuplicates =
              objprep.map((v) => v.empcode).length >
              new Set(objprep.map((v) => v.empcode)).size
                ? true
                : false;

            if (hasDuplicates) {
              return res.json({
                state: -1,

                message: "Duplicate Ecode are not allowed!",

                data: null,
              });
            }

            fs.unlink(filepath, function (err) {
              if (err) {
                //console.log("err", err);
              }
            });

            req.body.createdby = req.body.createdby;
            req.body.action = "deactivatemultipleuser";
            let objaction = req.body;
            commonModel.mysqlModelService(
              "call usp_employeexls_deactivate(?,?)",
              [JSON.stringify(objprep), JSON.stringify(objaction)],
              function (err, result) {
                if (err) {
                  //console.log("err", err);

                  return res.json({
                    state: -1,
                    message: err.message || err,
                  });
                } else {
                  return res.json({
                    state: 1,
                    message: result[0][0]["overview"],
                    data: result,
                  });
                }
              }
            );
          } else {
            return res.json({
              state: -1,
              message: excelcolm + " contains empty or invalid data",
            });
          }
        });
      } else {
        return res.json({
          state: -1,
          message: "Unsupported file format.Required .xlsx file format",
        });
      }
    }
  } catch (err) {
    return res.json({
      state: -1,
      message: err.message || err,
    });
  }
}

function supervisorEmployeeExcel(req, res) {
  try {
    req.setTimeout(1000 * 60 * 20);
    ////console.log("req",req.body)
    if (!req.files) {
      return res.json({
        state: -1,
        message: "No File uploaded",
      });
    } else {
      if (!fs.existsSync(path.join(appRoot.path, "uploads/employeeexcel"))) {
        fs.mkdirSync(path.join(appRoot.path, "uploads/employeeexcel"));
      }
      let timestamp = Date.now();
      var sampleFile = {};
      sampleFile = req.files["file"]; // //console.log("sampleFile", sampleFile)
      if (
        sampleFile &&
        sampleFile.name &&
        path.extname(sampleFile.name) == ".xlsx"
      ) {
        let filepath = path.join(
          appRoot.path,
          "uploads/employeeexcel",
          timestamp + sampleFile.name
        );
        sampleFile.mv(filepath, (err) => {
          if (err) {
            //console.log("err", err);
            return res.json({
              state: -1,
              message: err.message || err,
            });
          }
          var employeeArr = [];
          let workbook = xlsx.readFile(filepath, {
            cellDates: true,
            cellNF: false,
            cellText: false,
          });
          let sheet_name_list = workbook.SheetNames;
          let records = xlsx.utils.sheet_to_json(
            workbook.Sheets[sheet_name_list[0]],
            {
              header: 1,
              blankrows: false,
              raw: false,
            }
          );
          // { header: 1, skipHeader:true, blankrows: false, raw: false, dateNF: 'yyyy-mm-dd hh:mm:ss' });

          if (records && records && records[0].length != 3) {
            return res.json({
              state: -1,
              message: "Some columns are missing in excel file",
            });
          } else if (records && records.length == 0) {
            return res.json({
              state: -1,
              message: "Empty File(s), No Record parsed",
            });
          } else if (records && records.length > 1000) {
            return res.json({
              state: -1,
              message: "Maximum 1000 records are allowed",
            });
          }

          //        //console.log("rec",(records[0].toString()).replace(/[()#!@%^&*=_./]/g, '').replace(/[+-]/g, '').replace(/\s/g, '').toLowerCase())
          records[0] = records[0]
            .toString()
            .replace(/ *\([^)]*\) */g, "")
            .replace(/[()#!@%^&*=_./]/g, "")
            .replace(/[+-]/g, "")
            .replace(/\s/g, "")
            .toLowerCase()
            .split(",");
          ////console.log("rec",records[0][23]);
          // let keyarr = (records[0].toString());
          // //console.log("keyarr",keyarr)
          var keycount = records[0].length;
          let objprep = [];
          var errorloop = false;
          var excelcolm;
          let mandatoryfields = [];
          mandatoryfields.push(records[0].indexOf("managerecode"));
          mandatoryfields.push(records[0].indexOf("employeeemail"));
          mandatoryfields.push(records[0].indexOf("employeeecode"));

          if (records && records.length > 0) {
            _.each(records, (item, index) => {
              if (index > 0) {
                _.each(mandatoryfields, (id) => {
                  if (item[id] == null) {
                    errorloop = true;
                    excelcolm = records[0][id];
                  }
                });

                objprep.push({
                  emailid: item[records[0].indexOf("employeeemail")],
                  empcode: item[records[0].indexOf("employeeecode")],
                  managerecode: item[records[0].indexOf("managerecode")],
                });
              }
            });
          }
          records.shift();
          employeeArr = employeeArr.concat(records);

          //  //console.log("lop",datesindex)
          var duplicateexist = true; //errorloop = true;
          if (errorloop == false) {
            ////console.log("objprep", objprep)
            var parsed = objprep;
            var empcodearr = [];
            for (var i in parsed) {
              var empcode = parsed[i].empcode; // //console.log(empcode)
              var email = parsed[i].emailid; ////console.log(email)
              if (
                !empcodearr.includes(empcode) &&
                !empcodearr.includes(email)
              ) {
                empcodearr.push(empcode);
                empcodearr.push(email);
              } else {
                // //console.log(empcode)
                // //console.log(email)
                //console.log("duplicate found");
                duplicateexist = false;
              }
            }
            ////console.log("has", empcodearr)
            if (duplicateexist == false) {
              return res.json({
                state: -1,
                message:
                  "Duplicate Employee code or Employee email are not allowed.Must be unique",
              });
            }

            fs.unlink(filepath, function (err) {
              if (err) {
                //console.log("err", err);
              }
            });
            req.body.createdby = req.body.createdby;

            req.body.action = "updatemasssupervisor";

            let objaction = req.body;
            commonModel.mysqlModelService(
              "call usp_supervisor_massupdate(?,?)",
              [JSON.stringify(objprep), JSON.stringify(objaction)],
              function (err, result) {
                if (err) {
                  //console.log("err", err);

                  return res.json({
                    state: -1,
                    message: err.message || err,
                  });
                } else {
                  return res.json({
                    state: 1,
                    message: result[0][0]["overview"],
                    data: result,
                  });
                }
              }
            );
          } else {
            return res.json({
              state: -1,
              message: excelcolm + " contains empty or invalid data",
            });
          }
        });
      } else {
        return res.json({
          state: -1,
          message: "Unsupported file format.Required .xlsx file format",
        });
      }
    }
  } catch (err) {
    return res.json({
      state: -1,
      message: err.message || err,
    });
  }
}

function employeetaxoperation(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      state: -1,
      message: "Required parameters are missing",
      data: null,
    });
  }
  var obj = req.body;
  commonModel.mysqlModelService(
    "call usp_mstemployee_data(?)",
    [JSON.stringify(obj)],
    function (err, results) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
        });
      }
      return res.json({
        state: 1,
        message: "success",
        data: results,
      });
    }
  );
}

/**
  {"FirstName":"MAHANAND","LastName":"YADAV","OfficialEmail":"mahanand.yadav@falconautoonline.com",
  "Employeecode":"FA-931","Dateofbirth":"12.06.1987","Gender":"M","ReportingTo":"FA-934",
  "ContactNumber":"8795361140","Dateofconfirmation":"17.09.2020","Country":"India",
  "Location":"Noida Sector 16","BusinessUnit":"","Workforce":"",
  "PortalLicense":"","Department":"Installation","Designation":"Engineer",
  "Dateofjoining":"17.03.2020","Role":"Installation//M. Engineer",
  "TaxSlab":"30","ActiveEmployee":"Yes","RelievingDate":"",
  "TypeofRelieving":"","AllowLoginOnDeactivate":"No","ModuleAllowOnDeactivate":"ESOP"}
 * @param {array} jsondata 
 * @param {string} client 
 * @returns 
 */

function clientWiseEmployeeSync(jsondata, client, apiurl) {
  try {
    const newnow = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    if (!fs.existsSync(path.join(appRoot.path, "uploads/errorlogs"))) {
      fs.mkdirSync(path.join(appRoot.path, "uploads/errorlogs"));
    }
    var errlogfile = path.join(
      appRoot.path,
      "uploads/errorlogs",
      "clientempapiservice.log"
    );
    //console.log("Json Length", Object.keys(jsondata[0]));
    log("Client employee json service ," + newnow, errlogfile);
    if (!jsondata.length) {
      //console.log("Json Length", Object.keys(jsondata));
      log("Json data is empty ," + newnow, errlogfile);
      return;
    } else {
      log(
        "Total Json  Data Length :" + jsondata.length + " ," + newnow,
        errlogfile
      );

      var result1 = jsondata;

      var errorloop = false;
      var excelcolm;
      let datesindex = [
        "Dateofjoining",
        "Dateofconfirmation",
        "RelievingDate",
        "Dateofbirth",
      ];
      let mandatoryfields = [
        "FirstName",
        "LastName",
        "OfficialEmail",
        "Employeecode",
        "Gender",
        "ReportingTo",
        //"Country",
        //"BusinessUnit",
        //"worklocation",
        "Location",
        "Department",
        "Designation",
        "Dateofjoining",
        //"EmployeeShift",
        //"Workforce",
        "ActiveEmployee",
      ];
      let emptyfields = [
        // "Workforce",
        // "Country",
        // "BusinessUnit",
        // "worklocation",
        //"personalemail",
        "ContactNumber",
        //"costcenter",
        "PortalLicense",
        "TaxSlab",
        "TypeofRelieving",
        "AllowLoginOnDeactivate",
        "ModuleAllowOnDeactivate",
        "Role",
      ];

      //console.log("result1.length", result1.length);
      var countinvalid = 0;
      let dummyEmpArr = []; //new Array();
      if (result1 && result1.length > 0) {
        _.each(result1, (item, index) => {
          // if (index < 1) {
          var dummyEmpArrSub = [];
          _.forEach(item, (value, key) => {
            if (key.toLowerCase().indexOf("firstname") != -1) {
              key = "FirstName";
              item[key] = value && value.trim();
            } else if (key.toLowerCase().indexOf("lastname") != -1) {
              key = "LastName";
              item[key] = value && value.trim();
            } else if (key.toLowerCase().indexOf("officialemail") != -1) {
              key = "OfficialEmail";
              item[key] = value && value.trim();
            } else if (key.toLowerCase().indexOf("employeecode") != -1) {
              key = "Employeecode";
              item[key] = value && value.trim();
            } else if (key.toLowerCase().indexOf("gender") != -1) {
              key = "Gender";
              item[key] = value && value.trim();
            } else if (key.toLowerCase().indexOf("dateofbirth") != -1) {
              key = "Dateofbirth";
              item[key] = value && value.trim();
            } else if (key.toLowerCase().indexOf("reportingto") != -1) {
              key = "ReportingTo";
              item[key] = value && value.trim();
            } else if (key.toLowerCase().indexOf("contactnumber") != -1) {
              key = "ContactNumber";
              item[key] = value && value.trim();
            } else if (key.toLowerCase().indexOf("businessunit") != -1) {
              key = "BusinessUnit";
              item[key] = value && value.trim();
            } else if (key.toLowerCase().indexOf("dateofconfirmation") != -1) {
              key = "Dateofconfirmation";
              item[key] = value && value.trim();
            } else if (key.toLowerCase().indexOf("country") != -1) {
              key = "Country";
              item[key] = value && value.trim();
            } else if (key.toLowerCase().indexOf("workforce") != -1) {
              key = "Workforce";
              item[key] = value && value.trim();
            } else if (key.toLowerCase().indexOf("portallicense") != -1) {
              key = "PortalLicense";
              item[key] = value && value.trim();
            } else if (key.toLowerCase().indexOf("department") != -1) {
              key = "Department";
              item[key] = value && value.trim();
            } else if (key.toLowerCase().indexOf("designation") != -1) {
              key = "Designation";
              item[key] = value && value.trim();
            } else if (key.toLowerCase().indexOf("dateofjoining") != -1) {
              key = "Dateofjoining";
              item[key] = value && value.trim();
            } else if (key.toLowerCase().indexOf("role") != -1) {
              key = "Role";
              item[key] = value && value.trim();
            } else if (key.toLowerCase().indexOf("taxslab") != -1) {
              key = "TaxSlab";
              item[key] = value && value.trim();
            } else if (key.toLowerCase().indexOf("activeemployee") != -1) {
              key = "ActiveEmployee";
              item[key] = value && value.trim();
            } else if (key.toLowerCase().indexOf("relievingdate") != -1) {
              key = "RelievingDate";
              item[key] = value && value.trim();
            } else if (key.toLowerCase().indexOf("typeofrelieving") != -1) {
              key = "TypeofRelieving";
              item[key] = value && value.trim();
            } else if (
              key.toLowerCase().indexOf("allowloginondeactivate") != -1
            ) {
              key = "AllowLoginOnDeactivate";
              item[key] = value && value.trim();
            } else if (
              key.toLowerCase().indexOf("moduleallowondeactivate") != -1
            ) {
              key = "ModuleAllowOnDeactivate";
              item[key] = value && value.trim();
            } else if (key.toLowerCase().indexOf("location") != -1) {
              key = "Location";
              item[key] = value && value.trim();
            } else if (key.toLowerCase().indexOf("shift") != -1) {
              key = "EmployeeShift";
              item[key] = value && value.trim();
            }
            // if (key && value) {
            //   item[key.trim()] = value && value.trim();
            // }
          });
          if (client == "falcon") {
            item["Workforce"] = "Falcon";
          }

          item["ContactNumber"] =
            item["ContactNumber"] &&
            item["ContactNumber"].replace(/\D/g, "").toString();
          const emailRegexp =
            /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

          ////console.log(emailRegexp.test(emailToValidate));

          if (
            !emailRegexp.test(item["OfficialEmail"] && item["OfficialEmail"])
          ) {
            countinvalid = countinvalid + 1;
            delete item["OfficialEmail"];
            errorloop = true;
          }

          _.each(datesindex, (id) => {
            if (item[id]) {
              item[id] = moment(
                item[id],
                ["DD.MM.YYYY", "DD-MM-YYYY", "DD/MM/YYYY"],
                true
              ).isValid()
                ? moment(item[id], "DD.MM.YYYY").format("YYYY-MM-DD") ||
                  moment(item[id], "DD-MM-YYYY").format("YYYY-MM-DD") ||
                  moment(item[id], "DD/MM/YYYY").format("YYYY-MM-DD")
                : moment(item[id], ["YYYY-MM-DD"], true).isValid()
                ? item[id]
                : "";
            }
            if (item[id] == "") {
              delete item[id]; //DOB
            }
          });
          _.each(mandatoryfields, (id) => {
            if (!item[id]) {
              errorloop = true;
              excelcolm = id + " in record no." + index;
            }
          });
          _.each(emptyfields, (id) => {
            if (!item[id]) {
              delete item[id];
            }
          });

          if (
            item["Gender"] &&
            (item["Gender"].toLowerCase() == "male" ||
              item["Gender"].toLowerCase() == "Male" ||
              item["Gender"].toLowerCase() == "m")
          ) {
            item["Gender"] = "M";
          } else if (
            item["Gender"] &&
            (item["Gender"].toLowerCase() == "female" ||
              item["Gender"].toLowerCase() == "Female" ||
              item["Gender"].toLowerCase() == "f")
          ) {
            item["Gender"] = "F";
          } else {
            errorloop = true;
            excelcolm = "Gender in record " + index;
          }
          if (
            item["PortalLicense"] &&
            (item["PortalLicense"] == "Yes" || item["PortalLicense"] == "yes")
          ) {
            item["PortalLicense"] = 1;
            //licensedusers += 1;
          } else {
            item["PortalLicense"] = 0;
          }
          if (
            item["ActiveEmployee"] &&
            (item["ActiveEmployee"] == "Yes" || item["ActiveEmployee"] == "yes")
          ) {
            item["ActiveEmployee"] = 1;
          } else if (
            item["ActiveEmployee"] &&
            (item["ActiveEmployee"] == "no" || item["ActiveEmployee"] == "No")
          ) {
            item["ActiveEmployee"] = 0;
          } else {
            item["ActiveEmployee"] = "";
          }
          //var password = Math.random().toString(36).substring(2);
          var random = Math.random().toString().substring(5);
          var token = crypto.createHash("sha1").update(random).digest("hex");
          const passwordHash = bcrypt.hashSync("India@123", 10);
          item.userpassword = passwordHash;
          item.resettoken = token;
          dummyEmpArrSub.push(item["Employeecode"]);
          dummyEmpArrSub.push(item["FirstName"]);
          dummyEmpArrSub.push(item["LastName"]);
          dummyEmpArrSub.push(item["OfficialEmail"]);
          dummyEmpArrSub.push(item["personalemail"] || "");
          dummyEmpArrSub.push(item["Gender"] || "");
          dummyEmpArrSub.push(item["ReportingTo"] || "");
          dummyEmpArrSub.push(item["ContactNumber"] || "");
          dummyEmpArrSub.push(item["Dateofbirth"] || "");
          dummyEmpArrSub.push(item["Country"] || "");
          dummyEmpArrSub.push(item["Location"] || "");
          dummyEmpArrSub.push(item["BusinessUnit"]);
          dummyEmpArrSub.push(item["Workforce"] || "");
          dummyEmpArrSub.push(item["worklocation"] || "");
          dummyEmpArrSub.push(item["verticals"] || "");
          dummyEmpArrSub.push(item["Department"]);
          dummyEmpArrSub.push(item["Designation"]);
          dummyEmpArrSub.push(item["EmployeeShift"] || "");
          dummyEmpArrSub.push(item["hrrepresentative"] || "");
          dummyEmpArrSub.push(item["Dateofjoining"] || "");
          dummyEmpArrSub.push(item["Dateofconfirmation"] || "");
          dummyEmpArrSub.push(item["resourcetype"] || "");
          dummyEmpArrSub.push(item["employeetype"] || "");
          dummyEmpArrSub.push(item["RelievingDate"] || "");
          dummyEmpArrSub.push(item["costcenter"] || "");
          dummyEmpArrSub.push(item["PortalLicense"]);
          //dummyEmpArrSub.push(item['createdby'] || '')
          dummyEmpArrSub.push(item["userpassword"]);
          dummyEmpArrSub.push(item["resettoken"]);
          dummyEmpArrSub.push(item["Role"] || "");
          dummyEmpArrSub.push(item["TaxSlab"] || "");
          dummyEmpArrSub.push(item["ActiveEmployee"]);
          dummyEmpArrSub.push(item["TypeofRelieving"] || "");
          dummyEmpArrSub.push(item["AllowLoginOnDeactivate"] || "");
          dummyEmpArrSub.push(item["ModuleAllowOnDeactivate"] || "");

          dummyEmpArr.push(dummyEmpArrSub);

          //}
        });
      }
      //console.log("dummyEmpArr", dummyEmpArr[0]);
      ////console.log("errorloop", excelcolm)
      //console.log("countinvalid", countinvalid);
      var duplicateexist = true; //errorloop = true;
      //   if (errorloop == false) {

      var proc = "";
      var objarr = result1; //[];
      //console.log("oo", objarr.length);
      proc = "call usp_clientapiemployees_upload(?,?)";

      if (objarr.length > 0) {
        let objaction = {
          action: "syncEmployeeData",
        };
        mysqlserv.executeQuery(
          "truncate dummy_employee_client",
          function (erre, rese) {
            if (erre) {
              //console.log("err", erre);
              log("Write error " + erre + ", " + newnow, errlogfile);

              return;
            }
            commonModel.mysqlModelService(
              "INSERT INTO `dummy_employee_client`(`employeecode`,`firstname`,`lastname`,`officialemail`,`personalemail`,`gender`,`reportingto`,`contactnumber`,`dateofbirth`,`country`,`location`,`businessunit`,`workforce`,`worklocation`,`verticals`,`department`,`designation`,`employeeshift`,`hrrepresentative`,`dateofjoining`,`dateofconfirmation`,`resourcetype`,`employeetype`,`relievingdate`,`costcenter`,`islicense`,`userpassword`,`resettoken`,`role`,`taxslab`,`activeemployee`,`typeofrelieving`,`allowloginondeactivate`,`moduleallowondeactivate`) VALUES ?",
              [dummyEmpArr],
              function (err, result) {
                if (err) {
                  //console.log("err", err);
                  log("Write error " + err + ", " + newnow, errlogfile);
                  sendNotificationEmpApiErr(err, apiurl);

                  return;
                }

                commonModel.mysqlModelService(
                  proc,
                  [JSON.stringify(objarr), JSON.stringify(objaction)],
                  function (err, results) {
                    if (err) {
                      log("Write error " + err + ", " + newnow, errlogfile);

                      //console.log("err in procedure-> " + proc + " ", err);
                      sendNotificationEmpApiErr(err, apiurl);

                      return;
                      //return err.message || err ;
                    }
                    if (results) {
                      //console.log("results", results);
                      log("Result " + results + ", " + newnow, errlogfile);
                      log(
                        "Write result " +
                          results[0][0].overview +
                          ", " +
                          newnow,
                        errlogfile
                      );
                      log(
                        "Write error empcodes " +
                          results[0][0].empcodes +
                          ", " +
                          newnow,
                        errlogfile
                      );
                      sendNotificationEmpApiErr(
                        JSON.stringify(results[0][0]),
                        apiurl
                      );

                      return results;
                    }
                    //   return results ;
                  }
                );
              }
            );
          }
        );
      } else {
        log("No updates" + ", " + newnow, errlogfile);
        return;
      }
    }
  } catch (err) {
    //console.log("catch", err);
    log("Inside Catch " + err + ", " + newnow, errlogfile);
    sendNotificationEmpApiErr(err, apiurl);
    return;
  }
}

function publicEmpDataApi(req, res) {
  try {
    let jsondata = req.body.jsondata;
    if (!jsondata.length) {
      return res.json({
        state: -1,
        message: "Empty Employee json",
      });
    }
    const newnow = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    if (!fs.existsSync(path.join(appRoot.path, "uploads/errorlogs"))) {
      fs.mkdirSync(path.join(appRoot.path, "uploads/errorlogs"));
    }
    var errlogfile = path.join(
      appRoot.path,
      "uploads/errorlogs",
      "clientsyncservice.log"
    );
    //console.log("Json Length", Object.keys(jsondata[0]));
    log("Client employee json service ," + newnow, errlogfile);
    if (!Object.keys(jsondata).length) {
      //console.log("Json Length", Object.keys(jsondata));
      log("Json data is empty ," + newnow, errlogfile);
      return "Empty data";
    } else {
      log(
        "Total Json  Data Length :" + jsondata.length + " ," + newnow,
        errlogfile
      );

      var result1 = jsondata;

      var errorloop = false;
      var excelcolm;
      let datesindex = [
        "Dateofjoining",
        "Dateofconfirmation",
        "RelievingDate",
        "Dateofbirth",
      ];
      let mandatoryfields = [
        "FirstName",
        "LastName",
        "OfficialEmail",
        "Employeecode",
        "Gender",
        "ReportingTo",
        "Country",
        "BusinessUnit",
        "Worklocation",
        "Location",
        "Department",
        "Designation",
        "Dateofjoining",
        //"empshift",
        "PortalLicense",
        "ActiveEmployee",
      ];
      let emptyfields = [
        "Workforce",
        "Country",
        "BusinessUnit",
        // "worklocation",
        //"personalemail",
        "ContactNumber",
        //"costcenter",
        "PortalLicense",
        "TaxSlab",
        "TypeofRelieving",
        "AllowLoginOnDeactivate",
        "ModuleAllowOnDeactivate",
        "Role",
      ];

      //console.log("result1.length", result1.length);
      var countinvalid = 0;
      if (result1 && result1.length > 0) {
        _.each(result1, (item, index) => {
          // if (index < 1) {
          _.forEach(item, (value, key) => {
            item[key.trim()] = value.trim();
          });

          item["ContactNumber"] = item["ContactNumber"]
            .replace(/\D/g, "")
            .toString();
          const emailRegexp =
            /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

          ////console.log(emailRegexp.test(emailToValidate));

          if (!emailRegexp.test(item["OfficialEmail"])) {
            countinvalid = countinvalid + 1;
            delete item["OfficialEmail"];
            errorloop = true;
          }

          _.each(datesindex, (id) => {
            item[id] = moment(
              item[id],
              ["DD.MM.YYYY", "DD-MM-YYYY", "DD/MM/YYYY"],
              true
            ).isValid()
              ? moment(item[id], "DD.MM.YYYY").format("YYYY-MM-DD") ||
                moment(item[id], "DD-MM-YYYY").format("YYYY-MM-DD") ||
                moment(item[id], "DD/MM/YYYY").format("YYYY-MM-DD")
              : moment(item[id], ["YYYY-MM-DD"], true).isValid()
              ? item[id]
              : "";

            if (item[id] == "") {
              delete item[id]; //DOB
            }
          });
          _.each(mandatoryfields, (id) => {
            if (item[id] == null) {
              errorloop = true;
              excelcolm = id + " in record no." + index;
            }
          });
          _.each(emptyfields, (id) => {
            if (item[id] == "") {
              delete item[id];
            }
          });

          if (
            item["Gender"].toLowerCase() == "male" ||
            item["Gender"].toLowerCase() == "Male" ||
            item["Gender"].toLowerCase() == "m"
          ) {
            item["Gender"] = "M";
          } else if (
            item["Gender"].toLowerCase() == "female" ||
            item["Gender"].toLowerCase() == "Female" ||
            item["Gender"].toLowerCase() == "f"
          ) {
            item["Gender"] = "F";
          } else {
            errorloop = true;
            excelcolm = "Gender in record " + index;
          }
          if (
            item["PortalLicense"] == "Yes" ||
            item["PortalLicense"] == "yes"
          ) {
            item["PortalLicense"] = 1;
            //licensedusers += 1;
          } else {
            item["PortalLicense"] = 0;
          }
          if (
            item["ActiveEmployee"] == "Yes" ||
            item["ActiveEmployee"] == "yes"
          ) {
            item["ActiveEmployee"] = 1;
          } else {
            item["ActiveEmployee"] = 0;
          }
          //var password = Math.random().toString(36).substring(2);
          var random = Math.random().toString().substring(5);
          var token = crypto.createHash("sha1").update(random).digest("hex");
          const passwordHash = bcrypt.hashSync("India@123", 10);
          item.userpassword = passwordHash;
          item.resettoken = token;

          //}
        });
      }
      ////console.log("errorloop", errorloop)
      ////console.log("errorloop", excelcolm)
      //console.log("countinvalid", countinvalid);
      var duplicateexist = true; //errorloop = true;
      //   if (errorloop == false) {

      var proc = "";
      var objarr = result1; //[];
      //console.log("oo", objarr.length);
      proc = "call usp_clientapiemployees_upload(?,?)";

      if (objarr.length > 0) {
        let objaction = {
          action: "syncEmployeeData",
        };

        commonModel.mysqlModelService(
          proc,
          [JSON.stringify(objarr), JSON.stringify(objaction)],
          function (err, results) {
            if (err) {
              return res.json({
                state: -1,
                message: err,
              });
              //return err.message || err ;
            }

            return res.json({
              state: results[0][0].state || 1,
              message: results[0][0].message || "Success",
              overview: results[0][0].overview || "",
              employeecodees: results[0][0].empcodes || "",
              //results
            });
          }
        );
      } else {
        return res.json({
          state: -1,
          message: "Empty Employee Json",
        });
      }
    }
  } catch (err) {
    //console.log("catch", err);
    return res.json({
      state: -1,
      message: err,
    });
  }
}

async function sendNotificationEmpApiErr(error, apiurl) {
  try {
    //  //console.log("noti", options.error);
    // //console.log("noti1", options.type);

    const transporter = nodemailer.createTransport({
      pool: true,
      service: config.mailconfig && config.mailconfig.service,
      auth: {
        user: config.mailconfig && config.mailconfig.user,
        pass: config.mailconfig && config.mailconfig.password,
      },
    });

    let info = await transporter.sendMail({
      from: `Vega-HR<Support@vega-hr.com>`,
      to: "nivedita.verma@polestarllp.com,anuj.kumar@polestarllp.com",
      // cc: options.cc,
      subject: "Error In Employee Service",
      text:
        "URL :" +
        config.webUrlLink +
        " , ERROR :" +
        error +
        ", API URL : " +
        apiurl,
    });

    //console.log("Message sent: %s", info.messageId);
  } catch {
    console.error;
  }
}
