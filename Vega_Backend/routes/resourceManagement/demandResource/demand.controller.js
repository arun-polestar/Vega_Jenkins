const query = require('../../common/Model').mysqlPromiseModelService;
const commonCtrl = require('../../common/Controller');
const mailservice = require('../../../services/mailerService');

module.exports = {
  generateDemand,
  viewGeneratedDemand,
  viewSavedDraft,
  saveResourceDemandComments,
  fetchResourceDemandComments,
  getResourceList,
  approveResourceDemand,
  resourceAction,
  getDemandCounts,
  markDemandAsClosed,
  demandsReminder,
  getResourceMasterNameById,
  getRejectedResourceDetails
}

async function generateDemand(req, res) {
  try {
    var obj = req.body;
    var obj1 = req.body.resourceData;
    obj = commonCtrl.verifyNull(obj);
    obj1 = commonCtrl.verifyNull(obj1);
    // obj.newid = obj.id;
    if (obj.is_submitted == 1) {
      if (obj.id && obj.draftid == null) {
        obj.action = 'edit_demand_generation';
      } else {
        obj.action = 'demand_generation';
      }
      if (obj.action == 'demand_generation') {
        obj.draftid = obj.draftid;
      }
    }else if (obj.is_submitted == 0) {
      obj.action = 'demand_generation';
      if (obj.id) {
        obj.draftid = obj.id;
      }
      if (obj.isapproved == 1 && obj.id != null) {
        obj.action = 'edit_demand_generation';
      }
    }
    //console.log("obj", obj);

    for (let i = 0; i < (obj1 && obj1.length); i++){
      delete obj1[i].resource_idoptions;
    }
    let valueArr = obj1.map(item => item.resource_id).filter(item => item !== undefined);
    let isDuplicate = new Set(valueArr).size !== valueArr.length
    console.log('isDuplicate: ', isDuplicate)
    if (isDuplicate) {
      return res.json({
        message: "Same resource tagged multiple times!!",
        state: -1,
        data: null
      });
    }

    var result = await query('call usp_resource_demand_operation(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }
    res.json({ message: 'Success', state: 1, data: result })
    if (result && result[1] && result[1][0] && result[1][0].is_generated == 1) {

      let resources_details = [];
    
      let resources_stats = (result && result[0]).map(async (item) => {
      try {
        resources_details.push(
          `<tr>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourcename}</td>
                <td title="" style="min-width: 100px; max-width: 150px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourcerole}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourcedesignation}</td>
                <td title="" style="min-width: 100px; max-width: 200px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourceprimaryskill}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourcecompetencylevel}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourcestartdate}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourcefte}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourceallocationstatus}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourceprofilestatus}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourceprofiledate}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourceinterviewstatus}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourceinterviewdate}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourcedemandstatus}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourcereason}</td>
          </tr>`
        )
        return item;
      } catch (err) {
        //console.log("errrrrrr", err);
        return err;
      }
    })
    
      Promise.all(resources_stats).then(async () => {

        let html1 = `<h2>Resource(s) Detail </h2>
                        <table border="0"
                                   style="border-collapse: collapse;display: block;overflow-x: scroll;width: 650px;">
                                   <thead style="background-color: blueviolet; color: white;">
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Resource Name</th>
                                        <th title="" style="min-width: 100px; max-width: 150px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px" >Role</th>
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Designation</th>
                                        <th title="" style="min-width: 100px; max-width: 200px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Primary Skill</th>
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Competency Level</th>
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Start Date</th>
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">FTE</th>
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Allocation Status</th>
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Profile Status</th>
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Profile Date</th>
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Interview Status</th>
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Interview Date</th>
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Demand Status </th>
                                        <th title="" style="min-width: 100px; max-width: 180px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Reason For Loss </th>
                                   </thead>
                                   ${resources_details.toString().replace(/,/g, '')}
                                   </table>`;
        
        let res_details = result && result[0] && result[0].length ? html1 : "";
      
        var mailOptions = {
          userid: result[1][0].userid,
          email: result[1][0].useremails,           // mail to admins
          //email: "avinash.kumar@polestarllp.com",
          mailType: 'resourceDemandApprove',
          moduleid: req.body.moduleid ? req.body.moduleid : "ResourceManagement",
          headingVariables: {
            heading: "New Demand Generated"
          },
          subjectVariables: {
            subject: "New demand generated for your approval!"
          },
          bodyVariables: {
            trxdemandproject: result && result[1] && result[1][0] && result[1][0].trxdemandproject,
            trxdemandclient: result && result[1] && result[1][0] && result[1][0].trxdemandclient,
            trxdemandrequestedby: result && result[1] && result[1][0] && result[1][0].trxdemandrequestedby,
            trxdemandrole: result && result[1] && result[1][0] && result[1][0].trxdemandrole,
            trxdemandtechnicalskills: result && result[1] && result[1][0] && result[1][0].trxdemandtechnicalskills,
            trxdemandresourcecount: result && result[1] && result[1][0] && result[1][0].trxdemandresourcecount,
            trxdemandcriticality: result && result[1] && result[1][0] && result[1][0].trxdemandcriticality,
            trxdemandcompetencygroup: result && result[1] && result[1][0] && result[1][0].trxdemandcompetencygroup,
            trxdemanddescription: result && result[1] && result[1][0] && result[1][0].trxdemanddescription,
            trxdemandopportunitymonth: result && result[1] && result[1][0] && result[1][0].trxdemandopportunitymonth,
            trxdemandopportunityyear: result && result[1] && result[1][0] && result[1][0].trxdemandopportunityyear,
            trxdemandopportunitystatus: result && result[1] && result[1][0] && result[1][0].trxdemandopportunitystatus,
            trxdemandopportunitytype: result && result[1] && result[1][0] && result[1][0].trxdemandopportunitytype,
            trxdemandfte: result && result[1] && result[1][0] && result[1][0].trxdemandfte,
            trxdemandindustry: result && result[1] && result[1][0] && result[1][0].trxdemandindustry,
            trxdemandstatus: result && result[1] && result[1][0] && result[1][0].trxdemandstatus,
            trxdemandreason: result && result[1] && result[1][0] && result[1][0].trxdemandreason,
            trxresourcestabledetail: res_details
          }
        };
      
        if (result && result[1] && result[1][0] && result[1][0].trxdemandproject != null) {
          mailservice.mail(mailOptions, function (err, response) {
            if (err) {
              console.log("Mail Not Sent!")
              return { response: 'Mail not sent.', error: err };
            }
            else {
              console.log("Mail Sent!");
              return { response: 'Mail sent' };
            }
          });
        }
      })
        }
    if (result && result[0] && result[0][0] && result[0][0].is_demand_status_changed == 1) {
      var mailOptions = {
            userid: result[0][0].requestedby_userid,
            email: result[0][0].requestedby_email,       // mail to demand requestor
            //email: "avinash.kumar@polestarllp.com",
            mailType: 'resourceDemandStatusUpdate',
            moduleid: req.body.moduleid ? req.body.moduleid : "ResourceManagement",
            headingVariables: {
              heading: "Demand Status Changed"
            },
            subjectVariables: {
              subject: "Your Requested Demand Status has changed !!"
            },
            bodyVariables: {
              trxdemandproject: result && result[0] && result[0][0] && result[0][0].trxdemandproject,
              trxdemandclient: result && result[0] && result[0][0] && result[0][0].trxdemandclient,
              trxdemandrequestedby: result && result[0] && result[0][0] && result[0][0].trxdemandrequestedby,
              trxdemandrole: result && result[0] && result[0][0] && result[0][0].trxdemandrole,
              trxdemandtechnicalskills: result && result[0] && result[0][0] && result[0][0].trxdemandtechnicalskills,
              trxdemandresourcecount: result && result[0] && result[0][0] && result[0][0].trxdemandresourcecount,
              trxdemandcriticality: result && result[0] && result[0][0] && result[0][0].trxdemandcriticality,
              trxdemandcompetencygroup: result && result[0] && result[0][0] && result[0][0].trxdemandcompetencygroup,
              trxdemanddescription: result && result[0] && result[0][0] && result[0][0].trxdemanddescription,
              trxdemandopportunitymonth: result && result[0] && result[0][0] && result[0][0].trxdemandopportunitymonth,
              trxdemandopportunityyear: result && result[0] && result[0][0] && result[0][0].trxdemandopportunityyear,
              trxdemandopportunitystatus: result && result[0] && result[0][0] && result[0][0].trxdemandopportunitystatus,
              trxdemandopportunitytype: result && result[0] && result[0][0] && result[0][0].trxdemandopportunitytype,
              trxdemandfte: result && result[0] && result[0][0] && result[0][0].trxdemandfte,
              trxdemandindustry: result && result[0] && result[0][0] && result[0][0].trxdemandindustry,
              trxdemandstatus: result && result[0] && result[0][0] && result[0][0].trxdemandstatus,
              trxdemandreason: result && result[0] && result[0][0] && result[0][0].trxdemandreason,
              trxpreviousdemandstatus: result[0][0].trxpreviousdemandstatus,
              trxcurrentdemandstatus: result[0][0].trxcurrentdemandstatus,
            }
      };
      
      mailservice.mail(mailOptions, function (err, response) {
              if (err) {
                return { response: 'Mail not sent.', error: err };
              }
              else {
                return { response: 'Mail sent' };
              }
            });
    }


    //return res.json({ message: 'Success', state: 1, data: result })
  } catch (error) {
    console.log("errrrr", error);
    return res.json({ message: error, state: -1, data: null });
  }
}

async function viewGeneratedDemand(req, res) {
  try {
    var obj = req.body;
    var obj1 = {};
    var result = await query('call usp_resource_demand_operation(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }
    
    var response;

    if (obj.action == "view_demands" && obj.id == null) {
      response = result && result[0];
      var obj2 = { ...req.body, "action": "master_data" };
      var obj3 = {}
      var result1 = await query("call usp_resource_demand_operation(?,?)", [JSON.stringify(obj2), JSON.stringify(obj3)]);
      result1 = result1 && result1[0];

      response.map(async (item) => {
        item.role = getResourceMasterNameById(result1, item.role_id);
        item.technical_skills = getResourceMasterNameById(result1, item.technical_skills_id);
        item.criticality = getResourceMasterNameById(result1, item.criticality_id);
        item.opportunity_status = getResourceMasterNameById(result1, item.opportunity_status_id);
        item.opportunity_type = getResourceMasterNameById(result1, item.opportunity_type_id);
        item.industry = getResourceMasterNameById(result1, item.industry_id);
        item.competency_level = getResourceMasterNameById(result1, item.competency_level_id);
        item.demand_status = getResourceMasterNameById(result1, item.demand_status_id);
      })
    }
    if (obj.action == "demands_dropdown") {
      response = result && result[0];
    }
    if (obj.action == "view_demands" && obj.id != null) {
      response = result && result[0];
      var obj2 = { ...req.body, "action": "master_data" };
      var obj3 = {}
      var result1 = await query("call usp_resource_demand_operation(?,?)", [JSON.stringify(obj2), JSON.stringify(obj3)]);
      result1 = result1 && result1[0];

      response.map(async (item) => {
        item.role_name = getResourceMasterNameById(result1, item.role);
        item.technical_skills_name = getResourceMasterNameById(result1, item.technical_skills);
        item.criticality_name = getResourceMasterNameById(result1, item.criticality);
        item.opportunity_status_name = getResourceMasterNameById(result1, item.opportunity_status);
        item.opportunity_type_name = getResourceMasterNameById(result1, item.opportunity_type);
        item.industry_name = getResourceMasterNameById(result1, item.industry);
        item.demand_status_name = getResourceMasterNameById(result1, item.demand_status);
      })
    }

    return res.json({ message: 'Success', state: 1, data: response })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}

function getResourceMasterNameById(masterData, masterid) {
    masterid = masterid && masterid.toString();
    let idArray = masterid && masterid.split(",");
    let output = [];
    for (let i = 0; i < (idArray && idArray.length); i++){
      let data = masterData.find(item => item.id == idArray[i]);
      //console.log("data", data);
      output.push(data && data.configvalue1);
    }
    return output && output.toString();
}

async function viewSavedDraft(req, res) {
  try {
    var obj = req.body;
    obj.action = "view_saved_draft_demand";
    var obj1 = {};
    var result = await query('call usp_resource_demand_operation(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    let response = result && result[0];
      var obj2 = { ...req.body, "action": "master_data" };
      var obj3 = {}
      var result1 = await query("call usp_resource_demand_operation(?,?)", [JSON.stringify(obj2), JSON.stringify(obj3)]);
      result1 = result1 && result1[0];

      response.map(async (item) => {
        item.role = getResourceMasterNameById(result1, item.role_id);
        item.technical_skills = getResourceMasterNameById(result1, item.technical_skills_id);
        item.criticality = getResourceMasterNameById(result1, item.criticality_id);
        item.opportunity_status = getResourceMasterNameById(result1, item.opportunity_status_id);
        item.opportunity_type = getResourceMasterNameById(result1, item.opportunity_type_id);
        item.industry = getResourceMasterNameById(result1, item.industry_id);
        item.competency_level = getResourceMasterNameById(result1, item.competency_level_id);
        item.demand_status = getResourceMasterNameById(result1, item.demand_status_id);
      })
    return res.json({ message: 'Success', state: 1, data: response })
  } catch (error) {
    //console.log("err", error);
    return res.json({ message: error, state: -1, data: null });
  }
}

async function saveResourceDemandComments(req, res) {
  try {
    var obj = req.body;
    obj.action = "save_comments";
    var obj1 = {};
    obj = commonCtrl.verifyNull(obj);
    var result = await query('call usp_resource_demand_operation(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}

async function fetchResourceDemandComments(req, res) {
  try {
    var obj = req.body;
    obj.action = obj.action ? obj.action : "view_comments";
    var obj1 = {};
    obj = commonCtrl.verifyNull(obj);
    var result = await query('call usp_resource_demand_operation(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}

async function getResourceList(req, res) {
  try {
    var obj = req.body;
    obj.action = "resource_dropdown";
    var obj1 = {};
    var result = await query('call usp_resource_demand_operation(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}

async function approveResourceDemand(req, res) {
  try {
    var obj = req.body;
    obj.action = "approve_demand";
    var obj1 = {};
    obj = commonCtrl.verifyNull(obj);
    var result = await query('call usp_resource_demand_operation(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}

async function resourceAction(req, res) {
  try {
    var obj = req.body;
    var obj1 = {};
    var result = await query('call usp_resource_demand_operation(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}

async function getDemandCounts(req, res) {
  try {
    var obj = req.body;
    obj.action = "demand_counts";
    var obj1 = {};
    var result = await query('call usp_resource_demand_operation(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    let dbData = result && result[0];
    let defined = ["Approved", "Rejected", "Pending", "Closed"];
    let demandType = [];
    dbData.map(item => {
      demandType.push(item && item.demand_type);
    });
    defined.map(item => {
      if (!demandType.includes(item)) {
        dbData.push({ "demand_type": item, "count": 0 });
      }
    })
    dbData.push({ "demand_type": "Saved", "count": result[1] && result[1][0] && result[1][0].count || 0 })
    return res.json({ message: 'Success', state: 1, data: dbData })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}


async function markDemandAsClosed(req, res) {
  try {
    var obj = req.body;
    obj.action = "mark_closed";
    var obj1 = {};
    obj = commonCtrl.verifyNull(obj);
    var result = await query('call usp_resource_demand_operation(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null })
  }
}

async function demandsReminder(action) {
  try {
    var obj = { "action": action };
    var obj1 = {};
    var result = await query('call usp_resource_demand_cronmail(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }
    //console.log("result", result);
      
    let resources_details = [];
    
    let resources_stats = (result && result[0]).map(async (item) => {
      try {
        resources_details.push(
          `<tr>
                <td title="" style="min-width: 100px; max-width: 150px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxdemandproject}</td>
                <td title="" style="min-width: 100px; max-width: 150px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxdemandclient}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourcename}</td>
                <td title="" style="min-width: 100px; max-width: 150px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourcerole}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourcedesignation}</td>
                <td title="" style="min-width: 100px; max-width: 200px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourceprimaryskill}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourcecompetencylevel}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourcestartdate}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourcefte}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourceallocationstatus}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourceprofilestatus}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourceprofiledate}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourceinterviewstatus}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourceinterviewdate}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourcedemandstatus}</td>
                <td title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 7px 15px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis; text-align: left;font-size: 12px;">${item.trxresourcereason}</td>
          </tr>`
        )
        return item;
      } catch (err) {
        console.log("errrrrrr", err);
        return err;
      }
    })
    
    Promise.all(resources_stats).then(async () => {

      let html1 = `<table border="0"
                                   style="border-collapse: collapse;display: block;overflow-x: scroll;width: 650px;">
                                   <thead style="background-color: blueviolet; color: white;">
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Project Title</th>
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Client</th>
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Resource Name</th>
                                        <th title="" style="min-width: 100px; max-width: 150px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px" >Role</th>
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Designation</th>
                                        <th title="" style="min-width: 100px; max-width: 200px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Primary Skill</th>
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Competency Level</th>
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Start Date</th>
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">FTE</th>
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Allocation Status</th>
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Profile Status</th>
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Profile Date</th>
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Interview Status</th>
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Interview Date</th>
                                        <th title="" style="min-width: 100px; max-width: 140px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Demand Status </th>
                                        <th title="" style="min-width: 100px; max-width: 180px; border: 1px solid #dcc8c8;padding: 8px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; font-size: 13px">Reason For Loss </th>
                                   </thead>
                                   ${resources_details.toString().replace(/,/g, '')}
                                   </table>`;
      
      let subjecttype = action == "demands_reminder_for_profilenotshared" ? " profile not shared in these demands!!" : " interview pending in these demands!!"
      let bodytext = action == "demands_reminder_for_profilenotshared" ? "The details of resources belonging to corresponding demands whose profile is not shared are attached in the Resource(s) Detail table below." :
        "The details of resources belonging to corresponding demands whose profile is shared and interview is pending are attached in the Resource(s) Detail table below."
      var mailOptions = {
        userid: result && result[0] && result[0][0] && result[0][0].userid,
        email: result && result[0] && result[0][0] && result[0][0].useremails,   // mail to admins
        //email: "avinash.kumar@polestarllp.com",
        mailType: 'demandsReminder',
        moduleid: "ResourceManagement",
        headingVariables: {
          heading: "Demand Reminder"
        },
        subjectVariables: {
          trx_resource_status: subjecttype
        },
        bodyVariables: {
          trxresourcestabledetail: html1,
          trxmailbodytext: bodytext
        }
      };
      
      if (result && result[0] && result[0].length) {
        mailservice.mail(mailOptions, function (err, response) {
          if (err) {
            console.log("Mail Not Sent!", err)
            return { response: 'Mail not sent.', error: err };
          }
          else {
            console.log("Mail Sent!");
            return { response: 'Mail sent' };
          }
        });
      }
    })
  } catch (error) {
    //console.log("catchblockerr",error)
    return error;
  }
}

async function getRejectedResourceDetails(req, res) {
  try {
    var obj = req.body;
    obj.action = "rejected_resource";
    var obj1 = {};
    var result = await query('call usp_resource_demand_operation(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}