const proc = require("../../../common/procedureConfig");
const query = require("../../../common/Model").mysqlPromiseModelService;
const commonModel = require("../../../common/Model")
const _ = require('lodash');
const utils = require("../../../common/utils");

module.exports = {
  questionsForTest: questionsForTest,
  answercapture: answercapture,
  answerCaptureLateral
};

async function questionsForTest(req, res) {
  try {
    if (req && req.body && req.body.id) {
      const obj = {
        ...req.body,
        action: "questions",
      };
      await utils.removeFalseyLike(obj)
      const re = await query(proc.bachcheckproc, [ JSON.stringify(obj)]);
      const state = re && re[2] && re[2][0] && re[2][0].state
      const response = {
        state: 1,
        message: "Success",
        data: re,
      };
      const [r1, r2] = re;
      if (state == 2) {
        let sdata = [];
        const gdata = _.groupBy(r1, 'questiontype');

        _.each(r2, item => {
          if ((item.easy_question_count + item.medium_question_count + item.hard_question_count) > 0) {

            let easyQuestionArray =
              _.chain(gdata[item.sectionid])
                .filter({ difficultylevel: 'Easy' })
                .slice(0, item.easy_question_count)
                .value();

            let mediumQuestionArray =
              _.chain(gdata[item.sectionid])
                .filter({ difficultylevel: 'Medium' })
                .slice(0, item.medium_question_count)
                .value();

            let hardQuestionArray =
              _.chain(gdata[item.sectionid])
                .filter({ difficultylevel: 'Hard' })
                .slice(0, item.hard_question_count)
                .value();
            sdata = [...sdata, ...easyQuestionArray, ...mediumQuestionArray, ...hardQuestionArray]
          } else {
            sdata = [...sdata, ...gdata[item.sectionid].slice(0, item.totalquestion)];
          }
        });
        response['data'] = [_.shuffle(sdata)];
        return res.json(response)
      } else {
        return res.json(response)
      }
    }
  } catch (err) {
    res.json({
      state: -1,
      message: err.message || err,
      data: null,
    });
  }
}

function answercapture(req, res) {
  if (req && req.body) {
    var obj = JSON.stringify(req.body);
    commonModel.mysqlModelService(
      "call usp_trxonlinecandidate_add(?)",
      [obj],
      function (err, results) {
        if (err) {
          res.json({
            state: -1,
            message: err,
            data: null,
          });
        } else {
          res.json({
            state: 1,
            message: "Success",
            data: null,
          });
        }
      }
    );
  } else {
    res.json({
      state: -1,
      message: "Invalid Request",
      data: null,
    });
  }
}
function answerCaptureLateral(req, res) {
  if (req && req.body) {
    var obj = JSON.stringify(req.body);
    commonModel.mysqlModelService(
      "call usp_lateral_candidate_response(?)",
      [obj],
      function (err, results) {
        if (err) {
          res.json({
            state: -1,
            message: err,
            data: null,
          });
        } else {
          res.json({
            state: 1,
            message: "Success",
            data: null,
          });
        }
      }
    );
  } else {
    res.json({
      state: -1,
      message: "Invalid Request",
      data: null,
    });
  }
}

