const commonModel = require('../../common/Model');
const mailservice = require('../../../services/mailerService')
const commonCtrl = require('../../../routes/common/Controller');


const _ = require('underscore');

module.exports = {
  addProject: addProject,
  getExistingProject: getExistingProject,
  addbooklevel: addbooklevel,
  getmoduleuser: getmoduleuser,
  projectreport: projectreport,
  wbsallot: wbsallot,
  selfassignwbs: selfassignwbs,
  projectview: projectview
}
async function addProject(req, res) {
  if (!req.body.createdby || !req.body.reqtype) {
    return res.json({
      state: -1,
      message: "Send required data"
    });
  } else {
    req.body = _.mapObject(req.body, function (val, key) {
      if (val && val.constructor === Array) {
        val = val.toString();
      }
      return val;
    })
    var obj = req.body;
    obj.org_structure = req.body.org_structure ? JSON.parse(req.body.org_structure) : null;
    obj = await commonCtrl.verifyNull(obj);
    obj = JSON.stringify(obj);
    commonModel.mysqlModelService('call usp_mstproject_operations(?)', [obj], function (err, results) {
      if (err) {
        return res.json({
          state: -1,
          message: err.message || err
        });
      } else if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == -1) {
        return res.json({
          state: results[1][0].state,
          message: results[1][0].message,
          data: null
        });
      } else if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
        res.json({
          state: results[1][0].state,
          message: 'Success',
          data: results
        });
        if (results && results[0] && results[0][0] && results[0][0].role && results[0][0].role == 'User' && req.body && req.body.reqtype == 'add') {

          var typemail = 'projectapproval';
          var subjecttype = "<Project for Approval>";
          var headingtype = "Project for Approval";

          if (results && results[0] && results[0][0] && results[0][0].emailid && results[0][0].emailid) {
            let emailObj = {
              cc: results[0][0].emailid || " ",
              mailType: typemail,
              subjectVariables: {
                subject: subjecttype
              },
              headingVariables: {
                heading: headingtype
              },

              bodyVariables: {
                username: results && results[0] && results[0][0].username || '',
                // feedbackdescription: req.body.feedbackdescription,
                // employeename: results && results[0] && results[0][0].employeename || '',
              }
            }
            mailservice.mail(emailObj, function (err) {
              if (err) {
                //console.log("MAILLLLLLLLLLL", err);
              }
            });
          }
        }

      } else {
        return res.json({
          state: -1,
          message: "Something went wrong"
        });
      }
    });
  }
}


function getExistingProject(req, res) {
  if (!req.body.createdby || !req.body.reqtype) {
    return res.json({
      state: -1,
      message: "send reruired date"
    });
  }
  var obj = req.body;
  commonModel.mysqlModelService('call usp_mstproject_operations(?)', [JSON.stringify(obj)], function (err, results) {
    if (err) {
      return res.json({
        state: -1,
        message: err,
        data: null
      });
    }
    return res.json({
      state: 1,
      message: "Success",
      data: results[0]
    });
  });
}


async function addbooklevel(req, res) {
  if (!req.body.createdby || !req.body.reqtype) {
    return res.json({
      state: -1,
      message: "send reruired date"
    });
  }
  let obj = req.body.teamData;
  obj = JSON.stringify(obj);
  let obj1 = {
    createdby: req.body.createdby,
    reqtype: req.body && req.body.reqtype,
    assigntoall: req.body && req.body.assigntoall,
    wbsheaderid: req.body && req.body.wbsheaderid,
    projectheaderid: req.body && req.body.projectheaderid,
    wbsType: req.body && req.body.wbsType,
    ifmindate: req.body && req.body.ifmindate,
    ifmaxdate: req.body && req.body.ifmaxdate,
    effortUnit: req.body && req.body.effortUnit,
    effortValue: req.body && req.body.effortValue,
    maxdate: req.body && req.body.maxdate,
    mindate: req.body && req.body.mindate,
    baselineEffort: req.body && req.body.baselineEffort,

  };
  obj1 = await commonCtrl.verifyNull(obj1);
  obj1 = JSON.stringify(obj1);
  commonModel.mysqlModelService('call usp_mstproject_booklevel(?,?)', [obj, obj1], function (err, results) {
    if (err) {
      return res.json({
        state: -1,
        message: err,
        data: null
      });
    } else if (results && results[0] && results[0][0] && results[0][0].state && results[0][0].state == 1) {
      return res.json({
        state: results[0][0].state,
        message: results[0][0].message,
        data: results
      });
    } else {
      return res.json({
        state: -1,
        message: "somethng went wrong",
        data: null
      });
    }
  });
}

function getmoduleuser(req, res) {
  if (!req.body.createdby || !req.body.moduleid) {
    return res.json({
      state: 0,
      message: "send reruired date"
    });
  }
  var obj = req.body;
  commonModel.mysqlModelService('call usp_mstproject_operations(?)', [JSON.stringify(obj)], function (err, results) {
    if (err) {
      return res.json({
        state: -1,
        message: err,
        data: null
      });
    }
    return res.json({
      state: 1,
      message: "Success",
      data: results[0]
    });
  });
}




function projectreport(req, res) {
  if (!req.body.reqtype) {
    return res.json({
      message: "Send required data",
      state: -1
    })
  }
  let obj = JSON.stringify(req.body);
  commonModel.mysqlPromiseModelService('call usp_mstproject_operations(?)', [obj])
    .then(results => {
      return res.json({
        state: 1,
        message: "Success",
        data: results
      });
    })
    .catch(err => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err
      });
    })
}


function wbsallot() {
  try {
    commonModel.mysqlModelService('call usp_mstproject_operations(?)', [JSON.stringify({
      reqtype: 'wbsallot'
    })],
      function (err, results) {
        if (err) {
          //console.log('ERRRRRR', err.message || err)
        } else {
          //console.log("success")
        }
      });
  } catch (e) {
    //console.log('ERRRRRR', e.message || e)
  }
}





function selfassignwbs(req, res) {
  if (!req.body.createdby || !req.body.reqtype) {
    return res.json({
      message: "Send required data",
      state: -1
    })
  }
  let obj = JSON.stringify(req.body);
  commonModel.mysqlPromiseModelService('call usp_mstproject_operations(?)', [obj])
    .then(results => {
      return res.json({
        state: 1,
        message: "Success",
        data: results
      });
    })
    .catch(err => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err
      });
    })
}

function projectview(req, res) {
  if (!req.body.createdby || !req.body.reqtype) {
    return res.json({
      message: "Send required data",
      state: -1
    })
  }
  let obj = JSON.stringify(req.body);
  commonModel.mysqlPromiseModelService('call usp_mstproject_operations(?)', [obj])
    .then(results => {
      return res.json({
        state: 1,
        message: "Success",
        data: results[0]
      });
    })
    .catch(err => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err
      });
    })
}