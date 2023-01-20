const query = require('../../../routes/common/Model').mysqlPromiseModelService;
const verifyNull = require('../../common/utils').removeFalseyLike;
const lodash = require("lodash");
const notificationCtrl = require('../../notification/Controller');
const mailservice = require("../../../services/mailerService");
const path = require("path");
const commonModel = require('../../common/Model');
const makeDir = require("../../../routes/common/utils").makeDirectories;
var appRoot = require('app-root-path');
const config = require('../../../config/config');
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;


module.exports = {
  createBatch: createBatch,
  viewBatch: viewBatch,
  addParticipants: addParticipants,
  viewBatchTopic: viewBatchTopic,
  viewBatchDetails,
  myBatchStatus,
  viewParticipants,
  publishBatch,
  addLearningCertificateSignature,
  viewLearningCertificateSignature
}

async function createBatch(req, res) {
  try {
    var obj = req.body;
    await verifyNull(obj);
    var result = await query('call usp_learning_batch(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}

async function viewBatch(req, res) {
  try {
    var obj = req.body;
    obj.action = 'view_batch';
    await verifyNull(obj);
    var result = await query('call usp_learning_batch(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }
    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}

async function addParticipants(req, res) {
  try {
    var obj = req.body;
    await verifyNull(obj);
    var result = await query('call usp_learning_batch(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}

async function viewParticipants(req, res) {
  try {
    var obj = req.body;
    await verifyNull(obj);
    var result = await query('call usp_learning_batch(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}

async function viewBatchTopic(req, res) {
  let obj = req.body;
  try {
    let result = await query('call usp_learning_batch(?)', [JSON.stringify(obj)]);
    if (!result) {
      throw new Error('Something went wrong!');
    }
    return res.json({ state: 1, mesage: 'Success', data: result[0] })
  } catch (err) {
    ////console.log('err', err);
    return res.json({ state: -1, message: 'Something went wrong!' })
  }
}
async function viewBatchDetails(req, res) {
  try {
    var obj = req.body;
    //obj.action = 'view_batch';
    await verifyNull(obj);
    var result = await query('call usp_learning_batch(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}

async function myBatchStatus(req, res) {
  try {
    var obj = req.body;
    var result = await query('call usp_learning_batch(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}
async function publishBatch(req, res) {
  try {
    if (!req.body.batch_id) {
      return res.json({ state: -1, message: "Required parameters are missing" })
    }
    let obj = req.body;
    let result = await query('call usp_learning_batch(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    let emailParams = result && result[1] && result[1][0];
    ////console.log("emailParams", emailParams);
    // //console.log("result", result);
    let sendMailTo = lodash.map(result && result[0], "useremail");
    sendMailTo = sendMailTo.toString();

    if (emailParams.is_published == 1) {
      var msgbody = `You have been assigned a training ${emailParams.trxtrainingtitle} in batch ${emailParams.trxtrainingbatchname}.`

      var keysdata = {
        createdby: req.body.createdby, touser: emailParams.tousers,
        description: msgbody, module: 'Learning', action: 'add'
      };
      //console.log("keysdata", keysdata);

      notificationCtrl.saveUserNotificationDirect(keysdata);
    }


    let moduleid = req.body.moduleid ? req.body.moduleid : "Learning";
    let mailOptions = {
      //email: "avinash.kumar@polestarllp.com",
      email: sendMailTo,
      moduleid: moduleid,
      mailType: 'invitationForClassroomTraining',
      userid: emailParams.tousers,
      subjectVariables: {
        subject: "Invitation for Classroom Training"
      },
      headingVariables: {
        heading: "Classroom Training"
      },
      bodyVariables: {
        trxtrainingtitle: emailParams.trxtrainingtitle,
        trxtrainingdescription: emailParams.trxtrainingdescription,
        trxtrainingbatchname: emailParams.trxtrainingbatchname,
        trxtrainingstartdate: moment(emailParams.trxtrainingstartdate, "YYYY-MM-DD").format("DD MMMM YYYY"),
        trxtrainingenddate: moment(emailParams.trxtrainingenddate, "YYYY-MM-DD").format("DD MMMM YYYY"),
        trxtrainingpremises: emailParams.trxtrainingpremises,
        trxtrainingtype: emailParams.trxtrainingtype,
        trxtraininghour: emailParams.trxtraininghour
      }
    }
    //  //console.log(mailOptions, "mailoptionsssssssss");
    mailservice.mail(mailOptions, function (err, response) {
      if (err) {
        //console.log(
        //  " { state:-1,message: 'Mail not sent.', error: err }",
        //  err
        //);
      } else {
        //console.log("return { state:1,message: 'Mail sent' }");
      }
    });

    return res.json({ message: 'Success', state: 1, data: null })
  } catch (err) {
    return res.json({ state: -1, message: err || err.message || 'Something went wrong!' })
  }
}

async function addLearningCertificateSignature(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1
    })
  }
  var sampleFile = req.files && req.files.file;
  if (sampleFile) {
    let checkPostsDir = path.join('certificateSignature');
    makeDir(checkPostsDir);
    var sampleFile_name = `${sampleFile.name}`;
    await sampleFile.mv(path.join(appRoot && appRoot.path, 'certificateSignature', sampleFile_name))
    req.body.filename = sampleFile_name;
    req.body.filepath = path.join('certificateSignature/', sampleFile_name);
  }
  var obj = req.body;
  obj = JSON.stringify(obj);
  commonModel.mysqlPromiseModelService("call usp_learning_batch(?)", [obj])
    .then(results => {
      return res.json({
        state: 1,
        message: "Success",
        data: results
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

async function viewLearningCertificateSignature(req, res) {
  try {
    var obj = req.body;
    //obj.action = 'view_batch';
    await verifyNull(obj);
    var result = await query('call usp_learning_batch(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}