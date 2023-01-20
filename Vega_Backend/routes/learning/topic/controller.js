const query = require('../../common/Model').mysqlPromiseModelService;
const appRoot = require('app-root-path');
const path = require('path');
const fs = require('fs');
const lodash = require('lodash');
const _ = require('underscore');
const verifyNull = require('../../common/utils').removeFalseyLike;
const upload = require('../../../services/uploadService');
const excelToJson = require('convert-excel-to-json');
const commonModel = require('../../common/Model');
const makeDir = require("../../../routes/common/utils").makeDirectories;
const config = require('../../../config/config');

appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;


module.exports = {
  saveTrainingTopic,
  viewTrainingTopic,
  uploadTopicQuestions,
  markAsAttended,
  saveBatchTopic,
  viewTrainerList,
  addTopicQuestion,
  markTopicAsCompleted,
  getUnattendedTraineeList
}

async function saveTrainingTopic(req, res) {
  try {
    if (!req.body.topic_name) {
      throw new Error("Please provide Topic Name!");
    }
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
    let uploadFolder = path.join('learning', 'studymaterial', req.body.topic_name)
    if (req.files) {
      //console.log('Inside files')
      let fileUploaded = await upload.uploadMultiple(req, uploadFolder, countfiles);
      obj.study_material_filename = fileUploaded.filename && fileUploaded.filename.toString();
      obj.study_material_filepath = fileUploaded.filepath && fileUploaded.filepath.toString();
    }
    if (req.body.previous_study_material_filepath && req.body.previous_study_material_filepath != 'null' && req.files) {
      obj.study_material_filepath = req.body.previous_study_material_filepath + ',' + obj.study_material_filepath;
      obj.study_material_filename = req.body.previous_study_material_filename + ',' + obj.study_material_filename;
    } else if (req.body.previous_study_material_filepath && req.body.previous_study_material_filepath != 'null') {
      obj.study_material_filepath = req.body.previous_study_material_filepath;
      obj.study_material_filename = req.body.previous_study_material_filename;
    } else if (!req.files && (!req.body.previous_study_material_filepath || req.body.previous_study_material_filepath == 'null')) {
      delete obj.study_material_filepath;
      delete obj.study_material_filename;
    }
    await verifyNull(obj)
    var result = await query('call usp_learning_topic(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: result[0] });
    }
    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    //console.log(error);
    return res.json({ 'err': error, state: -1, data: null });
  }
}


async function viewTrainingTopic(req, res) {
  let obj = req.body;
  try {
    let results = await query('call usp_learning_topic(?)', [JSON.stringify(obj)]);
    if (!results) {
      throw new Error('Something went wrong!');
    }
    return res.json({ state: 1, mesage: 'Success', data: results[0] })
  } catch (err) {
    //console.log('err', err);
    return res.json({ state: -1, message: 'Something went wrong!' })
  }
}

function uploadTopicQuestions(req, res) {
  if (!req.body.topic_id) {
    return res.json({ state: -1, mesage: 'Required Paramters are missing' });
  }
  // if (!req.body.ifsubjective.toLowerCase() == 'yes' || !req.body.ifsubjective.toLowerCase() == 'no' ||
  //     !req.body.ifsubjective.toUpperCase() == 'YES' || !req.body.ifsubjective.toUpperCase() == 'NO')
  //  {
  //   return res.json({ state: -1, message: "ifsubjective value can be Yes/No only!" });
  // } else if (req.body.ifsubjective == "" || req.body.ifsubjective == null) {
  //   return res.json({ state: -1, message: "ifsubjective value cannot be empty." });
  // }

  if (!fs.existsSync(path.join(appRoot.path, 'uploads'))) {
    fs.mkdirSync(path.join(appRoot.path, 'uploads'))
  }
  if (!fs.existsSync(path.join(appRoot.path, 'uploads/learning'))) {
    fs.mkdirSync(path.join(appRoot.path, 'uploads/learning'));
  }
  if (!fs.existsSync(path.join(appRoot.path, 'uploads/learning/questions'))) {
    fs.mkdirSync(path.join(appRoot.path, 'uploads/learning/questions'));
  }

  var tmpfilename = 'uploads/learning/questions/';// + req.body.selectedTrainingmodule + '/';
  if (req.files && req.files['file'] && req.files['file'].name &&
    (path.extname(req.files['file'].name.toLowerCase()) == '.xlsx' ||
      path.extname(req.files['file'].name.toLowerCase()) == '.xls')) {
    upload.uploadmultipledoc(req, tmpfilename).then(async data => {

      var result = excelToJson({
        sourceFile: path.join(data[0].filepath),
        header: {
          rows: 1
        },
        columnToKey: {
          '*': '{{columnHeader}}'
        }
      });
      ////console.log("result", result.data);
      for (let i = 0; i < (result && result.data && result.data.length); i++) {
        //console.log(result.data[i].ifsubjective.toLowerCase());
        if (!(result.data[i].ifsubjective.toLowerCase() == 'yes' || result.data[i].ifsubjective.toLowerCase() == 'no')) {
          return res.json({ state: -1, message: "ifsubjective value can be Yes/No only!" });
        } else if (result.data[i].ifsubjective == "" || result.data[i].ifsubjective == null) {
          return res.json({ state: -1, message: "ifsubjective value cannot be empty." });
        } else if (result.data[i].ifsubjective.toLowerCase() == 'no' &&
          !(result.data[i].answer == result.data[i].option1 ||
            result.data[i].answer == result.data[i].option2 ||
            result.data[i].answer == result.data[i].option3 ||
            result.data[i].answer == result.data[i].option4)) {
          return res.json({ state: -1, message: "Answer can be from provided options only!" });
        }
      }
      if (result) {
        result.data = result[Object.keys(result)[0]];
        var header = result.data[0];
        var headerkeys = Object.keys(header);
        headerkeys = headerkeys && headerkeys.toString()
        if (headerkeys == 'title,ifsubjective,option1,option2,option3,option4,answer'
          || headerkeys == 'title,ifsubjective,answer') {
          var filteredarry = lodash.reject(result.data, item => {
            item.title = item.title ? item.title : ''
            item.ifsubjective = item.ifsubjective ? item.ifsubjective : ''
            item.answer = item.answer ? item.answer : ''
            if (item.ifsubjective && item.ifsubjective.toLowerCase() == 'no') {
              item.option1 = item.option1 ? item.option1 : ''
              item.option2 = item.option2 ? item.option2 : ''
              item.option3 = item.option3 ? item.option3 : ''
              item.option4 = item.option4 ? item.option4 : ''
            } else {
              item.option1 = item.option1 ? item.option1 : 'NA'
              item.option2 = item.option2 ? item.option2 : 'NA'
              item.option3 = item.option3 ? item.option3 : 'NA'
              item.option4 = item.option4 ? item.option4 : 'NA'
            }

            return item.title.toString().trim() == '' &&
              item.ifsubjective.toString().trim() == '' &&
              item.option1.toString().trim() == '' &&
              item.option2.toString().trim() == '' &&
              item.option3.toString().trim() == '' &&
              item.option4.toString().trim() == '' &&
              item.answer.toString().trim() == ''

          })
          if (!filteredarry.length) {
            return res.json({
              "state": -1,
              "message": "Template file to upload data should not be empty!",
              "data": null
            });
          }
          var finalData = _.map(filteredarry, function (item) {
            var obj = {};
            var uniqObj = lodash.chain(item).values().drop(2).dropRight(1).uniq().value();
            obj.title = item.title;
            obj.ifsubjective = (item.ifsubjective && item.ifsubjective.toLowerCase() == 'yes') ? 1 : 0;
            if (item.ifsubjective && item.ifsubjective.toLowerCase() == 'no') {
              if (item && item.option1 && item.option1.toString().replace(/\s\s+/g, '')
                && item.option2 && item.option2.toString().replace(/\s\s+/g, '')
                && item.option3 && item.option3.toString().replace(/\s\s+/g, '')
                && item.option4 && item.option4.toString().replace(/\s\s+/g, '')
                && item.answer && item.answer.toString().replace(/\s\s+/g, '')
                && item.title && item.title.toString().replace(/\s\s+/g, '')
                && item.ifsubjective && item.ifsubjective.toString().replace(/\s\s+/g, '')
                && uniqObj && uniqObj.length == 4) {
                //console.log('INSIDE IFFFFFFF')
                obj.options = [
                  {
                    "Sno": '1',
                    "value": item.option1,
                    "ifcorrect": (item.option1 == item.answer) ? true : false
                  },
                  {
                    "Sno": "2",
                    "value": item.option2,
                    "ifcorrect": (item.option2 == item.answer) ? true : false
                  },
                  {
                    "Sno": "3",
                    "value": item.option3,
                    "ifcorrect": (item.option3 == item.answer) ? true : false
                  },
                  {
                    "Sno": "4",
                    "value": item.option4,
                    "ifcorrect": (item.option4 == item.answer) ? true : false
                  }
                ];
                obj.success = true
              }
              else {
                obj.success = false;
              }
            }
            obj.createdby = req.body.createdby;
            obj.topic_id = req.body.topic_id;
            if (item.ifsubjective && item.ifsubjective.toLowerCase() == 'no') {
              obj.correctoption = item.option1 == item.answer ? '1' : item.option2 == item.answer ? '2' : item.option3 == item.answer ? '3' : item.option4 == item.answer ? '4' : '';
            }
            else {
              obj.correctoption = item.answer;
              obj.success = true;
            }
            if (item.ifsubjective && item.ifsubjective.toLowerCase() == 'no' && !(item.option1 == item.answer || item.option2 == item.answer || item.option3 == item.answer || item.option4 == item.answer))
              obj.success = false;
            {
              return obj;
            }
          })
          var errCount = _.where(finalData, { success: false });
          finalData = _.where(finalData, { success: true });
          //console.log('finalData', finalData);
          commonModel.mysqlModelService('call usp_learning_topic_question(?)', JSON.stringify(finalData), function (err, result) {
            if (err) {
              return res.json({ "state": -1, "message": err || "Something went wrong", err: err });

            } else {
              var errmsg = '';
              if (errCount && errCount.length > 0) {
                errmsg = (errCount.length) + ' record(s) have wrong/duplicate answer or empty fields in templates.';
              }
              if (result && result[0] && result[0][0]) {
                if (result[0][0].state == -1)
                  return res.json({ "state": -1, "message": result[0][0].message + ' ' + errmsg });
                return res.json({ "state": 1, "message": result[0][0].message + ' ' + errmsg });
              }
              return res.json({ "state": 1, "message": "Uploaded successfully." });

            }

          });

        } else {
          return res.json({ "state": -1, "message": "Invalid File Template" });
        }
      }
    }
    )
      .catch(err => {
        return res.json({
          "state": -1,
          "message": err || 'Something went wrong',
          "err": err
        });
      })
  } else {
    return res.json({ state: -1, message: "Unsupported File Format.", data: null })
  }
}


async function markAsAttended(req, res) {
  let obj = req.body;
  obj.action = obj.action ? obj.action : 'mark_as_attended';
  try {
    let results = await query('call usp_learning_topic(?)', [JSON.stringify(obj)]);
    if (!results) {
      throw new Error('Something went wrong!');
    }
    return res.json({ state: 1, mesage: 'Success', data: results[0] })
  } catch (err) {
    //console.log('err', err);
    return res.json({ state: -1, message: err })
  }
}


async function saveBatchTopic(req, res) {
  let obj = req.body;
  try {
    let results = await query('call usp_learning_topic(?)', [JSON.stringify(obj)]);
    if (!results) {
      throw new Error('Something went wrong!');
    }
    return res.json({ state: 1, mesage: 'Success', data: results[0] })
  } catch (err) {
    //console.log('err', err);
    return res.json({ state: -1, message: err })
  }
}

async function viewTrainerList(req, res) {
  let obj = req.body;
  obj.action = 'trainer_list';
  try {
    let results = await query('call usp_learning_topic(?)', [JSON.stringify(obj)]);
    if (!results) {
      throw new Error('Something went wrong!');
    }
    return res.json({ state: 1, mesage: 'Success', data: results[0] })
  } catch (err) {
    //console.log('err', err);
    return res.json({ state: -1, message: 'Something went wrong!' })
  }
}

async function addTopicQuestion(req, res) {
  let obj = req.body;
  try {
    req.body.options = req.body.options && JSON.parse(req.body.options);
    let uploadPath = path.join('uploads', 'learning', 'questions');
    makeDir(uploadPath);

    let countfiles = req.body.attachCount || 0;
    countfiles = parseInt(countfiles);
    let uploadFolder = path.join('learning', 'questions');
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

    let results = await query('call usp_learning_topic(?)', [JSON.stringify(obj)]);
    if (!results) {
      throw new Error('Something went wrong!');
    }
    return res.json({ state: 1, mesage: 'Success', data: results[0] })
  } catch (err) {
    //console.log('err', err);
    return res.json({ state: -1, message: err })
  }
}

async function markTopicAsCompleted(req, res) {
  let obj = req.body;
  obj.action = 'mark_topic_completed';
  try {
    let results = await query('call usp_learning_topic(?)', [JSON.stringify(obj)]);
    if (!results) {
      throw new Error('Something went wrong!');
    }
    return res.json({ state: 1, mesage: 'Success', data: results[0] })
  } catch (err) {
    //console.log('err', err);
    return res.json({ state: -1, message: err })
  }
}

async function getUnattendedTraineeList(req, res) {
  let obj = req.body;
  obj.action = 'unattended_trainee_list';
  try {
    let results = await query('call usp_learning_topic(?)', [JSON.stringify(obj)]);
    if (!results) {
      throw new Error('Something went wrong!');
    }
    return res.json({ state: 1, mesage: 'Success', data: results[0] })
  } catch (err) {
    //console.log('err', err);
    return res.json({ state: -1, message: err })
  }
}