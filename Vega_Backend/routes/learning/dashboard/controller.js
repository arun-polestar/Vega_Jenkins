const commonModel = require('../../common/Model');


module.exports = {
  getDashboardData: getDashboardData,
  getDashboardDataAdhock: getDashboardDataAdhock,
  getCalendarData: getCalendarData,
  getLearningAnalyticsData: getLearningAnalyticsData
}

function getDashboardData(req, res) {
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService('call usp_learning_trx_view(?)', [obj], function (err, result) {
    if (err) {
      return res.json({
        "state": -1,
        err: err,
        "message": "Database Error"
      });
    }
    return res.json({ "state": 1, "message": "success", data: result });

  });
}

function getDashboardDataAdhock(req, res) {
  req.body.action = 'adhock'
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService('call usp_learning_trx_view(?)', [obj], function (err, result) {
    if (err) {
      return res.json({
        "state": -1,
        err: err,
        "message": "Database Error"
      });
    }
    return res.json({ "state": 1, "message": "success", data: result });

  });
}

function getCalendarData(req, res) {
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService('call usp_learning_trxtrainingmodule_view(?)', [obj], function (err, results) {
    if (err) {
      return res.json({
        "state": -1,
        "message": "Something went wrong with Database",
        "err": err
      })
    }
    return res.json({
      "state": 1,
      "message": "success",
      data: results
    })
  });
}

function getLearningAnalyticsData(req, res) {
  var obj = req.body;
  if (!req.body || !req.body.reqtype) {
    return res.json({
      "state": -1,
      "message": "Required Parameters missing."
    })
  }
  req.body.departmentid = req.body && req.body.departmentid && req.body.departmentid.toString();
  req.body.locationid = req.body && req.body.locationid && req.body.locationid.toString();
  req.body.designationid = req.body && req.body.designationid && req.body.designationid.toString();
  //console.log('reqq dashboard', req.body)
  commonModel.mysqlModelService('call usp_learning_dashboard(?)', [JSON.stringify(obj)], (err, result) => {
    if (err) {
      res.json({
        state: -1,
        message: err,
        err: "error occured"
      })
    }
    else {

      res.json({
        state: result && result[1] && result[1][0] && result[1][0].state || 1,
        message: result && result[1] && result[1][0] && result[1][0].message || "success",
        data: result
      })
    }
  })
}
