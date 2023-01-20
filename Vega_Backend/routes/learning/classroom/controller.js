const commonModel = require('../../common/Model');
const mailservice = require('../../../services/mailerService');
const query = require('../../../routes/common/Model').mysqlPromiseModelService;
const commonCtrl = require('../../common/Controller');
const notificationCtrl = require('../../notification/Controller');

var lodash = require('lodash');
const moment = require("moment");
const verifyNull = require('../../common/utils').removeFalseyLike;


module.exports = {
  addClassroomTraining: addClassroomTraining,
  getClassroomTraining: getClassroomTraining,
  updateClassroomTraining: updateClassroomTraining,
  addClassroomTrainee: addClassroomTrainee,
  deactivateClassroom: deactivateClassroom,
  getAssignedClassroomTrainee: getAssignedClassroomTrainee,
  deactivateClassroomTraining: deactivateClassroomTraining,
  getBatchwiseTraining: getBatchwiseTraining,
  getLazyLoadedBatchData: getLazyLoadedBatchData
}

async function addClassroomTraining(req, res) {
  try {
    var obj = req.body;
    obj.reqtype = "add_cr_training";
    await verifyNull(obj);
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

async function getClassroomTraining(req, res) {
  try {
    var obj = req.body;
    obj.reqtype = "view_cr_training";
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

async function updateClassroomTraining(req, res) {
  try {
    var obj = req.body;
    obj.reqtype = "edit_cr_training";
    await verifyNull(obj);
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


async function addClassroomTrainee(req, res) {
  try {
    var obj = req.body;
    obj.reqtype = "add_cr_trainee";
    var obj1 = {};
    var result = await query('call usp_learning_classroom(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    ////console.log("result", result);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    let emailParams = result && result[1] && result[1][0];
    ////console.log("emailParams", emailParams);
    let sendMailTo = lodash.map(result[0], "useremail");
    sendMailTo = sendMailTo.toString();
    ////console.log("emails", sendMailTo);

    if (result[2][0].state == 1) {
      var msgbody = `You have been assigned a training in batch ${emailParams.trxtrainingtitle}.`

      var keysdata = {
        createdby: req.body.createdby, touser: emailParams.tousers,
        description: msgbody, module: 'Learning', action: 'add'
      };
      // //console.log("keysdata", keysdata);

      notificationCtrl.saveUserNotificationDirect(keysdata);
    }


    let emailObj = {
      //email: "avinash.kumar@polestarllp.com",
      email: sendMailTo,
      mailType: 'invitationForClassroomTraining',
      subjectVariables: {
        subject: "Invitation for Classroom Training"
      },
      headingVariables: {
        heading: "Classroom Training"
      },
      bodyVariables: {
        title: emailParams.title,
        description: emailParams.description,
        startdate: moment(emailParams.startdate, "YYYY-MM-DD").format("DD MMMM YYYY"),
        enddate: moment(emailParams.enddate, "YYYY-MM-DD").format("DD MMMM YYYY"),
        trainingpremises: emailParams.trainingpremises,
        type: emailParams.type,
        traininghour: emailParams.traininghour
      }
    }
    mailservice.send(emailObj, (err, response) => {
      if (err) {
        //console.log(err, "MAil not Sent Errr");
      }
      else {
        //console.log('Mail Sent');
      }
    })
    let moduleid = req.body.moduleid ? req.body.moduleid : "Learning";
    let mailOptions = {
      //email: "avinash.kumar@polestarllp.com",
      email: sendMailTo,
      moduleid: moduleid,
      mailType: 'invitationForClassroomTraining',
      userid: req.body.incoming_users,
      subjectVariables: {
        subject: "Invitation for Classroom Training"
      },
      headingVariables: {
        heading: "Classroom Training"
      },
      bodyVariables: {
        trxtrainingtitle: emailParams.trxtrainingtitle,
        trxtrainingdescription: emailParams.trxtrainingdescription,
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
        // " { state:-1,message: 'Mail not sent.', error: err }",
        //  err
        // );
      } else {
        //console.log("return { state:1,message: 'Mail sent' }");
      }
    });
    return res.json({ message: 'Success', state: 1, data: result })
  } catch (error) {
    ////console.log(error);
    return res.json({ 'message': error, state: -1, data: null });
  }
}

async function deactivateClassroom(req, res) {
  try {
    var obj = req.body;
    obj.reqtype = "deactivate_classroom";
    var obj1 = {};
    var result = await query('call usp_learning_classroom(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function getAssignedClassroomTrainee(req, res) {
  try {
    var obj = req.body;
    obj.reqtype = "cr_assigned_trainee";
    var obj1 = {};
    var result = await query('call usp_learning_classroom(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}



async function deactivateClassroomTraining(req, res) {
  try {
    var obj = req.body;
    obj.reqtype = "deactivate_cr_training";
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

async function getBatchwiseTraining(req, res) {
  try {
    var obj = req.body;
    obj.reqtype = "training_and_batch_details";
    var obj1 = {};
    var result = await query('call usp_learning_classroom(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }
    let uploadedData = result[1];
    // //console.log("uploads", uploadedData);
    let data = [];
    uploadedData.map(item => {
      let object = item;
      let filenameArr = object.filename && object.filename.split(',');
      let filepathArr = object.filepath && object.filepath.split(',');
      let file_path = [];
      for (let i = 0; i < (filenameArr && filenameArr.length); i++) {
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

    return res.json({ message: 'Success', state: 1, data: [result[0], data] })
  } catch (error) {
    ////console.log("error", error);
    return res.json({ 'err': error, state: -1, data: null });
  }
}


function getLazyLoadedBatchData(req, res) {
  var obj = req.body;
  obj.reqtype = "lazyload_batch_data";
  let obj1 = [];
  //console.log('reqqssssssssss classroom', req.body)
  commonModel.mysqlModelService('call usp_learning_classroom(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)], (err, result) => {
    if (err) {
      res.json({
        state: -1,
        message: err,
        err: "error occured in DB"
      })
    }
    else {
      var dbresult = commonCtrl.lazyLoading(result[0], req.body);
      //console.log("dbresult", dbresult);
      if (dbresult && "data" in dbresult && "count" in dbresult) {
        return res.json({
          state: 1,
          message: "success",
          data: dbresult.data,
          count: dbresult.count,
        });
      }
      else {
        return res.json({
          state: -1,
          message: "No Lazy Data"
        });
      }
    }
  })
}