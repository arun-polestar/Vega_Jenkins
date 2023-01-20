const proc = require('../common/procedureConfig');
const commonModel = require('../common/Model');
const config = require('../../config/config');
var async = require("async");
const mailservice = require('../../services/mailerService')
var mysqlserv = require('../../services/mysqlService')
var _ = require('underscore');
const query = require('../common/Model').mysqlPromiseModelService

module.exports = {
  getNotificationData: getNotificationData,
  clearNotification: clearNotification,
  // getUserLoginTimes: getUserLoginTimes,
  clearlogin: clearlogin,
  getVendorNotificationData, getVendorNotificationData,
  clearVendorNotification, clearVendorNotification,
  joiningReminderNotification, joiningReminderNotification,
  interviewReminderNotification, interviewReminderNotification,
  sendNotificationToMobileDevices: sendNotificationToMobileDevices,
  saveUserNotificationDirect: saveUserNotificationDirect,
  saveBellNotification,
  readNotification
};

/************************************for fetch the all notification.................................. */

// for notification and login times data
function getNotificationData(req, res) {
  if (!req.body || !req.body.tokenFetchedData) {
    return res.json({ message: 'User Authorization Failed', state: 0, data: null })
  }
  req.body.guid = req.body.tokenFetchedData.guid;
  req.body.action = 'getlogindata';
  //req.body.createdby = req.body.type && (req.body.type == 'vendor' || 'bgv') ? req.body.tokenFetchedData.credentialid : req.body.createdby;
  var obj = JSON.stringify(req.body);
  commonModel.mysqlPromiseModelService(proc.mstoperation, [obj]).
    then(results => {
      if (results && results[2] && results[2][0] && results[2][0].state && results[2][0].state == 1) {
        var finalresult = {
          logindata: results[0],
          notificationdata: results[1]
        }
        return res.json({ state: results[2][0].state, message: results && results[2] && results[2][0] && results[2][0].message, data: finalresult });
      } else {
        return res.json({ state: -1, message: "Something went wrong", data: 'null' });
      }
    }).catch(err => {
      return res.json({ "state": -1, "message": err });
    })
}



function getVendorNotificationData(req, res) {
  if (!req.body.tokenFetchedData) {
    return res.json({ message: 'User authorization failed', state: 0, data: null });
  }
  var obj = req.body;
  obj.createdby = req.body.tokenFetchedData.credentialid;
  obj.reqtype = 'getvendornotification';
  obj = JSON.stringify(obj);
  commonModel.mysqlPromiseModelService(proc.vendorview, [obj]
  ).then(results => {
    if (results && results[0] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
      return res.json({ state: results[1][0].state, message: results && results[0] && results[1][0] && results[1][0].message, data: results && results[0] });
    } else {
      return res.json({ state: -1, message: "Something went wrong", data: null });
    }
  }).catch(err => {
    return res.json({ "state": -1, "message": err });
  })
}

/*****************************************for clear the notification********************************************/

function clearVendorNotification(req, res) {
  if (!req.body || !req.body.tokenFetchedData) {
    return res.json({ message: 'User authorization failed', state: 0, data: null });
  }
  var obj = req.body;
  obj.createdby = req.body.tokenFetchedData.credentialid;
  obj.reqtype = 'clearvendornotification';
  obj = JSON.stringify(req.body);
  commonModel.mysqlPromiseModelService(proc.notificationedit, [obj]
  ).then(results => {
    if (results && results[0] && results[0][0] && results[0][0].state && results[0][0].state == 1) {
      return res.json({ state: results[0][0].state, message: results && results[0][0] && results[0][0].message, data: results && results[0][0] });
    } else {
      return res.json({ state: -1, message: "Something went wrong", data: null });
    }
  }).catch(err => {
    return res.json({ "state": -1, "message": err });
  })
}




function clearNotification(req, res) {
  if (!req.body || !req.body.createdby || !req.body.tokenFetchedData) {
    return res.json({ message: 'User authorization failed', state: 0, data: null });
  }

  var obj = JSON.stringify(req.body);
  commonModel.mysqlPromiseModelService(proc.notificationedit, [obj]
  ).then(results => {
    if (results && results[0] && results[0][0] && results[0][0].state && results[0][0].state == 1) {
      return res.json({ state: results[0][0].state, message: results && results[0][0] && results[0][0].message, data: results && results[0][0] });
    } else {
      return res.json({ state: -1, message: "Something went wrong", data: null });
    }
  }).catch(err => {
    return res.json({ "state": -1, "message": err });
  })
}




/*-------------------------------------------------------------for login time---------------------------------------------------------*/

// function getUserLoginTimes(req, res) {
//     if (!req.body || !req.body.createdby || !req.body.tokenFetchedData) {
//         return res.json({ message: 'User authorization failed', state: 0, data: null });
//     }
//     req.body.guid = req.body.tokenFetchedData.guid;
//     req.body.userid = req.body.createdby;
//     var tokendataobj = JSON.stringify(req.body);
//     // //console.log("1111111111111111111111111111111111111111",tokendataobj);

//     commonModel.mysqlPromiseModelService(proc.tokenmgm, [tokendataobj]
//     ).then(results => {
//         // //console.log("222222222222222222222222222222222222222",results);

//         if (results && results[1][0] && results[1][0].state == 1) {
//             return res.json({ state: results[1][0].state, message: results[1][0].message, data: results && results[0] });
//         } else if (results && results[1][0] && results[1][0].state && results.state == -1) {
//             return res.json({ state: results[1][0].state, message: "Something went wrong", data: null });
//         }
//     }).catch(err => {
//         return res.json({ "state": -1, "message": err });
//     })
// }
/*-----------------------------------------------------clear login-------------------------------------- */

function clearlogin(req, res) {
  if (!req.body || !req.body.createdby || !req.body.tokenFetchedData) {
    return res.json({ message: 'User authorization failed', state: 0, data: null });
  }
  req.body.userid = req.body.createdlogoutFromAllby;
  var tokendataobj = JSON.stringify(req.body);
  commonModel.mysqlPromiseModelService(proc.tokenmgm, [tokendataobj]
  ).then(results => {
    if (results && results[0] && results[0][0].state == 1) {
      return res.json({ state: results[0][0].state, message: results[0][0].message, data: results && results[0][0] });
    } else {
      return res.json({ state: -1, message: "Something went wrong", data: null });
    }
  }).catch(err => {
    return res.json({ "state": -1, "message": err });
  })
}

//-------------------------------------notification mail-------------------------------------------------------------------------------


function joiningReminderNotification(req, res) {//doubt
  //  if(config.webUrl.indexOf('fusion.polestarllp.com') == -1){
  //        return;
  //      }y
  var obj = JSON.stringify({ type: 'joining' });
  commonModel.mysqlPromiseModelService(proc.mailnotification, [obj]
  ).then(results => {
    if (results && results[0] && results[0][0] && results[0][0].state == -1) {
      return res.json({ state: results[0][0].state, message: "Something went wrong", data: null });
    }
    else {
      var joiningList = results[0];
      if (joiningList.length == 0) {
        return res.json({ state: -1, message: "there is no joining candidate" });
      }
      else {
        var obj = JSON.stringify({ type: 'hruser' });
        commonModel.mysqlPromiseModelService(proc.mailnotification, [obj]
        ).then(results1 => {
          if (results1 && results1[0] && results1[0][0] && results1[0][0].state == -1) {
            return res.json({ state: results1[0][0].state, message: "Something went wrong wrong", data: null });
          }
          else {
            var hrUsers = results1[0];
            var rmstablebody = '';
            joiningList.forEach(function (item) {
              rmstablebody += '<tr><td style="padding:3px;border:solid thin grey">' + item.candidatename + '</td><td style="padding:3px;border:solid thin grey">' + item.email + '</td><td style="padding:3px;border:solid thin grey">' + item.phone + '</td><td style="padding:3px;border:solid thin grey">' + item.jobtitle + '</td></tr>'
            });
            //console.log('~~~~~~~~~~~', hrUsers, '~~~~~~~~~~~~~~~~~~~');
            var emailObj = {
              bcc: hrUsers[0].email,
              mailType: ' ', bodyVariables: { rmstablebody: rmstablebody }
            };
            mailservice.mail(emailObj, function (err) {
              //console.log("MAILLLLLLLLLLL", err);
              if (err) {
                return res.json({ state: -1, message: err });
              }
              else {
                return res.json({ state: 1, message: 'mail sent' });
              }

            })
          };
        });
      }
    }
  });

}






function recordMailStatus(options) {
  dbService.query('insert into mstsystemlogs (procname,attribute1,attribute2,attribute3,procstatus,failedreason) values(?,?,?,?,?,?)', ['croneService', options.mailType, options.attribute2, options.attribute3, options.status, options.failedReason || ''], function (err, results) {
    if (err) {
      //console.log(err);
    }
  });
}

/*--------------------------------------------------------interviewer notification--------------------------------------- */

function interviewReminderNotification(req, res) {
  // if(sails.config.webUrl.indexOf('fusion.polestarllp.com') == -1){
  //     return;
  // }
  var obj = JSON.stringify({ type: 'interviewers' });
  commonModel.mysqlPromiseModelService(proc.mailnotification, [obj]
  ).then(results => {
    if (results && results[0] && results[0][0] && results[0][0].state && results[0][0].state == -1) {
      return res.json({ state: -1, message: 'something went wrong' })
    }
    else {
      var interviewers = results[0];
      var obj = JSON.stringify({ type: 'candidates' });
      commonModel.mysqlPromiseModelService(proc.mailnotification, [obj]
      ).then(results1 => {
        if (results1 && results1[0] && results1[0][0] && results1[0][0].state && results1[0][0].state == -1) {
          return res.json({ state: -1, message: 'something went wrong' })
        }
        else {
          async.eachSeries(interviewers, function (item, cb) {
            const interviewees = results1[0];
            var intervieweesList = _.where(interviewees, { userid: item.userid });
            if (intervieweesList.length == 0) {
              cb();
            }
            else {
              var dsrBody = '';
              intervieweesList.forEach(function (item) {
                dsrBody += '<tr><td style="padding:3px;border:solid thin grey">' + item.candidatename + '</td><td style="padding:3px;border:solid thin grey">' + item.email + '</td><td style="padding:3px;border:solid thin grey">' + item.phone + '</td><td style="padding:3px;border:solid thin grey">' + item.jobtitle + '</td><td style="padding:3px;border:solid thin grey">' + item.interviewtype + '</td><td style="padding:3px;border:solid thin grey">' + item.round + '</td></tr>'
              });
              var emailObj = {
                email: item.useremail,
                mailType: 'interviewReminder',
                subjectVariables: {
                  subject: "<Interviews Scheduled today>"
                },
                headingVariables: {
                  heading: "Count of Candidates to be interviewed today"
                },
                bodyVariables: { rmstablebody: dsrBody }
              };
              mailservice.mail(emailObj, function (err) {
                if (err) {
                  return cb(err);
                }
                else {
                  cb();
                }
              });
            }
          }, function (err) {
            if (err) {
              return res.json({ state: -1, message: err, data: null });
            } else {
              return res.json({ state: 1, message: 'Mail Sent', data: null });
            }
          });
        }
      });
    }
  });
}




/*--------------------------------------------vendor notification----------------------------------------------------------*/


/*-----------------------------------------------Sends Notification To Mobile Devices-------------------------------------*/


const admin = require("firebase-admin");

const serviceAccount = require("../../config/fcmAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://vega-hr-1602146992092.firebaseio.com"
});

const notification_options = {
  priority: "high",
  timeToLive: 60 * 60 * 24
};

async function sendNotificationToMobileDevices(userId, message) {
  console.log('Inside this send notification', message, userId);
  if (!userId) {
    //console.log('User ID is missing', userId);
    return;
  }
  //console.log("MMMMMMMMMMMMMMMMMMMMMMMMMMMMEEEEEEEEEEEMMMMMMM", message, userId);
  let obj = JSON.stringify({ userid: userId, action: 'devicetoken' });
  let registrationToken;
  try {
    registrationToken = await commonModel.mysqlPromiseModelService(proc.tokenmgm, obj);
  } catch (err) {
    //console.log("Error in getting device token:", err);
    return;
  }
  if (!registrationToken || !(registrationToken && registrationToken.length)) return;
  // //console.log("---------Registration Token1---------", registrationToken);

  registrationToken = registrationToken[0].map(key => key.devicetoken);
  // //console.log("---------Registration Token2---------",registrationToken);
  if (registrationToken) {

    admin.messaging().sendToDevice(registrationToken, message, notification_options)
      .then(response => {
        //console.log('Notification sent successfully:', response);
      })
      .catch(error => {
        //console.log('Error in sending notfication to mobile devices:', error);
      });
  } else {
    //console.log("Error in getting device token");
    return;
  }
}





async function saveUserNotificationDirect(data) {
  if (data.createdby && data.touser && data.description && data.module && data.action) {
    //console.log("ddddddddddd", JSON.stringify(data))
    try {
      let result = await commonModel.mysqlPromiseModelService('call usp_trxnotification_savedata(?)', JSON.stringify(data));
    } catch (err) {
      //console.log("Errorrr:", err);
      return;
    }
  } else {
    //console.log("Data is missing", data);
    return
  }
}
async function saveBellNotification(data) {
  try {
    data.action = 'save_data'
    await query('call usp_trxnotification_savedata(?)', JSON.stringify(data));
    return true
  } catch (err) {
    return false;
  }
} 

async function readNotification(req, res) {
  try {
    reqData = req.body;
    reqData.action = 'read_notification';
    let results = await query('call usp_trxnotification_savedata(?)', JSON.stringify(reqData));
    return res.json({ state: 1, message: "Success" });
  } catch (err) {
    return res.json({ state: -1, message: "Something went wrong" });
  }
}
