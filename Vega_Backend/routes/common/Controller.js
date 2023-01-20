// 'use strict';
const commonModel = require("./Model");
const proc = require("./procedureConfig");
var _ = require("underscore");
const moment = require("moment");
const query = require("./Model").mysqlPromiseModelService;
const mailservice = require("../../services/mailerService");
const async = require("async");
var config = require("../../config/config");

module.exports = {
  getMultipleMasters: getMultipleMasters,
  getUserTypeahead: getUserTypeahead,
  getMastersList: getMastersList,
  viewMaster: viewMaster,
  saveMaster: saveMaster,
  lazyLoading: lazyLoading,
  getLemonadeMaster: getLemonadeMaster,
  getCountryStateList: getCountryStateList,
  saveHrMaster: saveHrMaster,
  viewHrMaster: viewHrMaster,
  getExpenseMaster: getExpenseMaster,
  verifyNull: verifyNull,
  cascadeView: cascadeView,
  cascadeOperation: cascadeOperation,
  cascadeMaster: cascadeMaster,
  configusers: configusers,
  saveRMSMaster: saveRMSMaster,
  viewRMSMaster: viewRMSMaster,
  mappingAddEdit: mappingAddEdit,
  hrmConfigMaster: hrmConfigMaster,
  hrmConfigView: hrmConfigMaster,
  convertDateFormat: convertDateFormat,
  viewEmailLogs: viewEmailLogs,
  clearEmailLogs: clearEmailLogs,
  clearEmailLogsByUser: clearEmailLogsByUser,
  resendFailedMails: resendFailedMails,
  sendUserCreateEmail: sendUserCreateEmail,
  modulesession,
  ordinalSuffixOf,
};

function ordinalSuffixOf(i) {
  var j = i % 10,
    k = i % 100;
  if (j == 1 && k != 11) {
    return i + "st";
  }
  if (j == 2 && k != 12) {
    return i + "nd";
  }
  if (j == 3 && k != 13) {
    return i + "rd";
  }
  return i + "th";
}

function getMastersList(req, res) {
  if (!req.body) {
    return res.json({
      message: "Required parameters are missing.",
      state: -1,
      data: null,
    });
  }
  var obj = req.body;
  obj = JSON.stringify(obj);
  commonModel.mysqlModelService(
    "call usp_master_data(?)",
    [obj],
    function (error, result) {
      if (error) {
        return res.json({
          state: -1,
          message: error,
          data: null,
        });
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
          return res.status(400).json({
            message: "Something went wrong.",
            state: -1,
            data: null,
          });
        }
      }
    }
  );
}

async function getMultipleMasters(req, res) {
  try {
    if (!req.body || !req.body.configcode) {
      return res.json({
        message: "Required parameters are missing.",
        state: -1,
        data: null,
      });
    }
    // let cacheData = await rdb.getClientwiseKey(req.body.configcode)
    // if (cacheData) {
    //   return res.json({ state: 1, message: 'Success', data: JSON.parse(cacheData) })
    // } else {
    var obj = req.body;
    obj = JSON.stringify(obj);
    commonModel.mysqlModelService(
      proc.fetchmaster,
      [obj],
      function (error, result) {
        if (
          result &&
          result[1] &&
          result[1][0] &&
          result[1][0].state &&
          result[1][0].state == 1
        ) {
          //rdb.setClientwiseKey(req.body.configcode, JSON.stringify(result[0]), 24 * 60 * 60)
          return res.json({
            data: result[0],
            state: result[1][0].state,
            message: result[1][0].message,
          });
        } else {
          return res.status(400).json({
            message: "Something went wrong.",
            state: -1,
            data: null,
          });
        }
      }
    );
    //}
  } catch (err) {
    return res.status(400).json({
      message: "Something went wrong.",
      state: -1,
      data: null,
    });
  }
}

function getLemonadeMaster(req, res) {
  if (!req.body || !req.body.configcode) {
    return res.json({
      message: "Required parameters are missing.",
      state: -1,
      data: null,
    });
  }
  var obj = req.body;
  obj.cronjob = 1;
  obj = JSON.stringify(obj);
  commonModel.mysqlModelService(
    proc.fetchmaster,
    [obj],
    function (error, result) {
      if (error) {
        return res.json({
          state: -1,
          message: error,
          data: null,
        });
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
          return res.status(400).json({
            message: "Something went wrong.",
            state: -1,
            data: null,
          });
        }
      }
    }
  );
}

function viewMaster(req, res) {
  var obj = req.body;
  obj = JSON.stringify(obj);
  commonModel.mysqlModelService(
    "call usp_master_data(?)",
    [obj],
    function (error, result) {
      if (error) {
        return res.json({
          state: -1,
          message: error,
          data: null,
        });
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
          return res.status(400).json({
            message: "Something went wrong.",
            state: -1,
            data: null,
          });
        }
      }
    }
  );
}

function getUserTypeahead(req, res) {
  if (!req.body || !req.body.createdby) {
    return res.json({
      message: "Required parameters are missing.",
      state: -1,
      data: null,
    });
  }
  var obj = JSON.stringify({
    createdby: req.body.createdby,
    offlineUsers: req.body && req.body.offlineUsers,
    nonlicense: req.body.nonlicense ? 1 : 0,
  });
  commonModel.mysqlModelService(
    proc.employeeList,
    [obj],
    function (err, results) {
      if (err) {
        return res.json({
          message: err,
          state: -1,
          data: null,
        });
      } else {
        if (
          results &&
          results[1] &&
          results[1][0] &&
          results[1][0].state &&
          results[1][0].state == 1
        ) {
          return res.json({
            data: results[0],
            state: results[1][0].state,
            message: results[1][0].message,
          });
        } else {
          return res.status(400).json({
            message: "Something went wrong.",
            state: -1,
            data: null,
          });
        }
      }
    }
  );
}

function saveMaster(req, res) {
  if (!req.body.createdby) {
    return res.json({
      state: 0,
      message: "Token Not Found",
      data: null,
    });
  }
  req.body = _.mapObject(req.body, function (val, key) {
    if (val && val.constructor === Array) {
      val = val.toString();
    }
    return val;
  });
  var obj = req.body;
  if (obj.configcode == "offerLetterParams") {
    obj.configvalue2 = "";
    let j = obj["configvalue1"].split(" ");
    j[0] = j[0].toLowerCase();
    for (var i = 0; i < j.length; i++) {
      obj.configvalue2 += j[i];
    }
  }

  var procedure = obj.id ? proc.configedit : proc.configadd;
  var obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(procedure, [obj])
    .then((results) => {
      res.json({
        state: 1,
        data: null,
        message: "Success",
      });
    })
    .catch((err) => {
      res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}

function viewHrMaster(req, res) {
  var obj = req.body;
  obj = JSON.stringify(obj);
  commonModel.mysqlModelService(
    "call usp_mstportalconfig_hr_operation(?)",
    [obj],
    function (error, result) {
      if (error) {
        return res.json({
          state: -1,
          message: error,
          data: null,
        });
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
          return res.status(400).json({
            message: "Something went wrong.",
            state: -1,
            data: null,
          });
        }
      }
    }
  );
}

function saveHrMaster(req, res) {
  if (!req.body.createdby) {
    return res.json({
      state: 0,
      message: "Token Not Found",
      data: null,
    });
  }
  req.body = _.mapObject(req.body, function (val, key) {
    if (val && val.constructor === Array) {
      val = val.toString();
    }
    return val;
  });
  var obj = req.body;
  ////console.log("iobjjjjjjjjjjjjjjjjj", req.body.configvalue2);
  var obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService("call usp_mstportalconfig_hr_operation(?)", [obj])
    .then((results) => {
      res.json({
        state: 1,
        data: null,
        message: "Success",
      });
    })
    .catch((err) => {
      res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}

/*---------------------------------------------------------------------------------------------*
 *                                       LAZY LOADING                                          *
 *---------------------------------------------------------------------------------------------*/

function lazyLoading(tabledata, body) {
  let filterKeys = [];
  let globalFilterKeys = [];
  let filterValues = [];
  let filteredObj = tabledata;
  let count = filteredObj.length;
  let prefix = "search";
  if (!tabledata || !body) {
    return {
      data: filteredObj,
      count: count,
    };
  }
  _.map(body, function (val, key) {
    if (key.slice(0, 6) == prefix) {
      if (body[`${key}`]) {
        filterKeys.push(key.replace(prefix, ""));
        filterValues.push(body[`${key}`]);
      }
      globalFilterKeys.push(key.replace(prefix, ""));
    }
  });

  //Searching...
  if (body.globalsearchkey) {
    filteredObj = globalFilter(
      tabledata,
      body.globalsearchkey,
      globalFilterKeys,
      0
    );
    count = filteredObj.length;
  }
  if (filterKeys.length && filterValues.length) {
    filteredObj = individualFilter(filteredObj, filterKeys, filterValues);
    count = filteredObj.length;
  }
  //Sorting Only if Sort field is given...
  if (body.sortField && body.sortOrder) {
    filteredObj = _.sortBy(filteredObj, function (obj) {
      if (isNaN(obj[`${body.sortField}`])) {
        return String(obj[`${body.sortField}`]).toLowerCase().trim();
      } else {
        if (
          obj[`${body.sortField}`] === null ||
          String(obj[`${body.sortField}`]).trim() === ""
        ) {
          return "-"; // "-" has ascii value less than any number
        } else {
          return Number(obj[`${body.sortField}`]);
        }
      }
    });
    if (body.sortOrder === -1) filteredObj.reverse();
  }
  //Applying Limit on record to be sent
  var data = filteredObj.slice(
    body.startRecord ? body.startRecord : 0,
    body.limit ? body.limit + body.startRecord : 100000
  );
  return {
    data: data,
    count: count,
  };
}

function globalFilter(table, search, keys, searchType) {
  var lowSearch, searchData;
  return _.filter(table, function (row) {
    return keys.some((key) => {
      if (typeof search !== "object") {
        if (key.slice(0, 5) == "date_") {
          key = key.replace("date_", "");

          if (_.isDate(row[key])) {
            searchData = formatedDate(row[key]);
          } else {
            searchData = String(row[key]).slice(0, 10);
          }
          lowSearch = String(search);
        } else {
          searchData = String(row[key]).toLowerCase();
          lowSearch = String(search).toLowerCase();
        }
        if (
          (key == "tenthPercentage" ||
            key == "twelfthPercentage" ||
            key == "highestDegreePercentage") &&
          !isNaN(searchData) &&
          !isNaN(lowSearch)
        ) {
          return Number(row[key]) >= Number(lowSearch);
        }
        if (searchType) {
          searchData = String(searchData).split(",");
          lowSearch = String(lowSearch);
          return searchData.indexOf(lowSearch) >= 0;
        }
        return searchData.includes(lowSearch);
      } else if (typeof search === "object" && search.start && search.end) {
        if (
          key.slice(0, 5) == "date_" &&
          moment(search.start, "YYYY-MM-DD", true).isValid() &&
          moment(search.end, "YYYY-MM-DD", true).isValid()
        ) {
          key = key.replace("date_", "");
          searchData = _.isDate(row[key])
            ? row[key]
            : String(row[key]).slice(0, 10);
          searchData = new Date(formatedDate(searchData));
          search.start = new Date(search.start);
          search.end = new Date(search.end);
          return +search.start <= +searchData && +search.end >= +searchData;
        }
        return true;
      }
      return true;
    });
  });
}

function formatedDate(key) {
  var key = new Date(key);
  let year = key.getFullYear();
  let month = "" + (key.getMonth() + 1);
  let date = "" + key.getDate();
  if (month.length < 2) month = "0" + month.toString();
  if (date.length < 2) date = "0" + date.toString();
  return year.toString() + "-" + month + "-" + date;
}

function individualFilter(dbresult, searchkeys, searchvalues) {
  for (let index = 0; index < searchkeys.length; index++) {
    //Search from dropdown selections
    if (searchvalues[index] instanceof Array && searchvalues[index].length) {
      let dropDownSearchResult = [];
      for (let i = 0; i < searchvalues[index].length; i++) {
        let tempResult = globalFilter(
          dbresult,
          searchvalues[index][i],
          [searchkeys[index]],
          1
        ); //for
        dropDownSearchResult = dropDownSearchResult.concat(tempResult);
        dropDownSearchResult = [...new Set(dropDownSearchResult)];
      }
      dbresult = dropDownSearchResult;
    } else {
      dbresult = globalFilter(
        dbresult,
        searchvalues[index],
        [searchkeys[index]],
        0
      );
    }
  }
  return dbresult;
}

/*--------------------------------------LAZY LOADING END---------------------------------------*/
function getCountryStateList(req, res) {
  if (!req.body) {
    return res.json({
      message: "Required parameters are missing.",
      state: -1,
      data: null,
    });
  }
  var obj = req.body;
  obj.action = "countrystatelist";
  obj = JSON.stringify(obj);
  commonModel.mysqlModelService(
    "call usp_master_data(?)",
    [obj],
    function (error, result) {
      if (error) {
        return res.json({
          state: -1,
          message: error,
          data: null,
        });
      } else {
        if (
          result &&
          result[2] &&
          result[2][0] &&
          result[2][0].state &&
          result[2][0].state == 1
        ) {
          return res.json({
            countries: result[0],
            states: result[1],
            state: result[2][0].state,
            message: result[2][0].message,
          });
        } else {
          return res.status(400).json({
            message: "Something went wrong.",
            state: -1,
            data: null,
          });
        }
      }
    }
  );
}

/******************************Expense Master********************************************/

function getExpenseMaster(req, res) {
  if (!req.body || !req.body.configcode) {
    return res.json({
      message: "Required parameters are missing.",
      state: -1,
      data: null,
    });
  }
  var obj = req.body;
  obj.action = "fetchallmaster";
  obj = JSON.stringify(obj);
  commonModel.mysqlModelService(
    proc.expenseProc,
    [obj],
    function (error, result) {
      if (error) {
        return res.json({
          state: -1,
          message: error,
          data: null,
        });
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
          return res.status(400).json({
            message: "Something went wrong.",
            state: -1,
            data: null,
          });
        }
      }
    }
  );
}

function verifyNull(data) {
  var value;
  for (var keys in data) {
    value = data[keys];
    if (
      value === "null" ||
      value === null ||
      value === "" ||
      typeof value === "undefined" ||
      (value instanceof Object && Object.keys(value).length == 0)
    ) {
      delete data[keys];
    }
    if (value instanceof Object) value = verifyNull(value);
  }
  return data;
}

function cascadeView(req, res) {
  let obj = req.body;
  if (!obj.configcode || !obj.reqtype) {
    return res.json({
      state: -1,
      message: "Required parameters missing",
    });
  } else {
    commonModel.mysqlModelService(
      "call usp_cascade_operations(?)",
      [JSON.stringify(obj)],
      (error, result) => {
        if (error) {
          return res.json({
            state: -1,
            message: error,
          });
        } else {
          if (
            result &&
            result[1] &&
            result[1][0] &&
            result[1][0].state &&
            result[1][0].state == 1
          ) {
            return res.json({
              state: 1,
              message: "Success",
              data: result && result[0],
            });
          } else {
            return res.json({
              state: -1,
              message: "Something went wrong",
            });
          }
        }
      }
    );
  }
}

function cascadeMaster(req, res) {
  let obj = req.body;
  if (!obj.configcode || !obj.reqtype) {
    return res.json({
      state: -1,
      message: "Required parameters missing",
    });
  } else {
    commonModel.mysqlModelService(
      "call usp_cascade_operations(?)",
      [JSON.stringify(obj)],
      (error, result) => {
        if (error) {
          return res.json({
            state: -1,
            message: error,
          });
        } else {
          if (
            result &&
            result[1] &&
            result[1][0] &&
            result[1][0].state &&
            result[1][0].state == 1
          ) {
            return res.json({
              state: 1,
              message: "Success",
              data: result && result[0],
            });
          } else {
            return res.json({
              state: -1,
              message: "Something went wrong",
            });
          }
        }
      }
    );
  }
}

function cascadeOperation(req, res) {
  req.body = _.mapObject(req.body, function (val, key) {
    if (val && val.constructor === Array) {
      val = val.toString();
    }
    return val;
  });
  let obj = req.body;
  if (!obj.configcode || !obj.reqtype) {
    return res.json({
      state: -1,
      message: "Required parameters missing",
    });
  } else {
    commonModel.mysqlModelService(
      "call usp_cascade_operations(?)",
      [JSON.stringify(obj)],
      (error, result) => {
        if (error) {
          return res.json({
            state: -1,
            message: error,
          });
        } else {
          return res.json({
            state: 1,
            message: "Success",
            data: result && result[0],
          });
        }
      }
    );
  }
}

function configusers(req, res) {
  if (
    !req.body.country ||
    !req.body.location ||
    !req.body.bu ||
    !req.body.workforce
  ) {
    return res.json({
      message: "send required data",
      state: -1,
      data: null,
    });
  } else {
    var obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService("call usp_master_data(?)", [obj])
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
            message:
              results && results[1] && results[1][0] && results[1][0].message,
            data: results && results[0],
          });
        } else {
          return res.json({
            state: -1,
            message: "Something went wrong",
            data: null,
          });
        }
      })
      .catch((err) => {
        return res.json({
          state: -1,
          data: null,
          message: err.message || err,
        });
      });
  }
}
async function saveRMSMaster(req, res) {
  if (!req.body.createdby) {
    return res.json({
      state: 0,
      message: "Token Not Found",
      data: null,
    });
  }

  let obj = req.body;
  // req.body = _.mapObject(req.body, function (val, key) {
  //     if (val && val.constructor === Array) {
  //         val = val.toString();
  //     }
  //     return val;
  // });
  let obj1 = [];
  if (req.body && req.body.data) {
    obj1 = await verifyNull(req.body.data);
    ////console.log("obj1", obj1);
  }

  if (obj.configcode == "offerLetterParams") {
    _.each(obj1, function (item) {
      item.configvalue2 = "";
      let j = item["configvalue1"].split(" ");
      j[0] = j[0].toLowerCase();
      for (var i = 0; i < j.length; i++) {
        item.configvalue2 += j[i];
      }
    });
  }
  let objp = JSON.stringify(obj);
  let objs = JSON.stringify(obj1);
  // let mapobj = {
  //     countryid: req.body.countryid,
  //     workforceid: req.body.workforceid,
  //     locationid: req.body.locationid,
  //     businessunitid: req.body.businessunitid,
  //     createdby: req.body.createdby,
  //     configcode: req.body.configcode
  // }
  ////console.log("obj11", objs);
  commonModel
    .mysqlPromiseModelService("call usp_rms_mapping_master(?,?)", [objp, objs])
    .then((results) => {
      ////console.log("RES", results);
      // mapobj.id = req.body.rowid ? req.body.rowid : results[0] && results[0][0].state
      // mapobj.mapaction = req.body.rowid ? 'edit' : 'add';
      // return commonModel.mysqlPromiseModelService('call usp_rms_mapping_operations(?)', [JSON.stringify(mapobj)])
      //     .then(mapresult => {
      return res.json({
        message: "success",
        state: 1,
        data: results[0],
      });
      // })
    })
    .catch((err) => {
      res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}

function viewRMSMaster(req, res) {
  ////console.log("inside");
  var obj = req.body;
  let obj1 = [];
  obj = JSON.stringify(obj);
  commonModel.mysqlModelService(
    "call usp_rms_mapping_master(?,?)",
    [obj, JSON.stringify(obj1)],
    function (error, result) {
      if (error) {
        return res.json({
          state: -1,
          message: error,
          data: null,
        });
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
          // //console.log('RESSSSSSSSSS',result)
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
            return res.status(400).json({
              message: "Something went wrong.",
              state: -1,
              data: null,
            });
          }
        }
      }
    }
  );
}

function mappingAddEdit(mapObj) {
  return commonModel
    .mysqlPromiseModelService(`call ${mapObj.proc}(?)`, JSON.stringify(mapObj))
    .then((result) => {
      return {
        state: result[0][0].state,
      };
    })
    .catch((err) => {
      return {
        state: -1,
        message: "Mapping is not Created",
        err: err,
      };
    });
}

async function hrmConfigMaster(req, res) {
  if (req.body.action === "vertical") {
    try {
      if (!req.body.createdby) throw new Error("Not a valid user!");
      const reqData = JSON.stringify(req.body);
      const [results] = await query("call usp_trxorgstructure(?)", [reqData]);
      return res.json({
        state: 1,
        message: "success",
        data: results,
      });
    } catch (err) {
      //console.log(err);
      return res.json({
        state: -1,
        message: err.message || err,
      });
    }
  }
  req.body.firstoffday =
    req.body.firstoffday &&
    moment(req.body.firstoffday).format("YYYY-MM-DD HH:mm");
  let obj = req.body;
  let obj1 = [];
  if (req && req.body && req.body.data) {
    obj1 = req.body.data;
  }
  if (!obj || !obj.action || !obj.reqtype) {
    return res.json({
      state: -1,
      message: "Required parameters missing",
    });
  } else {
    if (
      (req.body.reqtype == "add" || req.body.reqtype == "edit") &&
      req.body.action == "workingshift"
    ) {
      obj = _.mapObject(obj, function (val, key) {
        if (val && val.constructor === Array) {
          val = val.toString();
        }
        return val;
      });
    } else if (
      (req.body.reqtype == "add" || req.body.reqtype == "edit") &&
      (req.body.action == "designation" || req.body.action == "practice")
    ) {
      obj1 = verifyNull(obj1);
    }
    var objp = JSON.stringify(obj);
    var objsub = JSON.stringify(obj1);

    commonModel.mysqlModelService(
      `call usp_hrmconfig_operations(?,?)`,
      [objp, objsub],
      (err, result) => {
        if (err) {
          res.json({
            state: -1,
            message: err,
            err: "Something Went Wrong",
            time: res.time,
          });
        } else if (
          req.body &&
          req.body.reqtype &&
          req.body.action &&
          req.body.reqtype == "view" &&
          req.body.action == "practice" &&
          result[0]
        ) {
          let obj2 = [];
          var i = 0;
          result[0].forEach(function (item) {
            var cv2arr =
              result[0] &&
              item &&
              item.configvalue3 &&
              item.configvalue3.split(","); // JSON.parse("[" + result[0][i].configvalue2 + "]");

            var mapidarr =
              result[0] && item && item.mapid && item.mapid.split(",");

            var verticalarr = [];
            //mapidarr.forEach(function (item) {
            for (var k = 0; k < mapidarr.length; k++) {
              verticalarr.push({
                id: mapidarr && mapidarr[k] ? mapidarr[k] : "null",
                configvalue3: cv2arr && cv2arr[k] ? cv2arr[k] : "null",
              });
            }

            obj2.push({
              configvalue1: item.configvalue1,
              businessunitid: item.businessunitid,
              businessunitname: item.businessunitname,
              countryid: item.countryid,
              countryname: item.countryname,
              isactive: item.isactive,
              isbusinessunitactive: item.isbusinessunitactive,
              iscountryactive: item.iscountryactive,
              islocationactive: item.islocationactive,
              ismappingactive: item.ismappingactive,
              iswfactive: item.iswfactive,
              locationid: item.locationid,
              locationname: item.locationname,
              workforceid: item.workforceid,
              workforcename: item.workforcename,
              mapid: item.mapid,
              datamap: verticalarr,
            });
          });
          res.json({
            state: result[0] && result[1] && result[1][0] && result[1][0].state,
            message:
              result[0] && result[1] && result[1][0] && result[1][0].message,
            data: obj2,
          });
        } else {
          res.json({
            state: 1,
            message: "success",
            data: result[0],
            time: res.time,
          });
        }
      }
    );
  }
}

/***strdate format should be DD-MM-YYYY or YYYY-MM-DD
 * type can be 0 to 14
 */
function convertDateFormat(strdate, type) {
  ////console.log('params',moment(strdate, ["MM-DD-YYYY", "YYYY-MM-DD"],true));
  if (
    !moment(
      strdate,
      ["DD-MM-YYYY", "YYYY-MM-DD", "YYYY-MM-DD HH:mm"],
      true
    ).isValid()
  ) {
    return "Invalid date format";
  } else {
    ////console.log("hha")
    var newdate;
    var m;
    if (moment(strdate, "DD-MM-YYYY", true).isValid()) {
      strdate = moment(strdate, "DD-MM-YYYY").format("YYYY-MM-DD");
      m = moment(strdate, "YYYY-MM-DD");
    } else if (moment(strdate, "YYYY-MM-DD", true).isValid()) {
      m = moment(strdate, "YYYY-MM-DD");
    } else if (moment(strdate, "YYYY-MM-DD HH:mm", true).isValid()) {
      m = moment(strdate, "YYYY-MM-DD HH:mm");
    }

    switch (type) {
      case 0:
        return (newdate = m.format()); //"2020-02-14T00:00:00+05:30"

      case 1:
        return (newdate = m.format("dddd")); //"Thursday"

      case 2:
        ////console.log(m.format('MMM Do YY'))
        return (newdate = m.format("MMM Do YY")); //"Feb 14th 20"

      case 3:
        return (newdate = m.fromNow()); // "4 months ago"

      case 4:
        return (newdate = m.format("DD-MM-YYYY")); // 14-02-2020

      case 5:
        return (newdate = m.format("DD/MM/YYYY")); // 14/02/2020

      case 6:
        return (newdate = m.format("LL")); // February 14, 2020

      case 7:
        return (newdate = m.format("ll")); // Feb 14, 2020

      case 8:
        return (newdate = m.format("LLL")); // June 9 2014 9:32 PM

      case 9:
        return (newdate = m.format("lll")); // Jun 9 2014 9:32 PM

      case 10:
        return (newdate = m.format("LLLL")); // Monday, June 9 2014 9:32 PM

      case 11:
        return (newdate = m.format("llll")); // Mon, Jun 9 2014 9:32 PM

      case 12:
        return (newdate = m.format("MMM Do")); //"Feb 14th"

      case 13:
        return (newdate = m.format("MMM Do YYYY")); //"Feb 14th 2020"

      case 14:
        return (newdate = m.format("DD MMMM YYYY")); //"14 February 2020"

      default:
        newdate = strdate;
        return newdate;
    }
  }
}

function viewEmailLogs(req, res) {
  try {
    let obj = req.body;
    obj.action = "view";
    let obj2 = [];
    commonModel.mysqlModelService(
      "call usp_email_logs(?,?)",
      [JSON.stringify(obj), JSON.stringify(obj2)],
      function (err, result) {
        if (err) {
          //console.log("err", err);
          return res.json({
            state: -1,
            message: "Something went wrong",
          });
        } else {
          return res.json({
            state: 1,
            message: "Success",
            data: result[0],
            mailtype: result && result[1],
          });
        }
      }
    );
  } catch (err) {
    return res.json({
      state: 1,
      message: "Something went wrong",
    });
  }
}

function clearEmailLogs() {
  try {
    let obj = {};
    obj.action = "delete";
    let obj2 = [];
    commonModel.mysqlModelService(
      "call usp_email_logs(?,?)",
      [JSON.stringify(obj), JSON.stringify(obj2)],
      function (err, result) {
        if (err) {
          //console.log("err", err);
        } else {
          //console.log("Something went wrong");
        }
      }
    );
  } catch (err) {
    //console.log("Something went wrong");
  }
}

function clearEmailLogsByUser(req, res) {
  try {
    let obj = {
      action: "delete_by_user",
      status: req.body.status,
      mailtype:
        req.body.mail_type && _.pluck(req.body.mail_type, "value").toString(),
    };
    let obj2 = [];
    commonModel.mysqlModelService(
      "call usp_email_logs(?,?)",
      [JSON.stringify(obj), JSON.stringify(obj2)],
      function (err, result) {
        if (err) {
          //console.log("err");
          return res.json({
            state: -1,
            message: "Something went wrong",
          });
        } else {
          //console.log("Something went wrong");
          return res.json({
            state: 1,
            message: "Success",
          });
        }
      }
    );
  } catch (err) {
    //console.log("err", err);
    return res.json({
      state: 1,
      message: "Something went wrong",
    });
  }
}

function resendFailedMails() {
  try {
    let obj = {
      action: "view_resend",
    };
    let obj2 = [];
    commonModel.mysqlModelService(
      "call usp_email_logs(?,?)",
      [JSON.stringify(obj), JSON.stringify(obj2)],
      function (err, result) {
        if (err) {
        } else {
          if (result[0] && result[0].length > 0) {
            var startdate = moment().subtract(1, "days").format("DD-MM-YYYY");
            return new Promise((resolve) => {
              let sent = [];
              let errors = [];
              const finalise = () => {
                if (sent.length + errors.length >= result[0].length) {
                  resolve({ sent, errors });
                }
              };

              result[0].forEach((item, index) => {
                var failureDate =
                  item.date && moment(item.date).format("DD-MM-YYYY");

                if (
                  item &&
                  startdate &&
                  failureDate &&
                  item.status == 0 &&
                  item["mail_type"] &&
                  startdate === failureDate &&
                  item.options
                ) {
                  //console.log('hey checking!')
                  var emailobj = item.options && JSON.parse(item.options);

                  if (emailobj.functionname == "sendCustomEmail") {
                    emailobj.email = emailobj.to;
                  }

                  if (
                    emailobj &&
                    emailobj.email &&
                    emailobj.email != null &&
                    emailobj.email != undefined
                  ) {
                    const emailsArray =
                      emailobj.email && emailobj.email.split(",");

                    const toArray =
                      emailsArray && emailsArray.length > 1
                        ? emailsArray.filter(function (elem, pos) {
                            return emailsArray.indexOf(elem) == pos;
                          })
                        : emailobj.email;
                    const ccArray = emailobj.cc && emailobj.cc.split(",");

                    const ccuniqueArray =
                      ccArray && ccArray.length > 1
                        ? ccArray.filter(function (elem, pos) {
                            return ccArray.indexOf(elem) == pos;
                          })
                        : emailobj.cc;
                    const bccArray = emailobj.bcc && emailobj.bcc.split(",");

                    const bccuniqueArray =
                      bccArray && bccArray.length > 1
                        ? bccArray.filter(function (elem, pos) {
                            return bccArray.indexOf(elem) == pos;
                          })
                        : emailobj.bcc;
                    emailobj.email = (toArray && toArray.toString()) || "";
                    emailobj.cc =
                      (ccuniqueArray && ccuniqueArray.toString()) || "";
                    emailobj.bcc =
                      (bccuniqueArray && bccuniqueArray.toString()) || "";
                    setTimeout(function () {
                      if (emailobj.functionname == "sendCalenderInvites") {
                        mailservice.sendCalenderInvites(
                          emailobj,
                          function (err, response) {
                            //callbackmail(err);
                            if (err) {
                              console.log("err", err);
                              errors.push(1);
                              finalise();
                            } else {
                              sent.push(2);
                              finalise();
                            }
                          }
                        );
                      } else if (emailobj.functionname == "sendCustomEmail") {
                        mailservice.sendCustomEmail(
                          emailobj,
                          function (err, response) {
                            //callbackmail(err);
                            console.log("err", err);
                            if (err) {
                              errors.push(1);
                              finalise();
                            } else {
                              sent.push(2);
                              finalise();
                            }
                          }
                        );
                      } else if (emailobj.functionname == "sendOTP") {
                        mailservice.sendOTP(emailobj, function (err, response) {
                          //callbackmail(err);
                          if (err) {
                            errors.push(1);
                            finalise();
                            console.log("err", err);
                          } else {
                            sent.push(2);
                            finalise();
                          }
                        });
                      } else {
                        mailservice.mail(emailobj, function (err, response) {
                          // callbackmail(err);

                          if (err) {
                            errors.push(1);
                            finalise();
                            console.log("err", err);
                          } else {
                            sent.push(2);
                            finalise();
                          }
                        });
                      }
                    }, 5000 * index);
                  }
                }
              });
            });
          }
        }
      }
    );
  } catch (err) {
    console.log("err", err);
  }
}

function sendUserCreateEmail() {
  try {
    const mailConfigurations = [
      {
        service: "gmail",
        connectionTimeout: 300000,
        type: "OAuth2",
        user: "support2@vegahr.in",
        password: "Support@123#",
        clientId:
          "775669563310-p6us644v0vrd6b2ivc42q7p0vf81fr4e.apps.googleusercontent.com",
        clientSecret: "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",
        refreshToken:
          "1//04FM90Q9GyQH5CgYIARAAGAQSNwF-L9IrUd9Z3sD6ock1NXPuAkzZIbi4AnljIZbFaHXLYaAKMPhFkrVrO2KWVxqkiGKQ6z0-PmU",
      },

      {
        service: "gmail",
        connectionTimeout: 300000,
        type: "OAuth2",
        user: "support3@vegahr.in",
        clientId:
          "479830654690-emdo7hm1cltiv0i4907i8aahr9bth1np.apps.googleusercontent.com",
        clientSecret: "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",
        refreshToken:
          "1//040Jg3BCotcDwCgYIARAAGAQSNwF-L9Ir_khN7OvYP4J-gwSp844xTVaYHVKe6dHArEEkoo3KeesXoRMHtqHWRwcrOMhY3GvS0_g",
      },
    ];
    const maillimit = 800;
    let multipleconfig;

    let obj = {};
    obj.action = "newuserlist";
    commonModel.mysqlModelService(
      "call usp_cron_operations(?)",
      [JSON.stringify(obj)],
      function (err, result) {
        if (err) {
          //console.log("err", err);
        }
        if (result[0] && result[0].length > 0) {
          let counter = 1;
          result[0].forEach(function (users, index) {
            // if (index <= 5) {
            const fullname =
              users.fname &&
              users.lname &&
              users.fname.charAt(0).toUpperCase() +
                users.fname.slice(1).toLowerCase() +
                " " +
                users.lname.charAt(0).toUpperCase() +
                users.lname.slice(1).toLowerCase();
            const urlLinkForReset =
              config.webUrlLink +
              "/#/resetPassword/validate?sec=" +
              users.resettoken +
              "&uid=" +
              users.useremail;
            const emailObj = {
              moduleid: "131911",
              email: users.useremail,
              userid: users.userid,
              linkUrl: urlLinkForReset,
              bodyVariables: {
                trxempdob: users.trxempdob,
                trxempjoining: users.trxempjoining,
                trxempsupervisor: users.trxempsupervisor,
                trxemployeename: fullname,
                trxempname: fullname,
              },
              headingVariables: { heading: fullname },
              subjectVariables: {
                trxemployeename: fullname,
                subject: "Welcome to Vega HR, " + fullname + "!",
              },

              mailType: "userRegistered",
              resettoken: users.resettoken,
            };

            setTimeout(() => {
              if (counter <= maillimit) {
                multipleconfig = mailConfigurations[0];
                // } else if (counter > maillimit && counter <= 2 * maillimit) {
                //   multipleconfig = mailConfigurations[1];
                // } else if (counter > 2 * maillimit && counter <= 3 * maillimit) {
                //   multipleconfig = mailConfigurations[2];
              } else {
                multipleconfig = mailConfigurations[1];
              }
              counter = counter + 1;
              mailservice.send_dynamic_transporter(
                emailObj,
                multipleconfig,
                function (err, response) {
                  if (err) {
                    //console.log("User created. Failed to send mail !", err);
                  }
                  //console.log("msg: 'Mail Sent. ");
                },
                counter * index * 3000
              );
            });
            // }
          });
        }
      }
    );
  } catch (err) {
    //console.log("Something went wrong", err);
  }
}

function modulesession(req, res) {
  if (!req.body || !req.body.moduleid) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = req.body;
  obj.action = "modulesession";
  obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService("call usp_module_session(?)", [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
      });
    })
    .catch((err) => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}
