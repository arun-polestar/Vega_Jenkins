"use strict";

const commonModel = require("../common/Model");
const proc = require("../common/procedureConfig");
const commonCtrl = require("../common/Controller");
var _ = require("underscore");
const lodash = require("lodash");

module.exports = {
  saveConfigMaster: saveConfigMaster,
  changeConfigStatus: changeConfigStatus,
  viewConfigMaster: viewConfigMaster,
  addConfigMapping: addConfigMapping,
  addnoticeperiod: addnoticeperiod,
  viewnoticeconfig: viewnoticeconfig,
  customrole: customrole,
  viewcustomroleconfig: viewcustomroleconfig,
};

function saveConfigMaster(req, res) {
  if (!req.body.createdby) {
    return res.json({ state: 0, message: "Token Not Found", data: null });
  }
  req.body = _.mapObject(req.body, function (val, key) {
    if (val && val.constructor === Array) {
      val = val.toString();
    }
    return val;
  });

  var obj = req.body;
  obj.action = req.body.id ? "edit" : "add";
  var obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService("call usp_hrconfig_operations(?)", [obj])
    .then((results) => {
      return res.json({ state: 1, data: null, message: "Success" });
    })
    .catch((err) => {
      return res.json({ state: -1, data: null, message: err.message || err });
    });
}
function changeConfigStatus(req, res) {
  if (!req.body.id) {
    return res.json({ state: -1, message: "Required Parameters are Missing" });
  }
  let obj = req.body;
  obj.action = "changestatus";
  commonModel
    .mysqlPromiseModelService("call usp_hrconfig_operations(?)", [
      JSON.stringify(obj),
    ])
    .then((results) => {
      ////console.log("ressssssssssss", results);
      return res.json({ state: 1, data: null, message: "Success" });
    })
    .catch((err) => {
      return res.json({ state: -1, data: null, message: err.message || err });
    });
}
function viewConfigMaster(req, res) {
  var obj = req.body;
  obj.action = req.body.action ? req.body.action : "view";
  obj = JSON.stringify(obj);
  commonModel.mysqlModelService(
    "call usp_hrconfig_operations(?)",
    [obj],
    function (error, result) {
      if (error) {
        return res.json({ state: -1, message: error, data: null });
      } else {
        if (
          result &&
          result[1] &&
          result[1][0] &&
          result[1][0].state &&
          result[1][0].state == 1
        ) {
          return res.json({
            data: result[0],
            state: result[1][0].state,
            message: result[1][0].message,
          });
        } else {
          return res
            .status(400)
            .json({ message: "Something went wrong.", state: -1, data: null });
        }
      }
    }
  );
}
async function addConfigMapping(req, res) {
  let obj = req.body.data;
  _.map(obj, function (item) {
    item.createdby = req.body.createdby;
    item.configcode = "configmap";
  });
  obj = await commonCtrl.verifyNull(obj);
  commonModel
    .mysqlPromiseModelService("call usp_hrconfig_mapping_add(?,?)", [
      JSON.stringify(obj),
      req.body.createdby,
    ])
    .then((results) => {
      ////console.log("heyyy", results);
      if (
        results[0] &&
        results[0][0] &&
        results[0][0].match_count &&
        results[0][0].match_count > 0
      ) {
        return res.json({
          state: -1,
          message: `${results[0][0].match_count} record(s) are already are present`,
        });
      }
      return res.json({ state: 1, data: null, message: "Success" });
    })
    .catch((err) => {
      return res.json({ state: -1, data: null, message: err.message || err });
    });
}

function addnoticeperiod(req, res) {
  if (!req.body.createdby) {
    return res.json({ state: 0, message: "Not Valid User", data: null });
  }
  //  if (req.body && req.body.action=='addnoticeperiod'){
  //  var newdata = [];
  //  let mappingData = req.body && req.body.mappingData;

  // //  var mappingData = req.body.mappingData;
  //  mappingData.map(item => {
  //      let departmentid = item.departmentid.split(',');
  //      let designationid = item.designationid.split(',');
  //      departmentid.map(item1 => {
  //          designationid.map(item2=>{
  //             //  //console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@', item);
  //              newdata.push({ ...item, departmentid: item1, designationid: item2});
  //          })
  //          // item.departmentid = item1.departmentid;
  //          // item.mapid = item1.mapid;
  //         //  //console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@', item);
  //         //  newdata.push({ ...item, departmentid: item1.departmentid, mapid: item1.mapid, newmapid: item1.newmapid });
  //      })
  //  })

  //      delete req.body.mappingData;
  //      req.body.mappingData = newdata;
  // }
  let obj = JSON.stringify(req.body);
  ////console.log("oooooooooooooooooooo", obj);
  //    - let obj = await commonCtrl.verifyNull(req.body);
  //    let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService("call usp_noticeperiod_operations(?)", [obj])
    .then((results) => {
      return res.json({ state: 1, data: results[0], message: "Success" });
    })
    .catch((err) => {
      return res.json({ state: -1, data: null, message: err.message || err });
    });
}

function viewnoticeconfig(req, res) {
  if (!req.body.mapid) {
    return res.json({ state: -1, message: "Required Parameters are Missing" });
  }
  let obj = req.body;
  obj.action = "viewnoticeconfig";
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService("call usp_noticeperiod_operations(?)", [obj])
    .then((result) => {
      if (result[0] && result[0].length) {
        ////console.log("inside1111111111");
        let maparr = [];
        lodash.each(result[0], function (item) {
          maparr.push({
            departmentid: item.departmentid,
            departmentname: item.departmentname,
            designationid: item.designationid,
            designationname: item.designationname,
            mapid: item.mapid,
          });
        });
        ////console.log("maparr", maparr);
        result[0][0].mappedData = maparr;

        delete result[0][0].department;
        delete result[0][0].designation;
        delete result[0][0].departmentname;
        delete result[0][0].designationname;
        return res.json({ state: 1, message: "Success", data: result[0][0] });
      } else {
        return res.json({ state: 1, message: "Success", data: result[0] });
      }
    })
    .catch((err) => {
      res.json({ message: err.message, data: err, state: -1 });
    });
}

function customrole(req, res) {
  if (!req.body.createdby) {
    return res.json({ state: 0, message: "Not Valid User", data: null });
  }

  let obj = JSON.stringify(req.body);

  commonModel
    .mysqlPromiseModelService("call usp_customrole_operations(?)", [obj])
    .then((results) => {
      return res.json({ state: 1, data: results[0], message: "Success" });
    })
    .catch((err) => {
      return res.json({ state: -1, data: null, message: err.message || err });
    });
}

function viewcustomroleconfig(req, res) {
  if (!req.body.mapid) {
    return res.json({ state: -1, message: "Required Parameters are Missing" });
  }
  let obj = req.body;
  obj.action = "viewcustomroleconfig";
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService("call usp_customrole_operations(?)", [obj])
    .then((result) => {
      if (result[0] && result[0].length) {
        ////console.log("inside1111111111");
        let maparr = [];
        lodash.each(result[0], function (item) {
          maparr.push({
            departmentid: item.departmentid,
            departmentname: item.departmentname,
            // designationid: item.designationid,
            // designationname: item.designationname,
            mapid: item.mapid,
          });
        });
        ////console.log("maparr", maparr);
        result[0][0].mappedData = maparr;

        delete result[0][0].departmentid;
        // delete result[0][0].designation
        delete result[0][0].departmentname;
        // delete result[0][0].designationname
        return res.json({ state: 1, message: "Success", data: result[0][0] });
      } else {
        return res.json({ state: 1, message: "Success", data: result[0] });
      }
    })
    .catch((err) => {
      res.json({ message: err.message, data: err, state: -1 });
    });
}
