const commonModel = require('../../../routes/common/Model');
const commonCtrl = require('../../../routes/common/Controller');
const query = require('../../../routes/common/Model').mysqlPromiseModelService
const _ = require('lodash');

module.exports = {
  addWbs: addWbs,
  viewwbslist: viewwbslist,
  getWBSResourceMapping,
  getResourceMapping,
  modifyWbsList,
  getWBSResourceWise
}
async function addWbs(req, res) {
  if (!req.body.createdby || !req.body.reqtype) {
    return res.json({ state: -1, message: "Send required data" });
  } else {
    if (req.body.reqtype == 'add' || req.body.reqtype == 'edit') {
      var obj = req.body.wbs;
      obj.projectheaderid = req.body.projectheaderid;
      obj.reqtype = req.body.reqtype;
      obj.wbsId = req.body.wbsId;
      obj.createdby = req.body.createdby;
      obj = await commonCtrl.verifyNull(obj);
    }
    else {
      var obj = req.body;
      obj = await commonCtrl.verifyNull(obj);
    }
    obj = JSON.stringify(obj);
    commonModel.mysqlModelService('call usp_mstwbs_operations(?)', [obj], function (err, results) {
      if (err) {
        return res.json({ state: -1, message: err, data: null });
      } else if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == -1) {
        return res.json({ state: results[1][0].state, message: results[1][0].message, data: null });
      } else if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
        return res.json({ state: 1, message: "Success", data: results });
      } else {
        return res.json({ state: -1, message: "Something went Wrong", data: null });
      }
    });
  }
}

async function getResourceMapping(resourceData) {
  const updatedResourceData = []
  for (let i = 0; i < resourceData.length; i++) {
    const resource = resourceData[i];
    let index = _.findIndex(updatedResourceData, (item) => item.resource_id === resource.resource_id
      && item.header_id === resource.header_id);

    if (index == -1) {
      let obj = { ...resource }
      obj.months = []
      obj.months.push(
        {
          [`${resource.month_name} ${resource.year}`]: { [`${resource.fortnight_number}`]: resource.fte }
        }
      )
      updatedResourceData.push(obj)
    }
    else {
      if (updatedResourceData[index].months[0].hasOwnProperty(`${resource.month_name} ${resource.year}`)) {
        updatedResourceData[index].months[0][`${resource.month_name} ${resource.year}`] = { ...updatedResourceData[index].months[0][`${resource.month_name} ${resource.year}`], [`${resource.fortnight_number}`]: resource.fte }
      } else {
        updatedResourceData[index].months[0][`${resource.month_name} ${resource.year}`] = { [`${resource.fortnight_number}`]: resource.fte }
      }
      // let monthIndex = getIndexIfObjWithOwnAttr(updatedResourceData[index].months,`${resource.month_name} ${resource.year}`)
      // if(monthIndex == -1){
      //     updatedResourceData[index].months.push({
      //         [`${resource.month_name} ${resource.year}`]: {[`${resource.fortnight_number}`]:resource.fte}
      //     })
      // }else{
      //     updatedResourceData[index].months[monthIndex][`${resource.month_name} ${resource.year}`] = {...updatedResourceData[index].months[monthIndex][`${resource.month_name} ${resource.year}`],
      //     [`${resource.fortnight_number}`]:resource.fte}
      // }
    }
  }
  return updatedResourceData
}
function getIndexIfObjWithOwnAttr(array, attr) {
  for (var i = 0; i < array.length; i++) {
    if (array[i].hasOwnProperty(attr)) {
      return i;
    }
  }
  return -1;
}

function modifyWbsList(wbsData) {
  const updatedWbsData = []
  for (let i = 0; i < wbsData.length; i++) {
    let wbs = wbsData[i];
    let obj = {
      ...wbs
    }
    obj.selResourceVal = obj.resources && obj.resources.split(',')
    obj.selFyVal = obj.fy && obj.fy.split(',')
    obj.selYearVal = obj.year && obj.year.split(',')
    obj.selMonthVal = obj.month && obj.month.split(',')
    updatedWbsData.push(obj)
  }
  return updatedWbsData
}

function viewwbslist(req, res) {
  if (!req.body.createdby || !req.body.projectheaderid || !req.body.reqtype) {
    return res.json({ state: -1, message: "Send required data" });
  }
  var obj = req.body;
  commonModel.mysqlModelService('call usp_mstwbs_operations(?)', [JSON.stringify(obj)], async function (err, results) {
    if (err) {
      return res.json({ state: -1, message: err, data: null });
    } else if (results && results[6] && results[6][0] && results[6][0].state && results[6][0].state == 1) {
      var results1 = {
        booklevel: results[0][0].booklevel,
        ifexist: results[0][0].ifexist,
        wbslist: results[1],
        data: results[2],
        date: results[3],
        wbsdates: results[6],
        newWbsData: await getResourceMapping(results[4]),
        newFiltersData: modifyWbsList(results[5])
      }
      return res.json({ state: results[6][0].state, message: results[6][0].message, data: results1 });
    } else {
      return res.json({ state: -1, message: "somethng went wrong", data: null });
    }
  });
}

async function getWBSResourceMapping(req, res) {
  try {
    if (!req.body.years || !req.body.wbsId || !req.body.userid || !req.body.months) {
      return res.json({ state: -1, message: "Required parameters missing" });
    }
    let reqData = req.body;
    reqData.reqtype = 'wbs_mapping'
    console.log(reqData)
    let [results] = await query('call usp_mstwbs_operations(?)', [JSON.stringify(reqData)])
    console.log(results);
    let wbsMapping = await getResourceMapping(results)
    return res.json({ state: 1, message: 'Success', data: wbsMapping })
  } catch (err) {
    console.log(err)
    return res.json({ state: 1, message: "Something went wrong", err: err })
  }
}

async function getWBSResourceWise(req, res) {
  try {
    if (!req.body.userid) {
      return res.json({ state: -1, message: "Required Parameters are missing" })
    }
    let reqData = req.body;
    reqData.fortnightdate = moment(req.body.fortnightdate, 'DD-MM-YYYY').format('YYYY-MM-DD')
    reqData.reqtype = 'wbs_resource_wise_assignment'
    let results = await query('call usp_mstwbs_operations(?)', [JSON.stringify(reqData)])
    let data = {
      newWbsData: results[0]
    }
    return res.json({ state: 1, message: 'Success', data: data })
  } catch (err) {
    return res.json({ state: -1, message: "Something went wrong", err: err })
  }
}