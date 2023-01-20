const proc = require('../../../common/procedureConfig')
const commonModel = require('../../../common/Model');
const commonCtrl = require('../../../common/Controller');
const _ = require('underscore');
const rdb = require('../../../../redisconnect');
const query = require('../../../common/Model').mysqlPromiseModelService

module.exports = {
  getDashboardData: getDashboardData,
  updateprocess: updateprocess,
  getAnswerdetails: getAnswerdetails,
  getResponseSheetLateral,
  sectionWiseScoreDashboard

}

function getDashboardData(req, res) {
  if (!req.body.createdby) {
    return res.json({
      "state": 0,
      "message": 'Not a valid user'
    });
  }
  if (req && req.body) {
    var reqData = req.body;
    reqData = JSON.stringify(reqData);
    commonModel.mysqlPromiseModelService(proc.dashboardproc, [reqData]).then(results => {
      // //console.log('mmmmmmmmmmmmmmm', results);
      if (results && results[1] && results[1][0] && results[1][0].state == 1) {
        var lazydata = commonCtrl.lazyLoading(results[0], req.body);
        // //console.log('mmmmmmmmmmmmmmm',lazydata);
        if (lazydata && "data" in lazydata && "count" in lazydata) {
          results[0] = lazydata.data;
          return res.json({
            "state": 1,
            "message": "success",
            "totalcount": lazydata.count,
            "data": results[0]
          });
        } else {
          res.json({
            message: "No Lazy Data",
            data: null,
            state: -1
          })
        }
      }
    }).catch(err => {
      return res.json({
        "state": -1,
        "message": err,
        "data": null
      });
    });
  } else {
    return res.json({
      "state": -1,
      "message": 'Invalid Request',
      "data": null
    });

  }
}

async function sectionWiseScoreDashboard(req, res) {
  try {
    let reqData = req.body;
    reqData.action = 'section_score';
    let [sectionScore, sectionDetail] = await query(proc.dashboardproc, [JSON.stringify(reqData)]);
    let extraKeys = [... new Set(sectionDetail.map(item => item.section))]
    let SectionWiseScore = []
    for (let i = 0; i < sectionScore.length; i++) {
      let element = sectionScore[i];
      let index = SectionWiseScore.findIndex(item => item.candidateid === element.candidateid)
      if (index > -1) {
        SectionWiseScore[index][element.section] = element.score
        SectionWiseScore[index]["total_score"] = SectionWiseScore[index]["total_score"] + element.score
        if (SectionWiseScore[index][`${element.section}_cutoff`] <= +element.score) {
          SectionWiseScore[index][`${element.section}_status`] = 'Qualified'
        }
      } else {
        let obj = JSON.parse(JSON.stringify(element))
        delete obj.section
        delete obj.score
        for (let j = 0; j < sectionDetail.length; j++) {
          let section = sectionDetail[j];
          if (section.batchid === element.batchid) {
            obj[section.section] = 0
            obj[`${section.section}_cutoff`] = +section.cutoff
            obj[`${section.section}_status`] = 'Failed'

          }
        }
        obj[element.section] = element.score
        obj["total_score"] = element.score
        if (obj[`${element.section}_cutoff`] <= +element.score) {
          obj[`${element.section}_status`] = 'Qualified'
        }
        SectionWiseScore.push(obj)
      }
    }

    SectionWiseScore = SectionWiseScore.map(item => {
      item.status = "Qualified"
      for (key in item) {
        if (item[key] === "Failed") {
          item.status = "Failed"
          return item
        }
      }
      return item;
    })
    return res.json({ state: 1, message: 'Success', data: SectionWiseScore, extraKeys })
  } catch (err) {
    console.log(err);
    return res.json({ state: -1, message: "Something went wrong" })
  }


}
//********Api for the actionOperation on frontend */

function updateprocess(req, res) {
  if (req && req.body && req.body.id) {
    var reqData = req.body;
    reqData.id = req.body.id.toString() + ',';
    reqData.schedule = reqData.interviewerid && reqData.action === 'A' ? 1 : 0;
    req.body.schedule = reqData.schedule;
    reqData = JSON.stringify(reqData);
    commonModel.mysqlModelService(proc.editbatchproc, [reqData, ''], function (err, results) {
      const [dbres1, dbres2] = results
      if (err) {
        return res.json({
          "state": -1,
          "message": err,
          "data": null
        });
      } else if ((dbres1 && dbres1[0] && dbres1[0].state === 1) ||
        (dbres2 && dbres2[0] && dbres2[0].state === 1)) {
        //console.log("Data from dataBase Lemonade", results);
        results.pop();      //remove Detail about last executed query
        let responseData = results.pop();
        //Insert candidate record in to redis
        for (let i = 0; i < results.length; i++) {
          if (results[i] && results[i][0]) {
            rdb.setCandidate('candidates', `candidate_${results[i][0].id}`, JSON.stringify(results[i][0]));
          }
        }
        return res.json({
          "state": 1,
          "message": (dbres1[0] && dbres1[0].message) || (dbres2[0] && dbres2[0].message),
          "data": [responseData]
        });
      } else {
        return res.json({
          "state": 1,
          "message": (dbres1[0] && dbres1[0].message) || (dbres2[0] && dbres2[0].message),
          "data": results
        });
      }
    });
  } else {
    return res.json({
      "state": -1,
      "message": 'Invalid Request',
      "data": null
    });
  }
}

function getAnswerdetails(req, res) {
  if (req && req.body) {
    var reqData = req.body;
    reqData = JSON.stringify(reqData);
    ////console.log('zzzzzzzzzzzzzzzzz', reqData);
    commonModel.mysqlModelService(proc.dashboardproc, [reqData], function (err, results) {
      // //console.log('kkkkkmxxxxxxxxxxxxmmmtttrrrr', err, results);
      if (err) {
        return res.json({
          "state": -1,
          "message": err,
          "data": null
        });
      } else if (results && results[1] && results[1][0] && results[1][0].state === 1) {
        return res.json({
          "state": 1,
          "message": "success",
          "data": results && results[0]
        });
      } else {
        return res.json({
          "state": -1,
          "message": "Failed! Please try after sometime",
          "data": null
        });
      }
    });
  } else {
    return res.json({
      "state": -1,
      "message": 'Invalid Request',
      "data": null
    });
  }
}

function getResponseSheetLateral(req, res) {
  if (req && req.body) {
    var reqData = req.body;
    reqData = JSON.stringify(reqData);
    commonModel.mysqlModelService(proc.dashboardproc, [reqData], function (err, results) {
      if (err) {
        return res.json({
          "state": -1,
          "message": err,
          "data": null
        });
      } else if (results && results[2] && results[2][0] && results[2][0].state === 1) {
        return res.json({
          "state": 1,
          "message": "success",
          "data": results && results[0],
          "data_header": results && results[1]
        });
      } else {
        return res.json({
          "state": -1,
          "message": "Failed! Please try after sometime",
          "data": null
        });
      }
    });
  } else {
    return res.json({
      "state": -1,
      "message": 'Invalid Request',
      "data": null
    });
  }
}