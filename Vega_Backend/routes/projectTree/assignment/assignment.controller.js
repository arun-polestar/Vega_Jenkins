const commonCtrl = require('../../../routes/common/Controller');
const query = require('../../../routes/common/Model').mysqlPromiseModelService
const _ = require('lodash');
const { getResourceMapping, modifyWbsList } = require('../WBS/wbs.controller');
const { toLength } = require('lodash');

module.exports = {
  addWBSResource,
  getAllWbsResource,
  getClientProjectMapping
}

function transformResourceMapping(resourceData) {
  const updatedResourceData = [];
  for (let i = 0; i < resourceData.length; i++) {
    let resource = resourceData[i];
    for (let key in resource.months[0]) {
      if (resource.months[0][key].hasOwnProperty("f1")) {
        updatedResourceData.push({
          userid: resource.resource_id,
          wbsid: resource.header_id,
          ename: resource.ename,
          year: key.split(" ")[1],
          month_name: key.split(" ")[0],
          fortnight_number: 1,
          fte: resource.months[0][key]["f1"]
        })
      }
      if (resource.months[0][key].hasOwnProperty("f2")) {
        updatedResourceData.push({
          userid: resource.resource_id,
          wbsid: resource.header_id,
          ename: resource.ename,
          year: key.split(" ")[1],
          month_name: key.split(" ")[0],
          fortnight_number: 2,
          fte: resource.months[0][key]["f2"]
        })
      }
    }
  }
  return updatedResourceData
}

async function transformClientProjectMapping(projectsData) {
  let clientWiseProject = []
  for (let i = 0; i < projectsData.length; i++) {
    let project = projectsData[i]
    let clientIndex = _.findIndex(clientWiseProject, item => item.client_id === project.client_id)
    if (clientIndex > -1) {
      clientWiseProject[clientIndex].projects.push({ label: project.project_name, value: project.project_id })
    } else {
      clientWiseProject.push(
        {
          client_id: project.client_id,
          client_name: project.client_name,
          label: project.client_name,
          value: project.client_id,
          projects: [{
            label: project.project_name,
            value: project.project_id
          }]
        })
    }
  }
  return clientWiseProject
}

async function addWBSResource(req, res) {
  try {
    let obj2 = req.body
    let obj = transformResourceMapping(req.body.resources)
    let [results] = await query('call usp_mstproject_assignment(?,?)', [JSON.stringify(obj), JSON.stringify(obj2)])
    return res.json({ state: 1, message: results[0] && results[0].message })
  } catch (err) {
    return res.json({ state: -1, message: err.message || err || "Something went wrong", err: err })
  }
}

async function getAllWbsResource(req, res) {
  try {
    let reqData = req.body;
    reqData.reqtype = 'wbs_resource_assignment'
    let results = await query('call usp_mstwbs_operations(?)', [JSON.stringify(reqData)])
    let data = {
      newWbsData: await getResourceMapping(results[0]),
      newFiltersData: await modifyWbsList(results[1])
    }
    return res.json({ state: 1, message: 'Success', data: data })
  } catch (err) {
    return res.json({ state: -1, message: "Something went wrong", err: err })
  }
}

async function getClientProjectMapping(req, res) {
  try {
    let reqData = req.body
    reqData.reqtype = 'client_project_mapping'
    let [results] = await query('call usp_mstwbs_operations(?)', [JSON.stringify(reqData)])
    let transformedData = await transformClientProjectMapping(results)
    return res.json({ state: 1, message: "Success", data: transformedData })
  } catch (err) {
    return res.json({ state: -1, message: "Something went wrong", err: err })
  }
}