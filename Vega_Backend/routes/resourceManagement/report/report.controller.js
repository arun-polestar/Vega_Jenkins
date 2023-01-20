const query = require('../../common/Model').mysqlPromiseModelService;
const lodash = require("lodash");
const moment = require("moment");
const demandCtrlPath = require("../demandResource/demand.controller");

module.exports = {
  getResourceCompetencyData,
  getResourceCompetencyCount,
  getFortnightUtilizationReport,
  getCurrentBenchReport,
  getResourceAdhocReport,
  getTimesheetAssignmentFTEReport
}

function toFixed(value, precision) {
  var precision = precision || 0,
    power = Math.pow(10, precision),
    absValue = Math.abs(Math.round(value * power)),
    result = (value < 0 ? '-' : '') + String(Math.floor(absValue / power));

  if (precision > 0) {
    var fraction = String(absValue % power),
      padding = new Array(Math.max(precision - fraction.length, 0) + 1).join('0');
    result += '.' + padding + fraction;
  }
  return result;
}


async function getResourceCompetencyData(req, res) {
  try {
    var obj = req.body;
    obj.action = "resource_competency_data";
    var result = await query('call usp_resource_demand_report(?)', [JSON.stringify(obj)]);
    //console.log(result);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }
    let dbData = result && result[0];
    
    let reqData = [];
    const unique = [...new Set(dbData.map(item => item.userid))];
    
    for (let i = 0; i < unique.length; i++) {
      let quarterObj = {};

      dbData.map(item => {

        if (unique[i] == item.userid) {

          quarterObj.userid = item.userid;
          quarterObj.ecode = item.ecode;
          quarterObj.emp_name = item.emp_name;
          quarterObj.department = item.department;
          quarterObj.designation = item.designation;
          quarterObj.country = item.country;
          quarterObj.location = item.location;
          quarterObj.businessunit = item.businessunit;
          quarterObj.workforce = item.workforce;
          quarterObj.primary_skill = item.primary_skill;
          quarterObj.secondary_skill = item.secondary_skill;
          quarterObj.competency_group = item.competencygroup;

// Q4 means Current Quarter (CQ) and Q3 means Previous Quarter (PQ) and Q2 means PQ-1 and Q1 means PQ-2
          if (item && item.quarter && item.financialyear && item.order_by == 4) {
            quarterObj["Q4"] = item.competency;
          } else if (item && item.quarter && item.financialyear && item.order_by == 3) {
            quarterObj["Q3"] = item.competency;
          } else if (item && item.quarter && item.financialyear && item.order_by == 2) {
            quarterObj["Q2"] = item.competency;
          } else {
            quarterObj["Q1"] = item.competency;
          }
        }

      })
      reqData.push(quarterObj);
    }

    return res.json({ message: 'Success', state: 1, data: reqData })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}

async function getResourceCompetencyCount(req, res) {
  try {
    var obj = req.body;
    obj.action = "resource_competency_count";
    var result = await query('call usp_resource_demand_report(?)', [JSON.stringify(obj)]);

    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    let dbData = result && result[0];
    let newData = [];
// Q4 means Current Quarter (CQ) and Q3 means Previous Quarter (PQ) and Q2 means PQ-1 and Q1 means PQ-2
    let objData = {
      "L1": { "Q1": 0, "Q2": 0, "Q3": 0, "Q4": 0 },
      "L2": { "Q1": 0, "Q2": 0, "Q3": 0, "Q4": 0 },
      "L3": { "Q1": 0, "Q2": 0, "Q3": 0, "Q4": 0 }
    }
    let competencyArray = ["L1", "L2", "L3"];

    for (let i = 0; i < competencyArray.length; i++) {
      dbData.forEach(item => {
        if (item.competency == competencyArray[i]) {

          if (item.quarter == "Q1") {
            objData[competencyArray[i]]["Q1"] = item.count;
          }
          if (item.quarter == "Q2") {
            objData[competencyArray[i]]["Q2"] = item.count;
          }
          if (item.quarter == "Q3") {
            objData[competencyArray[i]]["Q3"] = item.count;
          }
          if (item.quarter == "Q4") {
            objData[competencyArray[i]]["Q4"] = item.count;
          }
        }
      })

    }
    newData.push(objData);

    return res.json({ message: 'Success', state: 1, data: newData })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}

function fortnightUtilizationReport(dbData, datafor) {

    // var obj = req.body;
    // obj.action = "fortnight_utilization_report";
    // var result = await query('call usp_resource_demand_report(?)', [JSON.stringify(obj)]);

    // if (!result) {
    //   return res.json({ message: result.message, state: -1, data: null });
    // }

    //let dbData = result && result[0];
    dbData = dbData.filter(ele => ele.wbs_name !== "Not Utilized");

    const uniqueMonths = [...new Set(dbData.map(item => item.month))];

    let reqData = [];
    let newItem = {};
    for (let i = 0; i < uniqueMonths.length; i++) {

      let filtered = dbData.filter(item => item.month == uniqueMonths[i]);
      newItem[uniqueMonths[i]] = {};
      newItem[uniqueMonths[i]]["F1"] = {};
      newItem[uniqueMonths[i]]["F1"][`Billed_${datafor}`] = {"Domestic": 0, "International": 0, "Domestic_Days": 0, "International_Days": 0};
      newItem[uniqueMonths[i]]["F2"] = {};
      newItem[uniqueMonths[i]]["F2"][`Billed_${datafor}`] = {"Domestic": 0, "International": 0, "Domestic_Days": 0, "International_Days": 0};
      newItem[uniqueMonths[i]]["F1"]["Bench"] = { "Domestic": 0, "International": 0, "Domestic_Days": 0, "International_Days": 0 };
      newItem[uniqueMonths[i]]["F2"]["Bench"] = {"Domestic": 0, "International": 0, "Domestic_Days": 0, "International_Days": 0};
      
      filtered.forEach(item => {
        //console.log("item", item);
        if (item.fortnight == "F1") {
          if (item.wbs_name == "Billed") {
            if (item.ifdomestic == "Domestic") {
              newItem[item.month]["F1"][`Billed_${datafor}`]["Domestic"] = item.totalhours;
            // Domestic_Days key will only be used to calculate Utilization
              newItem[item.month]["F1"][`Billed_${datafor}`]["Domestic_Days"] = item.totaldays;
            } else {
              newItem[item.month]["F1"][`Billed_${datafor}`]["International"] = item.totalhours;
            // International_Days key will only be used to calculate Utilization
              newItem[item.month]["F1"][`Billed_${datafor}`]["International_Days"] = item.totaldays;
            } 
            newItem[item.month]["F1"][`Billed_${datafor}`]["Total_Billed"] = toFixed((newItem[item.month]["F1"][`Billed_${datafor}`]["Domestic"] + newItem[item.month]["F1"][`Billed_${datafor}`]["International"]), 2);
            newItem[item.month]["F1"][`Billed_${datafor}`]["Total_Billed_Days"] = newItem[item.month]["F1"][`Billed_${datafor}`]["Domestic_Days"] + newItem[item.month]["F1"][`Billed_${datafor}`]["International_Days"];
          }
          if (item.wbs_name == "Bench") {
            if (item.ifdomestic == "Domestic") {
              newItem[item.month]["F1"]["Bench"]["Domestic"] = item.totalhours;
            // Domestic_Days key will only be used to calculate Utilization
              newItem[item.month]["F1"]["Bench"]["Domestic_Days"] = item.totaldays;
            } else {
              newItem[item.month]["F1"]["Bench"]["International"] = item.totalhours;
            // International_Days key will only be used to calculate Utilization
              newItem[item.month]["F1"]["Bench"]["International_Days"] = item.totaldays;
            } 
            //newItem[item.month]["F1"]["Bench"]["Total_Bench"] = datafor == "Timesheet" ? (newItem[item.month]["F1"]["Bench"]["Domestic"] + newItem[item.month]["F1"]["Bench"]["International"]) : item.total_fte-;
            //newItem[item.month]["F1"]["Bench"]["Total_Bench_Days"] = newItem[item.month]["F1"]["Bench"]["Domestic_Days"] + newItem[item.month]["F1"]["Bench"]["International_Days"];
          }
          
          //newItem[item.month]["F1"]["Billed"]["Total Billed"] = newItem[item.month]["F1"]["Billed"]["Domestic"] + newItem[item.month]["F1"]["Billed"]["International"];
          newItem[item.month]["F1"]["Total"] = datafor == "Timesheet" ? ((+newItem[item.month]["F1"]["Bench"]["Total_Bench"] + +newItem[item.month]["F1"][`Billed_${datafor}`]["Total_Billed"])) : toFixed((item.total_fte || 0), 2);
          newItem[item.month]["F1"]["Total_Days"] = datafor == "Timesheet" ? (newItem[item.month]["F1"]["Bench"]["Total_Bench_Days"] + newItem[item.month]["F1"][`Billed_${datafor}`]["Total_Billed_Days"]) : 0;
          newItem[item.month]["F1"]["Utilization"] = datafor == "Timesheet" ? toFixed((((+newItem[item.month]["F1"][`Billed_${datafor}`]["Total_Billed_Days"] * 100) || 0) / (+newItem[item.month]["F1"]["Total_Days"] || 1)), 2) : toFixed((((+newItem[item.month]["F1"][`Billed_${datafor}`]["Total_Billed"] * 100) || 0) / (+newItem[item.month]["F1"]["Total"] || 1)), 2);
         
          newItem[item.month]["F1"]["Bench"]["Total_Bench"] = datafor == "Timesheet" ? toFixed((newItem[item.month]["F1"]["Bench"]["Domestic"] + newItem[item.month]["F1"]["Bench"]["International"]), 2) : toFixed((newItem[item.month]["F1"]["Total"] - newItem[item.month]["F1"][`Billed_${datafor}`]["Total_Billed"]), 2);
          newItem[item.month]["F1"]["Bench"]["Total_Bench_Days"] = datafor == "Timesheet" ? (newItem[item.month]["F1"]["Bench"]["Domestic_Days"] + newItem[item.month]["F1"]["Bench"]["International_Days"]) : 0;
          
        } else {
          if (item.wbs_name == "Billed") {
            if (item.ifdomestic == "Domestic") {
              newItem[item.month]["F2"][`Billed_${datafor}`]["Domestic"] = item.totalhours;
              newItem[item.month]["F2"][`Billed_${datafor}`]["Domestic_Days"] = item.totaldays;
            } else {
              newItem[item.month]["F2"][`Billed_${datafor}`]["International"] = item.totalhours;
              newItem[item.month]["F2"][`Billed_${datafor}`]["International_Days"] = item.totaldays;
            } 
            newItem[item.month]["F2"][`Billed_${datafor}`]["Total_Billed"] = toFixed((newItem[item.month]["F2"][`Billed_${datafor}`]["Domestic"] + newItem[item.month]["F2"][`Billed_${datafor}`]["International"]), 2);
            newItem[item.month]["F2"][`Billed_${datafor}`]["Total_Billed_Days"] = newItem[item.month]["F2"][`Billed_${datafor}`]["Domestic_Days"] + newItem[item.month]["F2"][`Billed_${datafor}`]["International_Days"];
          }
          if (item.wbs_name == "Bench") {
            if (item.ifdomestic == "Domestic") {
              newItem[item.month]["F2"]["Bench"]["Domestic"] = item.totalhours;
            // Domestic_Days key will only be used to calculate Utilization
              newItem[item.month]["F2"]["Bench"]["Domestic_Days"] = item.totaldays;
            } else {
              newItem[item.month]["F2"]["Bench"]["International"] = item.totalhours;
            // International_Days key will only be used to calculate Utilization
              newItem[item.month]["F2"]["Bench"]["International_Days"] = item.totaldays;
            } 
            //newItem[item.month]["F2"]["Bench"]["Total_Bench"] = newItem[item.month]["F2"]["Bench"]["Domestic"] + newItem[item.month]["F2"]["Bench"]["International"];
            //newItem[item.month]["F2"]["Bench"]["Total_Bench_Days"] = newItem[item.month]["F2"]["Bench"]["Domestic_Days"] + newItem[item.month]["F2"]["Bench"]["International_Days"];
          }
          //newItem[item.month]["F2"]["Billed"]["Total Billed"] = newItem[item.month]["F2"]["Billed"]["Domestic"] + newItem[item.month]["F2"]["Billed"]["International"];
          // newItem[item.month]["F2"]["Total"] = newItem[item.month]["F2"]["Bench"]["Total_Bench"] + newItem[item.month]["F2"][`Billed_${datafor}`]["Total_Billed"];
          // newItem[item.month]["F2"]["Total_Days"] = newItem[item.month]["F2"]["Bench"]["Total_Bench_Days"] + newItem[item.month]["F2"][`Billed_${datafor}`]["Total_Billed_Days"];
          // newItem[item.month]["F2"]["Utilization"] = ((newItem[item.month]["F2"][`Billed_${datafor}`]["Total_Billed_Days"] * 100) / (newItem[item.month]["F2"]["Total_Days"] || 1)).toFixed(2);
          
          newItem[item.month]["F2"]["Total"] = datafor == "Timesheet" ? ((+(newItem[item.month]["F2"]["Bench"]["Total_Bench"] || 0) + +(newItem[item.month]["F2"][`Billed_${datafor}`]["Total_Billed"] || 0))) : toFixed((item.total_fte || 0), 2);
          newItem[item.month]["F2"]["Total_Days"] = datafor == "Timesheet" ? (newItem[item.month]["F2"]["Bench"]["Total_Bench_Days"] + newItem[item.month]["F2"][`Billed_${datafor}`]["Total_Billed_Days"]) : 0;
          newItem[item.month]["F2"]["Utilization"] = datafor == "Timesheet" ? toFixed((((+newItem[item.month]["F2"][`Billed_${datafor}`]["Total_Billed_Days"] * 100) || 0) / (+newItem[item.month]["F2"]["Total_Days"] || 1)), 2) : toFixed(((+(newItem[item.month]["F2"][`Billed_${datafor}`]["Total_Billed"] * 100) || 0) / (+newItem[item.month]["F2"]["Total"] || 1)), 2);
         
          newItem[item.month]["F2"]["Bench"]["Total_Bench"] = datafor == "Timesheet" ? toFixed((newItem[item.month]["F2"]["Bench"]["Domestic"] + newItem[item.month]["F2"]["Bench"]["International"]), 2) : toFixed((newItem[item.month]["F2"]["Total"] - newItem[item.month]["F2"][`Billed_${datafor}`]["Total_Billed"]), 2);
          newItem[item.month]["F2"]["Bench"]["Total_Bench_Days"] = datafor == "Timesheet" ? (newItem[item.month]["F2"]["Bench"]["Domestic_Days"] + newItem[item.month]["F2"]["Bench"]["International_Days"]) : 0;
          
        }
      })
    }
    reqData.push(newItem);
    return reqData;
}

async function getFortnightUtilizationReport(req, res) {
  try {
    var obj = req.body;
    obj.action = "fortnight_utilization_report";
    var result = await query('call usp_resource_demand_report(?)', [JSON.stringify(obj)]);

    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    let timesheetUtilizationReport = fortnightUtilizationReport(result && result[0], "Timesheet");
    let assignmentUtilizationReport = fortnightUtilizationReport(result && result[1], "Assignment");
    let reqData = [...timesheetUtilizationReport, ...assignmentUtilizationReport];
    
    return res.json({ message: 'Success', state: 1, data: reqData})
  } catch (error) {
   // console.log("err", error)
    return res.json({ message: error, state: -1, data: null });
  }
}

async function getCurrentBenchReport(req, res) {
  try {
    var obj = req.body;
    obj.action = "current_bench_report";

    obj.fortnightdate = moment(req.body.fortnightdate, 'DD-MM-YYYY').format('YYYY-MM-DD');

    var result = await query('call usp_resource_demand_report(?)', [JSON.stringify(obj)]);

    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    let dbData = result && result[0];
    let curdate = moment().format('YYYY-MM-DD');

    var obj2 = { ...req.body, "action": "master_data" };
    var obj3 = {}
    var result1 = await query("call usp_resource_demand_operation(?,?)", [JSON.stringify(obj2), JSON.stringify(obj3)]);
    result1 = result1 && result1[0];

    let monthDifference;

    dbData.map(item => {
      //if (item.LWD != null) {
      //  monthDifference = moment(new Date(curdate)).diff(new Date(item.relievingdate), 'months', true);
     // }
     // else {
        monthDifference =  moment(new Date(curdate)).diff(new Date(item.dateofjoining), 'months', true);
      //}
      if (monthDifference != undefined || monthDifference != null) {
        monthDifference = Number(Math.round(monthDifference.toFixed(2)));
        item.month_at_polestar = monthDifference;
      } else {
        item.month_at_polestar = null;
      }
      item.primary_skill = demandCtrlPath.getResourceMasterNameById(result1, item.primary_skill);
      item.secondary_skill = demandCtrlPath.getResourceMasterNameById(result1, item.secondary_skill);
      item.demand_month = item.opportunity_month && getMonthName(item.opportunity_month) || '';
      delete item.opportunity_month;
      delete item.totalfilledhours;
      delete item.totalbilledhours;
    })

    return res.json({ message: 'Success', state: 1, data: dbData })
  } catch (error) {
    //console.log("err", error)
    return res.json({ message: error, state: -1, data: null });
  }
}

function getMonthName(monthid) {
  // if (monthid > 12 || monthid < 1) {
  //   throw new Error("Invalid monthid!");
  // }
  let monthArray = ["January", "February", "March", "April", "May", "June", "July", "August", "September",
    "October", "November", "December"];
  let month_name;
  month_name = monthArray[+monthid - 1];
  
  return month_name;
}

async function getResourceAdhocReport(req, res) {
  try {
    var obj = req.body;
    obj.action = obj.action ? obj.action : "resource_adhoc_report";
    var result = await query('call usp_resource_demand_report(?)', [JSON.stringify(obj)]);

    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    let dbData = result && result[0];
  
    // dbData.map(item => {
    //   item["opportunity_month_name"] = getMonthName(item.opportunity_month) || "N/A";
    //   delete item.opportunity_month;
    // })

    return res.json({ message: 'Success', state: 1, data: dbData })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}

async function getTimesheetAssignmentFTEReport(req, res) {
  try {
    var obj = req.body;
    obj.fortnightdate = moment(req.body.fortnightdate, 'DD-MM-YYYY').format('YYYY-MM-DD')
    obj.action = "timesheet_assignment_FTE_report";
    var result = await query('call usp_resource_demand_report(?)', [JSON.stringify(obj)]);

    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result && result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}