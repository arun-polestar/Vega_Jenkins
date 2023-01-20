const commonModel = require('../common/Model');
const commonHttpReq = require('../../routes/superAdmin/Controller')
var _ = require('underscore');
module.exports = {
  getAdhocReport: getAdhocReport,
  expenseAdhocReport: expenseAdhocReport,
  moodScoreReport: moodScoreReport,
  readReactionComment,
  getMoodPercentagemaster,
  getmooddata,
  getBasicReport: getBasicReport,
  getOpeningLeaveBalance: getOpeningLeaveBalance,
  getMonthlyWP
}


function getAdhocReport(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null })
  }
  else {
    var obj = JSON.stringify(req.body);
    commonModel.mysqlPromiseModelService('call usp_adhoc_report_operations(?)', [obj])
      .then(results => {
        if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
          return res.json({ "state": 1, message: "success", "data": results[0] });
        } else {
          return res.json({ state: -1, message: "Something went wrong", data: null });
        }
      })
      .catch(err => {
        return res.json({ state: -1, data: null, message: err.message || err });
      })
  }
}

function expenseAdhocReport(req, res) {

  if (!req.body || !req.body.createdby || !req.body.action) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  //console.log(req.body)
  req.body.mod = "ExpenseUserRoles"
  var obj = JSON.stringify(req.body);
  // var obj = {
  //     mod: "ExpenseUserRoles",
  //     createdby: req.body.createdby,
  //     action:req.body.action
  // }

  // let obj = req.body;
  // obj = JSON.stringify(obj);
  commonModel.mysqlPromiseModelService('call usp_allreports_operations(?)', [obj])
    .then(result => {

      return res.json({ message: 'success', data: result[0], state: 1 });
    })
    .catch(err => {
      res.json({ message: err, data: err, state: -1 });
    })
}
function moodScoreReport(req, res) {
  //console.log("here", req.body)
  if (!req.body || !req.body.createdby || !req.body.action) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  else {
    var obj = JSON.stringify(req.body);
    commonModel.mysqlPromiseModelService('call usp_moodscore_analysis(?)', [obj])
      .then(results => {//console.log("res",results)

        if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
          return res.json({ "state": 1, message: "success", currentweek: results[1][0].currentweek, "data": results[0] });
        } else {
          return res.json({ state: -1, message: "Something went wrong", data: null });
        }
      })
      .catch(err => {
        return res.json({ state: -1, data: null, message: err.message || err });
      })
  }
}

function readReactionComment(req, res) {
  //"readreactioncomment"

  if (!req.body || !req.body.createdby || !req.body.action || !req.body.id) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  else {
    var obj = JSON.stringify(req.body);
    commonModel.mysqlPromiseModelService('call usp_moodscore_analysis(?)', [obj])
      .then(results => {

        if (results && results[0] && results[0][0] && results[0][0].state && results[0][0].state == 1) {
          return res.json({ "state": 1, message: "success" });
        } else {
          return res.json({ state: -1, message: "Something went wrong", data: null });
        }
      })
      .catch(err => {
        return res.json({ state: -1, data: null, message: err.message || err });
      })
  }
}
async function getMoodPercentagemaster(req, res) {
  if (!req.body || !req.body.createdby) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  else {
    var options = {
      method: 'POST',
      rejectUnauthorized: false
    }
    var alldata = [];
    var obj = { cronjob: 1 };
    obj.configcode = "moodpercentage";
    var errmessage = "Failed"
    obj = JSON.stringify(obj);

    var data = JSON.stringify(
      {
        configcode: "moodpercentage",
        iscronjob: 1
      }
    )
    options.data = data
    options.path = '/getmastersforcron';
    let headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
    options.headers = headers;
    var masterdata = []
    var data = await commonHttpReq.commonfunc(options).then(result => result).catch(err => {
      errmessage = err;
      return null
    })
    var masterdata = [data && data.data]
    if (masterdata) {
      return res.json({ "state": 1, message: "success", data: masterdata });
    } else {
      return res.json({ state: -1, message: "Something went wrong", data: null });
    }


  }
}

async function getmooddata() {
  var options = {
    method: 'POST',
    rejectUnauthorized: false
  }
  var obj = { cronjob: 1 };
  obj.configcode = "moodpercentage";
  var errmessage = "Failed"
  obj = JSON.stringify(obj);

  var data = JSON.stringify(
    {
      configcode: "moodpercentage",
      iscronjob: 1
    }
  )
  options.data = data
  options.path = '/getmastersforcron';
  let headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
  options.headers = headers;
  var masterdata = []
  var data = await commonHttpReq.commonfunc(options).then(result => result).catch(err => {
    errmessage = err;
    return null
  })
  var masterdata = [data && data.data]
  if (masterdata) {
    _.each(masterdata[0], (item) => {
      item.configvalue3 = "category" + (item.configvalue3)
    })
    var groupedData = _.groupBy(masterdata[0], 'configvalue3');
    //console.log(groupedData)
    // groupedData.replace(/\'/gi, '')
    var obj = JSON.stringify(groupedData);
    commonModel.mysqlPromiseModelService('call usp_reactiondata_update(?)', [obj])
      .then(results => {
        //console.log("res", results)
      })
      .catch(err => {
        //console.log(err)

      })
  } else {
    //console.log("Master data of mood percentage not retrieved")
  }
}
function getBasicReport(req, res) {
  if (!req.body || !req.body.createdby || !req.body.action) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  var obj = JSON.stringify(req.body);
  commonModel.mysqlPromiseModelService('call usp_reports_view(?)', [obj])
    .then(result => {
      return res.json({ message: 'success', data: result[0], state: 1 });
    })
    .catch(err => {
      res.json({ message: err, data: err, state: -1 });
    })
}
function getOpeningLeaveBalance(req, res) {
  if (!req.body || !req.body.createdby || !req.body.action) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  var obj = JSON.stringify(req.body);
  commonModel.mysqlPromiseModelService('call usp_reports_view(?)', [obj])
    .then(result => {
      return res.json({ message: 'success', data: result, state: 1 });
    })
    .catch(err => {
      res.json({ message: err, data: err, state: -1 });
    })
}
function getMonthlyWP(req, res) {
  if (!req.body || !req.body.createdby || !req.body.action) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  var obj = JSON.stringify(req.body);
  commonModel.mysqlPromiseModelService('call usp_reports_view(?)', [obj])
    .then(result => {
      return res.json({ message: 'success', data: result, state: 1 });
    })
    .catch(err => {
      res.json({ message: err, data: err, state: -1 });
    })
}