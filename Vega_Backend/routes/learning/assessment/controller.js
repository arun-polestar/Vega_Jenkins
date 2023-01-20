const commonModel = require("../../common/Model");
const upload = require("./../../../services/uploadService");
const config = require('../../../config/config');
var appRoot = require("app-root-path");

var path = require("path");

var fs = require("fs");
var _ = require("underscore");
var excelToJson = require("convert-excel-to-json");
var lodash = require("lodash");
const query = require("../../common/Model").mysqlPromiseModelService;
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;


module.exports = {
  uploadQuestions: uploadQuestions,
  getAllQuestions: getAllQuestions,
  savelearningQuestion: savelearningQuestion,
  deactivateQuestions: deactivateQuestions,
  getassessment: getassessment,
  submitTest: submitTest,
  markcomplete: markcomplete,
  updateTopicQuestionStatus,
  verifyTestStatus,
  viewTestHistory
};

function uploadQuestions(req, res) {
  if (!fs.existsSync(path.join(appRoot.path, "uploads"))) {
    fs.mkdirSync(path.join(appRoot.path, "uploads"));
  }
  if (!fs.existsSync(path.join(appRoot.path, "uploads/learning"))) {
    fs.mkdirSync(path.join(appRoot.path, "uploads/learning"));
  }
  if (!fs.existsSync(path.join(appRoot.path, "uploads/learning/questions"))) {
    fs.mkdirSync(path.join(appRoot.path, "uploads/learning/questions"));
  }
  // if (!fs.existsSync(path.join(appRoot.path, 'uploads/learning/questions', req.body.selectedTrainingmodule))) {
  //   fs.mkdirSync(path.join(appRoot.path, 'uploads/learning/questions', req.body.selectedTrainingmodule));
  // }
  var tmpfilename = "uploads/learning/questions/"; // + req.body.selectedTrainingmodule + '/';
  if (
    req.files &&
    req.files["file"] &&
    req.files["file"].name &&
    (path.extname(req.files["file"].name.toLowerCase()) == ".xlsx" ||
      path.extname(req.files["file"].name.toLowerCase()) == ".xls")
  ) {
    upload
      .uploadmultipledoc(req, tmpfilename)
      .then(async (data) => {
        var result = excelToJson({
          sourceFile: path.join(data[0].filepath),
          header: {
            rows: 1,
          },
          columnToKey: {
            "*": "{{columnHeader}}",
          },
        });
        if (result) {
          result.data = result[Object.keys(result)[0]];
          var header = result.data[0];
          var headerkeys = Object.keys(header);
          headerkeys = headerkeys && headerkeys.toString();
          if (
            headerkeys ==
            "title,ifsubjective,option1,option2,option3,option4,answer" ||
            headerkeys == "title,ifsubjective,answer"
          ) {
            var filteredarry = lodash.reject(result.data, (item) => {
              item.title = item.title ? item.title : "";
              item.ifsubjective = item.ifsubjective ? item.ifsubjective : "";
              item.answer = item.answer ? item.answer : "";
              if (
                item.ifsubjective &&
                item.ifsubjective.toLowerCase() == "no"
              ) {
                item.option1 = item.option1 ? item.option1 : "";
                item.option2 = item.option2 ? item.option2 : "";
                item.option3 = item.option3 ? item.option3 : "";
                item.option4 = item.option4 ? item.option4 : "";
              } else {
                item.option1 = item.option1 ? item.option1 : "NA";
                item.option2 = item.option2 ? item.option2 : "NA";
                item.option3 = item.option3 ? item.option3 : "NA";
                item.option4 = item.option4 ? item.option4 : "NA";
              }

              return (
                item.title.toString().trim() == "" &&
                item.ifsubjective.toString().trim() == "" &&
                item.option1.toString().trim() == "" &&
                item.option2.toString().trim() == "" &&
                item.option3.toString().trim() == "" &&
                item.option4.toString().trim() == "" &&
                item.answer.toString().trim() == ""
              );
            });
            if (!filteredarry.length) {
              return res.json({
                state: -1,
                message: "Template file to upload data should not be empty!",
                data: null,
              });
            }

            var finalData = _.map(filteredarry, function (item) {
              var obj = {};
              var uniqObj = lodash
                .chain(item)
                .values()
                .drop(2)
                .dropRight(1)
                .uniq()
                .value();
              obj.title = item.title;
              obj.ifsubjective =
                item.ifsubjective && item.ifsubjective.toLowerCase() == "yes"
                  ? 1
                  : 0;
              if (
                item.ifsubjective &&
                item.ifsubjective.toLowerCase() == "no"
              ) {
                if (
                  item &&
                  item.option1 &&
                  item.option1.toString().replace(/\s\s+/g, "") &&
                  item.option2 &&
                  item.option2.toString().replace(/\s\s+/g, "") &&
                  item.option3 &&
                  item.option3.toString().replace(/\s\s+/g, "") &&
                  item.option4 &&
                  item.option4.toString().replace(/\s\s+/g, "") &&
                  item.answer &&
                  item.answer.toString().replace(/\s\s+/g, "") &&
                  item.title &&
                  item.title.toString().replace(/\s\s+/g, "") &&
                  item.ifsubjective &&
                  item.ifsubjective.toString().replace(/\s\s+/g, "") &&
                  uniqObj &&
                  uniqObj.length == 4
                ) {
                  //console.log("INSIDE IFFFFFFF");
                  obj.options = [
                    {
                      Sno: "1",
                      value: item.option1,
                      ifcorrect: item.option1 == item.answer ? true : false,
                    },
                    {
                      Sno: "2",
                      value: item.option2,
                      ifcorrect: item.option2 == item.answer ? true : false,
                    },
                    {
                      Sno: "3",
                      value: item.option3,
                      ifcorrect: item.option3 == item.answer ? true : false,
                    },
                    {
                      Sno: "4",
                      value: item.option4,
                      ifcorrect: item.option4 == item.answer ? true : false,
                    },
                  ];
                  obj.success = true;
                } else {
                  obj.success = false;
                }
              }
              obj.createdby = req.body.createdby;
              if (
                item.ifsubjective &&
                item.ifsubjective.toLowerCase() == "no"
              ) {
                obj.correctoption =
                  item.option1 == item.answer
                    ? "1"
                    : item.option2 == item.answer
                      ? "2"
                      : item.option3 == item.answer
                        ? "3"
                        : item.option4 == item.answer
                          ? "4"
                          : "";
                obj.trainingmoduleid = req.body.selectedTrainingmodule
                  .toString()
                  .replace("]", "")
                  .replace("[", "");
                obj.courseMaterial_classroom = req.body.courseMaterial_classroom
                  .toString()
                  .replace("]", "")
                  .replace("[", "");
              } else {
                obj.correctoption = item.answer;
                obj.success = true;
                obj.trainingmoduleid = req.body.selectedTrainingmodule
                  .toString()
                  .replace("]", "")
                  .replace("[", "");
                obj.courseMaterial_classroom = req.body.courseMaterial_classroom
                  .toString()
                  .replace("]", "")
                  .replace("[", "");
              }
              if (
                item.ifsubjective &&
                item.ifsubjective.toLowerCase() == "no" &&
                !(
                  item.option1 == item.answer ||
                  item.option2 == item.answer ||
                  item.option3 == item.answer ||
                  item.option4 == item.answer
                )
              )
                obj.success = false;
              {
                return obj;
              }
            });
            var errCount = _.where(finalData, { success: false });
            finalData = _.where(finalData, { success: true });
            commonModel.mysqlModelService(
              "call usp_learning_question_upload(?)",
              JSON.stringify(finalData),
              function (err, result) {
                if (err) {
                  return res.json({
                    state: -1,
                    message: err || "Something went wrong",
                    err: err,
                  });
                } else {
                  var errmsg = "";
                  if (errCount && errCount.length > 0) {
                    errmsg =
                      errCount.length +
                      " record(s) have wrong/duplicate answer or empty fields in templates.";
                  }
                  if (result && result[0] && result[0][0]) {
                    if (result[0][0].state == -1)
                      return res.json({
                        state: -1,
                        message: result[0][0].message + " " + errmsg,
                      });
                    return res.json({
                      state: 1,
                      message: result[0][0].message + " " + errmsg,
                    });
                  }
                  return res.json({
                    state: 1,
                    message: "Uploaded successfully.",
                  });
                }
              }
            );
          } else {
            return res.json({ state: -1, message: "Invalid File Template" });
          }
        }
      })
      .catch((err) => {
        return res.json({
          state: -1,
          message: err || "Something went wrong",
          err: err,
        });
      });
  } else {
    return res.json({
      state: -1,
      message: "Unsupported File Format.",
      data: null,
    });
  }
}

function getassessment(req, res) {
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService(
    "call usp_learning_trxtiaraassessment_view(?)",
    [obj],
    function (err, result) {
      if (err) {
        return res.json({
          state: -1,
          err: "Error from Database",
          message: err,
        });
      } else {
        if (result && result[0] && result[0][0]) {
          if (result[0][0].state == -1)
            return res.json({ state: -1, message: result[0][0].message });
          return res.json({
            state: 1,
            message: "success",
            assessmentData: result[0],
          });
        }
        return res.json({
          state: 1,
          message: "success",
          assessmentData: result[0],
        });
      }
    }
  );
}

function submitTest(req, res) {
  var obj = JSON.stringify(req.body.data);
  commonModel.mysqlModelService(
    "call usp_learning_trxtest_submit(?)",
    [obj],
    function (err, result) {
      if (err) {
        return res.json({
          state: -1,
          err: err,
          message: "database Error",
        });
      }
      if (result && result[0] && result[0][0]) {
        if (result[0][0].state == -1)
          return res.json({ state: -1, message: result[0][0].message });
        return res.json({ state: 1, message: "success", data: result[0] });
      }
    }
  );
}

function getAllQuestions(req, res) {
  if (!req.body.tokenFetchedData) {
    return res.json({
      state: -1,
      message: "Not Valid Data",
    });
  }
  var obj = req.body;
  obj.reqType = req.body && req.body.action;
  (obj.id = req.body && req.body.id),
    (obj.createdby =
      req.body && req.body.tokenFetchedData && req.body.tokenFetchedData.id),
    (obj.populate = req.body && req.body.populate),
    (obj.status = req.body && req.body.status),
    commonModel.mysqlModelService(
      "call usp_learning_trxquestion_add(?)",
      [JSON.stringify(obj)],
      function (err, results) {
        if (err) {
          return res.json({
            state: -1,
            message: "Something went wrong with Database",
            err: err,
          });
        }
        if (obj.flag != "1") {
          return res.json({
            state: 1,
            message: "success",
            data: results && results[0],
          });
        } else {
          if (results && results[0]) {
            results[0].forEach(function (item) {
              if (item.ifsubjective == 0) {
                var optns = JSON.parse(item.options);
                optns.forEach(function (optn) {
                  optn.ifcorrect = " ";
                });
                item.options = JSON.stringify(optns);
              }
            });
            return res.json({
              state: 1,
              message: "success",
              data: results && results[0],
            });
          }
        }
      }
    );
}

function savelearningQuestion(req, res) {
  if (!req.body.tokenFetchedData) {
    return res.json({
      state: -1,
      message: "Required Parameters missing.",
    });
  }
  obj = req.body;
  obj.reqType =
    req.body && req.body.id == undefined ? "addquestion" : "editquestion";
  (obj.id = (req.body && req.body.id) || ""),
    (obj.createdby =
      req.body && req.body.tokenFetchedData && req.body.tokenFetchedData.id),
    (obj.populate = req.body && req.body.populate),
    (obj.action = req.body && req.body.action),
    (obj.status = req.body && req.body.status),
    commonModel.mysqlModelService(
      "call usp_learning_trxquestion_add(?)",
      JSON.stringify(obj),
      function (err, results) {
        if (err) {
          return res.json({
            state: -1,
            message: "Database error",
            err: err,
          });
        }
        return res.json({
          state: 1,
          message: "success",
          data: results && results[0],
        });
      }
    );
}

function deactivateQuestions(req, res) {
  if (!req.body.tokenFetchedData) {
    return res.json({
      state: 1,
      message: "Required Parameter is missing",
    });
  }
  obj = req.body;
  obj.reqType = req.body && req.body.action;
  (obj.id = (req.body && req.body.id) || ""),
    (obj.createdby =
      req.body && req.body.tokenFetchedData && req.body.tokenFetchedData.id),
    (obj.populate = req.body && req.body.populate),
    (obj.action = req.body && req.body.action),
    (obj.isactive = req.body && req.body.status),
    commonModel.mysqlModelService(
      "call usp_learning_trxquestion_add(?)",
      JSON.stringify(obj),
      function (err, results) {
        if (err) {
          return res.json({
            state: 1,
            message: "database error",
            err: err,
          });
        }
        return res.json({
          state: 1,
          message: "success",
          data: results && results[0],
        });
      }
    );
}

function markcomplete(req, res) {
  var obj = req.body;
  obj.action = obj.action || "markascomplete";
  commonModel.mysqlModelService(
    "call usp_learning_TrainingOperations(?)",
    JSON.stringify(obj),
    function (err, result) {
      if (err) {
        return res.json({
          state: -1,
          message: "database Error",
          err: err,
        });
      } else {
        if (result && result[0]) {
          if (result[0][0]) {
            if (result[0][0].state > 0) {
              return res.json({
                state: 1,
                message: "Trainning Module is completed.",
              });
            } else {
              return res.json({
                state: -1,
                message: result[0][0].message,
              });
            }
          } else {
            return res.json({
              state: -1,
              message: result[0][0].message,
            });
          }
        } else {
          return res.json({
            state: -1,
            message: "User details provided are  wrong",
          });
        }
      }
    }
  );
}
async function updateTopicQuestionStatus(req, res) {
  if (!req.body.id) {
    return res.json({ state: -1, message: "Required Parameters are missing!" });
  } else {
    try {
      let reqData = req.body;
      reqData.action = "questionstatus";
      await query("call usp_learning_topic(?)", [JSON.stringify(reqData)]);
      return res.json({ state: 1, message: "Success", data: null });
    } catch (err) {
      //console.log(err);
      return res.json({
        state: -1,
        message: err.message || err || "Something went wrong!",
      });
    }
  }
}

async function verifyTestStatus(req, res) {
  if (!req.body.test_header_id && !req.body.attempt_number) {
    return res.json({ state: -1, message: "Required Parameters are missing!" });
  } else {
    try {
      let obj = req.body;
      obj.reqType = "verify_test_status";
      const result = await query("call usp_learning_trxquestion_add(?)", [JSON.stringify(obj)]);
      return res.json({ state: result[0][0].state, message: result[0][0].message, data: null });
    } catch (err) {
      return res.json({
        state: -1,
        message: err.message || err || "Something went wrong!",
      });
    }
  }
}

async function viewTestHistory(req, res) {
  if (!req.body.testheaderid) {
    return res.json({ state: -1, message: "Required Parameters are missing!" });
  } else {
    try {
      let obj = req.body;
      obj.action = "test_history";
      const result = await query("call usp_learning_topic(?)", [JSON.stringify(obj)]);
      return res.json({ state: 1, message: 'success', data: result });
    } catch (err) {
      return res.json({
        state: -1,
        message: err.message || err || "Something went wrong!",
      });
    }
  }
}