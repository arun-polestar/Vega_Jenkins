const proc = require('../common/procedureConfig');
const config = require('../../config/config');
const commonModel = require('../common/Model');
const commonCtrl = require('../common/Controller');
const path = require('path');
const mailservice = require('../../services/mailerService');
const _ = require('underscore');
const appRoot = require('app-root-path');
const async = require("async");
const moment = require("moment");
const fs = require('fs');
appRoot.originalPath = appRoot.path
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;


module.exports = {
  savesubmitdsr: savesubmitdsr,
  dsrview: dsrview,
  viewdsrtype: viewdsrtype,
  dsrtosupervisors: dsrtosupervisors,
  dsrByUser: dsrByUser
}


function savesubmitdsr(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      state: -1,
      message: "Send required data"
    })
  }
  let obj = JSON.stringify(req.body);
  commonModel.mysqlPromiseModelService(proc.dsr, [obj])
    .then(results => {
      if (results && results[0] && results[0][0] && results[0][0].state && results[0][0].state == 1) {
        return res.json({
          state: results[0][0].state,
          message: results[0][0].message,
          data: results[0]
        });
      } else {
        return res.json({
          state: -1,
          message: results[0][0].message,
          data: null
        });
      }
    })
    .catch(err => {
      return res.json({
        state: -1,
        message: err.message || err
      });
    })
}


function viewdsrtype(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      state: -1,
      message: "Send required data"
    })
  }
  let obj = JSON.stringify(req.body);
  commonModel.mysqlPromiseModelService(proc.dsr, [obj])
    .then(results => {
      if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
        return res.json({
          state: results[1][0].state,
          message: results[1][0].message,
          data: results[0]
        });
      } else {
        return res.json({
          state: -1,
          message: results[0][0].message,
          data: null
        });
      }
    })
    .catch(err => {
      return res.json({
        state: -1,
        message: err.message || err
      });
    })
}

async function dsrview(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1
    })

  }
  let obj = await commonCtrl.verifyNull(req.body);
  obj = JSON.stringify(obj);
  commonModel.mysqlPromiseModelService(proc.dsr, [obj])
    .then(results => {
      var dbresult = commonCtrl.lazyLoading(results[0], req.body);
      if (dbresult && "data" in dbresult && "count" in dbresult) {
        return res.json({
          "state": 1,
          message: "success",
          data1: results && results[1] && results[1],
          "data": dbresult.data,
          "count": dbresult.count
        });
      } else {
        return res.json({
          state: -1,
          message: "Something went wrong",
          data: null
        });
      }
    })
    .catch(err => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err
      });
    })
}


function dsrtosupervisors() {
  var obj = JSON.stringify({
    action: 'dsrlist'
  });
  var dsrdate = new Date();
  dsrdate.setDate(dsrdate.getDate() - 1);
  commonModel.mysqlPromiseModelService(proc.dsr, [obj])
    .then(results => {
      if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
        var dsrList = _.groupBy(results[0], 'mangeremail');
        subjecttype = '<DSR filled by your reportees>';
        headingtype = 'DSR Details';
        // //console.log("Resulsts", dsrList);
        async.eachSeries(Object.keys(dsrList), function (item, cb) {
          var dsrBody = '';
          var counter = 1;
          dsrList[item].forEach(function (dsr) {
            // GMAIL_CLIENT_ID:'116879773951652911882',
            // //console.log('item',)
            // filePath = path.join(appRoot && appRoot.path, '/uploads', req.body.url)
            var paragraph;
            if (dsr.scrum) {
              let descstr = dsr.scrum;
              descstr = descstr.replace(/\\n/g, ' ');
              descstr = descstr.replace(/\\r/g, ' ');
              paragraph = descstr
            } else {
              paragraph = '<div class="not-filled" style="color:white;background:#ec2e2e;padding: 10px 12px;display:inline-block;border-radius:24px;font-size: 10px;line-height: 0px;">Not Filled</div>';
            }
            var profilepic = '';
            let profilepath = path.join(appRoot && appRoot.path, '/uploads/' + dsr.profilepic);
            if (fs.existsSync(profilepath)) {
              profilepic = config.webUrlLink + '/webapi/' + dsr.profilepic;
            } else {
              profilepic = config.webUrlLink + '/webapi/img/user-placeholder.png'
            }

            var mood = '';
            switch (dsr.reaction) {
              case 1:
                mood = "Disappoint"
                break;
              case 2:
                mood = "Sad"
                break;
              case 3:
                mood = "Optimistic"
                break;
              case 4:
                mood = "Satisfied"
                break;
              case 5:
                mood = "Happy"
                break;
              default:
                mood = "";

            };
            let moodhtml = '';
            var moodpic = path.join(appRoot && appRoot.originalPath, '/assets/img/' + dsr.reaction + '.jpg');
            //console.log('Mood', moodpic);
            if (fs.existsSync(moodpic)) {
              //console.log('AAAAAAAAAAAAA')
              moodpic = config.webUrlLink + '/webapi/img/' + dsr.reaction + '.jpg';
              moodhtml = `<span style="float: right; width: 110px;text-align: center; "> <img src="${moodpic}" style="width: 30px; height: 30px; border-radius: 50%; padding: 2px; border: 2px solid #ddd;">
                                 <b style="font-family: arial; display: block; font-size: 12px; ">` + mood + `</b> </span>`;
            }
            dsrBody += `<li style="display:list-item;text-align:-webkit-match-parent;border-bottom: 1px dotted #9e9e9e;padding-bottom: 15px;margin-bottom: 15px;display:block;text-align:left;">
                                <img src="${profilepic}" style="height:45px;width:45px;float:left;display:inline-block;border-radius:50%;padding:2px;background:#f7f7f7;border:1px solid #e6e6e6; margin-right: 15px;" class="CToWUd">
                              <div style="margin-left:50px; padding-right: 0px;">
                                  ${moodhtml}
                                    <h4 style="font-size:16px;font-weight:600;margin:0; font-family: arial; line-height:100%;padding-left: 10px;">` + dsr.name + ` </h4>
                                  <p style="margin: 2px 0px; padding-left: 10px; font-family: arial; font-size: 13px; padding: 2px 8px 0px;">` + dsrdate.toDateString() + `</p>
                                       <p style="margin: 0px; padding-left: 10px; font-family: arial; font-size: 13px; padding: 0px 10px; font-weight:normal; color: #949494">` + paragraph + `</p>
                                     </div>
                             </li>`;
          });
          var emailObj = {
            email: item,
            mailType: 'dsrToSupervisors',

            subjectVariables: {
              subject: subjecttype
            },

            headingVariables: {
              heading: headingtype
            },

            bodyVariables: {
              dsrMailBody: dsrBody
            }
          };
          counter = counter + 1;
          setTimeout(() => {
            mailservice.mail(emailObj, function (err, response) {
              cb();
              if (err) {
                //console.log('error while sending eamil.', err);
              }
            }, counter * 3000);
          });
        }, function (err) {
          if (err) {
            //console.log('error while sending eamil.', err);
          }
        });
        // return res.json({ state: results[0][0].state, message: results[0][0].message, data: results[0]  });
      } else {
        //console.log('errrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr', {
        // state: -1,
        // message: err.message || err
        //});
      }
    })
    .catch(err => {
      //console.log('errrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr', {
      //  state: -1,
      //  message: err.message || err
      //});
    })
}
async function dsrByUser(req, res) {
  if (!req.body.userid || !req.body.date) {
    return res.json({
      state: -1,
      message: 'Required Parameters are missing'
    });
  }
  let obj = await commonCtrl.verifyNull(req.body);
  obj.action = 'dsrbyuser';
  obj = JSON.stringify(obj);
  commonModel.mysqlPromiseModelService(proc.dsr, [obj])
    .then(results => {
      return res.json({
        "state": 1,
        message: "success",
        "data": results[0],
        "punchdata": results && results[1]
      });
    })
    .catch(err => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err
      });
    })

}