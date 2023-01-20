const commonModel = require("../common/Model");
const mailservice = require("../../services/mailerService");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const _ = require("underscore");
const path = require("path");
const sheetToJson = require("csv-xlsx-to-json");
const appRoot = require("app-root-path");
const async = require("async");
const fs = require("fs");
const commonCtrl = require("../common/Controller");
const image2base64 = require("image-to-base64");
const moment = require("moment");
const query = require("../common/Model").mysqlPromiseModelService;
var mysqlserv = require("../../services/mysqlService");
const xlsx = require("xlsx");
const mysql = require("mysql");
const CryptoJS = require("crypto-js");
var config = require("../../config/config");
//const { next } = require('cheerio/lib/api/traversing');
const fusionconfig = config.fusionmysqlconfig;
const { makeDirectories } = require("../common/utils");
let uploadService = require("../../services/uploadService");

appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;

module.exports = {
  getUserList: getUserList,
  createUser: createUser,
  getAllModule: getAllModule,
  getUserInfo: getUserInfo,
  getUserModules: getUserModules,
  editUser: editUser,
  validateEmailEcode: validateEmailEcode,
  changeUserStatus: changeUserStatus,
  validateToken: validateToken,
  resetPassword: resetPassword,
  createMultipleUsers: createMultipleUsers,
  updateProfile: updateProfile,
  updateProfileOnMobile: updateProfileOnMobile,
  getlogo: getlogo,
  licenseUserList: licenseUserList,
  createEmpAsUser: createEmpAsUser,
  editUserModule: editUserModule,
  getUserShift: getUserShift,
  changeLicenseStatus: changeLicenseStatus,
  changeLicenseStatusCron: changeLicenseStatusCron,
  removeprofile: removeprofile,
  getRecentJoinedUser,
  editUserFlag,
  uploadUserRolesExcel,
  resetPasswordLogin,
  deactivateuser,
  getGoogleKey,
  getFyDates,
  checkModuleLicense,
  uploadResumeOnVegaProfile
  // changedefaultmodule:changedefaultmodule
};

function fusionEmployeeDataSync(userdata) {
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
async function resetPassword(req, res) {
  try {
    if (!req.body.userpassword) {
      throw new Error("Password is required!");
    }
    var obj = JSON.stringify({
      action: "password_history",
      userid: req.body.id,
    });
    let results = await query("call usp_mstuser_data(?)", [obj]);
    if (!results) {
      throw new Error("Something went wrong!");
    }
    let index = -1;
    let lastFewPasswords = results[0];
    ////console.log("lastPass", lastFewPasswords);
    for (let i = 0; i < lastFewPasswords.length; i++) {
      let isMatch = await bcrypt.compare(
        req.body.userpassword,
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
    let hash = await bcrypt.hash(req.body.userpassword, saltRounds);
    req.body.userpassword = hash;
    var obj = JSON.stringify(req.body);
    let result1 = await query("call usp_mstuser_resetpassword(?)", [obj]);
    ////console.log("resss", result1);
    if (!result1) {
      throw new Error("Something went wrong!");
    } else if (result1[0] && result1[0].state && result1[0].state === -1) {
      return res.json({
        state: -1,
        message: result1 && result1[0] && result1[0].message,
      });
    }
    return res.json({
      state: 1,
      message: "success",
      data: result1 && result1[0],
    });
  } catch (err) {
    ////console.log("errrr", err);
    return res.json({
      state: -1,
      message: err.message || err,
    });
  }
}
function resetPasswordLogin(req, res) {
  if (!req.body.password) {
    return res.json({ state: -1, message: "Password is required." });
  }
  var saltRounds = 10;
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    req.body.userpassword = hash;
    req.body.id = req.body.createdby;
    req.body.action = "reset_password";
    if (req.body.userid) {
      req.body.id = req.body.userid;
    }
    var obj = JSON.stringify(req.body);
    commonModel.mysqlModelService(
      "call usp_mstuser_resetpassword(?)",
      [obj],
      function (err, results) {
        if (err) {
          return res.json({ state: -1, message: err });
        }
        return res.json({
          state: 1,
          message: "success",
          data: results && results[0],
        });
      }
    );
  });
}
function validateToken(req, res) {
  if (!req.body.id) {
    return res.json({ state: 0, message: "Not a valid user" });
  }
  var obj = JSON.stringify(req.body); //console.log('asdjsadksad', obj)
  commonModel.mysqlModelService(
    "call usp_mstuser_validatetoken(?)",
    [obj],
    function (err, results) {
      if (err) {
        return res.json({ state: -1, message: err });
      }
      return res.json({
        state: 1,
        message: "success",
        data: results && results[0],
      });

      // errorService.getError(results[0][0],function(err){
      //   if(err)  return res.status(422).send(err);
      // 	    if(results[0][0].message == 'Success'){
      // 	    	return res.ok(results[0][0]);
      // 	    }
      // 	    return res.badRequest();
      // });
    }
  );
}

function getUserList(req, res) {
  if (!req.body.createdby) {
    return res.json({ state: 0, message: "Not a valid user" });
  }
  var myJson = JSON.stringify(req.body);

  commonModel.mysqlModelService(
    "call usp_mstuser_data(?)",
    [myJson],
    function (err, results) {
      if (err) {
        return res.json({ state: -1, message: err });
      } else {
        let currentusercount =
          results[1] && results[1][0] && results[1][0].currentusercount;
        var dbresult = commonCtrl.lazyLoading(results[0], req.body);
        if (dbresult && "data" in dbresult && "count" in dbresult) {
          return res.json({
            state: 1,
            message: "success",
            data: dbresult.data,
            count: dbresult.count,
            currentusercount: currentusercount,
          });
        } else {
          return res.json({ state: -1, message: "No Lazy Data" });
        }
        //return res.json({ "state": 1, message: "success", "data": results && results[0] });
      }
    }
  );
}

function validateEmailEcode(req, res) {
  if (!req.body.useremail || !req.body.ecode) {
    return res.json({ state: 0, message: "Not a valid user" });
  }
  req.body.guid = req.body.tokenFetchedData.guid;
  var obj = JSON.stringify(req.body);

  //console.log("REQBODYYYYYYYYYYYYYYYYYYY1111", req.body);
  commonModel.mysqlModelService(
    "call usp_mstuser_view(?)",
    [obj],
    function (err, results) {
      if (err) {
        return res.json({ state: -1, message: err });
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

function getUserModules(req, res) {
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService(
    "call usp_mstusermodule_view(?)",
    [obj],
    function (err, results) {
      //errorService.getError(results[0][0],function(err){
      if (err) return res.json({ state: -1, message: err });
      // //console.log('RESULTSSSSSSSSSSS',results);
      //return res.status(422).send(err);
      return res.json({
        state: 1,
        message: "success",
        data: results && results[0],
      });

      //return res.ok(results[0][0]);
      //});
    }
  );
}

function getAllModule(req, res) {
  if (!req.body.createdby) {
    return res.json({ state: 0, message: "Not a valid user" });
  }
  var myJson = JSON.stringify(req.body);
  commonModel.mysqlModelService(
    "call usp_master_data(?)",
    [myJson],
    function (err, results) {
      if (err) {
        return res.json({ state: -1, message: err });
      } else {
        return res.json({
          state: 1,
          message: "success",
          data: results && results[0],
        });
      }
    }
  );
}

function getUserInfo(req, res) {
  var obj = JSON.stringify(req.body);
  //console.log('objjjjjjjjjjjjjj', obj);
  commonModel.mysqlModelService(
    "call usp_mstuser_view(?)",
    [obj],
    function (err, results) {
      if (err) {
        //return res.serverError(err);
        return res.json({ state: -1, message: err });
      }
      //errorService.getError(results[0][0],function(err){
      if (err) return res.json({ state: -1, message: err });

      //return res.status(422).send(err);
      return res.json({
        state: 1,
        message: "success",
        data: results && results[0],
      });

      //return res.ok(results[0][0]);
      //});
    }
  );
}

function changeUserStatus(req, res) {
  if (!req.body || !req.body.guid) {
    return res.json({
      state: -1,
      message: "Required parameters are missing",
      data: null,
    });
  }
  var obj = req.body;
  obj.action = "edituser";
  var urllink = config.webUrlLink; //console.log("url", urllink)
  commonModel.mysqlModelService(
    "call usp_mstuser_operation(?)",
    [JSON.stringify(obj)],
    function (err, results) {
      if (err) {
        return res.json({ state: -1, message: err });
      }
      if (urllink && urllink.indexOf("polestar") != -1) {
        if (config.env && config.env == "development") {
          //console.log('not for fusion')
        } else {
          fusionEmployeeDataSync(obj);
        }
      }
      return res.json({
        state: 1,
        message: "success",
        data: results && results[0],
      });
    }
  );
}

function createUser(req, res) {
  //console.log(req.body, "dlkaksdjadksajsdadksjladslkj")
  const errors = req.validationErrors();
  if (errors) {
    let errorMsg = errors.map(({ msg }) => msg);
    return res.json({
      message: errorMsg && errorMsg.toString(),
      state: -1,
      data: null,
    });
  }
  if (req.body.userData.guid) {
    //console.log('adkjsjkfadskjfdkjadfskjfdskjfdskjfdsj', req.body.userData);
    editUser(req, res);
  } else {
    var random = Math.random().toString().substring(5);
    var token = crypto.createHash("sha1").update(random).digest("hex");
    req.body.userData.resettoken = token;
    req.body.userData.createdby = req.body.createdby;
    req.body.userData.action = "createuser";
    //Validate domain part of email of new user with logged in user
    var loggedUserEmail = req.body.tokenFetchedData.email.split("@");
    var newUserEmail = req.body.userData.useremail.split("@");
    // //console.log("dfshkjdsfbjjsdlknfjdkf;ljjdfs;ojfsk");
    if (loggedUserEmail.length !== 2 && newUserEmail.length !== 2) {
      return res.json({ message: "Invalid Email Id", state: -1, data: null });
    }
    if (loggedUserEmail[1] !== newUserEmail[1]) {
      return res.json({
        message: "Undesired domain name of email",
        state: -1,
        data: null,
      });
    }
    add_user(req.body.userData)
      .then((userData) => {
        //console.log('hhhhhh', userData);
        req.body.assignedModules.createdby = req.body.createdby;
        req.body.assignedModules.userId = userData && userData[0].state;
        req.body.assignedModules.roleid = req.body.userData.rmsroleid;
        return assign_module_to_user(req.body.assignedModules);
      })
      .then((moduleData) => {
        //console.log(moduleData)
        const urlLinkForReset =
          req.body.urllink +
          "/resetPassword/validate?sec=" +
          token +
          "&uid=" +
          req.body.userData.useremail; //req.protocol + "://" + req.headers.host + '/resetPassword/validate?sec=' + token + '&uid=' + req.body.userData.useremail;
        const emailObj = {
          email: req.body.userData.useremail,
          linkUrl: urlLinkForReset,
          bodyVariables: { trxemployeename: req.body.userData.firstname },
          subjectVariables: { trxemployeename: req.body.userData.firstname },
          mailType: "userRegistered",
          resettoken: token,
          createdby: req.body.createdby,
        };
        return send_mail(emailObj);
      })
      .then(() => {
        return res.json({
          message: "User created. Mail invite sent.",
          state: 1,
          data: null,
        });
      })
      .catch((erorr) => {
        //console.log(erorr);
        return res.json({ message: erorr.toString(), state: -1, data: null });
      });
  }
}

const add_user = (userInformation) => {
  return new Promise((resolve, reject) => {
    Object.keys(userInformation).forEach((key) =>
      userInformation[key] === undefined || userInformation[key] === null
        ? delete userInformation[key]
        : ""
    );

    let obj = JSON.stringify(userInformation);
    commonModel.mysqlModelService(
      "call usp_mstuser_operation(?)",
      [obj],
      function (err, result) {
        //console.log('errrrrrr', err, result);
        if (err) reject(err);
        else resolve(result && result[0]);
      }
    );
  });
};

const assign_module_to_user = (usermodules, createdby) => {
  return new Promise((resolve, reject) => {
    _.each(usermodules, function (item) {
      item.userid = usermodules.userId;
      item.createdby = usermodules.createdby;
      item.roleid = usermodules.roleid;
      if (!item.isdefault) delete item.isdefault;
    });
    let obj = JSON.stringify(usermodules); //console.log('ahdshjashjsd', obj);
    commonModel.mysqlModelService(
      "call usp_mstusermodule_add(?)",
      [obj],
      function (err, result) {
        //console.log('errrrrrr', err, result);
        if (err) reject(err);
        else resolve(result[0]);
      }
    );
  });
};
const send_mail = (emailObj) => {
  return new Promise((resolve, reject) => {
    mailservice.mail(emailObj, function (err, response) {
      //console.log(err, response)
      if (err) {
        reject("User created. Failed to send mail !");
      } else resolve({ msg: "Mail Sent. " });
    });
  });
};

function editUser(req, res) {
  var userInfo = req.body.userData;
  userInfo = _.mapObject(userInfo, function (val, key) {
    return val == null ? undefined : val;
  });
  userInfo.createdby = req.body.createdby;
  userInfo.action = "edituser";
  userInfo.guid = req.body.userData.guid;
  var obj = JSON.stringify(userInfo);
  commonModel.mysqlModelService(
    "call usp_mstuser_operation(?)",
    [obj],
    function (err, results) {
      //console.log('RESULTSS OF MSTUSER OPERATIONSSSSSSS', results)
      if (err) {
        return res.json({ state: -1, message: err });
      }
      _.map(req.body.assignedModules, function (item) {
        item.createdby = req.body.createdby;
        item.guid = req.body.userData.guid;
        //item.roleid = req.body.userData.rmsroleid;
        //item.userid = req.body.id;
        if (!item.isdefault) delete item.isdefault;
      });
      var obj = JSON.stringify(req.body.assignedModules);
      commonModel.mysqlModelService(
        "call usp_mstusermodule_edit(?)",
        [obj],
        function (err, results1) {
          if (err) {
            return res.json({
              state: -1,
              message: err.message || err,
              data: null,
            });
          } else {
            return res.json({
              state: 1,
              message: "User updated successfully",
              data: null,
            });
          }
        }
      );
    }
  );
}
function createMultipleUsers(req, res) {
  //console.log("createMultipleUsers", req.body)
  let sampleFile;
  let uploadPath;
  if (req.files && Object.keys(req.files).length == 0) {
    return res.json({
      state: -1,
      message: "Something Went Wrong in uploading ",
      data: null,
    });
  }
  sampleFile = req.files.file;
  //console.log('Filee '.sampleFile);
  var fileformat = sampleFile.name.split(".")[1].toLowerCase();
  if (fileformat != "xlsx" || fileformat != "csv") {
    return res.json({
      state: -1,
      message: "Unsupported File Format. Upload CSV or XLSX File Format",
      data: null,
    });
  }
  uploadPath = path.join(appRoot.path, "/uploads/users", req.files.file.name);
  sampleFile.mv(uploadPath, (err) => {
    if (err) {
      return res.json({
        state: -1,
        message: "Something Went Wrong in uploading ",
        data: null,
      });
    } else {
      sheetToJson.process(uploadPath, (error1, result1) => {
        if (error1) {
          return res.json({
            state: -1,
            message: "Something Went Wrong in conversiond",
            data: null,
          });
        } else {
          // //console.log('RESSSS',result1);
          if (result1 && result1.length > 0) {
            _.each(result1, (item) => {
              var random = Math.random().toString().substring(5);
              var token = crypto
                .createHash("sha1")
                .update(random)
                .digest("hex");
              item.resettoken = token;
              item.createdby = req.body.createdby;
            });
            commonModel
              .mysqlPromiseModelService(
                "call usp_multiple_user_operation(?,?)",
                [JSON.stringify(result1), "createuser"]
              )
              .then((results) => {
                res.json({
                  state: 1,
                  message: results && results[0][0].overview,
                  data: null,
                });
                async.each(
                  result1,
                  function (userData, next) {
                    var urlLinkForReset =
                      req.body.urllink +
                      "/resetPassword/validate?sec=" +
                      userData.resettoken +
                      "&uid=" +
                      userData.useremail; //req.protocol + "://" + req.headers.host + '/resetPassword/validate?sec=' + token + '&uid=' + req.body.userData.useremail;
                    var emailObj = {
                      email: userData.useremail,
                      userid: userData.userid,
                      linkUrl: urlLinkForReset,
                      moduleid: "131911",
                      bodyVariables: {
                        trxempdob:
                          userData.trxempdob && userData.trxempdob
                            ? userData.trxempdob
                            : "",
                        trxempjoining:
                          userData.trxempjoining && userData.trxempjoining
                            ? userData.trxempjoining
                            : "",
                        trxempsupervisor:
                          userData.trxempsupervisor && userData.trxempsupervisor
                            ? serData.trxempsupervisor
                            : "",
                        trxemployeename: userData.firstname,
                        trxempname: userData.fullname,
                      },
                      headingVariables: { heading: userData.fullname },
                      subjectVariables: {
                        trxemployeename: userData.firstname,
                        //   trxempname: users.fullname,
                        subject: "Welcome to Vega HR, trxempname!",
                      },
                      mailType: "userRegistered",
                      resettoken: userData.resettoken,
                      createdby: req.body.createdby,
                    };
                    mailservice.mail(emailObj, function (err, response) {
                      //console.log(err, response)
                      if (err) {
                        next(
                          "Mails Not Sent" + " Overview: " + results &&
                            results[0][0].overview
                        );
                      } else next(null, "Mail Sent.");
                    });
                  },
                  function (err, result2) {
                    if (err) {
                      //console.log(err);
                    } else {
                      //console.log(result2);
                    }
                  }
                );
              })
              .catch((err) => {
                res.json({ state: -1, message: err.message || err });
              });
          } else {
            res.json({ state: -1, message: "no excel data found" });
          }
        }
      });
    }
  });
}
function updateProfile(req, res) {
  var sampleFile = {};
  if (req.files) {
    sampleFile = req.files["file"];
    //console.log("samplefile", sampleFile.name);
    if (sampleFile) {
      var ext = path.extname(sampleFile.name).replace(".", "");
      ext = ext.toLowerCase();
      if (ext == "jpeg" || ext == "jpg" || ext == "png") {
        let uploadPath = makeDirectories(
          path.join("uploads", "profiles", req.body.createdby.toString())
        );
        let filepath = path.join(uploadPath, sampleFile.name);
        //console.log('sampleFile.name', sampleFile.name)

        sampleFile.mv(filepath, (err) => {
          if (!err) {
            //let cid=`data:image/`+(path.extname(sampleFile.name)).replace('.',"")+`;base64,`
            var profileblob;
            //     image2base64(filepath) // you can also  use url
            //     .then(
            //         (response) => {
            //             profileblob=response;
            //     updateUserInfo(path.join('/profiles',req.body.createdby.toString(),sampleFile.name),cid+profileblob)
            // })
            //var profileblob = fs.readFileSync(filepath);
            updateUserInfo(
              path.join(
                "/profiles",
                req.body.createdby.toString(),
                sampleFile.name
              ),
              profileblob
            );
          } else {
            return res.json({ state: -1, message: "Error in uploading File." });
            //updateUserInfo();
          }
        });
      } else {
        return res.json({
          state: -1,
          message: "Profile picture is not in valid format.",
        });
      }
    } else {
      return res.json({
        state: -1,
        message: "Something went wrong in uploading kile picture",
      });
      // updateUserInfo();
    }
  } else {
    updateUserInfo();
  }

  function updateUserInfo(filePath, profileblob) {
    var obj = {
      id: req.body.createdby,
      worklocation: req.body.worklocation,
      contactnumber: req.body.contactnumber,
      managerid: req.body.managerid,
      createdby: req.body.createdby,
      guid: req.body.tokenFetchedData.guid,
      moduleid: req.body && req.body.moduleid,
      bio: req.body && req.body.bio,
      action: "edituser",
      removeprofile: req.body && req.body.removeprofile,
      people_manager: req.body.people_manager,
      personalemail: req.body && req.body.personalemail,
    };
    if (filePath) {
      obj.profilepic = filePath;
      obj.profilepicblob = profileblob;
    }
    obj1 = JSON.stringify(obj);

    commonModel.mysqlModelService(
      "call usp_mstuser_operation(?)",
      [obj1],
      function (err, results) {
        if (err) {
          return res.json({
            state: -1,
            message: err.sqlMessage || err,
            data: null,
          });
        }
        return res.json({ state: 1, message: "success", data: null });
      }
    );
  }
}

async function updateProfileOnMobile(req, res) {
  try {
    if (!req.body || !req.body.base64String) {
      return res.json({
        state: -1,
        message: "Required parameters are missing!",
      });
    } else {
      let obj = req.body;
      obj.action = "update_profile_on_mobile";
      let extension = req.body.base64String.substring(
        "data:image/".length,
        req.body.base64String.indexOf(";base64")
      );
      var base64Image = req.body.base64String.split(";base64,").pop();
      newFileName = `${Date.now()}_profile_${req.body.createdby}.${extension}`;
      dbFilePath = path.join(
        `profiles`,
        req.body.createdby.toString(),
        newFileName
      );
      obj.filepath = dbFilePath;
      //console.log("obj", obj);
      let uploadPath = makeDirectories(
        path.join("uploads", "profiles", req.body.createdby.toString())
      );
      obj = JSON.stringify(obj);

      fs.writeFile(
        path.join(uploadPath, newFileName),
        base64Image,
        "base64",
        function (err) {
          if (err) {
            console.log("ERRRRRRR", err);
          } else {
            console.log("converted to image!");
          }
        }
      );

      let result = await query("call usp_mstuser_operation(?)", [obj]);

      if (!result) {
        return res.json({
          state: -1,
          message: error.message || "Something went wrongggg!",
          data: null,
        });
      } else {
        return res.json({
          state: 1,
          message: "success",
          data: result && result[0],
        });
      }
    }
  } catch (error) {
    return res.json({
      state: -1,
      message: error.message || "Something went wrong!",
    });
  }
}

async function getGoogleKey(req, res) {
  try {
    let obj = req.body;
    obj.action = "google_key";
    let result = await query("call usp_mstuser_data(?)", [JSON.stringify(obj)]);
    let gkeyencrypted = "";
    if (result && result[0] && result[0][0] && result[0][0].gkey) {
      gkeyencrypted = CryptoJS.AES.encrypt(
        result[0][0].gkey,
        "keyboardcatfusion"
      ).toString();
    }
    return res.json({ state: 1, message: "success", data: gkeyencrypted });
  } catch (err) {
    return res.json({ state: -1, message: "Something went wrong" });
  }
}
function getlogo(req, res) {
  commonModel.mysqlModelService("call usp_get_logo()", [], (err, result) => {
    if (err) {
      return res.json({ state: -1, message: err, data: null });
    } else {
      var obj = [[{ profilepicpath: null, expfilepath: null }]];
      let sso =
        (result && result[1] && result[1][0] && result[1][0].singlesignon) || 1;
      let { ssokey, appVersion, client_id, client_domain, ssokey_learning } =
        result && result[1] && result[1][0] && result[1][0];

      delete result[1][0];
      let ssokeyencrypted = "";
      if (ssokey) {
        ssokeyencrypted = CryptoJS.AES.encrypt(
          ssokey,
          "keyboardcatfusion"
        ).toString();
      }
      let ssokeyencrypted_learning = ""
      if (ssokey_learning) {
        ssokeyencrypted_learning = CryptoJS.AES.encrypt(
          ssokey_learning,
          "keyboardcatfusion"
        ).toString();
      }
      let f = 0;
      let expf = 0;
      if (result[0][0] && result[0][0].profilepicpath) {
        if (
          fs.existsSync(
            path.join(appRoot.path, "/uploads", result[0][0].profilepicpath)
          )
        )
          f = 1;
        if (
          fs.existsSync(
            path.join(appRoot.path, "/uploads", result[0][0].expfilepath || "")
          )
        )
          expf = 1;
        if (f == 0) result[0][0].profilepicpath = null;
        if (expf == 0) result[0][0].expfilepath = null;

        return res.json({
          state: 1,
          message: "success",
          data: result,
          url: "getlogourl",
          singlesignon: sso,
          ssokey: ssokeyencrypted,
          ssokey_learning: ssokeyencrypted_learning,
          appVersion: appVersion,
          client_id,
          client_domain,
        });
      } else {
        return res.json({
          state: 1,
          message: "success",
          data: obj,
          url: "getlogourl",
          singlesignon: sso,
          ssokey: ssokeyencrypted,
          appVersion: appVersion,
          client_id,
          client_domain,
        });
      }
    }
  });
}
function licenseUserList(req, res) {
  if (!req.body.createdby) {
    return res.json({ state: 0, message: "Not a valid user" });
  }
  var myJson = JSON.stringify(req.body);
  commonModel.mysqlModelService(
    "call usp_mstuser_data(?)",
    [myJson],
    function (err, results) {
      if (err) {
        return res.json({ state: -1, message: err });
      } else {
        return res.json({
          state: 1,
          message: "success",
          data: results && results[0],
        });
      }
    }
  );
}

async function createEmpAsUser(req, res) {
  //  //console.log("createEmpAsUser", req.body)
  if (
    !req.body.assignedModules ||
    !req.body.userObj ||
    !req.body.totallicense ||
    !req.body.packageenddate
  ) {
    return res.json({ state: -1, message: "Required Parameters are missing" });
  }
  // var useridArr = req.body.userid.split(',');
  // //console.log('UseriDsArray',useridArr);

  var obj = [];
  let userids = req.body.userObj.map((user) => user.id);
  _.each(req.body.assignedModules, (modules) => {
    let temp = Object.assign({}, modules);
    temp.guid = "";
    temp.createdby = req.body.createdby;
    temp.userids = userids && userids.toString();
    temp.multipleflag = 1;
    obj.push(temp);
  });

  var userObjArr = [];
  _.map(req.body.userObj, function (item) {
    let random = Math.random().toString().substring(5);
    let token = crypto.createHash("sha1").update(random).digest("hex");
    let userObj = {
      trxempdob: item.trxempdob
        ? moment(item.trxempdob && item.trxempdob)
            .utc()
            .format("DD-MM-YYYY")
        : "",
      trxempjoining: item.trxempjoining
        ? moment(item.trxempjoining && item.trxempjoining)
            .utc()
            .format("DD-MM-YYYY")
        : "", // moment(item.trxempjoining && item.trxempjoining.split('T')[0], 'YYYY-MM-DD').format('DD-MM-YYYY'),//"2020-08-30T18:30:00.000Z"
      trxempsupervisor: item.trxempsupervisor,
      userid: item.id,
      guid: item.guid,
      fullname: item.fullname,
      useremail: item.useremail,
      createdby: req.body.createdby,
      action: "add",
      packageenddate: moment(new Date(req.body.packageenddate)).format(
        "YYYY-MM-DD"
      ),
      totallicense: req.body.totallicense,
      resettoken: token,
      ispremium: item.ispremium || 0,
      isclientadmin: item.isclientadmin || 0,
    }; //console.log("doj", userObj.trxempjoining)
    userObjArr.push(userObj);
  });

  var obj = await commonCtrl.verifyNull(obj);

  ////console.log('USeriDARRAYYY',userObjArr);
  commonModel.mysqlModelService(
    "call usp_empasuser_operation(?)",
    [JSON.stringify(userObjArr)],
    function (err, result1) {
      if (err) {
        return res.json({ state: -1, message: err.message || err, data: null });
      } else {
        commonModel.mysqlModelService(
          "call usp_mstusermodule_edit(?)",
          [JSON.stringify(obj)],
          function (err, results1) {
            if (err) {
              return res.json({
                state: -1,
                message: err.message || err,
                data: null,
              });
            } else {
              commonModel.mysqlModelService(
                "call usp_leave_useradd(?)",
                [JSON.stringify(userObjArr)],
                function (err, results2) {
                  if (err) {
                    return res.json({
                      state: -1,
                      message: err.message || err,
                      data: null,
                    });
                  } else {
                    res.json({
                      state: 1,
                      message: "User updated successfully",
                      data: null,
                    });
                    return new Promise((resolve) => {
                      let sent = [];
                      let errors = [];

                      const finalise = () => {
                        if (sent.length + errors.length >= userObjArr.length) {
                          //console.log('IM resolved now')
                          resolve({ sent, errors });
                        }
                      };
                      userObjArr.forEach((users, index) => {
                        const urlLinkForReset =
                          req.body.urllink +
                          "/resetPassword/validate?sec=" +
                          users.resettoken +
                          "&uid=" +
                          users.useremail; //req.protocol + "://" + req.headers.host + '/resetPassword/validate?sec=' + token + '&uid=' + req.body.userData.useremail;
                        const emailObj = {
                          moduleid: "131911",
                          email: users.useremail,
                          userid: users.userid,
                          linkUrl: urlLinkForReset,
                          bodyVariables: {
                            trxempdob: users.trxempdob,
                            trxempjoining: users.trxempjoining,
                            trxempsupervisor: users.trxempsupervisor,
                            trxemployeename: users.fullname,
                            trxempname: users.fullname,
                          },
                          headingVariables: { heading: users.fullname },
                          subjectVariables: {
                            trxemployeename: users.fullname,
                            subject:
                              "Welcome to Vega HR, " + users.fullname + "!",
                          },
                          //  subject: "You’re in, "+users.fullname+". Welcome to Vega-HR !"},
                          //subject: "Thank you  "+users.fullname+" ,Welcome to Vega HR!!"},
                          mailType: "userRegistered",
                          resettoken: users.resettoken,
                          createdby: req.body.createdby,
                        };
                        setTimeout(() => {
                          mailservice.mail(emailObj, function (err, response) {
                            //console.log(err, response)
                            if (err) {
                              errors.push(1);
                              finalise();
                              //console.log('User created. Failed to send mail !')
                            } else {
                              sent.push(2);
                              finalise();
                              //console.log("msg: 'Mail Sent. ");
                            }
                          });
                        }, 5000 * index);
                      });
                    });
                  }
                }
              );
            }
          }
        );
      }
    }
  );
}

async function editUserModule(req, res) {
  if (!req.body.assignedModules || !req.body.guid) {
    return res.json({ state: -1, message: "Required Parameters are missing" });
  }
  var obj = [];
  _.each(req.body.assignedModules, (modules) => {
    let temp = Object.assign({}, modules);
    temp.guid = req.body.guid;
    temp.createdby = req.body.createdby;
    obj.push(temp);
  });
  var obj = await commonCtrl.verifyNull(obj);
  commonModel.mysqlModelService(
    "call usp_mstusermodule_edit(?)",
    [JSON.stringify(obj)],
    function (err, results1) {
      if (err) {
        return res.json({ state: -1, message: err.message || err, data: null });
      } else {
        return res.json({
          state: 1,
          message: "User updated successfully",
          data: null,
        });
      }
    }
  );
}

async function getUserShift(req, res) {
  if (!req.body.createdby) {
    return res.json({ state: 0, message: "Unauthorize Access" });
  }
  req.body.createdby = req.body.userid ? req.body.userid : req.body.createdby;
  req.body.fortnightdate = req.body.fortnightdate
    ? moment(req.body.fortnightdate, "DD-MM-YYYY").format("YYYY-MM-DD")
    : null;
  var obj = await commonCtrl.verifyNull(req.body);
  obj.action = "usershift";
  commonModel.mysqlModelService(
    "call usp_mstuser_data(?)",
    [JSON.stringify(obj)],
    function (err, results1) {
      if (err) {
        return res.json({ state: -1, message: err.message || err, data: null });
      } else {
        return res.json({
          state: 1,
          message: "success",
          data: results1 && results1[0],
        });
      }
    }
  );
}

function changeLicenseStatus(req, res) {
  //console.log("rrrrr", req.body);

  if (!req.body || !req.body.guid) {
    return res.json({ state: -1, message: "Required Parameters are missing" });
  }
  let obj = req.body;
  commonModel.mysqlModelService(
    "call usp_license_update(?)",
    [JSON.stringify(obj)],
    function (err, results1) {
      if (err) {
        return res.json({ state: -1, message: err.message || err, data: null });
      } else {
        return res.json({
          state: 1,
          message: "success",
          data: results1 && results1[0],
        });
      }
    }
  );
}

function changeLicenseStatusCron() {
  let obj = {
    action: "deactivateuser",
    cronjob: 1,
  };
  //console.log("oooooooooooooooooooooooooo", obj);

  commonModel.mysqlModelService(
    "call usp_license_update(?)",
    [JSON.stringify(obj)],
    function (err, results1) {
      //console.log("eeeeeeeeeeeeee", err, results1);

      if (err) {
        //console.log("error in license", err);
      } else {
        //console.log("Success");
      }
    }
  );
}

function removeprofile(req, res) {
  if (!req.body.createdby) {
    return res.json({ state: 0, message: "Not a valid user" });
  }

  let obj = req.body;
  obj.action = "removeprofile";

  commonModel.mysqlModelService(
    "call usp_mstuser_data(?)",
    [JSON.stringify(obj)],
    function (err, results) {
      if (err) {
        return res.json({ state: -1, message: err });
      } else {
        return res.json({
          state: 1,
          message: "success",
          data: results && results[0],
        });
      }
    }
  );
}
async function getRecentJoinedUser(req, res) {
  try {
    const data = req.body;
    data.action = "recentjoined";
    const reqdata = JSON.stringify(data);
    const result = await query("call usp_mstuser_data(?)", [reqdata]);
    return res.json({
      state: 1,
      data: result[0],
      message: "success",
    });
  } catch (err) {
    return res.json({ state: -1, message: err.message || err });
  }
}
async function getFyDates(req, res) {
  try {
    if (!req.body.fy) {
      return res.json({ state: -1, message: "Required Paramters are missing" });
    }
    const data = req.body;
    data.action = "getfydates";
    const reqdata = JSON.stringify(data);
    const result = await query("call usp_mstuser_data(?)", [reqdata]);
    return res.json({
      state: 1,
      data: result[0],
      message: "success",
    });
  } catch (err) {
    return res.json({ state: -1, message: err.message || err });
  }
}

// function changedefaultmodule(req,res) {
//     //console.log("rrrrr",req.body);

//     if(!req.body || !req.body.createdby || !req.body.action) {
//         return res.json({state:-1,message:"Required Parameters are missing"});
//     }
//     let obj = req.body;
//     commonModel.mysqlModelService('call usp_mstuser_data(?)',[JSON.stringify(obj)], function(err, results1) {
//         if (err) {
//             return res.json({state:-1,message:err.message||err,data:null});
//         } else{
//             return res.json({ "state": 1, message: "success", "data": results1 && results1[0] });
//         }
//     });
// }

async function editUserFlag(req, res) {
  try {
    let obj = req.body;
    obj.ispremium = req.body.ispremium || 0;
    obj.isclientadmin = req.body.isclientadmin || 0;
    obj.action = "editflag";
    const reqdata = JSON.stringify(obj);
    commonModel.mysqlModelService(
      "call usp_mstuser_operation(?)",
      [reqdata],
      function (err, results) {
        if (err) {
          return res.json({ state: -1, message: err });
        } else {
          return res.json({ state: 1, message: "success", data: null });
        }
      }
    );
  } catch (error) {
    return res.json({ state: -1, message: "something went wrong" });
  }
}

function uploadUserRolesExcel(req, res) {
  try {
    req.setTimeout(1000 * 60 * 20);
    ////console.log("req",req.body)
    if (!req.files) {
      return res.json({ state: -1, message: "No File uploaded" });
    } else {
      if (!fs.existsSync(path.join(appRoot.path, "uploads/userrolesexcel"))) {
        fs.mkdirSync(path.join(appRoot.path, "uploads/userrolesexcel"));
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
          "uploads/userrolesexcel",
          timestamp + sampleFile.name
        );
        sampleFile.mv(filepath, (err) => {
          if (err) {
            //console.log('err', err)
            return res.json({ state: -1, message: err.message || err });
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
            { header: 1, blankrows: false, raw: false }
          );
          // { header: 1, skipHeader:true, blankrows: false, raw: false, dateNF: 'yyyy-mm-dd hh:mm:ss' });

          if (records && records && records[0].length != 8) {
            //console.log('err', records[0].length)
            return res.json({
              state: -1,
              message: "Some columns are missing in excel file",
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
          // var keycount = records[0].length;
          // let objprep = [];
          var errorloop = false;
          var excelcolm;
          let mandatoryfields = [];
          let emptyfields = [];

          mandatoryfields.push(records[0].indexOf("module"));
          mandatoryfields.push(records[0].indexOf("role"));
          mandatoryfields.push(records[0].indexOf("employeecode"));

          mandatoryfields.push(records[0].indexOf("country"));
          mandatoryfields.push(records[0].indexOf("location"));
          mandatoryfields.push(records[0].indexOf("businessunit"));
          mandatoryfields.push(records[0].indexOf("workforce"));

          emptyfields.push(records[0].indexOf("attribute"));
          //  emptyfields.push(records[0].indexOf("Default"))

          if (records && records.length > 0) {
            _.each(records, (item, index) => {
              if (index != 0) {
                _.each(mandatoryfields, (id) => {
                  if (item[id] == null) {
                    errorloop = true;
                    excelcolm = records[0][id];
                  }
                });
                _.each(emptyfields, (id) => {
                  if (item[id] == "") {
                    delete item[id];
                  }
                });
                if (
                  item[records[0].indexOf("module")] == "Expense" &&
                  (isNaN(item[records[0].indexOf("attribute")]) ||
                    item[records[0].indexOf("attribute")] <= 0)
                ) {
                  //console.log(item[records[0].indexOf("attribute")])
                  errorloop = true;
                  excelcolm = "Expense Attribute must be greater than 0 ,it";
                }
              }
            });
          }
          //  //console.log("lop",datesindex)
          var duplicateexist = true;
          if (errorloop == false) {
            records.shift();

            if (duplicateexist == false) {
              return res.json({
                state: -1,
                message:
                  "Duplicate Empcode or emailid are not allowed.Must be unique",
              });
            }
            employeeArr = employeeArr.concat(records);
            if (employeeArr && employeeArr[0] && employeeArr[0].length == 0) {
              return res.json({
                state: -1,
                message: "Empty File(s), No Record parsed",
              });
            }
            mysqlserv.executeQuery(
              "truncate dummy_employee_excel",
              function (erre, rese) {
                commonModel.mysqlModelService(
                  "INSERT INTO `dummy_employee_excel`(`employeecode`,`module`,`role`,`country`,`location`,`businessunit`,`workforce`,`attribute`) VALUES ?",
                  [employeeArr],
                  function (err, result) {
                    if (err) {
                      //console.log('err', err)
                      return res.json({
                        state: -1,
                        message: err.message || err,
                      });
                    }
                    let objaction = req.body;
                    commonModel.mysqlModelService(
                      "call usp_userrolesxls_upload(?)",
                      [JSON.stringify(objaction)],
                      function (err, result) {
                        if (err) {
                          //console.log('err', err)
                          fs.unlink(filepath, function (err) {
                            if (err) {
                              //console.log('err', err)
                            }
                          });
                          return res.json({
                            state: -1,
                            message: err.message || err,
                          });
                        } else {
                          fs.unlink(filepath, function (err) {
                            if (err) {
                              //console.log('err', err)
                            }
                          });
                          return res.json({
                            state: 1,
                            message: "Success",
                            data: result,
                          });
                        }
                      }
                    );
                  }
                );
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
    return res.json({ state: -1, message: err.message || err });
  }

  return res.json({ state: -1, message: err.message || err });
}

async function deactivateuser(req, res) {
  if (!req.body || !req.body.action || !req.body.userid) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  var obj = await commonCtrl.verifyNull(obj);
  obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService("call usp_master_data(?)", [obj])
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
async function checkModuleLicense(req, res, next) {
  let obj = {
    createdby: req.body.createdby,
    guid: req.body.guid,
    action: "license_master",
    reqtype: req.body.action,
  };

  let [currentLicense, masterLicense] = await query("call usp_master_data(?)", [
    JSON.stringify(obj),
  ]);
  if (!currentLicense || !masterLicense) {
    //console.log('error from database');
    return res.json({ state: -1, message: "Something went wrong!" });
  }
  //console.log('currentLicense', currentLicense, 'masterLicense', masterLicense)
  let modulesExhausted = [];
  let incomingLicenseRequirement = req.body.assignedModules.map((item) => {
    let module = currentLicense.find(
      (item2) => item2.moduleid == item.moduleid
    );
    //console.log('module', module);
    let masterModule = masterLicense.find(
      (item3) => item3.alias == (module && module.alias)
    );
    //console.log('mastermodule', masterModule)
    item.license = item.isactive
      ? ((req.body.userObj && req.body.userObj.length) || 1) *
          (item.isactive || 0) +
        ((module && module.license) || 0)
      : 0;
    if (((masterModule && masterModule.license) || 0) < (item.license || 0)) {
      modulesExhausted.push(module && module.modulename);
    }
    return item;
  });

  if (modulesExhausted && modulesExhausted.length) {
    return res.json({
      message: `License for ${modulesExhausted.toString()} module(s) are exhausted`,
      state: -1,
    });
  } else {
    return next();
  }
}


async function uploadResumeOnVegaProfile(req, res) {
  try {
    let obj = req.body;
    obj.action = "upload_resume";

    if (req.files) {
      //console.log("Inside files");
      let fileUploaded = await uploadService.uploadMultiple(
        req,
        "user",
        req.body.attachCount && parseInt(req.body.attachCount)
      );
      console.log("fileupl", fileUploaded);
      obj.filename = fileUploaded.filename && fileUploaded.filename.toString();
      obj.filepath = fileUploaded.filepath && fileUploaded.filepath.toString();
    }
    // if (
    //   req.body.previousfilepath &&
    //   req.body.previousfilepath != "null" &&
    //   req.files
    // ) {
    //   obj.filepath = req.body.previousfilepath + "," + obj.filepath;
    //   obj.filename = req.body.previousfilename + "," + obj.filename;
    // } else if (
    //   req.body.previousfilepath &&
    //   req.body.previousfilepath != "null"
    // ) {
    //   obj.filepath = req.body.previousfilepath;
    //   obj.filename = req.body.previousfilename;
    // } else if (
    //   !req.files &&
    //   (!req.body.previousfilepath || req.body.previousfilepath == "null")
    // ) {
    //   delete obj.filepath;
    //   delete obj.filename;
    // }
    obj = commonCtrl.verifyNull(obj);
    obj = JSON.stringify(obj);
    let result = await query("call usp_mstuser_operation(?)", [obj]);

      if (!result) {
        return res.json({
          state: -1,
          message: "Something went wrongggg!",
          data: null,
        });
      } else {
        return res.json({
          state: 1,
          message: "success",
          data: result && result[0],
        });
      }
  } catch (error) {
    //console.log("eeeeeee", error);
    return res.json({
      state: -1,
      message: error.message || "Something went wrong!",
    });
  }
}
