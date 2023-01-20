"use strict";

const path = require("path");
const makeDir = require("../../../common/utils").makeDirectories;
const xlsx = require("xlsx");
const _ = require("lodash");
const commonModel = require("../../../common/Model");
const query = require("../../../common/Model").mysqlPromiseModelService;
const proc = require("./../../../common/procedureConfig");

module.exports = {
  uploadQuestion: uploadQuestion,
  getQuescount: getQuescount,
  getQuestionMaster: getQuestionMaster,
  saveQuestionData: saveQuestionData,
  getMastersForTest: getMastersForTest,
  changeStatus: changeStatus,
  changeQuestionStatus: changeQuestionStatus,
};

async function uploadQuestion(req, res) {
  try {
    if (!req.files && !req.files.file) {
      throw new Error("Please attache questions template!");
    }
    let uniqueoption = [];
    let wrongcorrectanswer = [];
    const excelTemplate = req.files.file;
    const dir = makeDir("uploads/lemonade");
    const uploadPath = path.join(dir, excelTemplate.name);
    await excelTemplate.mv(uploadPath);
    const wb = xlsx.readFile(uploadPath, {
      cellDates: true
    });
    const ws = wb.Sheets["data"];
    const c1 = ws["A1"] ? ws["A1"].v && ws["A1"].v : undefined;
    const c2 = ws["B1"] ? ws["B1"].v && ws["B1"].v : undefined;
    const c3 = ws["C1"] ? ws["C1"].v && ws["C1"].v : undefined;
    const c4 = ws["D1"] ? ws["D1"].v && ws["D1"].v : undefined;
    const c5 = ws["E1"] ? ws["E1"].v && ws["E1"].v : undefined;
    const c6 = ws["F1"] ? ws["F1"].v && ws["F1"].v : undefined;
    const c7 = ws["G1"] ? ws["G1"].v && ws["G1"].v : undefined;

    if (
      !c1 ||
      c1.toString().trim() !== "title" ||
      !c2 ||
      c2.toString().trim() !== "option1" ||
      !c3 ||
      c3.toString().trim() !== "option2" ||
      !c4 ||
      c4.toString().trim() !== "option3" ||
      !c5 ||
      c5.toString().trim() !== "option4" ||
      !c6 ||
      c6.toString().trim() !== "answer" ||
      !c7 ||
      c7.toString().trim() !== "level"
    ) {
      throw new Error("Invalid Questions Template!");
    }
    const excelArr = xlsx.utils.sheet_to_json(ws);
    const filteredarry = _.reject(excelArr, (item) => {
      item[c1] = item[c1] ? item[c1] : "";
      item[c2] = item[c2] || item[c2] == 0 ? item[c2] : "";
      item[c3] = item[c3] || item[c3] == 0 ? item[c3] : "";
      item[c4] = item[c4] || item[c4] == 0 ? item[c4] : "";
      item[c5] = item[c5] || item[c5] == 0 ? item[c5] : "";
      item[c6] = item[c6] || item[c6] == 0 ? item[c6] : "";
      item[c7] = item[c7] || item[c7] == 0 ? item[c7] : "";
      return (
        item[c1].toString().trim() == "" &&
        item[c2].toString().trim() == "" &&
        item[c3].toString().trim() == "" &&
        item[c4].toString().trim() == "" &&
        item[c5].toString().trim() == "" &&
        item[c6].toString().trim() == "" &&
        item[c7].toString().trim() == ""
      );
    });
    if (!filteredarry.length) {
      throw new Error(
        "Make sure the worksheet named 'data' in the template should not be empty!"
      );
    } else {
      let reqData = [];
      for (let i = 0, n = filteredarry.length; i < n; i++) {
        let el = filteredarry[i];
        if (!['Easy', 'Medium', 'Hard'].includes(el[c7])) {
          throw new Error(
            "Make sure the level of all the questions should be Easy/Medium/Hard"
          );
        }
        if (
          el &&
          (el[c1] || el[c1] == 0) &&
          el[c1].toString().replace(/\s\s+/g, "") &&
          (el[c2] || el[c2] == 0) &&
          el[c2].toString().replace(/\s\s+/g, "") &&
          (el[c3] || el[c3] == 0) &&
          el[c3].toString().replace(/\s\s+/g, "") &&
          (el[c4] || el[c4] == 0) &&
          el[c4].toString().replace(/\s\s+/g, "") &&
          (el[c5] || el[c5] == 0) &&
          el[c5].toString().replace(/\s\s+/g, "") &&
          (el[c6] || el[c6] == 0) &&
          el[c6].toString().replace(/\s\s+/g, "") &&
          (el[c7] || el[c7] == 0) &&
          el[c7].toString().replace(/\s\s+/g, "")
        ) {

          const mtrdata = Object.assign({}, el);
          delete mtrdata[c1];
          delete mtrdata[c6];
          delete mtrdata[c7];
          let mtrarr = Object.values(mtrdata);
          let uniqarr = _.uniq(mtrarr).length;
          if (mtrarr.indexOf(el[c6]) >= 0 && uniqarr === 4) {
            let arr1 = {
              title: el[c1],
              currectoptions: mtrarr.indexOf(el[c6]) + 1,
              marks: req.body.marks || 1,
              questiontype: req.body.questiontype,
              level: el[c7],
              options: [
                {
                  Sno: 1,
                  value: el[c2],
                  ifcorrect: el[c2] == el[c6] ? true : false,
                },
                {
                  Sno: 2,
                  value: el[c3],
                  ifcorrect: el[c3] == el[c6] ? true : false,
                },
                {
                  Sno: 3,
                  value: el[c4],
                  ifcorrect: el[c4] == el[c6] ? true : false,
                },
                {
                  Sno: 4,
                  value: el[c5],
                  ifcorrect: el[c5] == el[c6] ? true : false,
                },
              ],
            };
            reqData.push(arr1);
          } else if (uniqarr < 4) {
            uniqueoption.push(i + 2);
          } else {
            wrongcorrectanswer.push(i + 2);
          }
        } else {
          throw new Error("Some field blank in template");
        }
      }
      if (!uniqueoption.length && !wrongcorrectanswer.length) {

        let [result] = await query(proc.uploadQuestion, [
          JSON.stringify(reqData),
          JSON.stringify(req.body),
        ]);
        if (result && result[0] && result[0].state == 1) {
          return res.json({
            state: 1,
            message: "All question(s) succesfully parsed and uploaded.",
            data: null,
          });
        } else if (result && result[0] && result[0].errorcount > 0) {
          throw new Error(`${result[0].errorcount} Question(s) already exists`);
        } else {
          throw new Error(
            (result && result[0].message) ||
            "Something went wrong! Please try after sometime"
          );
        }
      } else {
        let msg = uniqueoption.length
          ? `Question at row(s) ${uniqueoption.toString()} have duplicate options`
          : `Question at row(s) ${wrongcorrectanswer.toString()} have wrong correct answer`;

        let msg1 =
          uniqueoption.length && wrongcorrectanswer.length
            ? `Question at row(s) ${uniqueoption.toString()} have duplicate options and
                      at row(s) ${wrongcorrectanswer.toString()} have wrong correct answer`
            : msg;
        throw new Error(msg1);
      }
    }
  } catch (err) {
    //console.log("Error:", err);
    return res.json({
      state: -1,
      message: err.message || err,
      data: null,
    });
  }
}

function getQuestionMaster(req, res) {
  if (req.body) {
    var reqData = req.body;
    (reqData.id = req.body.id || "All"), (reqData = JSON.stringify(reqData));
  }
  commonModel.mysqlModelService(proc.dashboardproc, [reqData], function (
    err,
    results
  ) {
    if (err) {
      res.json({
        state: -1,
        message: err,
        data: null,
      });
    } else if (results) {
      res.json({
        state: 1,
        message: "Success",
        data: results,
      });
    }
  });
}

function getQuescount(req, res) {
  var obj = "";
  dbService.query(
    "SELECT COUNT(id) quescount FROM mstassessmentquestion where isactive=1",
    [obj],
    function (err, results) {
      if (err) {
        res.json({
          state: -1,
          message: err,
          data: null,
        });
      }
      res.json({
        state: 1,
        message: "Success",
        data: results,
      });
    }
  );
}

async function saveQuestionData(req, res) {
  try {
    let obj = req.body && req.body.questionData;
    const title = req.body.title;
    obj.createdby = req.body.tokenFetchedData.id;
    const procToCall = req.body.questionData.id
      ? proc.editbatchproc
      : proc.savebatchproc;
    const [results] = await query(procToCall, [JSON.stringify(obj), title]);
    const dbres = results && results[0];
    if (dbres && dbres.state == 1) {
      return res.json({
        state: 1,
        message: "success",
        data: results,
      });
    } else {
      throw new Error(dbres.message || "Failed! Please try after sometimes !");
    }
  } catch (err) {
    return res.json({
      state: -1,
      message: (err && err.message) || err,
      data: null,
    });
  }
}

function getMastersForTest(req, res) {
  var body = req.body;
  var obj = JSON.stringify(body);
  commonModel.mysqlModelService(
    "call usp_trxonlinecandidate_view(?)",
    [obj],
    function (err, results) {
      if (err) {
        res.json({
          state: -1,
          message: err,
          data: null,
        });
      }
      res.json({
        state: 1,
        message: "Success",
        data: results,
      });
    }
  );
}

function changeQuestionStatus(req, res) {
  if (req && req.body) {
    var reqData = req.body;
    reqData = JSON.stringify(reqData);
    commonModel.mysqlModelService(proc.editbatchproc, [reqData, ""], function (
      err,
      results
    ) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
          data: null,
        });
      } else if (results) {
        return res.json({
          state: 1,
          message: "success",
          data: results[0],
        });
      }
    });
  } else {
    return res.json({
      state: -1,
      message: "Invalid Request",
      data: null,
    });
  }
}

function changeStatus(req, res) {
  var dataobj = req.body && req.body.obj.id;
  dataobj = dataobj && dataobj.split(",");
  dataobj = _.map(dataobj, function (item) {
    return {
      id: item,
      createdby: req.body.tokenFetchedData.id,
    };
  });
  var obj = JSON.stringify(dataobj);
  var action = req.body.action;
  // //console.log('[obj,action]..................', [obj, action]);
  commonModel.mysqlModelService(
    "call usp_trxmassupdate_edit(?,?)",
    [obj, action],
    function (err, results) {
      if (err) {
        res.json({
          state: -1,
          message: err,
          data: null,
        });
      }
      res.json({
        state: 1,
        message: "Success",
        data: results,
      });
    }
  );
}
