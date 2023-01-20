const commonModel = require('../../../routes/common/Model');
const commonCtrl = require('../../../routes/common/Controller');
const _ = require('underscore');

module.exports = {
  getClientContacts: getClientContacts,
  clientContactOperations: clientContactOperations,
  getExistingClients: getExistingClients,
  addClient: addClient,
  viewclient: viewclient,
  viewprojecttree: viewprojecttree,
  clientOperation: clientOperation
}

async function addClient(req, res) {
  if (!req.body.createdby || !req.body.reqtype) {
    return res.json({ state: -1, message: "Send required data" });
  }
  else {
    var obj = req.body;
    obj = await commonCtrl.verifyNull(obj);
    obj = JSON.stringify(obj);
    commonModel.mysqlModelService('call usp_mstclient_operations(?)', [obj], function (err, results) {
      if (err) {
        return res.json({ state: -1, message: err, data: null });
      }
      // } else if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == -1) {
      //     return res.json({ state: results[1][0].state, message: results[1][0].message, data: null });
      // }
      else if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
        return res.json({ state: 1, message: "Success", data: results });
      } else {
        return res.json({ state: -1, message: "Something went Wrong", data: null });
      }
    });
  }
}

function clientOperation(req, res) {
  if (!req.body.createdby || !req.body.reqtype) {
    return res.json({ state: -1, message: "Send required data" });
  }
  else {
    var obj = req.body;
    obj.org_structure = req.body.org_structure ? JSON.parse(req.body.org_structure) : null
    obj = JSON.stringify(obj);
    commonModel.mysqlModelService('call usp_mstclient_operations(?)', [obj], function (err, results) {
      if (err) {
        return res.json({ state: -1, message: err, data: null });
      }
      else if (results && results[0] && results[0][0] && results[0][0].state && results[0][0].state == 1) {
        return res.json({ state: 1, message: "Success", data: results });
      } else {
        return res.json({ state: -1, message: "Something went Wrong", data: null });
      }
    });
  }
}

function viewclient(req, res) {
  if (!req.body.createdby || !req.body.selectedClient || !req.body.reqtype) {
    return res.json({ state: -1, message: "Send required data" });
  }
  var obj = req.body;
  commonModel.mysqlModelService('call usp_mstclient_operations(?)', [JSON.stringify(obj)], function (err, results) {
    if (err) {
      return res.json({ state: -1, message: err, data: null });
    } else if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
      return res.json({ state: results[1][0].state, message: results[1][0].message, data: results });
    } else {
      return res.json({ state: -1, message: "somethng went wrong", data: null });
    }
  });
}

async function viewprojecttree(req, res) {
  if (!req.body.createdby || !req.body.reqtype) {
    return res.json({ state: -1, message: "Send required data" });
  }
  var obj = req.body;
  delete obj.columns;
  obj = _.mapObject(obj, function (val, key) {
    if (val && val.constructor === Array) {
      val = val.toString();
    }
    return val;
  });
  obj = await commonCtrl.verifyNull(obj);
  commonModel.mysqlModelService('call usp_mstprojecttree_view(?)', [JSON.stringify(obj)], function (err, results) {
    if (err) {
      return res.json({ state: -1, message: err, data: null });
    } else {
      var dbresult = commonCtrl.lazyLoading(results[0], req.body);
      if (dbresult && "data" in dbresult && "count" in dbresult) {
        //console.log('QQQQQQQQQQQQQQQQQQQ',results[1][0].pendingcount);
        return res.json({
          "state": 1, message: "success", pendingcount: results && results[1] && results[1][0].pendingcount,
          rejectedcount: results && results[1] && results[1][0].rejectedcount, "data": dbresult.data, "count": dbresult.count
        });
      } else {
        return res.json({ "state": -1, "message": "No Lazy Data" });
      }
    }
  });
}


function getClientContacts(req, res) {
  if (!req.body.createdby) {
    return res.json({ state: 0, message: "Authentication Error" });
  }
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService('call usp_mstcontact_view(?)', [obj], function (err, results) {
    if (err) {
      return res.json({ state: -1, message: err, data: null });
    }
    return res.json({ state: 1, message: "Success", data: results[0][0] });
  });
}

function clientContactOperations(req, res) {
  if (!req.body.createdby) {
    return res.json({ state: 0, message: "Authentication Error" });
  }
  var obj = req.body;
  obj = JSON.stringify(obj);
  commonModel.mysqlModelService('call usp_mstcontact_operations(?)', [obj], function (err, results) {
    if (err) {
      return res.json({ state: -1, message: err, data: null });
    }
    return res.json({ state: 1, message: "Success", data: results[0][0] });
  });
}


function getExistingClients(req, res) {
  if (!req.body.createdby) {
    return res.json({ state: 0, message: "Authentication Error" });
  }
  var obj = req.body;
  obj.reqtype = 'existingclients';
  commonModel.mysqlModelService('call usp_mstclient_view(?)', [JSON.stringify(obj)], function (err, results) {
    if (err) {
      return res.json({ state: -1, message: err, data: null });
    }
    return res.json({ state: 1, message: "Success", data: results[0] });
  });
}




