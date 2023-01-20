const proc = require("../common/procedureConfig");
const commonModel = require("../common/Model");
const commonCtrl = require("../common/Controller");
const mailservice = require("../../services/mailerService");
const path = require("path");
const async = require("async");
const notificationCtrl = require("../notification/Controller");
const { makeDirectories } = require("../common/utils");
const { result } = require("lodash");
const query = require("../common/Model").mysqlPromiseModelService;
const getNextLevel = require("../wfh/wfh.controller").getNextLevel;

module.exports = {
  addhelpdeskmaster: addhelpdeskmaster,
  viewhelpdeskmaster: viewhelpdeskmaster,
  activatehelpdeskmaster: activatehelpdeskmaster,
  viewticket: viewticket,
  viewsubticket: viewsubticket,
  raiseticket: raiseticket,
  viewraiseticket: viewraiseticket,
  viewstatus: viewstatus,
  helpdeskoperation: helpdeskoperation,
  viewhistory: viewhistory,
  selfviewmaster: selfviewmaster,
  viewmaster: viewmaster,
  helpdeskreport: helpdeskreport,
  viewRaisedTicketCount,
  addticketmaster:addticketmaster,
  editticketmaster:editticketmaster,
  viewticketmaster:viewticketmaster,
  activateticket: activateticket,
  ticketHeadDropdown,
  viewIcons,
  raiseTickets,
  approveTickets,
  ticketOperation,
  viewRaisedTickets
};
/*------------------------------helpdesk revamp--------------------------------*/

async function addticketmaster(req, res){
  try {
    var obj = req.body;
    var result = await query('call usp_helpdeskticket_operations(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }

}

async function editticketmaster(req, res){
  try {
    var obj = req.body;
    var result = await query('call usp_helpdeskticket_operations(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }

}

async function viewticketmaster(req, res){
  try {
    var obj = req.body;
    var result = await query('call usp_helpdeskticket_operations(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }

}

async function viewIcons(req, res){
  try {
    var obj = req.body;
    obj.action = "fetch_icons";
    var result = await query('call usp_helpdeskticket_operations(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}

async function activateticket(req, res){
  try {
    var obj = req.body;
    var result = await query('call usp_helpdeskticket_operations(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }

}

async function ticketHeadDropdown(req, res){
  try {
    var obj = req.body;
    obj.action = "ticket_head_role_dropdown";
    var result = await query('call usp_helpdeskticket_operations(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}

async function raiseTickets(req, res) {

  try {
    if (
        !req.body.tickettype ||
        !req.body.ticketsubtype ||
        !req.body.title ||
        !req.body.email ||
        !req.body.contact ||
        !req.body.action
      ) {
        return res.json({ message: "send required data", state: -1 });
      }
    let obj = req.body;
    let obj2 = { ...req.body, "action": "get_approvalstructure" };
    //obj2.action = "get_approvalstructure";
    let [approvalData] = await query('call usp_helpdeskticket_operations(?)', [JSON.stringify(obj2)]);
    let approval_structure = approvalData[0] && approvalData[0]['approvalstructure'] && JSON.parse(approvalData[0]['approvalstructure']);
    let returnedItem = approval_structure && getNextLevel(0, approval_structure);
    if (returnedItem) {
      obj = {
        ...obj, ...returnedItem, isautoapproved: 0, approval_structure: approval_structure
      }
    }
    else {
      obj.isautoapproved = 1;
    }
    commonModel.mysqlModelService('call usp_ticket_raise_operation(?)', [JSON.stringify(obj)], (err, result) => {
      if (err) {
        return res.json({
          message: err.message || err, state: -1
        })
      }
      else {
        //console.log("ticket raised", result[0]);

        return res.json({
          state: 1,
          message: "success",
          data: result[0]
        })
      }
    })

  }
  catch (err) {
    console.log("err", err);
    return res.json({
      message: err.message, data: null, state: -1
    })
  }
}

async function approveTickets(req, res) {

  try {
      if (!req.body) {
        return res.json({
        message: "Send required data",
        state: -1
      })
    }

    let isapproved = req.body.isapproved;
  // based on headerid, get approvalstructure from db (mstportalconfig_helpdesk) where id = headerid
    let obj = req.body;
    obj.action = "approve_ticket";
    let obj2 = { ...req.body, "action": "get_approvalstructure" };
    
    let [approvalData] = await query('call usp_helpdeskticket_operations(?)', [JSON.stringify(obj2)]);
    
    let approval_structure = approvalData[0] && approvalData[0]['approvalstructure'] && JSON.parse(approvalData[0]['approvalstructure']);
    //console.log("approval_str", approval_structure);
    let currentlevel = req.body.currentlevel;
    currentlevel = Number(currentlevel);
      //updating trx_ticket_approval and then checking for final level
      //if the ticket is approved (1) then we have to check next approval level is there or not

      if (isapproved) {
        let returnedItem = getNextLevel(currentlevel, approval_structure);
        console.log(returnedItem, "nextlevelllllll");

        // if next level is there then final level (0) and  insert in trx_ticket_approval

        if (returnedItem) {
          obj = { ...obj, finalLevel: 0, approver_id: returnedItem.approver_id, other_approver: returnedItem.other_approver };

          //console.log('we have one more approval level');
        }
        // if its final level , final level is 1 and update trx_ticket_header
        else {
          obj.finalLevel = 1;
          //console.log('final level');
        }
      }
      //if ticket is rejected from front end then we consider it as final level
      else {
        obj.finalLevel = 1;
      }

    commonModel.mysqlModelService('call usp_ticket_raise_operation(?)', [JSON.stringify(obj)], (err, result) => {
      if (err) {
        return res.json({
          message: err.message || err, state: -1
        })
      }
      else {

        return res.json({
          state: 1,
          message: "success",
          data: result[0]
        })
      }
    })

  }
  catch (err) {
    console.log("err", err);
    return res.json({
      message: err.message, data: null, state: -1
    })
  }
}

async function ticketOperation(req, res){
  try {
    var obj = req.body;

    let obj2 = { ...req.body, "action": "get_ticketstatus_master" };
    let ticketStatusMaster = await query('call usp_helpdeskticket_operations(?)', [JSON.stringify(obj2)]);
    
    let assigned_id, resolved_id, closed_id, reopen_id;

    for (let i = 0; i < (ticketStatusMaster && ticketStatusMaster[0] && ticketStatusMaster[0].length); i++){
      if (ticketStatusMaster[0][i].configvalue1 == "Assigned") {
        assigned_id = ticketStatusMaster[0][i].id;
      }else if(ticketStatusMaster[0][i].configvalue1 == "Resolved") {
        resolved_id = ticketStatusMaster[0][i].id;
      }else if(ticketStatusMaster[0][i].configvalue1 == "Re-Open") {
        reopen_id = ticketStatusMaster[0][i].id;
      }else if(ticketStatusMaster[0][i].configvalue1 == "Closed") {
        closed_id = ticketStatusMaster[0][i].id;
      }
    }
    
    if (obj.actiontaken == assigned_id && obj.actiontaken_value == "Assigned") {
      obj.action = "assign_ticket";
    } else if(obj.actiontaken == resolved_id && obj.actiontaken_value == "Resolved"){
      obj.action = "resolve_ticket";
    }else if(obj.actiontaken == reopen_id && obj.actiontaken_value == "Re-Open"){
      obj.action = "reopen_ticket";
    }else if(obj.actiontaken == closed_id && obj.actiontaken_value == "Closed"){
      obj.action = "close_ticket";
    }
    
    var result = await query('call usp_ticket_raise_operation(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    //console.log("err", error);
    return res.json({ message: error, state: -1, data: null });
  }

}

async function viewRaisedTickets(req, res) {
  try {
    let obj = JSON.stringify(req.body);
    console.log("obj", obj);
    let results = await query("call usp_ticket_view(?)", [obj]);
    console.log("results", results);
      if (!result) {
        return res.json({ message: result.message, state: -1, data: null });
      }
    var dbresult = commonCtrl.lazyLoading(results[0], req.body);
    console.log("dbresult", dbresult);
      if (dbresult && "data" in dbresult && "count" in dbresult) {
        return res.json({
          state: 1,
          message: "success",
          data: dbresult.data,
          count: dbresult.count,
        });
      } else {
        return res.json({
          state: -1,
          message: "something went wrong",
          data: null,
        });
    }
  } catch (error) {
      console.log("errrr", error);
      return res.json({ message: error, state: -1, data: null });
    }
}


/*--------------------------------------------------------------------------------*/

function addhelpdeskmaster(req, res) {
  if (!req.body || !req.body.action || !req.body.configvalue1) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.helpdeskMaster, [obj])
      .then((results) => {
        if (
          results &&
          results[0] &&
          results[0][0] &&
          results[0][0].state &&
          results[0][0].state == 1
        ) {
          return res.json({
            state: results[0][0].state,
            message: results[0][0].message,
          });
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function viewhelpdeskmaster(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    let obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.helpdeskMaster, [obj])
      .then((results) => {
        var dbresult = commonCtrl.lazyLoading(results[0], req.body);
        if (dbresult && "data" in dbresult && "count" in dbresult) {
          return res.json({
            state: 1,
            message: "success",
            data: dbresult.data,
            count: dbresult.count,
          });
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function activatehelpdeskmaster(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({ message: "send required data", date: -1, data: null });
  } else {
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.helpdeskMaster, [obj])
      .then((results) => {
        if (
          results &&
          results[0] &&
          results[0][0] &&
          results[0][0].state &&
          results[0][0].state == 1
        ) {
          return res.json({
            state: results[0][0].state,
            message: results[0][0].message,
          });
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function viewsubticket(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    let obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.helpdeskMaster, [obj])
      .then((results) => {
        var dbresult = commonCtrl.lazyLoading(results[0], req.body);
        if (dbresult && "data" in dbresult && "count" in dbresult) {
          return res.json({
            state: 1,
            message: "success",
            data: dbresult.data,
            count: dbresult.count,
          });
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function selfviewmaster(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    let obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.helpdeskMaster, [obj])
      .then((results) => {
        if (
          results &&
          results[4] &&
          results[4][0] &&
          results[4][0].state &&
          results[4][0].state == 1
        ) {
          return res.json({
            state: results[4][0].state,
            message: results[4][0].message,
            data: results,
          });
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function viewmaster(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    let obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.helpdeskMaster, [obj])
      .then((results) => {
        if (
          results &&
          results[2] &&
          results[2][0] &&
          results[2][0].state &&
          results[2][0].state == 1
        ) {
          return res.json({
            state: results[2][0].state,
            message: results[2][0].message,
            data: results,
          });
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function viewticket(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    let obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.helpdeskMaster, [obj])
      .then((results) => {
        if (
          results &&
          results[1] &&
          results[1][0] &&
          results[1][0].state &&
          results[1][0].state == 1
        ) {
          return res.json({
            state: results[1][0].state,
            message: results[1][0].message,
            data: results,
          });
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

async function raiseticket(req, res) {
  try {
    if (!req.body.userData) {
      return res.json({ message: "send required data", state: -1 });
    } else {
      req.body.userData = JSON.parse(req.body.userData);

      let userData = req.body.userData;
      userData.createdby = req.body.createdby;
      var tickettitle = userData.title;
      var ticketdesc = (userData && userData.description) || "";

      if (
        !userData.tickettype ||
        !userData.ticketsubtype ||
        !userData.title ||
        !userData.email ||
        !userData.contact ||
        !userData.action
      ) {
        return res.json({ message: "send required data", state: -1 });
      } else {
        var countfiles = userData.attachCount;
        countfiles = parseInt(countfiles);
        if (countfiles && countfiles != 0) {
          let createdby = req.body.createdby.toString();
          let uploadPath = makeDirectories(
            path.join("uploads", "helpdesk", createdby)
          );
          var filename = [];
          var filepath = [];

          async.times(
            countfiles,
            function (n, next) {
              var sampleFile = {};
              sampleFile = req.files["file[" + n + "]"];
              if (sampleFile) {
                let sampleFile_name = `${Date.now()}_${sampleFile.name}`;
                let filepath1 = path.join(uploadPath, sampleFile_name);
                sampleFile.mv(filepath1, (err) => {
                  if (!err) {
                    filename.push(sampleFile_name);
                    let uploadfilename = path.join(
                      "helpdesk",
                      createdby,
                      sampleFile_name
                    );
                    filepath.push(uploadfilename);
                  }
                  next(null, "success");
                });
              } else {
                next(null, "success");
              }
            },
            async (err, users) => {
              userData.filename = filename.join(",");
              userData.filepath = filepath.join(",");
              let obj = await commonCtrl.verifyNull(userData);
              obj = JSON.stringify(obj);
              commonModel.mysqlModelService(
                proc.helpdesk,
                [obj, null],
                function (err, results) {
                  if (err) {
                    return res.json({
                      message: "Some error occured.",
                      data: err,
                      state: -1,
                    });
                  }
                }
              );
            }
          );
        } else {
          var obj = await commonCtrl.verifyNull(userData);
          obj = JSON.stringify(obj);
          commonModel.mysqlModelService(
            proc.helpdesk,
            [obj, null],
            function (err, results) {
              if (err) {
                return res.json({
                  message: "Some error occured.",
                  data: err,
                  state: -1,
                });
              }
            }
          );
        } // mail
        var obj = await commonCtrl.verifyNull(userData);
        obj = JSON.stringify(obj);
        obj = JSON.parse(obj);
        obj.action = "mailonraised";
        obj = JSON.stringify(obj);
        commonModel.mysqlModelService(
          proc.helpdesk,
          [obj, null],
          function (err, results) {
            if (err) {
              return res.json({
                message: "Some error occured.",
                data: err,
                state: -1,
              });
            } else {
              res.json({ message: "Success", state: 1, data: results });
              //console.log(results, "<<<<<<<<<<<< results");
              let bodyVariables = {
                trxempname: results[0][0].ticketby || "",
                trxempsupervisor:
                  results &&
                  results[0] &&
                  results[0][0] &&
                  results[0][0].trxempsupervisor,
                trxempdob:
                  results &&
                  results[0] &&
                  results[0][0] &&
                  results[0][0].trxempdob,
                trxempjoining:
                  results &&
                  results[0] &&
                  results[0][0] &&
                  results[0][0].trxempjoining,
                trxempemail:
                  results &&
                  results[0] &&
                  results[0][0] &&
                  results[0][0].trxempemail,
                trxtitleofticket: tickettitle,
                trxticketdescription: ticketdesc,
              };

              var emailObj = {
                email: results[0][0].useremail || "",
                cc: results[0][0].ccmail || "",
                // bcc: results[0][0].useremail ||'',
                mailType: "ticketraised",
                moduleid: req.body.moduleid ? req.body.moduleid : "helpdesk",
                userid: req.body.createdby,
                bodyVariables,
                subjectVariables: {
                  ticketby: results[0][0].ticketby || "",
                  subject: `${results[0][0].ticketby} Has Raised Ticket, Ticket No :${results[0][0].trxTicketNo}`,
                },
                headingVariables: {
                  heading: "New ticket raised",
                },
              };
              mailservice.mail(emailObj, function (err) {
                if (err) {
                  //console.log("MAILLLLLLLLLLL", err);
                }
              });

              let message = {
                notification: {
                  title: "Helpdesk",
                  body: `${results[0][0].ticketby} has raised ticket.`,
                },
                data: {
                  route: "/helpdesk",
                  type: "helpdesk",
                },
              };
              notificationCtrl.sendNotificationToMobileDevices(
                results[0][0].trxempsupervisorid,
                message
              );

              var msgbody = `${results[0][0].ticketby} has raised ticket.`;
              var keysdata = {
                createdby: req.body.createdby,
                touser: results[0][0].trxempsupervisorid,
                description: msgbody,
                module: "Helpdesk",
                action: "add",
              };

              notificationCtrl.saveUserNotificationDirect(keysdata);
            }
          }
        );
        // }
      }
    }
  } catch (err) {
    return res.json({ message: "Something went wrong", data: null, state: -1 });
  }
}

function viewraiseticket(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    let obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.helpdesk, [obj, null])
      .then((results) => {
        //lazy
        var dbresult = commonCtrl.lazyLoading(results[0], req.body);
        if (dbresult && "data" in dbresult && "count" in dbresult) {
          return res.json({
            state: 1,
            message: "success",
            data: dbresult.data,
            count: dbresult.count,
          });
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function viewstatus(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    let obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.helpdeskMaster, [obj])
      .then((results) => {
        if (
          results &&
          results[1] &&
          results[1][0] &&
          results[1][0].state &&
          results[1][0].state == 1
        ) {
          return res.json({
            state: results[1][0].state,
            message: results[1][0].message,
            data: results,
          });
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function helpdeskoperation(req, res) {
  if (!req.body || !req.body.action || !req.body.historyid) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    var html = req.body.html;
    delete req.body.html;

    var obj = req.body;
    var obj = JSON.stringify(obj);
    commonModel
      .mysqlPromiseModelService(proc.helpdesk, [obj, html])
      .then((results) => {
        if (
          results &&
          results[0] &&
          results[0][0] &&
          results[0][0].state &&
          results[0][0].state == 1
        ) {
          res.json({
            state: results[0][0].state,
            message: results[0][0].message,
          });
          // mail

          obj = JSON.parse(obj);

          // delete obj.remark;

          obj.action = "mailonaction";
          obj = JSON.stringify(obj);
          commonModel.mysqlModelService(
            proc.helpdesk,
            [obj, html],
            function (err, results) {
              //console.log(req.body, "data in req");
              let subjecttype;
              let headingtype;
              let tonotification;
              var msgbody;
              let message = {
                notification: {
                  title: "Helpdesk",
                  body: "",
                },
                data: {
                  route: "/helpdesk",
                  type: "helpdesk",
                },
              };

              if (err) {
                return res.json({
                  message: "Some error occured.",
                  data: err,
                  state: -1,
                });
              } else {
                if (results && results[0] && results[0][0]) {
                  let bodyVariables = {
                    trxempname: results[0][0].ticketby || "",
                    trxempsupervisor:
                      results &&
                      results[0] &&
                      results[0][0] &&
                      results[0][0].trxempsupervisor,
                    trxempdob:
                      results &&
                      results[0] &&
                      results[0][0] &&
                      results[0][0].trxempdob,
                    trxempjoining:
                      results &&
                      results[0] &&
                      results[0][0] &&
                      results[0][0].trxempjoining,
                    trxempemail:
                      results &&
                      results[0] &&
                      results[0][0] &&
                      results[0][0].trxempemail,
                    trxtitleofticket: (results &&
                      results[0] &&
                      results[0][0] &&
                      results[0][0].title) || (req.body && req.body.tickettitle) || "",
                    trxticketdescription:
                      (results &&
                        results[0] &&
                        results[0][0] &&
                        results[0][0].description) ||
                      (req.body && req.body.ticketdesc) || "",
                    trxticketraisedby: (results &&
                      results[0] &&
                      results[0][0] &&
                      results[0][0].ticketby) || "",
                    trxticketremarks: (results &&
                      results[0] &&
                      results[0][0] &&
                      results[0][0].trxticketremarks) || ""
                    // trxempname: (req.body.tokenFetchedData.firstname + (req.body.tokenFetchedData.lastname ? (' ' + req.body.tokenFetchedData.lastname) : ''))
                  };
                  if (results[0][0].mailType == "ticketraised") {
                    subjecttype = `${results[0][0].ticketby}
                    Has Raised Ticket, Ticket No :${results[0][0].trxTicketNo}`;
                    headingtype = "New ticket raised";
                    message.notification.body = ` Ticket accepted by ${req.body.tokenFetchedData.firstname} ${req.body.tokenFetchedData.lastname}.`;
                    msgbody = ` Ticket accepted by ${req.body.tokenFetchedData.firstname} ${req.body.tokenFetchedData.lastname}.`;
                    tonotification = results[0][0].trxempid;
                  } else if (results[0][0].mailType == "ticketrejected") {
                    subjecttype = `${results[0][0].ticketby} Has Rejected Your Ticket, Ticket No :${results[0][0].trxTicketNo}`;
                    headingtype = "Ticket has been Rejected";
                    message.notification.body = ` Ticket rejected by ${req.body.tokenFetchedData.firstname} ${req.body.tokenFetchedData.lastname}.`;
                    msgbody = ` Ticket rejected by ${req.body.tokenFetchedData.firstname} ${req.body.tokenFetchedData.lastname}.`;
                    tonotification = results[0][0].trxempid;
                  } else if (results[0][0].mailType == "ticketassign") {
                    subjecttype = `${results[0][0].ticketby}  Has Assigned Ticket To You, Ticket No :${results[0][0].trxTicketNo}`;
                    headingtype = "Ticket has been Assigned ";
                    //message.notification.body = ` ${req.body.tokenFetchedData.firstname} ${req.body.tokenFetchedData.lastname} has assigned ticket to you.`
                    //msgbody = ` ${req.body.tokenFetchedData.firstname} ${req.body.tokenFetchedData.lastname} has assigned ticket to you.`
                    //tonotification = results[0][0].assignedto;
                  } else if (results[0][0].mailType == "ticketresolved") {
                    subjecttype = `${results[0][0].ticketby} Has Resolved Your Ticket, Ticket No : ${results[0][0].trxTicketNo}`;
                    headingtype = "Ticket has been Resolved";
                    message.notification.body = ` Ticket resolved by ${req.body.tokenFetchedData.firstname} ${req.body.tokenFetchedData.lastname}.`;
                    msgbody = ` Ticket resolved by ${req.body.tokenFetchedData.firstname} ${req.body.tokenFetchedData.lastname}.`;
                    tonotification = results[0][0].trxempid;
                  } else if (results[0][0].mailType == "ticketreopen") {
                    subjecttype = `${results[0][0].ticketby} Has Re-Opened Ticket, Ticket No :${results[0][0].trxTicketNo}`;
                    headingtype = "Ticket has been Re-Opened";
                    //message.notification.body = ` ${req.body.tokenFetchedData.firstname} ${req.body.tokenFetchedData.lastname} has reopened ticket.`
                    //msgbody = ` ${req.body.tokenFetchedData.firstname} ${req.body.tokenFetchedData.lastname} has reopened ticket.`
                    //tonotification = results[0][0].trxempsupervisorid;
                  } else if (results[0][0].mailType == "ticketclosed") {
                    subjecttype = `${results[0][0].ticketby}  Has Closed Ticket, Ticket No :${results[0][0].trxTicketNo}`;
                    headingtype = "Ticket Closed";
                    message.notification.body = ` Ticket closed by ${req.body.tokenFetchedData.firstname} ${req.body.tokenFetchedData.lastname}.`;
                    msgbody = ` Ticket closed by ${req.body.tokenFetchedData.firstname} ${req.body.tokenFetchedData.lastname}.`;
                    tonotification = results[0][0].trxempid;
                  } else if (results[0][0].mailType == "ticketinprogress") {
                    subjecttype = `Your Ticket is in Progress, Ticket No :${results[0][0].trxTicketNo}`;
                    headingtype = "Ticket in Progress";
                    message.notification.body = "Your ticket is in progress.";
                    msgbody = "Your ticket is in progress.";
                    tonotification = results[0][0].trxempid;
                  }
                  let subjectVariables = {
                    subject: subjecttype,
                    ticketby: (results[0][0] && results[0][0].ticketby) || "",
                  };
                  let headingVariables = {
                    heading: headingtype,
                    ticketby: (results[0][0] && results[0][0].ticketby) || "",
                  };
                  var emailObj = {
                    // bcc: results && results[0] && results[0][0] && results[0][0].useremail,
                    cc: results[0][0].ccmail || "",
                    email:
                      results &&
                      results[0] &&
                      results[0][0] &&
                      results[0][0].useremail, //results[0][0].toemail || '',
                    mailType:
                      results &&
                      results[0] &&
                      results[0][0] &&
                      results[0][0].mailType,
                    moduleid: req.body.moduleid
                      ? req.body.moduleid
                      : "helpdesk",
                    userid: req.body.createdby,
                    bodyVariables,
                    subjectVariables,
                    headingVariables,
                  };
                  mailservice.mail(emailObj, function (err) {
                    if (err) {
                      //console.log("MAILLLLLLLLLLL", err);
                    } else {
                      // return res.json({ state: 1, message: 'mail sent' });
                    }
                  });

                  notificationCtrl.sendNotificationToMobileDevices(
                    tonotification,
                    message
                  );

                  var keysdata = {
                    createdby: req.body.createdby,
                    touser: tonotification,
                    description: msgbody,
                    module: "Helpdesk",
                    action: "add",
                  };
                  notificationCtrl.saveUserNotificationDirect(keysdata);
                }
              }
            }
          );
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function viewhistory(req, res) {
  if (!req.body || !req.body.action || !req.body.historyid) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    let obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.helpdesk, [obj, null])
      .then((results) => {
        if (
          results &&
          results[2] &&
          results[2][0] &&
          results[2][0].state &&
          results[2][0].state == 1
        ) {
          return res.json({
            state: results[2][0].state,
            message: results[2][0].message,
            data: results,
          });
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function helpdeskreport(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    let obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.helpdesk, [obj, null])
      .then((results) => {
        if (
          results &&
          results[1] &&
          results[1][0] &&
          results[1][0].state &&
          results[1][0].state == 1
        ) {
          return res.json({
            state: results[1][0].state,
            message: results[1][0].message,
            data: results,
          });
        } else {
          return res.json({
            state: -1,
            message: "something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}
async function viewRaisedTicketCount(req, res) {
  try {
    let reqData = req.body;
    reqData.action = req.body.action
      ? req.body.action
      : "viewraiseticket_count";
    let result = await query(proc.helpdesk, [JSON.stringify(reqData), null]);
    return res.json({ state: 1, message: "Success", data: result[0][0] });
  } catch (err) {
    return res.json({ state: -1, message: "Something went wrong" });
  }
}
