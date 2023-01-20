const moment = require("moment");
const today = moment().format("YYYY-MM-DD");
let { cardCounts, empAgeRange, empExperienceRange, location, department, designation, band, separation_per_dept, separation_per_desg, cardCountAdditional} = require("./policy.model");

module.exports = {
  getEmployeeCount,
  hiresAndSeparations,
  yetToJoinCandidates,
  getAttritionData
}

// employee count on different basis like gender, notice period, probation period, hired, left employees

function getEmployeeCount(empData) {
  let ageSum = 0, tenureSum = 0, relievedCount = 0, ageCounter = 0;

// due to referencing of all model objects in model.js file, parsing of strigified modal objects is required
  
  let cardCountsObj = JSON.parse(JSON.stringify(cardCounts));
  let locationObj = JSON.parse(JSON.stringify(location));
  let departmentObj = JSON.parse(JSON.stringify(department));
  let designationObj = JSON.parse(JSON.stringify(designation));
  let bandObj = JSON.parse(JSON.stringify(band));
  let empAgeRangeObj = JSON.parse(JSON.stringify(empAgeRange));
  let empExperienceRangeObj = JSON.parse(JSON.stringify(empExperienceRange));

  let locationDepartment = {};
  for (let ele in locationObj) {
    locationDepartment[`${ele}`] = { ...departmentObj } ;
  }
  

  empData.forEach(item => {
    var emp_age, emp_tenure, emp_exp;

    if ((item.relievingdate == null) || (item.relievingdate != null && item.relievingdate > item.fyenddate)) {

      // calculating every employee age in month and adding them up to get total sum of age  
    
      if (item.fyenddate && item.dateofbirth != null) {
        ageCounter++;
        emp_age = moment(new Date(item.fyenddate)).diff(new Date(item.dateofbirth), 'months', true);
        emp_age = ((emp_age || 0) / 12).toFixed(2);
        ageSum += Number(emp_age);
      }

    
      if (item.gender == "M") {
        cardCountsObj["maleEmp"]++;
      } else if (item.gender == "F") {
        cardCountsObj["femaleEmp"]++;
      } else {
        cardCountsObj["otherEmp"]++;
      }
      if (item.dateofconfirmation == null) {
        cardCountsObj["probation"]++;
      }
      if (item.isOnNotice == 1 && item.relievingdate == null) {
        cardCountsObj["notice"]++;
      }
      if (item.employee_type == 1) {
        cardCountsObj["lateral"]++;
      } else {
        cardCountsObj["freshers"]++;
      }
      if (item.ifPermanent == 1) {
        cardCountsObj["permanent"]++;
      } else {
        cardCountsObj["contractual"]++;
      }
      if (item.isbillable == 1) {
        cardCountsObj["billable"]++;
      } else {
        cardCountsObj["non-billable"]++;
      }
      
      // location department wise employee count
      
      if (item && item.location && item.department) {
        if (locationDepartment && locationDepartment[item.location]) {
          locationDepartment[item.location][item.department] = locationDepartment[item.location][item.department] + 1;
        }
      }


      // age range wise employee count
    
      if (emp_age >= 0 && emp_age <= 20) {
        empAgeRangeObj["age_range0-20"]++;
      } else if (emp_age >= 21 && emp_age <= 30) {
        empAgeRangeObj["age_range21-30"]++;
      } else if (emp_age >= 31 && emp_age <= 40) {
        empAgeRangeObj["age_range31-40"]++;
      } else if (emp_age >= 41 && emp_age <= 50) {
        empAgeRangeObj["age_range41-50"]++;
      } else {
        empAgeRangeObj["age_range51+"];
      }

      // experience range wise employee count
    
      if (item.fyenddate && item.dateofjoining != null) {
        emp_exp = moment(new Date(item.fyenddate)).diff(new Date(item.dateofjoining), 'months', true);
        emp_exp = (emp_exp / 12).toFixed(2);
      }
    
      if (emp_exp >= 0 && emp_exp <= 2) {
        empExperienceRangeObj["exp_range0-2"]++;
      } else if (emp_exp > 2 && emp_exp <= 6) {
        empExperienceRangeObj["exp_range2-6"]++;
      } else if (emp_exp > 6 && emp_exp <= 10) {
        empExperienceRangeObj["exp_range6-10"]++;
      } else if (emp_exp > 10 && emp_exp <= 15) {
        empExperienceRangeObj["exp_range10-15"]++;
      } else {
        empExperienceRangeObj["exp_range15+"]++;
      }

      // location wise employee count
      if (item.location) {
        locationObj[item.location] = locationObj[item.location] ? locationObj[item.location] + 1 : 1;
      }
      // department wise employee count
      if (item.department) {
        departmentObj[item.department] = departmentObj[item.department] ? departmentObj[item.department] + 1 : 1;
      }
      // designation wise employee count
      if (item.designation) {
        designationObj[item.designation] = designationObj[item.designation] ? designationObj[item.designation] + 1 : 1;
      }
      // grade/band wise employee count
      if (item.grade) {
        bandObj[item.grade] = bandObj[item.grade] ? bandObj[item.grade] + 1 : 1;
      }
    }
    // calculating every employee(whose relieving date is not null) tenure
      // in month and adding them up to get total sum of tenure and also count of such employees
    
    if ((item.fyenddate && item.relievingdate != null && item.relievingdate <= item.fyenddate &&
      item.ninety_days_ref == 1) ||
      (item.fyenddate && item.relievingdate == null && item.dateofjoining && item.dateofjoining <= today
        && item.ninety_days_ref == 1)) {
        relievedCount++;
        emp_tenure = moment(new Date(today)).diff(new Date(item.dateofjoining), 'days', true);
        emp_tenure = ((emp_tenure) / 365).toFixed(2);
        tenureSum += Number(emp_tenure);
      }
  })
  // total headcount = sum of male, female and others employees
  cardCountsObj["headcount"] = cardCountsObj["maleEmp"] + cardCountsObj["femaleEmp"] + cardCountsObj["otherEmp"];
  
  // average age = sum of all employees age / total no of employees
  cardCountsObj["averageAge"] = Number((ageSum / ageCounter).toFixed(2));
  // average tenure = sum of all employees tenure / count of relieved employees
  cardCountsObj["averageTenure"] = Number((tenureSum / relievedCount).toFixed(2));

  if (isNaN(cardCountsObj["averageTenure"])) {
    cardCountsObj["averageTenure"] = 0;
  }

  return {
    cardCountsObj,
    empAgeRange: empAgeRangeObj,
    empExperienceRange: empExperienceRangeObj,
    location: locationObj,
    department: departmentObj,
    designation: designationObj,
    band: bandObj,
    locationDepartment: locationDepartment
  };
}

function hiresAndSeparations(empData) {

  let separation_per_deptObj = JSON.parse(JSON.stringify(separation_per_dept));
  let separation_per_desgObj = JSON.parse(JSON.stringify(separation_per_desg));
  let cardCountAdditionalObj = JSON.parse(JSON.stringify(cardCountAdditional));

  empData.forEach(item => {

  // count of hired employee
    if (item.dateofjoining >= item.fystartdate && item.dateofjoining <= item.fyenddate) {
      cardCountAdditionalObj["hires"]++;
    }
  // count of all separated employees whose relieving date lies in the range fy start date and fy end date
  // as well as month start date and month end date (monthwise condition is applied on db end)
    
    if (item.fyenddate && item.relievingdate != null && item.relievingdate >= item.fystartdate && item.relievingdate <= item.fyenddate) {
      cardCountAdditionalObj["separations"]++;
    }

    if (item.fyenddate && item.relievingdate != null && item.relievingdate >= item.fystartdate && item.relievingdate <= item.fyenddate && item.department) {
      separation_per_deptObj[item.department] = separation_per_deptObj[item.department] ? separation_per_deptObj[item.department] + 1 : 1;
    }

    if (item.fyenddate && item.relievingdate != null && item.relievingdate >= item.fystartdate && item.relievingdate <= item.fyenddate && item.designation) {
      separation_per_desgObj[item.designation] = separation_per_desgObj[item.designation] ? separation_per_desgObj[item.designation] + 1 : 1;
    }
  })
  return {
    "separation_per_dept": separation_per_deptObj, "separation_per_desg": separation_per_desgObj,
    cardCountAdditional: cardCountAdditionalObj
  };
}


function yetToJoinCandidates(empData) {
  return empData[0].count;
}

function getAttritionData(attritionData) {
  let startHeadcountData = attritionData.filter(item=>item.orderby == 1);
//console.log("start", startHeadcountData);

let dept_desg_Attrition = [];
let dept_desg_CumulativeLeft = [];

for(let i=0; i<attritionData.length;i++){
    
  let item = attritionData[i];
  let startCount;
  if (item && item.departmentid) {
    startCount = startHeadcountData.find(ele => ele.departmentid == item.departmentid).fystart_headcount;
  } else {
    startCount = startHeadcountData.find(ele => ele.designationid == item.designationid).fystart_headcount;
  }
  //console.log("start", startCount);
  let avg = (startCount + item.fyend_headcount) / 2;
  let index;
  if (item && item.departmentid) {
    index = dept_desg_CumulativeLeft.findIndex(ele=>ele.departmentid == item.departmentid);
  } else {
    index = dept_desg_CumulativeLeft.findIndex(ele=>ele.designationid == item.designationid);
  }
    
    if(index>-1){
        dept_desg_CumulativeLeft[index].cumulativeLeft+=item.separated;
    } else {
      if (item && item.departmentid) {
        dept_desg_CumulativeLeft.push({"departmentid": item.departmentid, "cumulativeLeft":item.separated});
        index = dept_desg_CumulativeLeft.findIndex(ele=>ele.departmentid == item.departmentid);
      } else {
        dept_desg_CumulativeLeft.push({"designationid": item.designationid, "cumulativeLeft":item.separated});
        index = dept_desg_CumulativeLeft.findIndex(ele=>ele.designationid == item.designationid);
      }
        
    }
    let cumulativeVal = dept_desg_CumulativeLeft[index].cumulativeLeft;
    let attrition_rate = Number(((cumulativeVal/avg)*100).toFixed(5));
  let annualized_rate = Number(((attrition_rate * 12) / item.orderby).toFixed(2));
  
  if (isNaN(annualized_rate)) {
    annualized_rate = 0.00;
}

    let arrObj = {
        "month": item.month,
        "month_name": item.month_name,
        "year": item.year,
        "orderby": item.orderby,
        "exit_employee": item.separated,
      //  "cumulativeLeftValue": cumulativeVal,
      // annualized_rate is used as attrition rate (frontend)
        "attrition_rate": annualized_rate,
      //  "startCount": startCount,
      //  "fystart_headcount": item.fystart_headcount,
      //  "fyend_headcount": item.fyend_headcount
  };
  if (item && item.departmentid) {
    arrObj["departmentid"] = item.departmentid;
    arrObj["departmentname"] = item.departmentname;
  } else {
    arrObj["designationid"] = item.designationid;
    arrObj["designationname"] = item.designationname;
  }
    dept_desg_Attrition.push(arrObj); 
}
  return dept_desg_Attrition;
}