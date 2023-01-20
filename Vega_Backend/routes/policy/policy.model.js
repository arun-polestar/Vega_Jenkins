"use strict";
const query = require('../common/Model').mysqlPromiseModelService;

let location = {}, department = {}, designation = {}, band = {},
  separation_per_dept = {}, separation_per_desg = {};

async function getConfiguration() {
  try {
      let obj = { "action": "get_configuration" };
      obj = JSON.stringify(obj);
      var result = await query("call usp_hranalytics_dashboard(?)", [obj]);
  
      result[0].map(item => {
        if (item.configcode == "location") {
          location[`${item.configvalue1}`] = 0;
        } else if (item.configcode == "department") {
          department[`${item.configvalue1}`] = 0;
          separation_per_dept[`${item.configvalue1}`] = 0;
        } else if (item.configcode == "designation") {
          designation[`${item.configvalue1}`] = 0;
          separation_per_desg[`${item.configvalue1}`] = 0;
        } else if (item.configcode == "band") {
          band[`${item.configvalue1}`] = 0;
        }
      })
  
    } catch (err) {
      //console.log("errr", err);
      return err;
    }
}


const cardCounts = {
  "maleEmp": 0,
  "femaleEmp": 0,
  "otherEmp": 0,
  "headcount": 0,
  "probation": 0,
  "notice": 0,
  "lateral": 0,
  "freshers": 0,
  "permanent": 0,
  "contractual": 0,
  "averageAge": 0,
  "averageTenure": 0,
  "yetToJoin": 0,
  "billable": 0,
  "non-billable": 0
}

const cardCountAdditional = {
  "hires": 0,
  "separations": 0,
}

const empAgeRange = {
  "age_range0-20": 0,
  "age_range21-30": 0,
  "age_range31-40": 0,
  "age_range41-50": 0,
  "age_range51+": 0
}

const empExperienceRange = {
  "exp_range0-2": 0,
  "exp_range2-6": 0,
  "exp_range6-10": 0,
  "exp_range10-15": 0,
  "exp_range15+": 0,
}

module.exports = {
  getConfiguration,
  cardCounts,
  cardCountAdditional,
  empAgeRange,
  empExperienceRange,
  location,
  department,
  designation,
  band,
  separation_per_dept,
  separation_per_desg
}