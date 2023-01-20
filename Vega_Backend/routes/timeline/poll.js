/**
 * TimelinePollController
 */

const commonModel = require('../common/Model');
const commonUtils = require("../../lib/common");




module.exports = {
  createPoll,
  voteForPoll,
  fetchPoll,
  actionOnPendingPoll,
  fetchPollVoters,
  userPollCreationAccess,
  deletePoll,
  pushNotificationsForModules,
  editPoll,
};




function createPoll(req, res) {
  try {
    req.body.action = 'create_poll';
    let obj = JSON.stringify(req.body);
    //console.log(obj, "--Poll----request----------------");

    commonModel.mysqlModelService('call usp_trxtimeline_poll(?)', [obj], function (err, results) {
      //console.log(results, "Poll----resultrsss");
      if (err) {
        return res.json({ state: -1, message: err, data: null });
      }
      return res.json({ state: 1, message: "Success", data: results[0] });
    });
  } catch (error) {
    throw error;
  }
}


function voteForPoll(req, res) {
  req.body.action = 'check_poll_status';
  let obj = JSON.stringify(req.body);
  //console.log(obj, "--vote for ---Poll----request----------------");

  commonModel.mysqlPromiseModelService('call usp_trxtimeline_poll(?)', [obj])
    .then(results => {
      //console.log(results, "Poll----resultrsss");
      if (results && results[0] && results[0][0] && results[0][0].id) {
        req.body.action = 'vote_for_poll';
        let obj2 = JSON.stringify(req.body);
        commonModel.mysqlPromiseModelService('call usp_trxtimeline_poll(?)', [obj2])
          .then(results => {
            return res.json({ state: 1, message: "Success", data: results[0] });
          })

      }
      else
        return res.json({ state: 1, message: "Poll is not open for voting", data: results[0] });
    })
    .catch(error => {
      return res.json({ state: -1, message: err, data: null });
      // throw error;
    })
}

function fetchPoll(req, res) {
  try {
    req.body.action = 'fetch_poll';
    let obj = JSON.stringify(req.body);
    //console.log(obj, "--fetch --Poll----request----------------");

    commonModel.mysqlModelService('call usp_trxtimeline_poll(?)', [obj], function (err, results) {
      if (err) {
        return res.json({ state: -1, message: err, data: null });
      }
      return res.json({ state: 1, message: "Success", data: results[0] });
    });
  } catch (error) {
    throw error;
  }
}

function actionOnPendingPoll(req, res) {
  try {

    req.body.action = 'action_on_pending_poll'
    let obj = JSON.stringify(req.body);
    //console.log(obj, "request----------");

    commonModel.mysqlModelService('call usp_trxtimeline_poll(?)', [obj], function (err, results) {
      if (err) {
        return res.json({ state: -1, message: err, data: null });
      }
      return res.json({ state: 1, message: "Success", data: results[0] });
    });
  } catch (error) {
    throw error;
  }
}

function fetchPollVoters(req, res) {
  try {
    req.body.action = 'fetch_poll_voters'
    let obj = JSON.stringify(req.body);
    //console.log(obj, "request----------");

    commonModel.mysqlModelService('call usp_trxtimeline_poll(?)', [obj], function (err, results) {
      if (err) {
        return res.json({ state: -1, message: err, data: null });
      }
      return res.json({ state: 1, message: "Success", data: results[0] });
    });
  } catch (error) {
    throw error;
  }
}

function userPollCreationAccess(req, res) {
  try {
    let operationType = req.body.operationType
    switch (operationType) {
      case "read":
        req.body.action = 'get_user_poll_creation_access';
        break;
      case "update":
        req.body.action = 'update_user_poll_creation_access';
        break;
      default:
        //console.log("default case");
        break;
    }
    let obj = JSON.stringify(req.body);
    //console.log(obj, "request----------");

    commonModel.mysqlModelService('call usp_trxtimeline_poll(?)', [obj], function (err, results) {
      if (err) {
        return res.json({ state: -1, message: err, data: null });
      }
      return res.json({ state: 1, message: "Success", data: results[0] });
    });
  } catch (error) {
    throw error;
  }
}


function deletePoll(req, res) {
  try {
    req.body.action = 'delete_poll';
    let obj = JSON.stringify(req.body);
    //console.log(obj, "request----------------");
    commonModel.mysqlModelService('call usp_trxtimeline_poll(?)', [obj], function (err, results) {
      if (err) {
        return res.json({ state: -1, message: err, data: null });
      }
      //console.log(results, "results--------------------------------");
      return res.json({ state: 1, message: "Success", data: results[0] });
    });
  } catch (error) {
    throw error;
  }
}

async function pushNotificationsForModules(data) {
  return new Promise((resolve, reject) => {
    let obj = JSON.stringify(data);
    //console.log(obj, "Action ---request--push --notification--------------");
    commonModel.mysqlModelService('call usp_trxnotification_add(?)', [obj], function (err, results) {
      if (err) {
        reject(err);
      }
      // let final_data1 = JSON.parse(JSON.stringify(results[0]));
      resolve(results && results[0]);
    });
  })
}

function editPoll(req, res) {
  try {
    req.body.action = 'edit_poll';
    let obj = JSON.stringify(req.body);
    //console.log(obj, "request----------------");
    commonModel.mysqlModelService('call usp_trxtimeline_poll(?)', [obj], function (err, results) {
      if (err) {
        return res.json({ state: -1, message: err, data: null });
      }
      //console.log(results, "results--------------------------------");
      return res.json({ state: 1, message: "Success", data: results[0] });
    });
  } catch (error) {
    throw error;
  }
}
