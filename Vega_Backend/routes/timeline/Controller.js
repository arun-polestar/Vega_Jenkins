/**
 * TimesheetController
 */
"use strict";
var fs = require("fs");
var moment = require("moment-timezone");
moment.tz.setDefault("Asia/Kolkata");
var path = require("path");
var _ = require("underscore");
const commonModel = require("../common/Model");
const config = require("../../config/config");
const appRoot = require("app-root-path");
const async = require("async");
const commonUtils = require("../../lib/common");
const axios = require("axios");
const { resultS } = require("underscore");
const makeDir = require("../../routes/common/utils").makeDirectories;
const mailservice = require("../../services/mailerService");
const Blob = require("blob");
const paytm = require("../paytm/Controller");
const feedback = require("../feedback/Controller");
const notificationCtrl = require("../notification/Controller");

appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;



module.exports = {
  createPost,
  fetchPost,
  editPost,
  deletePost,
  checkLikedOrNot,
  fetchLikeOrComment,
  deleteLikeOrComment,
  editComment,
  fetchUpcomingBirthdays,
  fetchUpcomingAnniversary,
  bulk_create_birthday_posts,
  bulk_create_anniversary_posts,
  check_notification_exists_or_not,
  coviddata,
  fetchNotificationData,
  masterReportCategory,
  reportPost,
  fetchReportedPostDetails,
  deleteReadNotifications,
  fetchReportedCommentsPost,
  cubedata,
  masterTimelineApproval,
  actionOnPendingPost,
  fetchtimelinedata,
  UpdateEmployeeDailyReaction,
  fetchEmployeeDailyReaction,
  timelinedashboard,
  viewtimelinepraise,
  addSuggestion,
  viewSuggestion,
  getCurrentSuggestion,
  // deleteOldBirthdayAnniversaryPosts
};

async function createPost(req, res) {
  try {
    req.body.action = "createPost";
    //console.log(req.body.imgblob, "----body----", req.files, "---files------");
    // let validation =  commonUtils.validator({
    // 	container: req.body,
    // 	fields: [
    // 	  { key: 'category_id', trimmed: true, type: 'id'},
    // 	  { key: 'attachCount', trimmed: true, type: 'id'},
    // 	  { key: 'description', trimmed: true, type: 'string'},
    // 	]
    //   });
    // if(!validation.isvalid){
    // 	res.json({state:-1,message:validation.message,data:null})
    // }
    if (req.files || req.body.imgblob) {
      let d = new Date();
      let months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      let monthFolder = `${months[d.getMonth()]}_${d.getFullYear()}`;
      //console.log(monthFolder, "MonthFolder-----");
      let checkPostsDir = path.join("uploads", "Posts");
      makeDir(checkPostsDir);
      let checkdir = path.join("uploads", "Posts", monthFolder);
      //console.log(checkdir, "CheckDirrr");
      makeDir(checkdir);
      //let fileObj = {};
      let newFilesArr = [];
      if (req.files) {
        let file = req.files.images;
        if (req.body.attachCount == 1) {
          file = [file];
          //console.log(file, "single -file scenario ");
        }
        for (let i = 0; i < file.length; i++) {
          let fileObj = {};
          let newFileName = `${Date.now()}_${file[i].name}`;
          await file[i].mv(
            path.join(appRoot && appRoot.path, checkdir, newFileName)
          );
          fileObj.path = `Posts/${monthFolder}/${newFileName}`;
          fileObj.name = file[i].name;
          newFilesArr.push(fileObj);
        }
      }
      if (req.body && req.body.imgblob) {
        for (let i = 0; i < req.body.imgblob.length; i++) {
          let fileObj = {};
          var base64Data = req.body.imgblob[i].replace(
            /^data:image\/jpeg;base64,/,
            ""
          );
          let imageext = req.body.imgblob[i]
            .split(",")[0]
            .split("/")[1]
            .split(";")[0];
          // let  imageext1=imageext[1].split(';')
          let newFileName1 = `${Date.now()}_camera_${req.body.createdby
            }_${i}.${imageext}`;
          // try {
          await fs.writeFile(
            path.join(appRoot && appRoot.path, checkdir, newFileName1),
            base64Data,
            "base64",
            function (err) {
              // //console.log('ERRRRR', err);
            }
          );
          // } catch (err) {
          //console.log("]BBBBBBBBBBBBBBBB", imageext);
          // }
          fileObj.path = `Posts/${monthFolder}/${newFileName1}`;
          fileObj.name = newFileName1;
          //console.log("!!!!!!!!!!!!!!!!!!!!!!______________", fileObj);
          newFilesArr.push(fileObj);
        }
      }
      req.body.images = newFilesArr;
    }

    let obj = JSON.stringify(req.body);
    //console.log(obj, "finalObj========>");
    commonModel.mysqlModelService(
      "call usp_trxtimeline_operations(?)",
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
    //console.log("error in create post", error);
    return res.json({
      state: -1,
      message: "Something went wrong",
    });
  }
}

function fetchPost(req, res) {
  try {
    req.query.action = "fetchPost";
    req.query.createdby = req.body.createdby;
    let obj = JSON.stringify(req.query);
    //console.log(obj, "request----------------");

    commonModel.mysqlModelService(
      "call usp_trxtimeline_operations(?)",
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
          pending_count:
            (results[1] && results[1][0] && results[1][0].pending_count) || 0,
          reported_count:
            (results[1] && results[1][0] && results[1][0].reported_count) || 0,
          user_posts_count:
            (results[1] && results[1][0] && results[1][0].user_post_count) || 0,
        });
      }
    );
  } catch (error) {
    //console.log("error in fetchPost post", error);
    return res.json({
      state: -1,
      message: "Something went wrong",
    });
  }
}

async function editPost(req, res) {
  try {
    req.body.action = "editPost";

    if (req.files) {
      let d = new Date();
      let months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      let monthFolder = `${months[d.getMonth()]}_${d.getFullYear()}`;
      //console.log(monthFolder, "MonthFolder-----");
      let checkdir = path.join("uploads", "Posts", monthFolder);
      //console.log(checkdir, "CheckDirrr");
      makeDir(checkdir);

      let newFilesArr = [];
      let file = req.files.images;
      if (req.body.attachCount == 1) {
        file = [file];
      }
      for (let i = 0; i < req.body.attachCount; i++) {
        let fileObj = {};
        let newFileName = `${Date.now()}_${file[i].name}`;
        await file[i].mv(path.join(checkdir, newFileName));
        fileObj.path = `Posts/${monthFolder}/${newFileName}`;
        fileObj.name = file[i].name;
        newFilesArr.push(fileObj);
      }
      if (req.body && req.body.imgblob) {
        for (let i = 0; i < req.body.imgblob.length; i++) {
          var base64Data = req.body.imgblob[i].replace(
            /^data:image\/png;base64,/,
            ""
          );
          let imageext = req.body.imgblob[i]
            .split(",")[0]
            .split("/")[1]
            .split(";")[0];
          let newFileName1 = `${Date.now()}_camera_${req.body.createdby
            }_${i}.${imageext}`;
          // try {
          await fs.writeFile(
            path.join(appRoot && appRoot.path, checkdir, newFileName1),
            base64Data,
            "base64",
            function (err) {
              // //console.log('ERRRRR', err);
            }
          );
          // } catch (err) {
          // 	//console.log('ERRRRR', err);
          // }
          fileObj.path = `Posts/${monthFolder}/${newFileName1}`;
          fileObj.name = newFileName1;
          //console.log("!!!!!!!!!!!!!!!!!!!!!!______________", fileObj);
          newFilesArr.push(fileObj);
        }
      }
      if (req.body.previous_images) {
        let previous_images = JSON.parse(req.body.previous_images);
        req.body.images = [...newFilesArr, ...previous_images];
      } else req.body.images = newFilesArr;
    } else if (req.body.previous_images) {
      req.body.images = JSON.parse(req.body.previous_images);
    }

    let obj = JSON.stringify(req.body);
    //console.log(obj, "request----------------");

    commonModel.mysqlModelService(
      "call usp_trxtimeline_operations(?)",
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
    //console.log(error, "error in edit post");
    return res.json({
      state: -1,
      message: "Something went wrong",
      data: null,
    });
  }
}

function deletePost(req, res) {
  try {
    req.body.action = "delete_post";
    let obj = JSON.stringify(req.body);

    //console.log(obj, "request----------------");

    commonModel.mysqlModelService(
      "call usp_trxtimeline_operations(?)",
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
    //console.log(error, "error in delete post");
    return res.json({
      state: -1,
      message: "Something went wrong",
      data: null,
    });
  }
}

function fetchLikeOrComment(req, res) {
  try {
    req.query.createdby = req.body.createdby;
    req.query.action = "fetch_likes_and_comments";
    let obj = JSON.stringify(req.query);
    //console.log(obj, "request----------");

    commonModel.mysqlModelService(
      "call usp_trxtimeline_operations(?)",
      [obj],
      function (err, results) {
        if (err) {
          return res.json({
            state: -1,
            message: err,
            data: null,
          });
        }
        //console.log(results, "results------------------------");
        return res.json({
          state: 1,
          message: "Success",
          data: results[0],
          reaction_counts: (results && results[1]) || 0,
        });
      }
    );
  } catch (error) {
    //console.log(error, "error in fetchLikeOrComment");
    return res.json({
      state: -1,
      message: "Something went wrong",
      data: null,
    });
  }
}

function editComment(data) {
  try {
    return new Promise((resolve, reject) => {
      data.action = "edit_comment";
      let obj = JSON.stringify(data);
      //console.log(obj, "request----------");
      commonModel.mysqlModelService(
        "call usp_trxtimeline_operations(?)",
        [obj],
        function (err, results) {
          if (err) {
            reject(err);
          }
          //console.log(results, "reeeeeee-----");
          let final_data = JSON.parse(JSON.stringify(results[0][0]));
          resolve(final_data);
        }
      );
    });
  } catch (error) {
    throw error;
  }
}

function fetchUpcomingBirthdays(req, res) {
  try {
    req.query.action = "fetch_upcoming_birthdays";
    let obj = JSON.stringify(req.query);
    //console.log(obj, "request----------------");

    commonModel.mysqlModelService(
      "call usp_trxtimeline_operations(?)",
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
    //console.log(error, "error in fetchUpcomingBirthdays");
    return res.json({
      state: -1,
      message: "Something went wrong",
      data: null,
    });
  }
}

function fetchUpcomingAnniversary(req, res) {
  try {
    req.query.action = "fetch_upcoming_anniversary";
    let obj = JSON.stringify(req.query);
    //console.log(obj, "request----------------");

    commonModel.mysqlModelService(
      "call usp_trxtimeline_operations(?)",
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
    //console.log(error, "error in fetchUpcomingAnniversary");
    return res.json({
      state: -1,
      message: "Something went wrong",
      data: null,
    });
  }
}

function bulk_create_birthday_posts() {
  try {
    let obj = JSON.stringify({
      action: "fetch_current_birthdays",
    });
    commonModel.mysqlModelService(
      "call usp_trxtimeline_operations(?)",
      [obj],
      function (err, results) {
        if (err) {
          //console.log("error in fetching birthdays");
        }
        let employees = results && results[0];
        let birthdyPath = path.join(__dirname, "../../assets/birthdays");
        var files = fs.readdirSync(birthdyPath);
        //console.log(files, "--fiels-------");
        let employeeBirthday =
          employees &&
          employees.map((employee) => {
            let birthdayReq = {};
            var chosenFile = files[Math.floor(Math.random() * files.length)];
            // //console.log(chosenFile, "---------chosenFile----------");
            birthdayReq.user_id = employee.userid;
            birthdayReq.category_id = employee.category_id;
            birthdayReq.images = [
              {
                name: chosenFile,
                path: `birthdays/${chosenFile}`,
              },
            ];
            birthdayReq.description = `Happy Birthday ${employee.user_name}, Have a great year ahead!`;
            return birthdayReq;
          });
        //console.log(
        // employees,
        //  "----employees------",
        //  employeeBirthday,
        //  "-----employeeBirthday-----"
        //);
        let obj2 = JSON.stringify(employeeBirthday);
        commonModel.mysqlModelService(
          "call usp_trxtimeline_bulk_operations(?)",
          [obj2],
          function (err, results) {
            if (err) {
              //console.log("Error in user creation----");
            }
            var counter = 1;
            employees.map((employee) => {
              let headingtype = `Happy Birthday ${employee.user_name}, Have a great year ahead!`;
              let subjecttype = `Happy Birthday ${employee.user_name}, Have a great year ahead!`;
              // let subjecttype='We Wish You a Very Happy Birthday!';
              //console.log(
              //"BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
              //  employee.useremail
              //);
              let typemail = "birthday";
              var filename = "";
              var selectimage = files[Math.floor(Math.random() * files.length)];
              var filename = "";
              if (
                fs.existsSync(
                  config.webUrlLink + "/webapi/" + "birthdays/" + selectimage
                )
              ) {
                filename =
                  config.webUrlLink + "/webapi/" + "birthdays/" + selectimage;
              } else {
                filename =
                  config.webUrlLink +
                  "/webapi/birthdays/happy-birthday-image-4.jpg";
              }
              let emailObj = {
                email: employee.useremail || "",
                mailType: typemail,
                moduleid: "131911",
                subjectVariables: {
                  subject: subjecttype,
                },
                headingVariables: {
                  heading: headingtype,
                },

                bodyVariables: {
                  trxusername: employee.user_name || "",
                  trxfilename: filename,
                },
              };
              counter = counter + 1;
              setTimeout(() => {
                mailservice.mail(
                  emailObj,
                  function (err) {
                    if (err) {
                      //console.log("MAILLLLLLLLLLL", err);
                    }
                  },
                  counter * 5000
                );
              });
            });

            //console.log(results, "result creation-------");
          }
        );
        //console.log("out side sql---");
      }
    );
  } catch (error) {
    // throw error;
  }
}

function bulk_create_anniversary_posts() {
  try {
    let obj = JSON.stringify({
      action: "fetch_current_anniversary",
    });
    commonModel.mysqlModelService(
      "call usp_trxtimeline_operations(?)",
      [obj],
      function (err, results) {
        if (err) {
          return 1
          //console.log("error in fetching anniversary");
        }
        let employees = results[0];
        let anniversaryPath = path.join(__dirname, "../../assets/anniversary");
        var files = fs.readdirSync(anniversaryPath);
        let employeeAnniversary = employees.map((employee) => {
          let anniversaryReq = {};
          var chosenFile = files[Math.floor(Math.random() * files.length)];
          //console.log(chosenFile, "---------chosenFile----------");
          anniversaryReq.user_id = employee.userid;
          anniversaryReq.category_id = employee.category_id;
          anniversaryReq.images = [
            {
              name: chosenFile,
              path: `anniversary/${chosenFile}`,
            },
          ];
          anniversaryReq.description = `Our congratulations to ${employee.user_name} on completing ${employee.years_completed} successful year(s).`;
          return anniversaryReq;
        });
        //console.log(
        //employees,
        //  "----employees------",
        //  employeeAnniversary,
        //  "-----employeeAnniversary-----"
        //);
        let obj2 = JSON.stringify(employeeAnniversary);
        commonModel.mysqlModelService(
          "call usp_trxtimeline_bulk_operations(?)",
          [obj2],
          function (err, results) {
            if (err) {
              //console.log("Error in user creation----");
            }
            var counter = 1;
            employees.map((employee) => {
              let headingtype = `Our Congratulations to ${employee.user_name} on completing ${employee.years_completed} successful year(s).`;
              let subjecttype = `Our Congratulations to ${employee.user_name} on completing ${employee.years_completed} successful year(s).`;
              // let subjecttype='Happy Work Anniversary!';
              var selectimage = files[Math.floor(Math.random() * files.length)];
              var filename = "";
              if (
                fs.existsSync(
                  config.webUrlLink + "/webapi/" + "anniversary/" + selectimage
                )
              ) {
                filename =
                  config.webUrlLink + "/webapi/" + "anniversary/" + selectimage;
              } else {
                filename =
                  config.webUrlLink +
                  "/webapi/anniversary/happy-work-anniversary-4.jpg";
              }
              let typemail = "anniversary";
              let emailObj = {
                email: employee.useremail || "",
                //  cc: employee.useremail || "",
                mailType: typemail,
                moduleid: "131911",
                subjectVariables: {
                  subject: subjecttype,
                },
                headingVariables: {
                  heading: headingtype,
                },

                bodyVariables: {
                  //username: employee.user_name || '',
                  //filename: filename,
                  trxempusername: employee.user_name || "",
                  trxfilename: filename,
                  trxempyears: employee.years_completed || "",
                },
              };
              counter = counter + 1;
              setTimeout(() => {
                mailservice.mail(
                  emailObj,
                  function (err) {
                    if (err) {
                      //console.log("MAILLLLLLLLLLL", err);
                    }
                  },
                  counter * 5000
                );
              });
            });
            //console.log(results, "final result creation-------");
          }
        );
        //console.log("out side sql---");
      }
    );
  } catch (error) {
    //console.log(error, "----------->error--------<");
  }
}

function checkLikedOrNot(data) {
  return new Promise((resolve, reject) => {
    if (data.action_type == 1 || data.action_type == 3) {
      data.reaction_operation = "insert";
      data.action = "check_liked_or_not";
      let obj = JSON.stringify(data);
      commonModel.mysqlModelService(
        "call usp_trxtimeline_operations(?)",
        [obj],
        function (err, results) {
          if (err) {
            reject(err);
          }
          let result_data = JSON.parse(JSON.stringify(results[0]));
          if (
            data.action_type == 1 &&
            result_data.length != 0 &&
            result_data[0].reaction_type == data.reaction_type
          ) {
            resolve({
              message: "You have already reacted",
            });
          } else if (
            data.action_type == 3 &&
            result_data.length != 0 &&
            result_data[0].action_type == 3
          ) {
            resolve({
              message: "You have already liked this comment",
            });
          } else {
            if (
              data.action_type == 1 &&
              result_data.length != 0 &&
              result_data[0].reaction_type != data.reaction_type
            )
              data.reaction_operation = "update";
            likeOrComment(data).then((result) => {
              resolve(result);
            });
          }
        }
      );
    } else {
      likeOrComment(data).then((result) => {
        resolve(result);
      });
    }
  });
}

function likeOrComment(data) {
  return new Promise((resolve, reject) => {
    data.action = "like_or_comment";
    if (data.reaction_operation == "update") {
      data.action = "update_reaction";
    }
    let obj = JSON.stringify(data);
    //console.log(obj, "Action ---request--likeComment--------------");
    commonModel.mysqlModelService(
      "call usp_trxtimeline_operations(?)",
      [obj],
      function (err, results) {
        if (err) {
          reject(err);
        }
        let notifyuser, notifymsg, raisedfor, createduser;
        let notifyuserid;
        let final_data1 = JSON.parse(JSON.stringify(results[0]));
        final_data1[0].user_id = data.createdby;
        final_data1[0].createdusername = data.createdusername;
        if (data.action_type == 1) {
          final_data1[0].reaction_type = data.reaction_type;
          final_data1[0].createdusername = data.createdusername;
          notifyuser = results[1][0] && results[1][0].notifyuser;
          notifymsg = results[1][0] && results[1][0].notifymsg;
          raisedfor = results[1][0] && results[1][0].raisedfor;
          final_data1[0].notifyuser = results[1][0] && results[1][0].notifyuser;
          final_data1[0].notifymsg = results[1][0] && results[1][0].notifymsg;
          final_data1[0].raisedfor = results[1][0] && results[1][0].raisedfor;
          notifyuserid =
            results &&
            results[1][0] &&
            results[1][0].notifyuserid &&
            results[1][0].notifyuserid.toString().split(",");
          createduser = results && results[1][0] && results[1][0].createduser;
        }
        if (data.action_type == 3) {
          final_data1[0].post_id = data.post_id;
          final_data1[0].parent_id = data.parent_id;
          final_data1[0].action_type = data.action_type;
          final_data1[0].reaction_type = data.reaction_type;

          notifyuser = results[1][0] && results[1][0].notifyuser;
          notifymsg = results[1][0] && results[1][0].notifymsg;
          raisedfor = results[1][0] && results[1][0].raisedfor;
          final_data1[0].notifyuser = results[1][0] && results[1][0].notifyuser;
          final_data1[0].notifymsg = results[1][0] && results[1][0].notifymsg;
          final_data1[0].raisedfor = results[1][0] && results[1][0].raisedfor;
          notifyuserid =
            results &&
            results[1][0] &&
            results[1][0].notifyuserid &&
            results[1][0].notifyuserid.toString().split(",");
          createduser = results && results[1][0] && results[1][0].createduser;
        }
        let final_data2 = [];
        if (data.action_type == 2) {
          final_data2 = JSON.parse(JSON.stringify(results[1]));

          notifyuser = results[2][0] && results[2][0].notifyuser;
          notifymsg = results[2][0] && results[2][0].notifymsg;
          raisedfor = results[2][0] && results[2][0].raisedfor;
          final_data1[0].notifyuser = results[2][0] && results[2][0].notifyuser;
          final_data1[0].notifymsg = results[2][0] && results[2][0].notifymsg;
          final_data1[0].raisedfor = results[2][0] && results[2][0].raisedfor;
          notifyuserid =
            results &&
            results[2][0] &&
            results[2][0].notifyuserid &&
            results[2][0].notifyuserid.toString().split(",");
          createduser = results && results[2][0] && results[2][0].createduser;
        }

        let message = {
          notification: {
            title: "Timeline",
            body: "",
          },
          data: data.data,
        };
        //message.notification.body = `${data.createdusername || data.user_name} ${notifymsg} ${raisedfor}`;
        if (
          data.createdusername === undefined ||
          data.createdusername == "undefined"
        ) {
          message.notification.body = `Someone ${notifymsg} ${raisedfor}`;
        } else {
          message.notification.body = `${data.createdusername || "Someone"
            } ${notifymsg} ${raisedfor}`;
        }
        //Sending notification to mobile device on like or comment
        if (notifyuser && notifymsg && raisedfor && createduser) {
          //console.log("message", message);
          notificationCtrl.sendNotificationToMobileDevices(notifyuser, message);
        }
        notifyuserid =
          results &&
          results[1][0] &&
          results[1][0].notifyuserid &&
          results[1][0].notifyuserid.toString().split(",");

        if (notifyuserid) {
          notifyuserid.forEach(function (notifyuseriditem) {
            if (data.action_type == 1) {
              message.notification.body = `${createduser || "Someone"
                } liked feebback raised for ${raisedfor}`;
            }
            if (data.action_type == 2) {
              message.notification.body = `${createduser || "Someone"
                } Commented on feebback raised for ${raisedfor}`;
            }
            //    Sending notification to mobile device on feedback action
            if (notifyuseriditem)
              notificationCtrl.sendNotificationToMobileDevices(
                notifyuseriditem,
                message
              );
            //console.log(
            //"notificaton msg notifyuser3",
            //  message.notification.body,
            //  "IIIIIII",
            //  notifyuseriditem
            //);
          });
        }
        resolve([...final_data1, ...final_data2]);
      }
    );
  });
}

function deleteLikeOrComment(data) {
  return new Promise((resolve, reject) => {
    data.action = "delete_like_or_comment";
    let obj = JSON.stringify(data);
    //console.log(obj, "request----------");

    commonModel.mysqlModelService(
      "call usp_trxtimeline_operations(?)",
      [obj],
      function (err, results) {
        if (err) {
          reject(err);
        }
        let finalData = JSON.parse(JSON.stringify(results[0]));
        finalData[0].user_id = data.createdby;
        finalData[0].post_id = data.post_id;
        if (data.action_type == 2 || data.action_type == 3) {
          finalData[0].parent_id = data.parent_id || null;
          finalData[0].comment_id = data.comment_id || null;
          finalData[0].action_type = data.action_type;
        }
        resolve(finalData);
      }
    );
  });
}

function check_notification_exists_or_not(data) {
  return new Promise((resolve, reject) => {
    if (data.action_type == 1 || data.action_type == 3) {
      data.reaction_operation = "insert";
      data.action = "check_notification_exists_or_not";
      let obj = JSON.stringify(data);
      commonModel.mysqlModelService(
        "call usp_trxtimeline_operations(?)",
        [obj],
        function (err, results) {
          if (err) {
            reject(err);
          }
          let result_data = JSON.parse(JSON.stringify(results[0]));
          if (
            data.action_type == 1 &&
            result_data.length != 0 &&
            result_data[0].reaction_type == data.reaction_type
          ) {
            resolve({
              message: "You have already received the notification",
            });
          } else if (
            data.action_type == 3 &&
            result_data.length != 0 &&
            result_data[0].action_type == 3
          ) {
            resolve({
              message:
                "You have already received the notification for this comment",
            });
          } else {
            //console.log("in notification else block  ----");
            if (
              data.action_type == 1 &&
              result_data.length != 0 &&
              result_data[0].reaction_type != data.reaction_type
            ) {
              data.notification_id = result_data[0].notification_id;
              data.reaction_operation = "update";
            }
            timelineNotification(data).then((result) => {
              resolve(result);
            });
          }
        }
      );
    } else {
      timelineNotification(data).then((result) => {
        resolve(result);
      });
    }
  });
}

async function timelineNotification(data) {
  return new Promise((resolve, reject) => {
    data.action = "add_notification";
    if (data.reaction_operation == "update") {
      data.action = "update_notification_reaction";
    }
    let obj = JSON.stringify(data);
    //console.log(
    //obj,
    //  "request--1ssstttObject timeline notification --------------"
    //);
    commonModel.mysqlModelService(
      "call usp_trxtimeline_operations(?)",
      [obj],
      function (err, results) {
        if (err) {
          reject(err);
        }
        //console.log(results, "tmln reaslts----------");
        resolve(results[0]);
      }
    );
  });
}

function coviddata(req, res) {
  let from = req.query.from;
  let to = req.query.to;
  axios
    .get(`https://api.covid19api.com/country/in?from=${from}&to=${to}`)
    .then((response) => {
      //console.log(response.data);
      return res.json({
        state: 1,
        message: "Success",
        data: response.data,
      });
      //   //console.log(response.data);
    })
    .catch((error) => {
      //console.log(error, "error");
    });
}

function fetchNotificationData(req, res) {
  try {
    req.query.action = "fetch_notification_data";
    req.query.createdby = req.body.createdby;
    let obj = JSON.stringify(req.query);
    //console.log(obj, "request----------------");

    commonModel.mysqlModelService(
      "call usp_trxtimeline_operations(?)",
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
    //console.log(error, "error in fetchNotificationData");
    return res.json({
      state: -1,
      message: "Something went wrong",
      data: null,
    });
  }
}

function masterReportCategory(req, res) {
  try {
    let operationType = req.body.operationType;
    switch (operationType) {
      case "create":
        req.body.action = "add_report_category";
        break;
      case "read":
        req.body.action = "fetch_report_categories";
        break;
      case "update":
        req.body.action = "edit_report_category";
        break;
      case "delete":
        req.body.action = "delete_report_category";
        break;
      default:
        //console.log("default case");
        break;
    }
    let obj = JSON.stringify(req.body);
    //console.log(obj, "request----------");

    commonModel.mysqlModelService(
      "call usp_trxtimeline_report(?)",
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
          count:
            (results[1] && results[1][0] && results[1][0].total_records) || 0,
        });
      }
    );
  } catch (error) {
    //console.log(error, "error in masterReportCategory");
    return res.json({
      state: -1,
      message: "Something went wrong",
      data: null,
    });
  }
}

function reportPost(req, res) {
  try {
    let obj = JSON.stringify(req.body);
    //console.log(obj, "request----------------");

    commonModel.mysqlModelService(
      "call usp_trxtimeline_report(?)",
      [obj],
      function (err, results) {
        if (err) {
          return res.json({
            state: -1,
            message: err,
            data: null,
          });
        }
        //console.log(results, "results--------------------------------");
        res.json({
          state: 1,
          message: "Success",
          data: results[1][0],
        });

        if (results && results[0] && results[0][0] && results[0][0].emailid) {
          typemail = "timelinereport";
          subjecttype = "A New Post Reported";
          headingtype = "A New Post Reported";

          if (req.body.action != "report_post") {
            subjecttype = "A New Comment Reported";
            headingtype = "A New Comment Reported";
            typemail = "commentreport";
          }
          let descstr =
            results && results[0] && results[0][0].report_description;
          descstr = descstr.replace(/\\n/g, " ");
          descstr = descstr.replace(/\\r/g, " ");
          let emailObj = {
            cc: results[0][0].emailid || " ",
            mailType: typemail,
            subjectVariables: {
              subject: subjecttype,
            },
            headingVariables: {
              heading: headingtype,
            },

            bodyVariables: {
              employee_name:
                (results && results[0] && results[0][0].employee_name) || "",
              category_name:
                (results && results[0] && results[0][0].category_name) || "",
              report_description: descstr || "",
            },
          };
          mailservice.mail(emailObj, function (err) {
            if (err) {
              //console.log("MAILLLLLLLLLLL", err);
            }
          });
        }
      }
    );
  } catch (error) {
    //console.log(error, "error in reportPost");
    return res.json({
      state: -1,
      message: "Something went wrong",
      data: null,
    });
  }
}

function fetchReportedPostDetails(req, res) {
  try {
    req.query.action = "fetch_reported_post_details";
    req.query.createdby = req.body.createdby;
    let obj = JSON.stringify(req.query);
    //console.log(obj, "request----------------");

    commonModel.mysqlModelService(
      "call usp_trxtimeline_report(?)",
      [obj],
      function (err, results) {
        if (err) {
          return res.json({
            state: -1,
            message: err,
            data: null,
          });
        }
        //console.log(results, "results--------------------------------");
        return res.json({
          state: 1,
          message: "Success",
          data: results[0],
          count:
            (results[1] && results[1][0] && results[1][0].total_records) || 0,
        });
      }
    );
  } catch (error) {
    //console.log(error, "error in fetchReportedPostDetails");
    return res.json({
      state: -1,
      message: "Something went wrong",
      data: null,
    });
  }
}

function fetchReportedCommentsPost(req, res) {
  try {
    req.query.action = "fetch_reported_comments_post";
    req.query.createdby = req.body.createdby;
    let obj = JSON.stringify(req.query);
    //console.log(obj, "request----------------");
    commonModel.mysqlModelService(
      "call usp_trxtimeline_report(?)",
      [obj],
      function (err, results) {
        if (err) {
          return res.json({
            state: -1,
            message: err,
            data: null,
          });
        }
        //console.log(results, "results--------------------------------");
        return res.json({
          state: 1,
          message: "Success",
          data: results[0],
        });
      }
    );
  } catch (error) {
    //console.log(error, "error in fetchReportedCommentsPost");
    return res.json({
      state: -1,
      message: "Something went wrong",
      data: null,
    });
  }
}

function deleteReadNotifications(req, res) {
  try {
    req.body.action = "delete_read_notification";
    let obj = JSON.stringify(req.body);
    //console.log(obj, "request----------------");
    commonModel.mysqlModelService(
      "call usp_trxtimeline_operations(?)",
      [obj],
      function (err, results) {
        if (err) {
          return res.json({
            state: -1,
            message: err,
            data: null,
          });
        }
        //console.log(results, "results--------------------------------");
        return res.json({
          state: 1,
          message: "Success",
          data: results[0],
        });
      }
    );
  } catch (error) {
    //console.log(error, "error in deleteReadNotifications");
    return res.json({
      state: -1,
      message: "Something went wrong",
      data: null,
    });
  }
}

function cubedata(req, res) {
  try {
    let obj = {
      action: "cubedata",
      createdby: req.body.createdby,
    };
    obj = JSON.stringify(obj);
    //console.log(obj, "request----------------");

    commonModel.mysqlModelService(
      "call usp_cubedata(?)",
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
  } catch (error) {
    //console.log(error, "error in cubedata");
    return res.json({
      state: -1,
      message: "Something went wrong",
      data: null,
    });
  }
}

function masterTimelineApproval(req, res) {
  try {
    let operationType = req.body.operationType;
    switch (operationType) {
      case "read":
        req.body.action = "get_timeline_approval_status";
        break;
      case "update":
        req.body.action = "update_timeline_approval_status";
        break;
      default:
        //console.log("default case");
        break;
    }
    let obj = JSON.stringify(req.body);
    //console.log(obj, "request----------");

    commonModel.mysqlModelService(
      "call usp_trxtimeline_operations(?)",
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
    //console.log(error, "error in masterTimelineApproval");
    return res.json({
      state: -1,
      message: "Something went wrong",
      data: null,
    });
  }
}

function actionOnPendingPost(req, res) {
  try {
    req.body.action = "action_on_pending_posts";
    let obj = JSON.stringify(req.body);
    //console.log(obj, "request----------");

    commonModel.mysqlModelService(
      "call usp_trxtimeline_operations(?)",
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
    //console.log(error, "error in actionOnPendingPost");
    return res.json({
      state: -1,
      message: "Something went wrong",
      data: null,
    });
  }
}

async function UpdateEmployeeDailyReaction(req, res) {
  if (!req.body || !req.body.createdby) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  try {
    // let validation_obj = {
    // 	userid: req.body && req.body.createdby,
    // 	createdby: req.body && req.body.createdby,
    // 	action: 'userbudgetvalidate',
    // 	subtype: 'dailyfeedback',
    // 	type:1
    // }
    // let re = await paytm.budgetvalidate(validation_obj);
    // if (re && re.state == -1) {
    // 	return res.json({ state: -1, message: re.message || re });
    // }
    let self_obj = req && req.body;
    (self_obj.userid = req.body && req.body.createdby),
      (self_obj.action = "selffeedback"),
      (self_obj.type = 1);

    let result = await feedback.selffeedback(self_obj);
    //console.log("result", result);
    if (result && result.state == -1) {
      return res.json({
        state: -1,
        message: (result && result.message) || "Something went Wrong",
      });
    } else {
      return res.json({
        state: 1,
        message: (result && result.message) || "Success",
        data: result,
      });
    }
    // req.body.amount=re1 && re1.amount;
    // req.body.emppoint = re1 && re1.emppoint;
    // req.body.action = 'update_daily_reaction'
    // let obj = JSON.stringify(req.body);
    // commonModel.mysqlModelService('call usp_trxtimeline_operations(?)', [obj], function (err, results) {
    // 	if (err) {
    // 		return res.json({ state: -1, message: err, data: null });
    // 	}
    // 	return res.json({ state: 1, message: "Success", data: results[0] });
    // });
  } catch (error) {
    return res.json({
      state: -1,
      message: error.message || error,
      data: null,
    });
  }
}

function fetchEmployeeDailyReaction(req, res) {
  try {
    req.body.action = "fetch_daily_reaction";
    let obj = JSON.stringify(req.body);
    //console.log(obj, "request ---daily----reaction----------");

    commonModel.mysqlModelService(
      "call usp_trxtimeline_operations(?)",
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
          workingday:
            (results &&
              results[1] &&
              results[1][0] &&
              results[1][0].isworkingday) ||
            0,
          emoticon_required:
            (results[2] && results[2][0] && results[2][0].emoticon_required) ||
            0,
        });
      }
    );
  } catch (error) {
    //console.log(error, "error in UpdateEmployeeDailyReaction");
    return res.json({
      state: -1,
      message: "Something went wrong",
      data: null,
    });
  }
}

function fetchtimelinedata(req, res) {
  try {
    req.body.action = "fetchtimelinedata";
    let obj = JSON.stringify(req.body);
    //console.log(obj, "request----------------");

    commonModel.mysqlModelService(
      "call usp_trxtimeline_operations(?)",
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
          userpoll_creation_access: results[0],
          upcomming_birthdays: results[1],
          upcomming_anniversary: results[2],
          upcomming_holidays: results[3],
          recent_joining: results[4],
          approval_required_status: results[5],
        });
      }
    );
  } catch (error) {
    //console.log(error, "error in fetchtimelinedata");
    return res.json({
      state: -1,
      message: "Something went wrong",
      data: null,
    });
  }
}

// function deleteOldBirthdayAnniversaryPosts(req, res) {
// 	try {

// 		req.body.action = 'delete_old_birthday_anniversary_posts'
// 		let obj = JSON.stringify(req.body);
// 		//console.log(obj, "request ---daily----delete ---posts----------");

// 		commonModel.mysqlModelService('call usp_trxtimeline_operations(?)', [obj], function (err, results) {
// 			if (err) {
// 				//console.log("error in deletion of old birthday and work anniversary posts")
// 			}
// 			//console.log("deletion of old birthday and work anniversary posts successful")
// 		});
// 	} catch (error) {
// 		throw error;
// 	}
// }

function timelinedashboard(req, res) {
  try {
    // req.body.action = 'delete_old_birthday_anniversary_posts'
    let obj = JSON.stringify(req.body);
    // //console.log(obj, "request ---daily----delete ---posts----------");

    commonModel.mysqlModelService(
      "call usp_timeline_dashboard(?)",
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
  } catch (error) {
    //console.log(error, "error in timelinedashboard");
    return res.json({
      state: -1,
      message: "Something went wrong",
      data: null,
    });
  }
}

function viewtimelinepraise(req, res) {
  try {
    // req.body.action = 'delete_old_birthday_anniversary_posts'
    let obj = JSON.stringify(req.body);
    // //console.log(obj, "request ---daily----delete ---posts----------");

    commonModel.mysqlModelService(
      "call usp_timeline_dashboard(?)",
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
  } catch (error) {
    throw error;
  }
}

function addSuggestion(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({ message: "send required data", data: null });
  } else {
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService("call usp_trxtimeline_operations(?)", [obj])
      .then((results) => {
        //console.log(results, "rrrrrrrrrrr");
        if (
          results &&
          results[0] &&
          results[0][0] &&
          results[0][0].State &&
          results[0][0].State == 1
        ) {
          return res.json({
            state: results[0][0].State,
            message: results[0][0].Message,
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
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function viewSuggestion(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({ message: "send required data", data: null });
  } else {
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService("call usp_trxtimeline_operations(?)", [obj])
      .then((results) => {
        //console.log(results, "rrrrrrrrrrr");
        if (
          results &&
          results[1] &&
          results[1][0] &&
          results[1][0].State &&
          results[1][0].State == 1
        ) {
          return res.json({
            state: results[1][0].State,
            message: results[1][0].Message,
            data: results[0],
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
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function getCurrentSuggestion(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({ message: "send required data", data: null });
  } else {
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService("call usp_trxtimeline_operations(?)", [obj])
      .then((results) => {
        //console.log(results, "todays suggestions");
        if (
          results &&
          results[1] &&
          results[1][0] &&
          results[1][0].State &&
          results[1][0].State == 1
        ) {
          return res.json({
            state: results[1][0].State,
            message: results[1][0].Message,
            data: results[0],
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
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}
