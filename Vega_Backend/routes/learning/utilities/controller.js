const query = require('../../../routes/common/Model').mysqlPromiseModelService;
const upload = require('./../../../services/uploadService');
const notificationCtrl = require('../../notification/Controller');
const mailservice = require('../../../services/mailerService');

var appRoot = require('app-root-path');
const config = require('../../../config/config')

var path = require('path');

var fs = require('fs');
var lodash = require('lodash');
const verifyNull = require('../../common/utils').removeFalseyLike;

appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;



module.exports = {
  trainingReminder: trainingReminder,
  uploadStudyMaterial: uploadStudyMaterial,
  viewStudyMaterial: viewStudyMaterial,
  deleteStudyMaterial: deleteStudyMaterial,
  viewLearningCertificate: viewLearningCertificate,
  tagLearningCertificate: tagLearningCertificate,
  makeTestLive: makeTestLive,
  getTraineeAndRewardDetails: getTraineeAndRewardDetails,
  launchFeedbackForBatch: launchFeedbackForBatch,
  launchRewardForBatch: launchRewardForBatch,
  previewReward: previewReward,
  getRatingSlabandTestStatus: getRatingSlabandTestStatus,
  tagFeedbackForm: tagFeedbackForm
}

function trainingReminder(requestype) {
  //trainingreminder

  let obj = { reqtype: requestype }

  // obj.createdby = req.body && req.body.createdby;


  //console.log('JSON.stringify(obj)---------', JSON.stringify(obj));//tiara_training_view
  commonModel.mysqlModelService('call usp_learningmail_operation(?)', JSON.stringify(obj), function (err, result) {
    //console.log('reeeeeesssssss', result);
    if (err) console.log(err);
    else {
      result[0].forEach(function (item) {

        var g1 = new Date();
        var g2 = new Date(item && item.startdate);
        var g3 = new Date(item && item.enddate);
        // //console.log(g1.getDate()  +" " +g1.getMonth() +" " +g1.getDay())
        // //console.log(g2.getDate()  +" " +g2.getMonth() +" " +g2.getDay())


        if (item && item.startdate && (g1.getDate() === g2.getDate())
          && (g1.getMonth() === g2.getMonth())
          && (g1.getDay() === g2.getDay())
          && (g1.getFullYear() === g2.getFullYear())) {
          //console.log("Both  are equal");
          let emailObj = {
            email: item.assigneduseremail,
            mailType: 'learningMail',
            subjectVariables: {
              subject: "Reminder for Training"
            },
            headingVariables: {
              heading: "Reminder for Training"
            },
            bodyVariables: {

              message: `Your ${item.type} training module <b>${item.title}</b>  will start today.`
            }
          }
          mailservice.send(emailObj, (err, response) => {
            if (err) console.log(err, "MAil not Sent Errr")
            else console.log('Mail Sent')
          })
        } else if (item && item.enddate && (g1.getDate() === g3.getDate())
          && (g1.getMonth() === g3.getMonth())
          && (g1.getDay() === g3.getDay()) && (g1.getFullYear() === g2.getFullYear())) {
          ////console.log("Both  are equal"); 
          let emailObj = {
            email: item.assigneduseremail,
            mailType: 'learningMail',
            subjectVariables: {
              subject: "Reminder for Training"
            },
            headingVariables: {
              heading: "Reminder for Training"
            },
            bodyVariables: {
              message: `Your ${item.type} training module <b>${item.title}</b>  will end today.`
            }
          }
          mailservice.send(emailObj, (err, response) => {
            if (err) console.log(err, "MAil not Sent Errr")
            else console.log('Mail Sent')
          })

        } else {
          //console.log("No match found");
        }

      });
    }

  });
}

async function uploadStudyMaterial(req, res) {
  try {
    var obj = req.body;
    if (!fs.existsSync(path.join(appRoot.path, 'uploads'))) {
      fs.mkdirSync(path.join(appRoot.path, 'uploads'))
    }
    if (!fs.existsSync(path.join(appRoot.path, 'uploads', 'learning'))) {
      fs.mkdirSync(path.join(appRoot.path, 'uploads', 'learning'));
    }
    if (!fs.existsSync(path.join(appRoot.path, 'uploads', 'learning', 'studymaterial'))) {
      fs.mkdirSync(path.join(appRoot.path, 'uploads', 'learning', 'studymaterial'));
    }

    let countfiles = req.body.attachCount || 0;
    countfiles = parseInt(countfiles);
    let uploadFolder = path.join('learning', 'studymaterial', req.body.topicname)
    if (req.files) {
      //console.log('Inside files')
      let fileUploaded = await upload.uploadMultiple(req, uploadFolder, countfiles);
      obj.filename = fileUploaded.filename && fileUploaded.filename.toString();
      obj.filepath = fileUploaded.filepath && fileUploaded.filepath.toString();
    }
    if (req.body.previousfilepath && req.body.previousfilepath != 'null' && req.files) {
      obj.filepath = req.body.previousfilepath + ',' + obj.filepath;
      obj.filename = req.body.previousfilename + ',' + obj.filename;
    } else if (req.body.previousfilepath && req.body.previousfilepath != 'null') {
      obj.filepath = req.body.previousfilepath;
      obj.filename = req.body.previousfilename;
    } else if (!req.files && (!req.body.previousfilepath || req.body.previousfilepath == 'null')) {
      delete obj.filepath;
      delete obj.filename;
    }
    await verifyNull(obj)
    obj.reqtype = 'upload_studymaterial';
    var obj1 = {};
    var result = await query('call usp_learning_classroom(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    //console.log("ressss", result);
    //console.log("reqqqqq", req.body);
    let isbatch = req.body.isbatch;
    isbatch = Number(isbatch);
    var msgbody = isbatch ? `New study material is uploaded for batch ${result[0][0].title}.` :
      `New study material is uploaded for training ${result[0][0].title}`;

    if (result[1][0].state == 1) {

      var keysdata = {
        createdby: req.body.createdby, touser: result[0][0].tousers,
        description: msgbody, module: 'Learning', action: 'add'
      };

      notificationCtrl.saveUserNotificationDirect(keysdata);
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    //console.log(error);
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function viewStudyMaterial(req, res) {
  try {
    var obj = req.body;
    obj.reqtype = "view_studymaterial";
    var obj1 = {};
    var result = await query('call usp_learning_classroom(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }
    let uploadedData = result[0];
    //console.log("uploaded", uploadedData);

    let data = [];
    uploadedData.map(item => {
      let object = item;
      filenameArr = object.filename.split(',');
      filepathArr = object.filepath.split(',');

      let file_path = [];
      for (let i = 0; i < filenameArr.length; i++) {
        let obj = {};
        obj.name = filenameArr[i];
        obj.path = filepathArr[i];
        file_path.push(obj)
      }
      object = lodash.omit(object, "filename", "filepath");
      object["file_path"] = file_path;
      data.push(object);
      return data;
    })

    return res.json({ message: 'Success', state: 1, data: data })
  } catch (error) {
    //console.log('error', error)
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function deleteStudyMaterial(req, res) {
  try {
    var obj = req.body;
    obj.reqtype = "delete_studymaterial";
    var obj1 = {};
    var result = await query('call usp_learning_classroom(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function viewLearningCertificate(req, res) {
  try {
    var obj = req.body;
    obj.reqtype = "learning_certificate";
    var obj1 = {};
    var result = await query('call usp_learning_classroom(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function tagLearningCertificate(req, res) {
  try {
    var obj = req.body;
    obj.reqtype = "tag_learning_certificate";
    var obj1 = {};
    var result = await query('call usp_learning_classroom(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function makeTestLive(req, res) {
  try {
    var obj = req.body;
    obj.reqtype = "test_live";
    var obj1 = {};
    var result = await query('call usp_learning_classroom(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }
    //console.log("ressss", result);
    if (result[0][0].test_live == 1) {
      var msgbody = `Test is live now for ${result[0][0].title}.`

      var keysdata = {
        createdby: req.body.createdby, touser: result[0][0].tousers,
        description: msgbody, module: 'Learning', action: 'add'
      };
      //console.log("keysdata", keysdata);

      notificationCtrl.saveUserNotificationDirect(keysdata);
    }
    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}


async function getTraineeAndRewardDetails(req, res) {
  try {
    let obj = req.body;
    var obj1 = {};
    obj.action = 'trainee_and_reward_details';

    var result = await query('call usp_learning_feedback_question(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result && result[0] })

  } catch (error) {
    //console.log(error)
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function launchFeedbackForBatch(req, res) {
  try {
    let obj = req.body;
    var obj1 = {};
    obj.action = 'launch_feedback';

    var result = await query('call usp_learning_feedback_question(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result && result[0] })

  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function launchRewardForBatch(req, res) {
  try {
    let obj = req.body;
    var obj1 = {};
    obj.action = 'launch_reward';

    var result = await query('call usp_learning_feedback_question(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result && result[0] })

  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function previewReward(req, res) {
  try {
    let obj = req.body;
    var obj1 = {};
    obj.action = 'preview_reward';

    var result = await query('call usp_learning_feedback_question(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result && result[0], headerdata: result && result[1] })

  } catch (error) {
    //console.log(error)
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function getRatingSlabandTestStatus(req, res) {
  try {
    let obj = req.body;
    var obj1 = {};
    obj.action = 'rating_slab';

    var result = await query('call usp_learning_feedback_question(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result })

  } catch (error) {
    //console.log(error)
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function tagFeedbackForm(req, res) {
  try {
    var obj = req.body;
    obj.action = "tag_feedback_form";
    var obj1 = {};
    var result = await query('call usp_learning_feedback_question(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}