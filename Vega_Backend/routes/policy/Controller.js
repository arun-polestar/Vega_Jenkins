const proc = require("../common/procedureConfig");
const commonModel = require("../common/Model");
const commonCtrl = require("../common/Controller");
var path = require("path");
const appRoot = require("app-root-path");
// const saveSync = require('save-file')
const fs = require("fs");
const sheetToJson = require("csv-xlsx-to-json");
const xlsx = require("xlsx");
const _ = require("underscore");
const lodash = require("lodash");
var moment = require("moment");
const mailservice = require("../../services/mailerService");
const makeDir = require("../../routes/common/utils").makeDirectories;
const query = require("../common/Model").mysqlPromiseModelService;
const feedbackController = require("../feedback/Controller");

let {
  getEmployeeCount,
  hiresAndSeparations,
  yetToJoinCandidates,
  getAttritionData,
} = require("./policy.policy");
let { getConfiguration } = require("./policy.model");

const config = require("../../config/config");

appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;

module.exports = {
  addHRPolicy: addHRPolicy,
  viewHRPolicy: viewHRPolicy,
  deactivatepolicy: deactivatepolicy,
  addHREvent: addHREvent,
  viewHREvent: viewHREvent,
  eventmailnotify: eventmailnotify,
  uploadHoliday: uploadHoliday,
  addHoliday: addHoliday,
  viewHoliday: viewHoliday,
  deactivateEvent: deactivateEvent,
  hrreportview: hrreportview,
  hrreport: hrreport,
  croneoperation: croneoperation,
  getPolicyAgreement,
  agreePolicy,
  getModulePolicy,
  OptionalHolidayConfig,
  hrAnalyticsDashboardData,
  hrAnalyticsHiringData,
  hrDashboard,
  hiringAndLeftTrend,
  viewAttritionData,
};

async function addHRPolicy(req, res) {
  if (!req.body.title || !req.body.mapid || !req.body.action) {
    return res.json({
      message: "send required data",
      state: -1,
    });
  }
  var uploadPath = makeDir(path.join("uploads", "policy"));
  req.body = _.mapObject(req.body, function (val, key) {
    if (val && val.constructor === Array) {
      val = val.toString();
    }
    return val;
  });
  req.body = await commonCtrl.verifyNull(req.body);
  var uploadedData = {
    title: req.body.title,
    description: req.body.description || "",
    id: req.body.id,
    action: req.body.action,
    createdby: req.body.createdby,
    mapid: req.body.mapid,
    newmapid: req.body.newmapid,
    oldtitle: req.body.oldtitle,
    isagreement: req.body.isagreement || 0,
  };
  var sampleFile = req.files && req.files.file;
  if (sampleFile) {
    var sampleFile_name = `${Date.now()}_${sampleFile.name}`;
    var filepath = path.join(uploadPath, sampleFile_name);
    sampleFile.mv(filepath, (err) => {
      if (!err) {
        uploadedData.filename = sampleFile_name;
        uploadedData.filepath = path.join("policy/", sampleFile_name);
        var obj = JSON.stringify(uploadedData);
        commonModel
          .mysqlPromiseModelService("call usp_policy_operation(?)", [obj])
          .then((results) => {
            return res.json({
              message: "success",
              state: 1,
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
      } else {
        return res.json({
          state: -1,
          message: "error in file",
          data: null,
        });
      }
    });
  } else {
    uploadedData.filename = req.body && req.body.filename;
    uploadedData.filepath = req.body && req.body.filepath;
    uploadedData = await commonCtrl.verifyNull(uploadedData);
    var obj = JSON.stringify(uploadedData);
    commonModel
      .mysqlPromiseModelService("call usp_policy_operation(?)", [obj])
      .then((results) => {
        return res.json({
          message: "success",
          state: 1,
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
}

function viewHRPolicy(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Required Information is missing.",
      state: -1,
    });
  }
  var obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService("call usp_policy_operation(?)", [obj])
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

function deactivatepolicy(req, res) {
  if (!req.body.mapid || !req.body.action) {
    return res.json({
      message: "Required Information is missing.",
      state: -1,
    });
  }
  var obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.policy, [obj])
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
          message:
            results && results[0] && results[0][0] && results[0][0].message,
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

async function addHREvent(req, res) {
  if (
    !req.body.title ||
    !req.body.eventdescription ||
    !req.body.startdate ||
    !req.body.enddate ||
    !req.body.mapid
  ) {
    return res.json({
      message: "Required Information is missing.",
      state: -1,
    });
  }
  let checkEventDir = path.join("uploads", "event");
  if (req.files) {
    makeDir(checkEventDir);
    let fileObj = {};
    let fileObj1 = {};
    let newFilesArr = [];
    let attachmentsArr = [];
    let file = req.files.file;
    if (req.body.attachCount == 1) {
      file = [file];
    }
    for (let i = 0; i < file.length; i++) {
      fileObj = {};
      fileObj1 = {};
      let newFileName = `${Date.now()}_${file[i].name}`;
      let checkEventDir = path.join("uploads", "event");
      await file[i].mv(
        path.join(appRoot && appRoot.path, checkEventDir, newFileName)
      );
      fileObj.path = `event/${newFileName}`;
      fileObj.name = file[i].name;
      newFilesArr.push(fileObj);
      fileObj1.filename = file[i].name;
      fileObj1.path = path.join(appRoot.path, `uploads/event/${newFileName}`);
      attachmentsArr.push(fileObj1);
    }
    req.body.attachments = attachmentsArr;
    req.body.images = newFilesArr;
  }
  var obj = JSON.stringify(req.body);
  // //console.log('obj',obj)

  commonModel
    .mysqlPromiseModelService("call usp_policy_operation(?)", [obj])
    .then((results) => {
      if (req.body.sentmail == "1") {
        req.body.id =
          req.body.action == "addevent" ? results[0][0].state : req.body.id;
        eventmailnotify(req, res);
      } else {
        return res.json({
          state: results[0][0].state,
          message:
            results && results[0] && results[0][0] && results[0][0].message,
          data: results && results[0],
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

function deactivateEvent(req, res) {
  if (!req.body.mapid || !req.body.action) {
    return res.json({
      message: "Required Information is missing.",
      state: -1,
    });
  }
  var obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.policy, [obj])
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
          message:
            results && results[0] && results[0][0] && results[0][0].message,
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

function viewHREvent(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Required Information is missing.",
      state: -1,
    });
  }
  var obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService("call usp_policy_operation(?)", [obj])
    .then((results) => {
      //  //console.log('REEEEEEEE',results)
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

function eventmailnotify(req, res) {
  if (!req.body.mapid) {
    return res.json({
      message: "Required Information is missing.",
      state: -1,
    });
  }
  req.body.action = "eventnotify";
  // req.body = _.mapObject(req.body, function (val, key) {
  //     if (val && val.constructor === Array) {
  //         val = val.toString();
  //     }
  //     return val;
  // })
  var mailtype;
  if (req.body.sentmail == "1" || req.body.remindercount == 0) {
    mailtype = "eventnotify"; //when event created
    subjecttype = req.body.title || "Event";
  } else {
    mailtype = "eventreminder"; //when reminder
    subjecttype =
      "Gentle Reminder-" + req.body.remindercount + " " + req.body.title ||
      "Event";
  }
  var obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.policy, [obj])
    .then((results) => {
      if (
        results &&
        results[1] &&
        results[1][0] &&
        results[1][0].state &&
        results[1][0].state == 1
      ) {
        var emailUsers = results[0][0].email;
        var appenddate = "";
        if (
          req.body.eventenddate &&
          req.body.eventstartdate &&
          req.body.eventstartdate != req.body.eventenddate
        ) {
          appenddate =
            "<span style='font-weight: bold;color: #ee8e20;padding: 8px 8px; display: block; '>To</span>" +
            moment(req.body.eventenddate, "YYYY-MM-DD").format(
              "ddd Do MMMM, YYYY"
            );
        }
        var descstr = req.body.eventdescription || req.body.description;
        descstr = descstr.replace(/\\n/g, " ");
        descstr = descstr.replace(/\\r/g, " ");
        var eventdatestrn;
        var eventdatestr =
          req.body.eventstartdate &&
          moment(req.body.eventstartdate, "YYYY-MM-DD").format(
            "ddd Do MMMM, YYYY"
          ) + appenddate;
        if (eventdatestr == "Invalid date" || eventdatestr == null) {
          eventdatestrn = "";
          //   disp ="none"
        } else {
          eventdatestrn =
            '<h3 style="display: disp; background: #fbfbfb;padding: 20px 0px 0px;margin-top: 0px;margin-bottom: 0px;font-family: arial;font-weight: bold;font-size: 20px;color: #ee8e20;text-decoration: underline;">Event Dates</h3><h4 style="font-family: arial;font-weight: bold;margin: 0px;padding: 15px 0px 8px;color: #333;font-size: 14px;">' +
            eventdatestr +
            " </h4>";
          //    disp="block"
        }
        var emailObj = {
          bcc: emailUsers || " ",
          mailType: mailtype,
          banner: "banner4.jpg",
          subjectVariables: {
            subject: subjecttype,
            //EventName: "Invite:"+req.body.title || "Event",
            // ReminderCount: req.body.remindercount
          },
          headingVariables: {
            heading: req.body.title || "Event",
            //heading: "You're invited for "+req.body.title+" event" || "Event",
            //  ReminderCount: req.body.remindercount
          },
          bodyVariables: {
            Description: descstr,
            Eventsddate: eventdatestrn,
            //  Eventeddate: moment(req.body.eventenddate, 'YYYY-MM-DD').format('DD-MM-YYYY'),
            Eventcountry: results[0][0].country,
            Eventlocation: results[0][0].location,
            Eventbu: results[0][0].businessunit,
            Eventworkforce: results[0][0].workforce,
          },
          attachments: req.body.attachments,
        };
        //console.log('attachmet', req.body.attachments);
        res.json({
          state: 1,
          message: "mail sent",
        });

        mailservice.mail(emailObj, function (err) {
          if (err) {
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
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}

function addHoliday(req, res) {
  if (
    !req.body.title ||
    !req.body.startdate ||
    !req.body.enddate ||
    !req.body.mapid
  ) {
    return res.json({
      message: "Required Information is missing.",
      state: -1,
    });
  }
  var obj = JSON.stringify(req.body);

  commonModel
    .mysqlPromiseModelService("call usp_policy_operation(?)", [obj])
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

function viewHoliday(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Required Information is missing.",
      state: -1,
    });
  }
  var obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService("call usp_policy_operation(?)", [obj])
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
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}

function uploadHolidays(req, res) {
  return new Promise((resolve, reject) => {
    if (!req.body.mapid) {
      return res.json({
        state: -1,
        message: "Send Required data",
      });
    }
    let sampleFile;
    let uploadPath;
    if (req.files && Object.keys(req.files).length == 0) {
      return res.json({
        state: -1,
        message: "Something Went Wrong in Uploading ",
        data: null,
      });
    }
    sampleFile = req.files.file;
    var fileformat = sampleFile.name.split(".")[1].toLowerCase();
    if (fileformat != "xlsx") {
      //|| fileformat != 'csv')
      return res.json({
        state: -1,
        message: "Unsupported File Format. Upload XLSX File Format",
        data: null,
      });
    }
    uploadPath = makeDir(path.join("uploads", "holidays"));
    uploadPath = path.join(uploadPath, `${Date.now()}_${req.files.file.name}`);
    sampleFile.mv(uploadPath, (err) => {
      if (err) {
        return res.json({
          state: -1,
          message: "Something Went Wrong in Uploading ",
          data: null,
        });
      } else {
        let wb = xlsx.readFile(uploadPath, {
          type: "binary",
          cellDates: true,
          dateNF: "yyyy/mm/dd;@",
        });
        let sheet_name_list = wb.SheetNames;
        let ws = wb.Sheets[sheet_name_list];
        let excelArr = xlsx.utils.sheet_to_json(ws, {
          raw: false,
        });
        if (excelArr && excelArr.length == 0) {
          return res.json({
            state: -1,
            message: "File is Empty ",
            data: null,
          });
        }

        var headerkeys = Object.keys(excelArr && excelArr[0]).sort();
        headerkeys = headerkeys && headerkeys.toString();
        //console.log('header keys in here ', headerkeys)
        if (
          headerkeys ==
            "Optional Holiday(Y/N),enddate(DD-MM-YYYY),startdate(DD-MM-YYYY),title" ||
          headerkeys ==
            "'Optional Holiday(Y/N)','enddate(DD-MM-YYYY)','startdate(DD-MM-YYYY)','title'"
        ) {
          var filteredarry = lodash.reject(excelArr, (item) => {
            return (
              item.title == "" &&
              item["startdate(DD-MM-YYYY)"] == "" &&
              item["enddate(DD-MM-YYYY)"] == "" &&
              item["Optional Holiday(Y/N)"] == ""
            );
          });
          if (filteredarry && filteredarry.length == 0) {
            reject("File is Empty");
          } else {
            //
            _.map(filteredarry, (item) => {
              item["startdate(DD-MM-YYYY)"] =
                item["startdate(DD-MM-YYYY)"] &&
                item["startdate(DD-MM-YYYY)"].replace(/\//g, "-");
              item["enddate(DD-MM-YYYY)"] =
                item["enddate(DD-MM-YYYY)"] &&
                item["enddate(DD-MM-YYYY)"].replace(/\//g, "-");

              if (
                !item.title ||
                !item["startdate(DD-MM-YYYY)"] ||
                !item["enddate(DD-MM-YYYY)"] ||
                !item["Optional Holiday(Y/N)"]
              ) {
                reject("File Column can't be Empty");
              } else if (
                item.title.length == 0 ||
                item["startdate(DD-MM-YYYY)"].length == 0 ||
                item["enddate(DD-MM-YYYY)"].length == 0 ||
                item["Optional Holiday(Y/N)"].length == 0
              ) {
                reject("File Column can't be Empty");
              } else if (
                !moment(
                  item["startdate(DD-MM-YYYY)"],
                  "DD-MM-YYYY"
                ).isValid() ||
                !moment(item[("enddate(DD-MM-YYYY)", "DD-MM-YYYY")]).isValid()
              ) {
                reject("Not a Valid Date");
              } else if (
                !moment(
                  item["startdate(DD-MM-YYYY)"],
                  "DD-MM-YYYY",
                  true
                ).isValid() ||
                !moment(
                  item["enddate(DD-MM-YYYY)"],
                  "DD-MM-YYYY",
                  true
                ).isValid()
              ) {
                reject("Not a Valid Date format");
              }

              item.startdate = moment(
                new Date(moment(item["startdate(DD-MM-YYYY)"], "DD-MM-YYYY"))
              ).format("YYYY-MM-DD");
              item.enddate = moment(
                new Date(moment(item["enddate(DD-MM-YYYY)"], "DD-MM-YYYY"))
              ).format("YYYY-MM-DD");
              item.isoptional =
                item["Optional Holiday(Y/N)"] == "Y" ||
                item["Optional Holiday(Y/N)"] == "y"
                  ? 1
                  : 0;
            });
            resolve(filteredarry);
          }
        } else {
          reject("File Template is Not Valid  OR  File Column is Empty");
        }
      }
    });
  });
}

function uploadHoliday(req, res) {
  uploadHolidays(req, res)
    .then((val) => {
      if (val) {
        let obj = JSON.stringify(val);
        let obj1 = {
          mapid: req.body.mapid,
          createdby: req.body.createdby,
        };
        obj1 = JSON.stringify(obj1);
        commonModel
          .mysqlPromiseModelService(proc.holidayupload, [obj, obj1])
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
                  results &&
                  results[1] &&
                  results[1][0] &&
                  results[1][0].message,
                data: results,
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
                data: results,
              });
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
    })
    .catch((err) => {
      return res.json({
        message: err,
        state: -1,
        data: null,
      });
    });
}

function hrreportview(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Required Information is missing.",
      state: -1,
    });
  }
  var obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService("call usp_policy_operation(?)", [obj])
    .then((results) => {
      if (
        results &&
        results[2] &&
        results[2][0] &&
        results[2][0].state &&
        results[2][0].state == 1
      ) {
        results[0].forEach((user) => {
          user.reaction_details = results[1].filter(
            (reactions) => user.userid == reactions.user_id
          );
        });
        return res.json({
          state: results[2][0].state,
          message:
            results && results[2] && results[2][0] && results[2][0].message,
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

async function hrreport(req, res) {
  if (!req.body) {
    return res.json({
      message: "send required data",
      state: -1,
      data: null,
    });
  } else {
    let allreportees = await feedbackController.userhierarcy(req, res);
    ////console.log("allreportees ", allreportees);
    let obj = { ...req.body, allreportees };
    //var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService("call usp_policy_operation(?)", [
        JSON.stringify(obj),
      ])
      .then((results) => {
        dbresult = commonCtrl.lazyLoading(results[0], req.body);
        if (dbresult && "data" in dbresult && "count" in dbresult) {
          return res.json({
            state: 1,
            message: "success",
            data: dbresult.data,
            count: dbresult.count,
            orgmoodscore: results[1][0].orgmoodscore,
            orghappinessindex: results[1][0].orghappinessindex,
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

function croneoperation(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Required Information is missing.",
      state: -1,
    });
  }
  var obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService("call usp_policy_operation(?)", [obj])
    .then((results) => {
      var dbresult = commonCtrl.lazyLoading(results[0], req.body);
      if (dbresult && "data" in dbresult && "count" in dbresult) {
        if ((req.body.action = "viewcrone")) {
          global.cronedetail = results && results[1];
        }
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

function getPolicyAgreement(req, res) {
  try {
    let rq = req.body;
    rq.action = "get_policy_agreement";
    commonModel
      .mysqlPromiseModelService("call usp_policy_operation(?)", [
        JSON.stringify(rq),
      ])
      .then((results) => {
        return res.json({
          state: 1,
          message: "Success",
          data: results[0],
        });
      })
      .catch((err) => {
        //console.log('err DB', err)
        return res.json({
          state: -1,
          message: "Something went wrong",
          data: null,
        });
      });
  } catch (err) {
    //console.log('err node', err)
    return res.json({
      state: -1,
      message: "Something went wrong",
    });
  }
}

function agreePolicy(req, res) {
  if (!req.body.policyid) {
    return res.json({
      state: -1,
      message: "Required Parameters are missing",
    });
  } else {
    let rq = req.body;
    rq.action = "agree_policy";
    commonModel
      .mysqlPromiseModelService("call usp_policy_operation(?)", [
        JSON.stringify(rq),
      ])
      .then((results) => {
        return res.json({
          state: 1,
          message: "Success",
        });
      })
      .catch((err) => {
        //console.log('err DB', err)
        return res.json({
          state: -1,
          message: "Something went wrong",
          data: null,
        });
      });
  }
}

function getModulePolicy(req, res) {
  if (!req.body.module) {
    return res.json({
      state: -1,
      message: "Required Parameters are missing",
    });
  } else {
    let rq = {
      action: "module_policy",
      ...req.body,
    };
    commonModel
      .mysqlPromiseModelService("call usp_policy_operation(?)", [
        JSON.stringify(rq),
      ])
      .then((results) => {
        return res.json({
          state: 1,
          message: "Success",
          data: results[0],
        });
      })
      .catch((err) => {
        //console.log('err DB', err)
        return res.json({
          state: -1,
          message: "Something went wrong",
          data: null,
        });
      });
  }
}
async function OptionalHolidayConfig(req, res) {
  try {
    if (!req.body.action) {
      return res.json({ state: -1, message: "Required paramters are missing" });
    }
    let obj = req.body;
    let results = await query("call usp_holiday_optional(?)", [
      JSON.stringify(obj),
    ]);
    return res.json({
      state: 1,
      message: "success",
      data: results[0],
      allow_optional_count:
        results[1] && results[1][0] && results[1][0].allow_optional_count,
      my_optional_count:
        results[1] && results[1][0] && results[1][0].myadditonal_count,
    });
  } catch (err) {
    return res.json({
      state: -1,
      message: err.message || err || "Something went wrong",
      err: err,
    });
  }
}

async function hrAnalyticsDashboardData(req, res) {
  if (!req.body) {
    return res.json({
      message: "send required data",
      state: -1,
      data: null,
    });
  } else {
    let allreportees = await feedbackController.userhierarcy(req, res);
    ////console.log("allreportees ", allreportees);
    let obj = { ...req.body, allreportees };
    //var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService("call usp_policy_operation(?)", [
        JSON.stringify(obj),
      ])
      .then((results) => {
        //console.log("reee", results)
        if (results) {
          return res.json({
            state: 1,
            message: "success",
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
        return res.json({
          state: -1,
          data: null,
          message: err.message || err,
        });
      });
  }
}

async function hrAnalyticsHiringData(req, res) {
  if (!req.body) {
    return res.json({
      message: "send required data",
      state: -1,
      data: null,
    });
  } else {
    let allreportees = await feedbackController.userhierarcy(req, res);
    ////console.log("allreportees", allreportees);
    let obj = { ...req.body, allreportees };
    //var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService("call usp_policy_operation(?)", [
        JSON.stringify(obj),
      ])
      .then((results) => {
        // //console.log("reee", results)
        let financialyeartrend = [];
        let quatertrend = [];
        let monthtrend = [];
        if (results && results[0]) {
          financialyeartrend = [
            {
              financialyear: "FY-2022-23",
              headcount:
                (results[0][0] && results[0][0].currentheadcount) || "",
              hired: (results[0][0] && results[0][0].currenthired) || "",
              left: (results[0][0] && results[0][0].currentleft) || "",
            },
            {
              financialyear: "FY-2021-22",
              headcount: (results[0][0] && results[0][0].p1headcount) || "",
              hired: (results[0][0] && results[0][0].p1hired) || "",
              left: (results[0][0] && results[0][0].p1left) || "",
            },
            {
              financialyear: "FY-2020-21",
              headcount: (results[0][0] && results[0][0].p2headcount) || "",
              hired: (results[0][0] && results[0][0].p2hired) || "",
              left: (results[0][0] && results[0][0].p2left) || "",
            },
            {
              financialyear: "FY-2019-20",
              headcount: (results[0][0] && results[0][0].p3headcount) || "",
              hired: (results[0][0] && results[0][0].p3hired) || "",
              left: (results[0][0] && results[0][0].p3left) || "",
            },
            {
              financialyear: "FY-2018-19",
              headcount: (results[0][0] && results[0][0].p4headcount) || "",
              hired: (results[0][0] && results[0][0].p4hired) || "",
              left: (results[0][0] && results[0][0].p4left) || "",
            },
          ];
        }
        if (results && results[1]) {
          quatertrend = [
            {
              quater: "Q1",
              headcount: (results[1][0] && results[1][0].q1headcount) || "",
              hired: (results[1][0] && results[1][0].q1hired) || "",
              left: (results[1][0] && results[1][0].q1left) || "",
            },
            {
              quater: "Q2",
              headcount: (results[1][0] && results[1][0].q2headcount) || "",
              hired: (results[1][0] && results[1][0].q2hired) || "",
              left: (results[1][0] && results[1][0].q2left) || "",
            },
            {
              quater: "Q3",
              headcount: (results[1][0] && results[1][0].q3headcount) || "",
              hired: (results[1][0] && results[1][0].q3hired) || "",
              left: (results[1][0] && results[1][0].q3left) || "",
            },
            {
              quater: "Q4",
              headcount: (results[1][0] && results[1][0].q4headcount) || "",
              hired: (results[1][0] && results[1][0].q4hired) || "",
              left: (results[1][0] && results[1][0].q4left) || "",
            },
          ];
        }

        if (results && results[2]) {
          monthtrend = [
            {
              month: (results[2][0] && results[2][0].startmonthname) || "",
              headcount: (results[2][0] && results[2][0].startmonthhc) || "",
              hired: (results[2][0] && results[2][0].startmonthhired) || "",
              left: (results[2][0] && results[2][0].startmonthleft) || "",
            },
            {
              month: (results[2][0] && results[2][0].p1monthname) || "",
              headcount: (results[2][0] && results[2][0].p1monthhc) || "",
              hired: (results[2][0] && results[2][0].p1monthhired) || "",
              left: (results[2][0] && results[2][0].p1monthleft) || "",
            },
            {
              month: (results[2][0] && results[2][0].p2monthname) || "",
              headcount: (results[2][0] && results[2][0].p2monthhc) || "",
              hired: (results[2][0] && results[2][0].p2monthhired) || "",
              left: (results[2][0] && results[2][0].p2monthleft) || "",
            },
            {
              month: (results[2][0] && results[2][0].p3monthname) || "",
              headcount: (results[2][0] && results[2][0].p3monthhc) || "",
              hired: (results[2][0] && results[2][0].p3monthhired) || "",
              left: (results[2][0] && results[2][0].p3monthleft) || "",
            },
            {
              month: (results[2][0] && results[2][0].p4monthname) || "",
              headcount: (results[2][0] && results[2][0].p4monthhc) || "",
              hired: (results[2][0] && results[2][0].p4monthhired) || "",
              left: (results[2][0] && results[2][0].p4monthleft) || "",
            },
            {
              month: (results[2][0] && results[2][0].p5monthname) || "",
              headcount: (results[2][0] && results[2][0].p5monthhc) || "",
              hired: (results[2][0] && results[2][0].p5monthhired) || "",
              left: (results[2][0] && results[2][0].p5monthleft) || "",
            },
            {
              month: (results[2][0] && results[2][0].p6monthname) || "",
              headcount: (results[2][0] && results[2][0].p6monthhc) || "",
              hired: (results[2][0] && results[2][0].p6monthhired) || "",
              left: (results[2][0] && results[2][0].p6monthleft) || "",
            },
            {
              month: (results[2][0] && results[2][0].p7monthname) || "",
              headcount: (results[2][0] && results[2][0].p7monthhc) || "",
              hired: (results[2][0] && results[2][0].p7monthhired) || "",
              left: (results[2][0] && results[2][0].p7monthleft) || "",
            },
            {
              month: (results[2][0] && results[2][0].p8monthname) || "",
              headcount: (results[2][0] && results[2][0].p8monthhc) || "",
              hired: (results[2][0] && results[2][0].p8monthhired) || "",
              left: (results[2][0] && results[2][0].p8monthleft) || "",
            },
            {
              month: (results[2][0] && results[2][0].p9monthname) || "",
              headcount: (results[2][0] && results[2][0].p9monthhc) || "",
              hired: (results[2][0] && results[2][0].p9monthhired) || "",
              left: (results[2][0] && results[2][0].p9monthleft) || "",
            },
            {
              month: (results[2][0] && results[2][0].p10monthname) || "",
              headcount: (results[2][0] && results[2][0].p10monthhc) || "",
              hired: (results[2][0] && results[2][0].p10monthhired) || "",
              left: (results[2][0] && results[2][0].p10monthleft) || "",
            },
            {
              month: (results[2][0] && results[2][0].p11monthname) || "",
              headcount: (results[2][0] && results[2][0].p11monthhc) || "",
              hired: (results[2][0] && results[2][0].p11monthhired) || "",
              left: (results[2][0] && results[2][0].p11monthleft) || "",
            },
          ];
        }

        if (financialyeartrend && quatertrend && monthtrend) {
          return res.json({
            state: 1,
            message: "success",
            financialyeartrend: financialyeartrend || [],
            quatertrend: quatertrend || [],
            monthtrend: monthtrend || [],
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

async function hrDashboard(req, res) {
  try {
    if (!req.body) {
      return res.json({
        message: "send required data",
        state: -1,
        data: null,
      });
    } else {
      let allreportees = await feedbackController.userhierarcy(req, res);
      req.body.action = "hranalytics_dashboard_data";
      let obj = { ...req.body, allreportees };
      await getConfiguration();
    

      let result = await query(
        "call usp_hranalytics_dashboard(?)",
        JSON.stringify(obj)
      );
      ////console.log("result", result[1][0]);
      let empCount = getEmployeeCount(result[0]);
      let hireSeparation = hiresAndSeparations(result[0]);
      let yetToJoinCandidate = yetToJoinCandidates(result[1]);

      empCount.cardCountsObj["yetToJoin"] = yetToJoinCandidate;
      empCount.cardCountsObj["hires"] =
        hireSeparation &&
        hireSeparation.cardCountAdditional &&
        hireSeparation.cardCountAdditional.hires;
      empCount.cardCountsObj["separations"] =
        hireSeparation &&
        hireSeparation.cardCountAdditional &&
        hireSeparation.cardCountAdditional.separations;

      return res.json({
        state: 1,
        message: "success",
        data: {
          empCount,
        },
      });
    }
  } catch (error) {
    ////console.log("errrr".error);
    return res.json({
      state: -1,
      data: null,
      message: error.message || error,
    });
  }
}

// async function attritionRateData(req, res) {
//   try {
//     if (!req.body) {
//       return res.json({
//         message: "send required data",
//         state: -1,
//         data: null
//       })
//     } else {
//       let allreportees = await feedbackController.userhierarcy(req, res);
//       req.body.action = "attrition_data";
//       let obj = { ...req.body, allreportees };

//       let result = await query("call usp_hranalytics_dashboard(?)", JSON.stringify(obj));
//       let dept_totalCount = result && result[0];
//       let dept_leftCount = result && result[1];
//       //  //console.log("dept_total", dept_totalCount);
//       // //console.log("dept_left", dept_leftCount);

//       let desg_totalCount = result && result[2];
//       let desg_leftCount = result && result[3];

//       ////console.log("desg_total", desg_totalCount);
//       // //console.log("desg_left", desg_leftCount);

//       let department_wise_attritionData = [];
//       let designation_wise_attritionData = [];

//       dept_totalCount.forEach(item => {
//         let matchedItem = dept_leftCount.find(ele => ele.departmentid == item.departmentid && ele.month == item.month);

//         if (matchedItem != undefined) {
//           matchedItem.attrition_rate = Number(((matchedItem.exit_employee / item.headcount)*100).toFixed(2));
//           matchedItem.headcount = item.headcount;
//         } else {
//           matchedItem = item;
//           matchedItem.attrition_rate = 0.00;
//           matchedItem.exit_employee = 0;
//         }
//         department_wise_attritionData.push(matchedItem);
//       })

//       desg_totalCount.forEach(item => {
//         let matchedItem1 = desg_leftCount.find(ele => ele.designationid == item.designationid && ele.month == item.month);

//         if (matchedItem1 != undefined) {
//           matchedItem1.attrition_rate = Number(((matchedItem1.exit_employee / item.headcount)*100).toFixed(2));
//           matchedItem1.headcount = item.headcount;
//         } else {
//           matchedItem1 = item;
//           matchedItem1.attrition_rate = 0.00;
//           matchedItem1.exit_employee = 0;
//         }
//         designation_wise_attritionData.push(matchedItem1);
//       })

//       return res.json({
//         state: 1,
//         message: "success",
//         data: {
//           department_wise_attritionData,
//           designation_wise_attritionData
//         }
//       })
//     }
//   } catch (error) {
//     //console.log("errrr".error);
//     return res.json({
//       state: -1,
//       data: null,
//       message: error.message || error
//     });
//   }
// }

async function viewAttritionData(req, res) {
  try {
    if (!req.body) {
      return res.json({
        message: "send required data",
        state: -1,
        data: null,
      });
    } else {
      let allreportees = await feedbackController.userhierarcy(req, res);
      req.body.action = "department_designation_attrition";
      let obj = { ...req.body, allreportees };

      let result = await query(
        "call usp_hranalytics_dashboard(?)",
        JSON.stringify(obj)
      );
      let dept_data = result && result[0];
      let desg_data = result && result[1];
      //console.log(dept_data, desg_data);
      let department_wise_attritionData = getAttritionData(dept_data);
      let designation_wise_attritionData = getAttritionData(desg_data);

      return res.json({
        state: 1,
        message: "success",
        data: {
          department_wise_attritionData,
          designation_wise_attritionData,
        },
      });
    }
  } catch (error) {
    //console.log("errrr".error);
    return res.json({
      state: -1,
      data: null,
      message: error.message || error,
    });
  }
}

async function hiringAndLeftTrend(req, res) {
  try {
    if (!req.body) {
      return res.json({
        message: "send required data",
        state: -1,
        data: null,
      });
    } else {
      let allreportees = await feedbackController.userhierarcy(req, res);
      req.body.action = "hiring_left_trend";
      let obj = { ...req.body, allreportees };

      let result = await query(
        "call usp_hranalytics_dashboard(?)",
        JSON.stringify(obj)
      );
      let financialyeartrend = result && result[0];
      let quatertrend = result && result[1];
      let monthtrend = result && result[2];

      financialyeartrend.map((item) => {
        item.left = item.separated;
        delete item.separated;
      });
      quatertrend.map((item) => {
        item.left = item.separated;
        delete item.separated;
      });
      monthtrend.map((item) => {
        item.left = item.separated;
        delete item.separated;
      });

      return res.json({
        state: 1,
        message: "success",
        data: { financialyeartrend, quatertrend, monthtrend },
      });
    }
  } catch (error) {
    return res.json({
      state: -1,
      data: null,
      message: error.message || error,
    });
  }
}
