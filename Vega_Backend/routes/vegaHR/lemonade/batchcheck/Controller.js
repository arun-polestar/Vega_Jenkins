const proc = require('../../../common/procedureConfig')
const commonModel = require('../../../common/Model');
const _ = require('underscore');

module.exports = {
  validateCandidate: validateCandidate,
}

function validateCandidate(req, res) {
  if (req && req.body) {
    var reqData = req.body;
    reqData = JSON.stringify(reqData);
    commonModel.mysqlModelService(proc.bachcheckproc, [reqData], function (err, results) {
      if (err) {
        //console.log("Validate Error:",err)
        return res.json({
          "state": -1,
          "message": err.Error || "Failed! Please try after some time",
          "data": null
        });
      } else if (results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
        if (req.body.action.toLowerCase() == 'onboardvalidate') {
          return res.json({
            "state": 1,
            "message": "success",
            "data": results[1][0]
          });
        }
        else {
          return res.json({
            "state": 1,
            "message": "success",
            "data": results[0][0]
          });
        }
      } else {
        //console.log("Validate Error:",err,results)
        return res.json({
          state: -1,
          message: results && results[1] && results[1][0] && results[1][0].message || "Invalid Request",
          data: null
        })
      }
    })
  } else {
    return res.json({
      "state": -1,
      "message": "Invalid Request",
      "data": null
    });
  }
}