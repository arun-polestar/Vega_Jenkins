const appRoot = require("app-root-path");
var timeZone = "Asia/Kolkata";
var moment = require("moment-timezone");
const https = require("https");
var axios = require("axios");
const _ = require("underscore");
var mime = require("mime"),
  path = require("path"),
  fs = require("fs");
moment.tz.setDefault("Asia/Kolkata");
const prediction = require("../routes/joiningPrediction/Controller");
var async = require("async");
//var stringSimilarity = require('string-similarity');
var CronJob = require("cron").CronJob,
  mv = require("mv");
var extractmailServices = require("./extractmailServices");
const commonModel = require("../routes/common/Model");
var config = require("../config/config");
var linkUrl = config.webUrlLink;
const leaveCtrl = require("../routes/vegaHR/leave/leave.controller");
const timelineCtrl = require("../routes/timeline/Controller");
const commonlib = require("../lib/common");

const pms = require("./../routes/pms/Controller");
const learn = require("./../routes/learning/utilities/controller");
const user = require("../routes/user/user.controller");
const dsrCtrl = require("./../routes/DSR/Controller");
const timeCtrl = require("../routes/timesheet/timesheet.controller");
const commonCtrl = require("../routes/common/Controller");
const empCtrl = require("../routes/employee/employee.controller");
const candidateCtrl = require("../routes/vegaHR/candidate/Controller");
const userLoginCtrl = require("../routes/userLogin/userlogin.controller");
const grantCtrl = require("../routes/ESOP/grantlatter.Controller");
const wbsCtrl = require("./../routes/projectTree/project/project.controller");
const log = require("log-to-file");

const paytmCtrl = require("./../routes/paytm/Controller");
const feedbackCtrl = require("../routes/feedback/Controller");
const couponCtrl = require("../routes/coupon/Controller");
const ESOPCtrl = require("../routes/ESOP/esop.Controller");
const clientsyncCtrl = require("../routes/clientsync/Controller");

const demandCtrl = require("../routes/resourceManagement/demandResource/demand.controller");

const adhocCtrl = require("../routes/adhoc-report/adhoc-report.controller");
const { dsrtosupervisors } = require("./../routes/DSR/Controller");
const authService = require("./authService");
const { makeDirectories } = require("../routes/common/utils");

appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;

module.exports = {
  joiningPrediction: joiningPrediction,
  leaveUpdate: leaveUpdate,
  leaveAllotOnConfirm: leaveAllotOnConfirm,
  changeUserLicense: changeUserLicense,
  dsrforsupervisor: dsrforsupervisor,
  currentBirthdaysPost,
  currentAnniversaryPost,
  timesheetReminder,
  clearEmailLogs,
  croneschedule,
  PMSMail,
  PMSReviewmail,
  PMSVerticalreviewmail,
  learningtrainingReminder,
  NitcoAttendance,
  nitcoEmployeeJson,
  rejectCandidateMail,
  getEmployeeJson,
  allotwbscode,
  paytmorderlist,
  clearTokenMonthly,
  //empConfirmationReminder,
  certificationdelete,
  leaveAllotOnJoin,
  clearCompoffBalance,
  // updatecoupontoken,
  getClientAttendance,
  mailLogsResend,
  vestingesop,
  balanceupdate,
  cronNewUserMails,
  weeklyTimesheetReminder,
  getEmployeeData3rdparty,
  grantesopreminder,
  feedbackReportMail,
  runAllCronJobs,
  createGrantLetter,
  clientEmpApiService,
  pingSavista,
  // deleteOldBirthdayAnniversaryPosts
  resourceDemandReminder1,
  resourceDemandReminder2,
};

new CronJob(
  "* * * * *",
  function () {
    if (global.scheduledData) {
      //console.log("Global Scheduler Data - :", global.scheduledData);
      var rmsController = require("../routes/vegaHR/upload/Controller");
      _.map(global.scheduledData, async function (item) {
        var time = moment().format("LT");
        var jobtimeval =
          item.jobtime &&
          item.jobtime
            .split(",")
            .map((t) => moment(moment(t, "HH:mm:ss")).format("LT"));
        if (jobtimeval && jobtimeval.indexOf(time) > -1) {
          // if (jobtimeval && (time.getHours() == jobtimeval.getHours() && time.getMinutes() == jobtimeval.getMinutes())) {
          let currentimespan = new Date().valueOf(),
            resumetempdir =
              (item.resumesource || "Mailer") + "_" + currentimespan;
          var dirname = makeDirectories(
            path.join(
              appRoot && appRoot.path,
              "/uploads/Recruitment/" + resumetempdir
            )
          );

          // extractmailServices.startListner({ emailid: item.email, password: item.password, dirname: dirname, resumetempdir: resumetempdir }, function (err, data) {
          // 	var resumesource = item.resumesource;
          // 	fs.readdir((appRoot && appRoot.path) + '/uploads/Recruitment/' + resumetempdir + '/', function (err, filenames) {
          // 		if (err) {
          // 			return;
          // 		}
          // // extractmailServices.startListner({emailid:item.email,password:item.password,dirname:dirname,resumetempdir:resumetempdir},function(err,data){
          extractmailServices
            .downloadAttachment({
              token: JSON.parse(item.token),
              levelId: item.levelid,
              emailid: item.email,
              dirname: dirname,
              resumetempdir: resumetempdir,
            })
            .then(async (data) => {
              //console.log("After resume download from email", data);
              fs.readdir(
                (appRoot && appRoot.path) +
                  "/uploads/Recruitment/" +
                  resumetempdir +
                  "/",
                function (err, filenames) {
                  if (err) {
                    console.error(
                      "Error in reading directory of newly downloaded File:",
                      err
                    );
                    return;
                  }
                  async.eachSeries(
                    filenames,
                    function (value, callback) {
                      mv(
                        dirname + "/" + value,
                        path.join(appRoot && appRoot.path, "/uploads/RMS/") +
                          value,
                        async function (err) {
                          if (err) {
                            console.error(
                              "Error in moving resume to RMS:",
                              err
                            );
                            callback();
                          } else {
                            //console.log(`${value} move to uploads/RMS`);
                            var uploadedData = {
                              filename: value,
                              uploadedpath:
                                path.join(
                                  appRoot && appRoot.path,
                                  "/uploads/RMS/"
                                ) + value,
                            };
                            let mailData = data.filter((item) => {
                              return item[value];
                            });
                            let candidateMail =
                              mailData && mailData[0] && mailData[0][value];
                            var resumesource =
                              (await commonlib.getResumeSourceID(
                                candidateMail && candidateMail.resumeSource
                              )) || item.resumesource;
                            let parsedMail = {};
                            if (
                              resumesource == "Naukri.com" ||
                              (candidateMail &&
                                candidateMail.mailSubject &&
                                candidateMail.mailSubject.includes(
                                  "Naukri.com"
                                ))
                            ) {
                              //console.log("Here");
                              parsedMail = {
                                ...(await commonlib.parseNaukriTemplate(
                                  candidateMail.mailSubject,
                                  candidateMail.msg
                                )),
                              };
                            }

                            rmsController
                              .parseData(
                                uploadedData,
                                item.createdby,
                                resumesource,
                                null,
                                "HR",
                                parsedMail
                              )
                              .then((result) => {
                                //console.log(
                                //  "log after parsing the resume downloaded from email",
                                //  result
                                // );
                                callback();
                              })
                              .catch((e) => {
                                console.error(
                                  "error in parsing the resume from email:",
                                  e
                                );
                                callback();
                              });
                          }
                        }
                      );
                    },
                    function (err) {}
                  );
                }
              );
            })
            .catch(() => {
              console.error("Error in getting resumes from emails");
            });

          // });
        }
      });
    }
  },
  null,
  true,
  timeZone
);

function runAllCronJobs() {
  //cronService.croneschedule();                 // for check crone is activated or not activated

  //new CronJob('30 1 * * *', function () {

  //      for (let i = 0; i < (global.cronedetail).length; i++) {

  //              if (global.cronedetail[i].title == 'joiningPrediction') {
  joiningPrediction();
  //              }
  //              else if (global.cronedetail[i].title == 'leaveUpdate') {
  leaveUpdate();
  //              }
  //              else if (global.cronedetail[i].title == 'leaveAllotOnConfirm') {
  leaveAllotOnConfirm();
  //              }
  //              else if (global.cronedetail[i].title == 'changeUserLicense') {
  changeUserLicense();
  //              }
  if (linkUrl.indexOf("polestarllp") != -1) {
    //console.log("crons for polestar");
    //            else if (global.cronedetail[i].title == 'currentBirthdaysPost') {
    //            currentBirthdaysPost();
    //            }
    //            else if (global.cronedetail[i].title == 'currentAnniversaryPost') {
    //            currentAnniversaryPost();
    //            }
    //            else if (global.cronedetail[i].title == 'dsrforsupervisor') {
    dsrforsupervisor();
    //            }
    //            else if (global.cronedetail[i].title == 'timesheetReminder') {
    timesheetReminder();
    //            }
    //            else if (global.cronedetail[i].title == 'PMSMail') {
    PMSMail();
    //            }
    //            else if (global.cronedetail[i].title == 'PMSReviewmail') {
    PMSReviewmail();
    //            }
    //            else if (global.cronedetail[i].title == 'PMSVerticalreviewmail') {
    PMSVerticalreviewmail();
    //            }
    //            else if (global.cronedetail[i].title == 'learningtrainingReminder') {
    learningtrainingReminder();
    //            }
    rejectCandidateMail();
  }
  //              else if (global.cronedetail[i].title == 'clearEmailLogs') {
  clearEmailLogs();
  //              }

  //              //console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&7', global.cronedetail[i].title);
  //      }
  //}, null, true, timeZone)

  NitcoAttendance();
  nitcoEmployeeJson();
  allotwbscode();
  paytmorderlist();
  clearTokenMonthly();
  certificationdelete();
  clearCompoffBalance();
  currentBirthdaysPost();
  currentAnniversaryPost();
  getClientAttendance();
  mailLogsResend();
  // updatecoupontoken();
  vestingesop();
  balanceupdate();
  cronNewUserMails();
  grantesopreminder();
  feedbackReportMail();
  weeklyTimesheetReminder();
  getEmployeeData3rdparty();
  clientEmpApiService();
  pingSavista();
  createGrantLetter();
  resourceDemandReminder1();
  resourceDemandReminder2();
  // empConfirmationReminder();
}

function joiningPrediction() {
  if (linkUrl.indexOf("salesdemo") == -1) {
    new CronJob(
      "0 0 * * *",
      function () {
        //console.log("xxx---------->>>> CronJob for Joining prediction");
        prediction.getPrediction();
      },
      null,
      true,
      timeZone
    );
  }
}

function leaveUpdate() {
  if (linkUrl.indexOf("salesdemo") == -1) {
    new CronJob(
      "00 00 * * *",
      function () {
        //console.log("leave UPDATE CRON JOB.");
        leaveCtrl.updateLeaves();
      },
      null,
      true,
      timeZone
    );
  }
}

function leaveAllotOnConfirm() {
  //if (linkUrl.indexOf("salesdemo") == -1) {
  new CronJob(
    "30 23 * * *",
    function () {
      //console.log("leaveAllotOnConfirm JOB.");
      leaveCtrl.leaveAllotOnConfirm("leaveonconfirm");
    },
    null,
    true,
    timeZone
  );
  //}
}

function leaveAllotOnJoin() {
  //if (linkUrl.indexOf("salesdemo") == -1) {
  new CronJob(
    "30 00 * * *",
    function () {
      //console.log("leaveAllotOnJoin JOB.");
      leaveCtrl.leaveAllotOnConfirm("leaveonjoined");
    },
    null,
    true,
    timeZone
  );
  //}
}

function PMSMail() {
  if (linkUrl.indexOf("salesdemo") == -1 || linkUrl.indexOf("nitco") == -1) {
    new CronJob(
      "00 09 * * *",
      function () {
        //console.log("This is For PMS");
        pms.pmsMail();
      },
      null,
      true,
      timeZone
    );
  }
}

function PMSReviewmail() {
  if (linkUrl.indexOf("salesdemo") == -1 || linkUrl.indexOf("nitco") == -1) {
    new CronJob(
      "00 11 * * *",
      function () {
        //console.log("This is For PMS Review");
        pms.pmsreviewmail();
      },
      null,
      true,
      timeZone
    );
  }
}

function PMSVerticalreviewmail() {
  if (linkUrl.indexOf("salesdemo") == -1 || linkUrl.indexOf("nitco") == -1) {
    new CronJob(
      "00 13 * * *",
      function () {
        //console.log("This is For PMS Vertical");
        pms.pmsverticalreviewmail();
      },
      null,
      true,
      timeZone
    );
  }
}

function learningtrainingReminder() {
  if (linkUrl.indexOf("salesdemo") == -1 || linkUrl.indexOf("nitco") == -1) {
    new CronJob(
      "0 0 * * *",
      function () {
        //console.log("xxx---------->>>> CronJob for training reminder");
        //learn.trainingReminder('trainingreminder')
        //learn.trainingReminder('classroomreminder')
      },
      null,
      true,
      timeZone
    );
  }
}

function changeUserLicense() {
  new CronJob(
    "45 23 * * *",
    function () {
      //console.log("<<<<<<<<<<CronJob for license>>>>>>>>>>>>>");
      user.changeLicenseStatusCron();
    },
    null,
    true,
    timeZone
  );
}

function dsrforsupervisor() {
  //new CronJob('* * * * *',function(){
  if (linkUrl.indexOf("salesdemo") == -1 || linkUrl.indexOf("nitco") == -1) {
    new CronJob(
      "0 7 * * 2-6",
      function () {
        //console.log(
        //   ">>>>>>>>>>>>>>>>>>>>>>>>Cron for DSR>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>."
        // );
        dsrCtrl.dsrtosupervisors();
      },
      null,
      true,
      timeZone
    );
  }
}

function currentBirthdaysPost() {
  if (linkUrl.indexOf("salesdemo") == -1 || linkUrl.indexOf("nitco") == -1) {
    // new CronJob('* * * * *', function () {
    new CronJob(
      "0 6 * * *",
      function () {
        //console.log(" -------Cron for Birthday Postssss---");
        timelineCtrl.bulk_create_birthday_posts();
        // leaveCtrl.leaveAllotOnConfirm()
      },
      null,
      true,
      timeZone
    );
  }
}

function currentAnniversaryPost() {
  if (linkUrl.indexOf("salesdemo") == -1 || linkUrl.indexOf("nitco") == -1) {
    new CronJob(
      "0 7 * * *",
      function () {
        //console.log("cron for everry minute-------Anniversary Postssss---");
        timelineCtrl.bulk_create_anniversary_posts();
      },
      null,
      true,
      timeZone
    );
  }
}

function timesheetReminder() {
  if (linkUrl.indexOf("salesdemo") == -1 || linkUrl.indexOf("nitco") == -1) {
    new CronJob(
      "00 10 * * *",
      function () {
        //console.log(
        //   "xxx---------->>>> CronJob for Timesheet reminder fortnight and month"
        // );
        timeCtrl.timesheetReminder("timesheetreminder");
      },
      null,
      true,
      timeZone
    );
  }
}

function NitcoAttendance() {
  if (linkUrl.indexOf("nitco") != -1) {
    new CronJob(
      "*/20 * * * *",
      function () {
        //console.log("This is For Nitco Attendance json");
        timeCtrl.getNitcoAttendance();
      },
      null,
      true,
      timeZone
    );
  }
}

function clearEmailLogs() {
  new CronJob(
    "00 03 * * *",
    function () {
      //console.log("xxx---------->>>> CronJob for Timesheet reminder");
      commonCtrl.clearEmailLogs();
    },
    null,
    true,
    timeZone
  );
}
function renameKeys(obj, newKeys) {
  const keyValues = Object.keys(obj).map((key) => {
    const newKey = newKeys[key] || key;
    return { [newKey]: obj[key] };
  });
  return Object.assign({}, ...keyValues);
}

function getEmployeeJson(status) {
  let newKeys = {
    Emp_Code: "empcode",
    FName: "fname",
    LName: "lname",
    W_Email: "officialemail",
    P_Email: "personalemail",
    GENDER: "gender",
    Date_of_joining: "dateofjoining",
    Cost_Center: "costcenter",
    Contact_No: "contactnumber",
    Birth_Date: "dateofbirth",
    Country: "country",
    Location: "location",
    Work_Location: "worklocation",
    Department: "departmentName",
    Designation: "designation",
    REmp_Code: "reportingmanager",
    Bus_Unit: "businessunit",
    Date_of_confirmation: "dateofconfirmation",
    Relieving_Date: "relievingdate",
    Portal_License: "portallicense",
  };

  //let apiurl = "https://routerprd.nitco.in:8084/routerprd/getUserJsonAction.do";
  const url = "https://nitco.in/vegahr/NitcoEmpDataForVega";
  const data = {
    Username: "VegaHR",
    Password: "NV#hr@321",
  };
  const headers = {
    Authtoken: "nqcYRR56-eXut6GbI-FF6bXcZy-uYCKC23S",
  };
  const newnow = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
  });

  if (!fs.existsSync(path.join(appRoot.path, "uploads/errorlogs"))) {
    fs.mkdirSync(path.join(appRoot.path, "uploads/errorlogs"));
  }
  var errlogfile = path.join(
    appRoot.path,
    "uploads/errorlogs",
    "nitcoservice.log"
  );
  axios
    .post(url, data, { headers })
    .then(async (jsondata) => {
      log("Api working fine , " + newnow, errlogfile);
      /**
       * Commenting from here
       */
      let workmenempcodes = [
        4015, 4042, 4049, 4096, 4112, 4119, 4130, 4131, 4132, 4136, 4170, 4193,
        4196, 4198, 4201, 4202, 4205, 4206, 4211, 4223, 4228, 4230, 4231, 4234,
        4240, 4267, 4269, 4273, 4294, 4296, 4297, 4300, 4301, 4302, 4312, 4314,
        4319, 4329, 4331, 4332, 4347, 4348, 4350, 4351, 4352, 4353, 4354, 4355,
        4356, 4357, 4358, 4359, 4360, 4361, 4362, 4363, 4373, 4375, 4381, 4384,
        4385, 4386, 4387, 4388, 4389, 4393, 4394, 4395, 4396, 4397, 4398, 4399,
        4400, 4401, 4414, 4423, 4424, 4431, 4432, 4440, 4453, 4460, 4461, 4463,
        4464, 4465, 4466, 4467, 4470, 4473, 4477, 4487, 4492, 4505, 4515, 4516,
        4517, 4518, 4519, 4521, 4555, 4557, 4562, 4568, 4569, 4570, 4576, 4578,
        4587, 4589, 4592, 4597, 4598, 4599, 4609, 4612, 4614, 4625, 4632, 4635,
        4637, 4638, 4641, 4650, 4657, 4662, 4663, 4664, 4665, 4673, 4679, 4680,
        4697, 4698, 4701, 4706, 4707, 4710, 4718, 4727, 4728, 4729, 4731, 4740,
        4742, 4743, 4747, 4751, 4752, 4753, 4758, 4761, 4762, 4763, 4764, 4766,
        4767, 4772, 4773, 4776, 4783, 4786, 4787, 4788, 4789, 4790, 4793, 4794,
        4795, 4796, 4798, 4799, 4800, 4803, 4804, 4810, 4818, 4819, 4820, 4823,
        4824, 4829, 4831, 4832, 4834, 4838, 4839, 4840, 4841, 4848, 4852, 4868,
        4871, 4872, 4876, 4882, 4883, 4888, 4889, 4890, 4892, 4893, 4896, 4914,
        4915, 4921, 4925, 4928, 4933, 4936, 4939, 4942, 4944, 4952, 4955, 4959,
        4962, 4963, 4973, 4977, 4980, 4981, 4982, 4984, 4985, 4986, 4990, 4999,
        5000, 5001, 5005, 5007, 5015, 5016, 5019, 5020, 5021, 5024, 5025, 5026,
        5027, 5029, 5032, 5035, 5036, 5037, 5040, 5055, 5057, 5089, 5164,
      ];
      _.each(workmenempcodes, (value) => {
        jsondata["data"] =
          jsondata["data"] &&
          jsondata["data"].filter(function (item) {
            if (item.empcode == value) {
              item.portallicense = "No";
            }
            return item;
          });
      });
      let filtered = [];
      if (status == "Active") {
        filtered["empdetails"] = _.chain(jsondata.data)
          .filter((data) => {
            return data.portallicense == "Yes" || data.Portal_License == "Yes";
          })
          .map((item) => {
            return (item = renameKeys(item, newKeys));
          })
          .value();
        empCtrl.saveNitcoEmployeeJson(filtered, status);
      } else if (status == "Inactive") {
        filtered["empdetails"] = _.chain(jsondata.data)
          .filter((data) => {
            return data.portallicense == "No" || data.Portal_License == "No";
          })
          .map((item) => {
            return (item = renameKeys(item, newKeys));
          })
          .value();
        empCtrl.saveNitcoEmployeeJson(filtered, status);
      }
    })
    .catch((error) => {
      log("Api not working ,Error:" + error, errlogfile);
      console.error(error.message);
    });
}

function nitcoEmployeeJson() {
  if (linkUrl.indexOf("nitco") != -1) {
    new CronJob(
      "30 5 * * *",
      function () {
        console.log("This is For Nitco active employee json");
        getEmployeeJson("Active");
      },
      null,
      true,
      timeZone
    );
    // new CronJob('30 5 * * *', function () {
    // 	//console.log('This is For Nitco active employee json');
    // 	getEmployeeJson('Active');

    // }, null, true, timeZone)

    // new CronJob(
    //   "0 3 * * *",
    //   function () {
    //     //console.log("This is For Nitco inactive employee json");
    //     getEmployeeJson("Inactive");
    //   },
    //   null,
    //   true,
    //   timeZone
    // );

    // new CronJob('0 6 * * *', function () {
    // 	//console.log('This is For Nitco inactive employee json');
    // 	getEmployeeJson('Inactive');

    // }, null, true, timeZone)
  }
}

function croneschedule() {
  // new CronJob('* * * * *',function(){
  // if (linkUrl.indexOf("salesdemo") == -1) {
  new CronJob(
    "0 1 * * *",
    function () {
      let obj = {
        action: "viewcrone",
        isactive: 1,
      };
      obj = JSON.stringify(obj);
      //console.log(
      //   "crone>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>."
      // );
      commonModel
        .mysqlPromiseModelService("call usp_policy_operation(?)", [obj])
        .then((results) => {
          // var dbresult = commonCtrl.lazyLoading(results[0], req.body);
          // if (dbresult && "data" in dbresult && "count" in dbresult) {
          // global.cronedetail = [];
          global.cronedetail = results && results[1];
          //console.log("Email ativate details", results && results[1]);
        })
        .catch((err) => {
          //console.log("Email ativate error", err);
        });
    },
    null,
    true,
    timeZone
  );
  // }
}

function rejectCandidateMail() {
  new CronJob(
    "0 11 * * * ",
    function () {
      candidateCtrl.rejectedCandidate("All");
    },
    null,
    true,
    timeZone
  );
}

function allotwbscode() {
  if (linkUrl.indexOf("salesdemo") == -1 || linkUrl.indexOf("nitco") == -1) {
    new CronJob(
      "0 5 */15 * *",
      function () {
        // new CronJob('* * * * *', function () {
        //console.log("cron for everry minute------allot wbs---");
        wbsCtrl.wbsallot();
        // leaveCtrl.leaveAllotOnConfirm()
      },
      null,
      true,
      timeZone
    );
  }
}

function paytmorderlist() {
  if (linkUrl.indexOf("salesdemo") == -1 || linkUrl.indexOf("nitco") == -1) {
    // new CronJob('0 0 * * *', function () {
    new CronJob(
      "0 16 * * *",
      function () {
        //console.log("cron for ------paytm order list---");
        paytmCtrl.orderlist();
        // leaveCtrl.leaveAllotOnConfirm()
      },
      null,
      true,
      timeZone
    );
  }
}

// function clearEmailLogs() {
// 	new CronJob('00 03 * * *', function () {
// 		//console.log('xxx---------->>>> CronJob for Timesheet reminder');
// 		commonCtrl.clearEmailLogs();

// 	}, null, true, timeZone)
// }

// function deleteOldBirthdayAnniversaryPosts() {
// 	if (linkUrl.indexOf("salesdemo") == -1) {
// 		new CronJob('0 7 * * *', function () {
// 			//console.log("cron each day for deleting old birthdaya and Anniversary Postssss---");
// 			timelineCtrl.deleteOldBirthdayAnniversaryPosts();
// 		}, null, true, timeZone)
// 	}
// }

function clearTokenMonthly() {
  new CronJob(
    "00 03 * * *",
    function () {
      //console.log("xxx---------->>>> CronJob for clearTokenMonthly");
      userLoginCtrl.clearTokenMonthly();
    },
    null,
    true,
    timeZone
  );
}

function empConfirmationReminder() {
  new CronJob(
    "12 14 * * *",
    function () {
      //console.log("xxx---------->>>> CronJob for empConfirmationReminder");
      empCtrl.empConfirmationReminder();
    },
    null,
    true,
    timeZone
  );
}

function certificationdelete() {
  new CronJob(
    "0 0 * * *",
    function () {
      //  new CronJob('* * * * *', function () {
      //console.log("cron for everry minute------Delete Certification---");
      feedbackCtrl.deletecertificaton();
    },
    null,
    true,
    timeZone
  );
}

function clearCompoffBalance() {
  new CronJob(
    "45 23 * * *",
    function () {
      //console.log("cron for everry minute------Delete Certification---");
      leaveCtrl.clearCompoffBalance();
    },
    null,
    true,
    timeZone
  );
}
new CronJob(
  "12 0 * * *",
  function () {
    //console.log("mood");
    adhocCtrl.getmooddata();
  },
  null,
  true,
  timeZone
);

// function updatecoupontoken() {
//   new CronJob(
//     "0 5 */10 * *",
//     function () {
//       // new CronJob('* * * * *', function () {
//       //console.log("cron for every 10 days ------update coupon token---");
//       couponCtrl.couponaccestoken();
//     },
//     null,
//     true,
//     timeZone
//   );
// }

function getClientAttendance() {
  if (linkUrl.indexOf("mawai") != -1) {
    new CronJob(
      "0 5 7,15,28,29,30,31 * *",
      function () {
        // new CronJob('44 09 * * *', function () {
        //console.log("cron for every client attendance");
        timeCtrl.getClientAttendance("mawai");
      },
      null,
      true,
      timeZone
    );
  }
}

function mailLogsResend() {
  if (linkUrl.indexOf("salesdemo") == -1) {
    new CronJob(
      "0 7 * * *",
      function () {
        console.log(
          ">>>>>>>>>>>>>>>>>>>>>>>>Cron for Failure mails>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>."
        );
        commonCtrl.resendFailedMails();
      },
      null,
      true,
      timeZone
    );
  }
}

function vestingesop() {
  new CronJob(
    "0 2 * * *",
    function () {
      // new CronJob('* * * * *', function () {
      //console.log("cron for each day  at 2 am------update vesting ESOP---");
      ESOPCtrl.esopvesting();
    },
    null,
    true,
    timeZone
  );
}

function balanceupdate() {
  new CronJob(
    "0 2 * * *",
    function () {
      // new CronJob('* * * * *', function () {
      //console.log(
      //   "cron for each day  at 2 am------update Balancee on Superadmin---"
      // );
      couponCtrl.updatecouponbalance();
    },
    null,
    true,
    timeZone
  );
}
function cronNewUserMails() {
  // new CronJob('59 21 * * *', function () {
  //   //console.log("cron user email---");
  //   commonCtrl.sendUserCreateEmail();
  // }, null, true, timeZone)
}
function weeklyTimesheetReminder() {
  if (linkUrl.indexOf("statusneo") != -1) {
    new CronJob(
      "30 09 * * *",
      function () {
        //console.log(
        //    "xxx---------->>>> CronJob for Statusneo Timesheet reminder weekly"
        //  );
        timeCtrl.timesheetReminder("weeklyreminder");
      },
      null,
      true,
      timeZone
    );
  }
}

function getEmployeeData3rdparty() {
  if (linkUrl.indexOf("falcon") != -1) {
    new CronJob(
      "30 22 * * *",
      function () {
        //console.log("This is For getEmployeeData3rdparty");
        let apiurl = config.empsyncapiurl && config.empsyncapiurl.apiurl;
        let username = config.empsyncapiurl && config.empsyncapiurl.username;
        let Password = config.empsyncapiurl && config.empsyncapiurl.Password;
        let clientname;
        if (linkUrl.indexOf("falcon") != -1) {
          clientname = "falcon";
        }
        //clientname = 'falcon';
        var data = JSON.stringify({ username: username, Password: Password });

        var option = {
          method: "get",
          url: apiurl,
          headers: {
            Authorization: "Basic VmVnYVBvcnRhbDppbEB2ZW15SW5kaUA=",
            "Content-Type": "application/json",
          },
          data: data,
        };

        axios(option)
          .then(function (response) {
            ////console.log(JSON.stringify(response.data));
            let jsondata = response.data;
            empCtrl.clientWiseEmployeeSync(jsondata, clientname, apiurl);
          })
          .catch(function (error) {
            //console.log(error);
            empCtrl.sendNotificationEmpApiErr(error, apiurl);
          });
      },
      null,
      true,
      timeZone
    );
  }
}

function grantesopreminder() {
  // new CronJob('* * * * *', function () {
  if (linkUrl.indexOf("salesdemo") == -1 || linkUrl.indexOf("nitco") == -1) {
    new CronJob(
      "0 2 * * 1,3,5",
      function () {
        //console.log(
        //    ">>>>>>>>>>>>>>>>>>>>>>>>Cron for Accept Grnat ESOP Reminder>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>."
        // );
        ESOPCtrl.grantesopreminder();
      },
      null,
      true,
      timeZone
    );
  }
}

function feedbackReportMail() {
  if (linkUrl.indexOf("salesdemo") == -1 || linkUrl.indexOf("nitco") == -1) {
    new CronJob(
      "12 22 1 * *",
      function () {
        //console.log("This is For Feedback Report Mail");
        feedbackCtrl.feedbackReportMail();
      },
      null,
      true,
      timeZone
    );
  }
}

function pingSavista() {
  // for only ping api
  if (linkUrl.indexOf("savista") > -1) {
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
    log("Cron for Client Secure API ," + newnow, errlogfile);
    new CronJob(
      "0 6 * * *",
      function () {
        clientsyncCtrl.clientApiCallValidation();
      },
      null,
      true,
      timeZone
    );
  }
}

function clientEmpApiService() {
  if (linkUrl.indexOf("savista") > -1) {
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
    log("Cron for Client Secure API ," + newnow, errlogfile);
    new CronJob(
      "2 6 * * *",
      function () {
        //console.log(
        //   ">>>>>>>>>>>>>>>>>>>>>>>>Cron for Client Secure API>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>."
        // );
        clientsyncCtrl.clientApiCallValidation();
      },
      null,
      true,
      timeZone
    );
  }
}
// clientEmpApiService();

function createGrantLetter() {
  if (linkUrl.indexOf("salesdemo") == -1 || linkUrl.indexOf("nitco") == -1) {
    // new CronJob('* * * * *', function () {
    new CronJob(
      "* 3 * * *", // at 3 AM
      function () {
        //console.log(" -------Cron for Grant Letter Creation ---");
        grantCtrl.createGrantLetter();
      },
      null,
      true,
      timeZone
    );
  }
}

function resourceDemandReminder1() {
  if (linkUrl.indexOf("polestarllp") != -1) {
    new CronJob(
      "0 9 * * FRI",
      function () {
        // new CronJob('* * * * *', function () {
        //console.log(
        //   "cron for each day  at 2 am------update Balancee on Superadmin---"
        // );
        demandCtrl.demandsReminder("demands_reminder_for_profilenotshared");
      },
      null,
      true,
      timeZone
    );
  }
}

function resourceDemandReminder2() {
  if (linkUrl.indexOf("polestarllp") != -1) {
    new CronJob(
      "0 9 * * FRI",
      function () {
        // new CronJob('* * * * *', function () {
        //console.log(
        //   "cron for each day  at 2 am------update Balancee on Superadmin---"
        // );
        demandCtrl.demandsReminder("demands_reminder_for_interviewpending");
      },
      null,
      true,
      timeZone
    );
  }
}
