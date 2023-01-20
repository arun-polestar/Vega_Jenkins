const commonModel = require('../common/Model');
const commonCtrl = require('../common/Controller');
const feedbackController = require("../feedback/Controller");
const query = require("../common/Model").mysqlPromiseModelService;
const mailservice = require("../../services/mailerService");
const _ = require("underscore");

module.exports = {
  addWFHMaster,
  viewWFHMaster,
  applyWFHRequest,
  viewWFHRequest,
  calculateWFHDays,
  getWorkType,
  approveWFHRequest,
  getWFHHistory,
  upcomingWFH,
  getPendingApprovalCounts,
  getNextLevel,
  workPlaceDetails
}


function getNextLevel(currentlevel, approval_structure) {

  for (let i = 0; i < approval_structure.length; i++) {
    let item = approval_structure[i];
    ////console.log(item, " ", i);
    if (item['levelId'] == (currentlevel + 1)) {
      return item;
    }
  }
}

function addWFHMaster(req, res) {

  try {
    let obj = req.body.wfhdata ? req.body.wfhdata : {};
    let obj2 = JSON.parse(JSON.stringify(req.body));
    delete obj2.wfhdata;
    commonModel.mysqlModelService('call usp_WFH_operations(?, ?)', [JSON.stringify(obj), JSON.stringify(obj2)], (err, result) => {
      if (err) {
        return res.json({
          message: err.message || err, state: -1
        })
      }
      else {
        //console.log(result[0]);
        return res.json({
          state: 1,
          message: "success",
          data: result[0]
        })
      }
    })
  }
  catch (err) {
    return res.json({
      message: err.message || err, data: null, state: -1
    })
  }
}


function viewWFHMaster(req, res) {
  if (!req.body) {
    return res.json({
      message: "Send required data",
      state: -1
    })
  }
  let obj = JSON.stringify(req.body);
  commonModel.mysqlPromiseModelService('call usp_WFH_view(?)', [obj])
    .then(results => {
      // var dbresult = commonCtrl.lazyLoading(results[0], req.body);
      // if (dbresult && "data" in dbresult && "count" in dbresult) {
      //   //console.log(dbresult.data, "daaaaaaaataaaaaaaaaaaaaa");
      return res.json({
        "state": 1,
        message: "success",
        "data": results[0],
        // "count": dbresult.count
      });
      // } else {
      //   return res.json({
      //     state: -1,
      //     message: "Something went wrong",
      //     data: null
      //   });
      // }
    })
    .catch(err => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err
      });
    })
}


async function applyWFHRequest(req, res) {

  try {
    let obj = {};
    let obj2 = JSON.parse(JSON.stringify(req.body));
    let obj3 = JSON.parse(JSON.stringify(req.body));
    obj3.action = 'getapprovalstructure'
    let [approvalData] = await query('call usp_WFH_view(?)', [JSON.stringify(obj3)]);
    obj2.offdates = obj2.offdates && obj2.offdates.split(",");
    obj2.holidaydates = obj2.holidaydates && obj2.holidaydates.split(",");
    obj2.weekoffdates = obj2.weekoffdates && obj2.weekoffdates.split(",");
    obj2.dates = [];
    _.each(obj2.offdates, function (item) {
      if (
        !(
          _.indexOf(obj2.holidaydates, item) > -1 ||
          _.indexOf(obj2.weekoffdates, item) > -1
        )
      )
        obj2.dates.push(item);
    });
    if (obj2.dates) obj2.dates = obj2.dates.toString();
    let approval_structure = approvalData[0] && approvalData[0]['approval_structure'] && JSON.parse(approvalData[0]['approval_structure']);
    let returnedItem = approval_structure && getNextLevel(0, approval_structure)
    if (returnedItem) {
      obj2 = { ...obj2, ...returnedItem, isapproval: 1, approval_structure: approval_structure }
    }
    else {
      obj2.isapproval = 0;
    }
    commonModel.mysqlModelService('call usp_WFH_operations(?, ?)', [JSON.stringify(obj), JSON.stringify(obj2)], (err, result) => {
      if (err) {
        return res.json({
          message: err.message || err, state: -1
        })
      }
      else {
        //console.log(result[0], "applieddddddd");
        let wfhParam = result && result[0] && result[0][0];
        let moduleid = req.body.moduleid ? req.body.moduleid : "Attendance";
        let trxwfhlevel = (wfhParam.isapproval && wfhParam.isapproval == 1) ? 1 : "Self-approval";
        let fdate = req.body.fromdate.split(" ")[0];
        let tdate = req.body.todate.split(" ")[0];

        var mailOptions = {
          email: wfhParam && wfhParam.trxempsupervisoremail,
          cc: (req.body.notifyto && req.body.notifyto.toString()) || "",
          moduleid: moduleid,
          userid: req.body.tokenFetchedData && req.body.tokenFetchedData.id,
          //email: 'avinash.kumar@polestarllp.com',
          mailType: "applyworkplace",
          moduleid: moduleid,
          banner: "",
          subjectVariables: {
            wfhType: wfhParam.trxempworktypename,
            requestByName:
              req.body.tokenFetchedData.firstname +
              " " +
              req.body.tokenFetchedData.lastname,
            subject: `Request for ${wfhParam.trxempworktypename} by ${req.body.tokenFetchedData.firstname + " " +
              req.body.tokenFetchedData.lastname}`,
          },
          headingVariables: { heading: "Workplace Application" },
          bodyVariables: {
            trxempname:
              req.body.tokenFetchedData.firstname +
              " " +
              req.body.tokenFetchedData.lastname,
            trxwfhtype: wfhParam.trxempworktypename,
            trxempemail: wfhParam && wfhParam.trxempemail,
            trxwfhfromdt: moment(fdate, "YYYY-MM-DD").format(
              "DD MMMM YYYY"
            ), //moment(req.body.fromdate).format('DD-MM-YYYY'),
            trxwfhtodt: moment(tdate, "YYYY-MM-DD").format(
              "DD MMMM YYYY"
            ), //moment(req.body.todate).format('DD-MM-YYYY'),
            trxwfhreason: req.body.reason || "",
            trxwfhlevel: trxwfhlevel,
            to_approver: wfhParam.to_approver,
            trxempsupervisor: wfhParam && wfhParam.trxempsupervisor,
            trxwfhdays: wfhParam && wfhParam.trxwfhdays,
            trxwfhtotalapplied: wfhParam && wfhParam.trxwfhtotalapplied,
            trxwfhtotalapproved: wfhParam && wfhParam.trxwfhtotalapproved
          },
        };
        //console.log(mailOptions, "mailoptionssssssssssss");

        mailservice.mail(mailOptions, function (err, response) {
          if (err) {
            //console.log("Mail not sent!", err);
          } else {
            //console.log("Mail sent successfully!");
          }
        });

        return res.json({
          state: 1,
          message: "success",
          data: result[0]
        })
      }
    })

  }
  catch (err) {
    return res.json({
      message: err.message, data: null, state: -1
    })
  }
}



function viewWFHRequest(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1
    })
  }
  let obj = JSON.stringify(req.body);
  commonModel.mysqlPromiseModelService('call usp_WFH_view(?)', [obj])
    .then(results => {
      var dbresult = commonCtrl.lazyLoading(results[0], req.body);
      if (dbresult && "data" in dbresult && "count" in dbresult) {
        ////console.log(dbresult.data, "daaaaaaaataaaaaaaaaaaaaa");
        return res.json({
          "state": 1,
          message: "success",
          "data": dbresult.data,
          "count": dbresult.count
        });
      } else {
        return res.json({
          state: -1,
          message: "Something went wrong",
          data: null
        });
      }
    })
    .catch(err => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err
      });
    })
}


function calculateWFHDays(req, res) {

  try {
    let obj = {};
    let obj2 = JSON.parse(JSON.stringify(req.body));

    commonModel.mysqlModelService('call usp_WFH_operations(?, ?)', [JSON.stringify(obj), JSON.stringify(obj2)], (err, result) => {

      if (err) {
        return res.json({
          message: err.message, data: null, state: -1
        })
      }
      else {
        //console.log(result[0]);
        return res.json({
          state: 1,
          message: "success",
          data: result[0]
        })
      }
    })
  }
  catch (err) {
    return res.json({
      message: err.message, data: null, state: -1
    })
  }
}



function getWorkType(req, res) {
  if (!req.body) {
    return res.json({
      message: "Send required data",
      state: -1
    })
  }
  let obj = JSON.stringify(req.body);
  commonModel.mysqlPromiseModelService('call usp_WFH_view(?)', [obj])
    .then(results => {
      var dbresult = commonCtrl.lazyLoading(results[0], req.body);
      if (dbresult && "data" in dbresult && "count" in dbresult) {
        //console.log(dbresult.data, "daaaaaaaataaaaaaaaaaaaaa");
        return res.json({
          "state": 1,
          message: "success",
          "data": dbresult.data,
          "count": dbresult.count
        });
      } else {
        return res.json({
          state: -1,
          message: "Something went wrong",
          data: null
        });
      }
    })
    .catch(err => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err
      });
    })
}


function approveWFHRequest(req, res) {
  if (!req.body || !req.body.reqtype) {
    return res.json({
      message: "Send required data",
      state: -1
    })
  }
  // headerid, id, isapproved from frontend

  let isapproved = req.body.isapproved;
  // based on headerid, get approvalstructure form db (trx_wfh_request) where id = headerid

  let obj = JSON.parse(JSON.stringify(req.body));
  obj.action = 'getapprovalstructure'
  commonModel.mysqlPromiseModelService('call usp_WFH_view(?)', [JSON.stringify(obj)])
    .then(results => {
      let obj2 = JSON.parse(JSON.stringify(req.body));
      ////console.log(obj2, "obj2");
      let data = results[0];
      //console.log(data, "data");
      let approval_structure = data && data[0] && data[0].approval_structure && JSON.parse(data[0].approval_structure);
      //console.log(approval_structure, "aprrovallll");
      let currentlevel = req.body.currentlevel;
      //updating trx_wfh_request_status and then checking for final level
      //if the request is approved (1) then we have to check next approval level is there or not

      if (isapproved) {
        let returnedItem = getNextLevel(currentlevel, approval_structure);
        //console.log(returnedItem, "nextlevelllllll");

        // if next level is there then final level (0) and  insert in trx_wfh_request_status

        if (returnedItem) {
          obj2 = { ...obj2, finalLevel: 0, to_approver: returnedItem.to_approver, other_approver: returnedItem.other_approver };

          //console.log('we have one more approval level');
        }
        // if its final level , final level is 1 and update trx_wfh_request
        else {
          obj2.finalLevel = 1;
          //console.log('final level');
        }
      }
      //if request is rejected from front end then we consider it as final level
      else {
        obj2.finalLevel = 1;
      }
      // calling db usp_wfh_operations 
      //console.log(obj2, "obj2");



      return commonModel.mysqlPromiseModelService('call usp_WFH_operations(?, ?)', [JSON.stringify({}), JSON.stringify(obj2)])
        .then(results => {
          //console.log(results[0], "reeeeeeesssssssss");
          let wfhParam = results && results[0] && results[0][0];
          let moduleid = req.body.moduleid ? req.body.moduleid : "Attendance";
          let trxwfhlevel = wfhParam.isapproval ? "Self-approval" : wfhParam.trxwfhlevel;


          if (req.body.reqtype == "approvewfhrequest") {
            mailtype = obj2.finalLevel ? "actionwfh" : "applyworkplace";
            trxwfhtype = wfhParam.trxempworktypename;
            trxwfhaction = req.body.isapproved ? "is Approved" : "is Rejected";
          }

          if (obj2.finalLevel == 1) {
            ////console.log("finalLevel == 1");
            var mailOptions = {
              email: wfhParam.trxempemail,
              moduleid: moduleid,
              //email: 'avinash.kumar@polestarllp.com',
              userid: wfhParam.userid,
              mailType: mailtype,
              subjectVariables: { subject: "Request for " + wfhParam.trxempworktypename + " " + trxwfhaction },
              headingVariables: { heading: trxwfhtype + " Application " + " " + trxwfhaction },
              bodyVariables: {
                trxempname: wfhParam.trxempname,
                trxwfhtype: wfhParam.trxempworktypename,
                trxwfhaction: trxwfhaction,
                trxwfhfromdt: wfhParam.trxfromdate
                  ? moment(wfhParam.trxfromdate, "YYYY-MM-DD").format(
                    "DD MMMM YYYY"
                  )
                  : moment(req.body.fromdate, "DD-MM-YYYY").format("DD MMMM YYYY"),
                trxwfhtodt: wfhParam.trxtodate
                  ? moment(wfhParam.trxtodate, "YYYY-MM-DD").format(
                    "DD MMMM YYYY"
                  )
                  : moment(req.body.todate, "DD-MM-YYYY").format("DD MMMM YYYY"),
                trxwfhreason: wfhParam.trxwfhreason || "",
                trxwfhdays: wfhParam && wfhParam.trxwfhdays,
                trxwfhtotalapplied: wfhParam && wfhParam.trxwfhtotalapplied,
                trxwfhtotalapproved: wfhParam && wfhParam.trxwfhtotalapproved
              }
            };
          } else {
            ////console.log("finalLevel == 0");
            var mailOptions = {
              email: wfhParam.sendmailto,
              moduleid: moduleid,
              userid: wfhParam.userid,
              //email: 'avinash.kumar@polestarllp.com',
              mailType: mailtype,
              subjectVariables: { subject: `Request for ${wfhParam.trxempworktypename} by ${wfhParam.trxempname}`, },
              headingVariables: { heading: "Workplace Application" },
              bodyVariables: {
                trxempname: wfhParam.trxempname,
                trxempemail: wfhParam.trxempemail,
                trxwfhtype: wfhParam.trxempworktypename,
                trxwfhaction: trxwfhaction,
                trxwfhfromdt: wfhParam.trxfromdate
                  ? moment(wfhParam.trxfromdate, "YYYY-MM-DD").format(
                    "DD MMMM YYYY"
                  )
                  : moment(req.body.fromdate, "DD-MM-YYYY").format("DD MMMM YYYY"),
                trxwfhtodt: wfhParam.trxtodate
                  ? moment(wfhParam.trxtodate, "YYYY-MM-DD").format(
                    "DD MMMM YYYY"
                  )
                  : moment(req.body.todate, "DD-MM-YYYY").format("DD MMMM YYYY"),
                trxwfhreason: wfhParam.trxwfhreason || "",
                trxwfhlevel: trxwfhlevel,
                trxwfhdays: wfhParam && wfhParam.trxwfhdays,
                trxwfhtotalapplied: wfhParam && wfhParam.trxwfhtotalapplied,
                trxwfhtotalapproved: wfhParam && wfhParam.trxwfhtotalapproved
              }
            };
          }
          //console.log(mailOptions, "mailoptionsssssssss");
          mailservice.mail(mailOptions, function (err, response) {
            if (err) {
              //console.log(
              //" { state:-1,message: 'Mail not sent.', error: err }",
              // err
              //  );
            } else {
              //console.log("return { state:1,message: 'Mail sent' }");
            }
          });

          return res.json({
            state: 1,
            message: "success",
          });
        })
    })
    .catch(err => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err
      });
    })
}



function getWFHHistory(req, res) {
  if (!req.body) {
    return res.json({
      message: "Send required data",
      state: -1
    })
  }
  let obj = JSON.stringify(req.body);
  commonModel.mysqlPromiseModelService('call usp_WFH_view(?)', [obj])
    .then(results => {
      ////console.log(results[0], "resultssssss");

      return res.json({
        state: 1,
        message: "success",
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


async function upcomingWFH(req, res) {
  try {
    let allreportees = await feedbackController.userhierarcy(req, res);
    ////console.log(allreportees, "allllllllllll");
    let obj = { allreportees, ...req.body };
    ////console.log(obj, "ooobbbjjj");
    let results = await query("call usp_WFH_view(?)", [
      JSON.stringify(obj),
    ]);
    return res.json({ state: 1, message: "success", data: results[0] });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
}


function getPendingApprovalCounts(req, res) {
  try {
    let obj = req.body
    obj.action = 'pendingwfhcounts';
    commonModel.mysqlModelService('call usp_WFH_view(?)', [JSON.stringify(obj)], (err, result) => {
      if (err) {
        return res.json({
          message: err.message, data: null, state: -1
        })
      }
      else {
        //console.log(result[0]);
        return res.json({
          state: 1,
          message: "success",
          data: result[0]
        })
      }
    })
  }
  catch (err) {
    return res.json({
      message: err.message, data: err, state: -1
    })
  }
}

function workPlaceDetails(req, res) {
  try {
    let { k: key } = req.query;
    if (!key) return res.json({ state: -1, message: 'Invalid Key' })
    let obj = {
      action: 'mawai_api',
      s_key: key,
      ...req.body
    }

    commonModel.mysqlPromiseModelService('call usp_WFH_view(?)', [JSON.stringify(obj)])
      .then(results => {
        return res.json({ state: 1, message: "Success", data: results[0] })

      })
      .catch(err => {
        return res.json({ state: -1, data: null, message: err.message || err });
      })
  } catch (error) {
    console.error('Error', error);
    return res.json({ state: -1, message: catchErr });
  }
}