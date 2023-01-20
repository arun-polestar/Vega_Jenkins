const commonModel = require('../common/Model');
const _ = require('underscore');
const fs = require('fs');
const path = require('path');
const commonctrl = require('../common/Controller');
const sheetToJson = require('csv-xlsx-to-json');
const mail = require('./../../services/mailerService');
const moment = require('moment');
const { makeDirectories } = require('../common/utils')

module.exports = {
  pmsmasteroperation: pmsmasteroperation,
  pmsMail: pmsMail,
  pmsmasteradd: pmsmasteradd,
  dropdown: dropdown,
  addlevelweightage: addlevelweightage,
  objectivemap: objectivemap,
  pmsopertion: pmsopertion,
  addrating: addrating,
  selfperformanceperiod: selfPerformancePeriod,
  additionalsupervisorlist: additionalsupervisorlist,
  pmsmasterdata: pmsmasterdata,
  addempobj: addempobj,
  uploadRating: uploadRating,
  pmsAdhocReport: pmsAdhocReport,
  pmsgridmap: pmsgridmap,
  addgridrating: addgridrating,
  pmsreviewmail: pmsreviewmail,
  pmsverticalreviewmail: pmsverticalreviewmail,
  ratingdata: ratingdata,
  griddata: griddata,
  uploadQuestionRating: uploadQuestionRating
}

function dropdown(req, res) {
  req.body.action = 'dropdown';
  var obj = req.body;
  if (!req.body.action) {
    res.json({
      state: -1,
      message: err,
      err: 'Something Went Wrong'

    })
  } else {
    commonModel.mysqlModelService('call usp_pmsmaster_operation(?)', [JSON.stringify(obj)], async (err, result) => {
      if (err) {
        res.json({
          state: -1,
          message: err,
          err: 'Database error'
          , time: res.time
        })
      }
      else {
        let obj = [... new Set(_.pluck(result[0], 'configcode'))];
        var obj2 = {};

        for (var i = 0; i < obj.length; i++) {
          var arr = [];
          arr.push(...(_.filter(result[0], item => {
            if (item.configcode == obj[i]) {
              return item;
            }
          })));
          obj2[obj[i]] = arr;
        }
        res.json({
          state: result[1][0].state,
          message: result[1][0].message,
          data: obj2, time: res.time
        })
      }
    })
  }
}


function selfPerformancePeriod(req, res) {
  if (!req.body || !req.body.action || !req.body.createdby) {
    return res.json({ data: null, state: -1, message: "Required parameters are missing." })
  }
  let temp = JSON.stringify(req.body);
  commonModel.mysqlPromiseModelService('call usp_pms_trxoperations(?,?,?,?)', [temp, null, null, null]).then(result => {
    if (result && result[1] && result[1][0] && result[1][0].state && result[1][0].state == 1) {
      return res.json({ state: 1, data: result[0], message: "Success", time: res.time });
    } else {
      return res.json({ state: -1, data: null, message: "something went Wrong", time: res.time });
    }
  })
    .catch(err => {
      return res.json({ data: null, state: -1, message: err, time: res.time });
    })

}

function additionalsupervisorlist(req, res) {
  if (!req.body || !req.body.action || !req.body.createdby) {
    return res.json({ data: null, state: -1, message: "Required parameters are missing.", time: res.time })
  }
  let temp = JSON.stringify(req.body);
  commonModel.mysqlPromiseModelService('call usp_pms_trxoperations(?,?,?,?)', [temp, null, null, null]).then(result => {
    if (result && result[1] && result[1][0] && result[1][0].state && result[1][0].state == 1) {
      return res.json({ state: 1, data: result[0], message: "Success", time: res.time });
    }
  })
    .catch(err => {
      return res.json({ data: null, state: -1, message: err });
    })
}


function pmsmasteroperation(req, res) {
  var obj = req.body;
  if (!req.body.action) {
    return res.json({
      state: -1,
      message: 'Something Went Wrong',
      err: 'Something Went Wrong'
    })
  }
  if (req.body.action == "addperformance") {
    obj.objectiveselector = parseInt(req.body.objectiveselector);
  }
  console.time("Starttime")
  commonModel.mysqlModelService('call usp_pmsmaster_operation(?)', [JSON.stringify(obj)], async (err, result) => {
    if (err) {
      res.json({
        state: -1,
        message: err,
        err: 'Database error'
      })
    }
    else {
      if (req.body.action.toLowerCase() == 'plotdata' || req.body.action.toLowerCase() == "getgirdvalue" || req.body.action.toLowerCase() == 'usergriddata' || req.body.action.toLowerCase() == 'gridmapping' || req.body.action.toLowerCase() == 'buuserlist' || req.body.action.toLowerCase() == 'practiceuserlist' || req.body.action.toLowerCase() == 'deptmap' || req.body.action.toLowerCase() == 'allempdata' || req.body.action.toLowerCase() == 'objectiveuser' || req.body.action.toLowerCase() == 'objectivedata' || req.body.action.toLowerCase() == 'pmsstatus' || req.body.action.toLowerCase() == 'pmsuserlist' || req.body.action.toLowerCase() == 'view' || req.body.action.toLowerCase() == 'viewperformance' || req.body.action.toLowerCase() == 'targetview' || req.body.action.toLowerCase() == 'leveldata') {
        return res.json({
          state: result[1][0].state,
          message: result[1][0].message,
          data: result[0],
          result: result
          , time: res.time
        })
      }
      else if (req.body.action == 'copymaster') {
        return res.json({
          state: result[3][0].state,
          message: result[3][0].message,
          data: result, time: res.time, result
        })
      }
      else if (req.body.action.toLowerCase() == 'currentpmsperiod') {
        if (result[6]) {
          for (let i = 0; i < result[6].length; i++) {
            result[6][i]['Effective Date(DD-MM-YYYY)'] = result[6][i] && result[6][i]['Effective Date(DD-MM-YYYY)'] && moment(result[6][i]['Effective Date(DD-MM-YYYY)']).format('DD-MM-YYYY')

            result[6][i]['New Designation'] = result[6][i] && result[6][i]['New Designation'] && result[6][i]['New Designation'].toString()
          }
        }
        return res.json({
          state: result[7][0].state,
          message: result[7][0].message,
          data: result,
          time: res.time, result
        })
      }
      else {
        return res.json({
          state: result[0][0].state,
          message: result[0][0].message,
          data: result[0], time: res.time, result
        })
      }
    }
  })
}

async function addlevelweightage(req, res) {
  var obj = req.body.data;
  obj = await commonctrl.verifyNull(obj);
  commonModel.mysqlModelService('call usp_pmslevel_weightage(?,?)', [JSON.stringify(obj), req.body.createdby], (err, result) => {
    if (err) {
      res.json({
        state: -1,
        message: err,
        err: 'Database error'
      })
    }

    else {
      res.json({
        state: (parseInt(result[0][0].errorcount) > 0) ? -1 : result[0][0].state,
        message: (parseInt(result[0][0].errorcount) > 0) ? `Mapping already present for ${result[0][0].errorcount} cells` : result[0][0].message,
        data: result[0],
        errorcount: result[0][0].errorcount, time: res.time
      })
    }
  })
}

async function addrating(req, res) {
  var obj = req.body.data;
  var userid = req.body.userid && req.body.userid.toString();
  var obj1 = {
    createdby: req.body.createdby,
    iseligible: req.body.isSupervisoreligible,
    hreligible: req.body.hreligible,
    tabType: req.body.tabType,
    pid: req.body.pid,
    issubmit: req.body.issubmit,
    ratingid: req.body.ratingid,
    id: req.body.id,
    designation: req.body['New Designation'],
    effdate: req.body['Effective Date(DD-MM-YYYY)'] && req.body['Effective Date(DD-MM-YYYY)'].split("-").reverse().join("-")
  };
  obj1 = await commonctrl.verifyNull(obj1)
  //console.log(obj1, userid);
  var hrstatus = req.body.tabType;
  if (+req.body.selfstatus == 1) {
    hrstatus = 2;
    userid = req.body.createdby;
  } else if (+req.body.verticalstatus == 1) {
    hrstatus = 3;
  } else if (+req.body.bustatus == 1) {
    hrstatus = 4;
  } else if (+req.body.hrstatus) {
    hrstatus = req.body.hrstatus
  } else {
    hrstatus = null;
  };
  commonModel.mysqlModelService('call usp_pms_rating(?,?,?,?)', [JSON.stringify(obj), hrstatus, userid, JSON.stringify(obj1)], (err, result) => {
    //console.log(result, err)
    if (err) {
      return res.json({
        state: -1,
        message: err,
        err: 'Database error',

      })
    }
    else {
      return res.json({
        state: result[0][0].state,
        message: result[0][0].message,
        data: result[0],
        errorcount: result[0][0].errorcount, time: res.time
      })
    }
  })
}

function addgridrating(req, res) {
  var obj = req.body.data;
  var userid = req.body.userid;
  var obj1 = {
    createdby: req.body.createdby,
    iseligible: req.body.isSupervisoreligible,
    hreligible: req.body.hreligible,
    tabType: req.body.tabType,
    pid: req.body.pid,
    issubmit: req.body.issubmit,
    ratingid: req.body.ratingid,
    id: req.body.id
  };
  var hrstatus = req.body.tabType;
  if (+req.body.selfstatus == 1) {
    hrstatus = 2;
    userid = req.body.createdby;
  } else if (+req.body.verticalstatus == 1) {
    hrstatus = 3;
  } else if (+req.body.bustatus == 1) {
    hrstatus = 4;
  } else if (+req.body.hrstatus) {
    hrstatus = req.body.hrstatus
  } else {
    hrstatus = null;
  };
  commonModel.mysqlModelService('call usp_pms_rating_grid(?,?,?,?)', [JSON.stringify(obj), hrstatus, userid, JSON.stringify(obj1)], (err, result) => {
    if (err) {
      return res.json({
        state: -1,
        message: err,
        err: 'Database error',

      })
    }
    else {
      return res.json({
        state: result[0][0].state,
        message: result[0][0].message,
        data: result[0],
        errorcount: result[0][0].errorcount, time: res.time
      })
    }
  })
}



function objectivemap(req, res) {
  var obj = req.body.data;
  commonModel.mysqlModelService('call usp_pmsobjective_target(?,?)', [JSON.stringify(obj), req.body.createdby], (err, result) => {
    if (err) {
      res.json({
        state: -1,
        message: err,
        err: 'Database error'
      })
    }
    else {
      res.json({
        state: (parseInt(result[0][0].errorcount) > 0) ? 1 : result[0][0].state,
        message: result[0][0].errorcount ? `${result[0][0].errorcount} is not mapped` : 'All objective mapped sucessfully',
        data: result[0],
        errorcount: result[0][0].errorcount,
        totalcount: result[0][0].totalcount, time: res.time
      })
    }
  })
}


async function pmsopertion(req, res) {
  var obj = req.body;
  let obj1 = [];
  if (req.body.action && req.body.action == 'insertadditional') {
    let temp = req.body && req.body.userids && req.body.userids.split(",");
    _.each(temp, (item) => {
      obj1.push({ userid: item });
    });
  } else if (req.body.action && req.body.action == 'insertinput') {
    obj1 = req.body.data;
    obj1 = await commonctrl.verifyNull(obj1)
  }
  let html = null;
  let shtml = null;
  if (req.body.action == 'selfinputadd') {
    if (req.body.selfinput) {
      html = req.body.selfinput;
      delete req.body.selfinput;
    }
    if (req.body.supervisorinput) {
      shtml = req.body.supervisorinput;
      delete req.body.supervisorinput;
    }
  }
  commonModel.mysqlModelService('call usp_pms_trxoperations(?,?,?,?)', [JSON.stringify(obj), JSON.stringify(obj1), html, shtml], (err, result) => {
    if (err) {
      res.json({
        state: -1,
        message: "Something Went Wrong in DB",
        err: err
      })
    }
    else {
      if (req.body.action.toLowerCase() == 'empobjectivedata' || req.body.action.toLowerCase() == 'pid' || req.body.action.toLowerCase() == 'userlist' || req.body.action.toLowerCase() == 'selfinputview' || req.body.action.toLowerCase() == 'objectiveview') {
        res.json({
          state: result[1][0].state,
          message: result[1][0].message,
          data: result[0], time: res.time
        })
      } else {
        res.json({
          state: result[0][0].state,
          message: result[0][0].message,
          data: result[0], time: res.time
        })
      }
    }
  })
}



function pmsmasteradd(req, res) {
  if (!req.body.createdby || !req.body.action) {
    return res.json({ state: 0, message: "send reruired date" });
  }
  let obj = req.body.arr;
  obj = JSON.stringify(obj);
  let obj1 = {
    createdby: req.body.createdby,
    action: req.body.action,
    configcode: req.body.configcode,
    configdesc: req.body.configdesc
  };
  obj1 = JSON.stringify(obj1);
  commonModel.mysqlModelService('call usp_pmsmaster_add(?,?)', [obj, obj1], function (err, results) {
    if (err) {
      return res.json({ state: -1, message: err, data: null });
    } else if (results && results[0] && results[0][0] && results[0][0].state && results[0][0].state == 1) {
      return res.json({ state: results[0][0].state, message: results[0][0].message, data: results, time: res.time });
    } else {
      return res.json({ state: -1, message: "somethng went wrong", data: null });
    }
  });
}

function pmsmasterdata(req, res) {
  try {
    var obj = req.body;
    if (!req.body.action) {
      throw new Error('Action is not Defined');
    }
    let procname = 'usp_pmsmaster_operation_new(?,?)';
    var data = [];

    if (req.body.action == 'addmaster' || req.body.action == 'editmasteroperation') {
      obj = req.body.arr;
      // obj = ob;
      let obj1 = {
        createdby: req.body.createdby,
        action: req.body.action,
        configcode: req.body.configcode,
        configdesc: req.body.configdesc,
      };
      data = [JSON.stringify(obj), JSON.stringify(obj1)];
      procname = 'usp_pmsmaster_add(?,?)';
    }
    else if (req.body.action == 'addownobjective') {
      let obj1 = req.body.arr;
      for (let i = 0; i < obj1.length; i++) {
        if (obj1[i].target == null)
          delete obj1[i].target
      }
      data = [JSON.stringify(obj), JSON.stringify(obj1)];
    }
    else {
      obj = req.body;
      data = [JSON.stringify(obj), '{}'];
    }
    commonModel.mysqlModelService(`call ${procname}`, data, (err, result) => {
      if (err) {
        res.json({
          state: -1,
          message: err,
          err: 'Something Went Wrong'
        })
      }
      else {
        if (req.body.action == 'fetchmaster') {
          if (req.body.configcode && req.body.configcode.indexOf(",") > -1) {
            let obj = [... new Set(_.pluck(result[0], 'configcode'))];
            var obj2 = {};

            for (var i = 0; i < obj.length; i++) {
              var arr = [];
              arr.push(...(_.filter(result[0], item => {
                if (item.configcode == obj[i]) {
                  return item;
                }
              })));
              obj2[obj[i]] = arr;
            }
            res.json({
              state: result[1][0].state,
              message: result[1][0].message,
              data: obj2
            })
          }
          else {
            res.json({
              state: result[1][0].state,
              message: result[1][0].message,
              data: result[0]
            })
          }
        } else {
          res.json({
            state: result[0][0].state,
            message: result[0][0].message,
            data: result[0]
          })
        }
      }
    })
  }
  catch (err) {
    res.json({
      state: -1,
      message: err,
      err: 'Something Went Wrong'
    })
  }
}

async function addempobj(req, res) {
  var obj1 = req.body.data;
  var obj = req.body;
  obj = await commonctrl.verifyNull(obj);
  obj1 = await commonctrl.verifyNull(obj1);
  commonModel.mysqlModelService('call usp_pms_empobjective(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)], (err, result) => {
    if (err) {
      res.json({
        state: -1,
        message: err,
        err: 'Database error',

      })
    }
    else {
      res.json({
        state: result[0][0].state,
        message: result[0][0].message,
        data: result[0], time: res.time
      })
    }
  })
}


function uploadRatings(req, res) {
  return new Promise((resolve, reject) => {
    //console.log('This is here 4')
    let sampleFile;
    let uploadPath;
    if (req.files && Object.keys(req.files).length == 0) {
      return res.json({
        "state": -1,
        "message": "Something Went Wrong in Uploading ",
        "data": null
      });
    }
    sampleFile = req.files.file;
    var fileformat = sampleFile.name.split('.')[1].toLowerCase();
    if (fileformat != 'xlsx') {
      return res.json({
        "state": -1,
        "message": "Unsupported File Format. Upload XLSX File Format",
        "data": null
      });
    }
    //console.log('This is here 3')
    uploadPath = makeDirectories(path.join('uploads', 'pms'))
    uploadPath = path.join(uploadPath, req.files.file.name);
    //console.log('This is here 2')
    sampleFile.mv(uploadPath, (err) => {
      if (err) {
        return res.json({
          "state": -1,
          "message": `Something Went Wrong in Uploading ${err}`,
          "data": null
        });
      } else {
        //console.log('This is here 1')
        sheetToJson.process(uploadPath, (error1, result1) => {
          if (result1.length == 0) {
            return res.json({
              "state": -1,
              "message": "Something is Wrong in File",
              "data": null
            });
          }
          var headerkeys = Object.keys(result1[0]).sort();
          headerkeys = headerkeys && headerkeys.toString();
          let headerkeyname = req.body.headerkeyname.split(",").sort().toString();
          //console.log(headerkeys, "ssssssssssssssss", headerkeyname)
          if (headerkeys == headerkeyname) {
            //console.log("Inside match")
            let filteredarry = _.filter(result1, (item) => {
              let bool = false;
              for (const key in item) {
                if (item.hasOwnProperty(key)) {
                  const element = item[key];
                  if (element && element != '') {
                    bool = true;
                  }
                }
              }
              if (bool) {
                return item
              }
            })
            //console.log("Inside match", filteredarry)
            if (error1) {
              return res.json({
                "state": -1,
                "message": "Something Went Wrong in Conversion",
                "data": null,
                "time": res.time
              });
            } else {
              if (filteredarry && filteredarry.length == 0) {
                reject("File is Empty");
              }
              else {
                //console.log(filteredarry, "???????")
                var arr = [];
                _.map(filteredarry, (ele) => {
                  //console.log(ele, "inside map")
                  let keynames = req.body.headerkeyname.split(',');
                  for (let i = 0; i < keynames.length; i++) {
                    //console.log(ele, "This is here ")
                    if ((keynames[i] == 'Effective Date(YYYY-MM-DD)' || keynames[i] == 'New Designation') && ele['Promotion(Y/N)'] == 'N') {

                    }
                    else {
                      if (ele[keynames[i]].length == 0) {
                        reject("File Column can't be Empty");
                      }
                    }
                  }
                  Object.keys(ele).forEach(item1 => {
                    if (item1 !== 'Employee ID' && item1 !== 'Employee Name' && item1 !== 'Performance Period' && item1 !== 'Promotion(Y/N)' && item1 != 'New Designation' && item1 != 'Effective Date(YYYY-MM-DD)') {
                      let date = ele['Effective Date(YYYY-MM-DD)']
                        && moment(ele['Effective Date(YYYY-MM-DD)'], 'YYYY-MM-DD').format('YYYY-MM-DD');
                      //console.log(date, "This is date of element")
                      arr.push({
                        empname: ele['Employee Name'],
                        empid: ele['Employee ID'],
                        performanceperiod: ele['Performance Period'],
                        iseligible: ele['Promotion(Y/N)'],
                        rating: ele[item1],
                        category: item1,
                        designation: ele['New Designation'],
                        effdate: date
                      })
                    }
                  });
                  //console.log(arr);
                })
                resolve(arr);
              }
            }
          }
          else {
            reject("File Template is Not Valid");
          }
        })
      }
    });
  })
}

function uploadRating(req, res) {
  //console.log('This is here 7');
  uploadRatings(req, res)
    .then((val) => {
      if (val) {
        let obj = JSON.stringify(val);
        let obj1 = JSON.stringify(req.body);
        //console.log('This is here 8', val);
        commonModel.mysqlPromiseModelService('call usp_pmsrating_upload(?,?)', [obj, obj1])
          .then(results => {
            if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
              return res.json({ state: results[1][0].state, message: results && results[1] && results[1][0] && results[1][0].message, data: results, time: res.time });
            }
            else if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == -1) {
              return res.json({ state: results[1][0].state, message: results && results[1] && results[1][0] && results[1][0].message, data: results, time: res.time });
            } else {
              return res.json({ state: -1, message: "Something Went Wrong", data: null });
            }
          })
          .catch(err => {
            //console.log(err);
            return res.json({ state: -1, data: null, message: err && err.message || err });
          })
      }
    })
    .catch((err) => {
      //console.log('This is here 6')
      return res.json({ message: err, state: -1, data: null });
    })
}




async function pmsMail() {
  let obj = {
    action: 'pmsreminder',
    dateserver: new Date()
  }
  commonModel.mysqlModelService('call usp_pmsreminder_operation(?)', JSON.stringify(obj), (err, result) => {
    if (err) { }
    else {
      for (let i = 0; i < result[0].length; i++) {
        let stdate = new Date(result[0][i].selfinputstartdate);
        let stdate1 = new Date(result[0][i].selfinputstartdate);
        let enddate = new Date(result[0][i].selfinputenddate);
        stdate1 = new Date(stdate1.setDate(stdate1.getDate() + 1)).toDateString();
        let arr = [];
        arr.push(stdate1);
        arr.push(enddate.toDateString());

        //console.log(stdate, enddate);

        //console.log((new Date(enddate.getMilliseconds() - 5 * 24 * 3600 * 1000) > new Date(stdate.getMilliseconds())))

        //console.log(stdate.toDateString() < enddate.toDateString());

        while (stdate < enddate
          && ((new Date(enddate.getTime() - 5 * 24 * 3600 * 1000)) > stdate)) {
          //console.log("1");
          arr.push(new Date(stdate.setDate(stdate.getDate() + 5)).toDateString())
        }
        //console.log(arr, "DATE ARRAY")
        if (!(arr.indexOf(obj.dateserver.toDateString()) == -1)) {
          //console.log("mail Shoots");
          let emailObj = {
            bcc: result[0][i].useremails,
            mailType: 'pmsremindermail',
            subjectVariables: {
              subject: " Reminder to submit self input"
            },
            headingVariables: {
              heading: " Reminder to submit self input"
            },
            bodyVariables: {
              message: `This e-mail serves as notification that you are required to submit your Self Input by ${new Date(result[0][i].selfinputenddate).toDateString()} as part of the appraisal process. If already submitted, Please ignore.
                                <b>Please log on to the Vega HR Portal for the same. </sb>`
            }
          }
          mail.send(emailObj, (err, response) => {
            if (err) { }
            else { }
          })
        }
      }
    }
  })
}

function pmsAdhocReport(req, res) {

  if (!req.body || !req.body.createdby || !req.body.action) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  req.body.mod = "PMSUserRoles"
  var obj = JSON.stringify(req.body);
  commonModel.mysqlPromiseModelService('call usp_allreports_operations(?)', [obj])
    .then(result => {

      return res.json({ message: 'success', data: result[0], state: 1 });
    })
    .catch(err => {
      res.json({ message: err, data: err, state: -1 });
    })
}


async function pmsgridmap(req, res) {
  var obj1 = req.body.data;
  var obj = req.body;
  obj = await commonctrl.verifyNull(obj);
  obj1 = await commonctrl.verifyNull(obj1);
  commonModel.mysqlModelService('call usp_pms_gridmapping(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)], (err, result) => {
    if (err) {
      res.json({
        state: -1,
        message: err,
        err: 'Database error',
      })
    }
    else {
      res.json({
        state: result[0][0].state,
        message: result[0][0].message,
        data: result[0]
      })
    }
  })
}



async function pmsreviewmail() {
  let obj = {
    action: 'reviewreminder',
    dateserver: new Date()
  }
  commonModel.mysqlModelService('call usp_pmsreminder_operation(?)', JSON.stringify(obj), (err, result) => {
    // //console.log(err, result);
    if (err) { }
    else {
      let resultArr = [];
      //console.log(resultArr);
      for (let i = 1; i < result[0].length; i++) {
        //console.log(result[0][i])
        resultArr.push({
          performancePeriodName: result[0][i].performancePeriodName,
          managername: result[0][i].managername,
          email: result[0][i].email,
          reviewerstartdate: result[0][i].reviewerstartdate,
          reviewerenddate: result[0][i].reviewerenddate,
          detail: []
        })
      }
      resultArr = [... new Set(resultArr.map(item => JSON.stringify(item)))];
      resultArr = resultArr.map(item => JSON.parse(item))
      for (let i = 0; i < resultArr.length; i++) {
        for (let j = 0; j < result[0].length; j++) {
          if (result[0][j].performancePeriodName == resultArr[i].performancePeriodName
            && result[0][j].managername == resultArr[i].managername) {
            resultArr[i].detail.push({
              name: result[0][j].name,
              status: result[0][j].status
            })
          }
        }
      }
      // //console.log(resultArr,"this is Final Object");
      for (let i = 0; i < resultArr.length; i++) {

        let stdate = new Date(resultArr[i].reviewerstartdate);
        let stdate1 = new Date(resultArr[i].reviewerstartdate);
        let enddate = new Date(resultArr[i].reviewerenddate);
        stdate1 = new Date(stdate1.setDate(stdate1.getDate() + 1)).toDateString();
        let arr = [];
        arr.push(stdate1);
        arr.push(enddate.toDateString());

        //console.log(stdate, enddate);
        //console.log((new Date(enddate.getMilliseconds() - 5 * 24 * 3600 * 1000) > new Date(stdate.getMilliseconds())))
        //console.log(stdate.toDateString() < enddate.toDateString());

        while (stdate < enddate
          && ((new Date(enddate.getTime() - 5 * 24 * 3600 * 1000)) > stdate)) {
          //console.log("1");
          arr.push(new Date(stdate.setDate(stdate.getDate() + 5)).toDateString())
        }
        let tableHtml = `<br><center><table style="font-family: arial, sans-serif;
  border-collapse: collapse;
  width: 100%; "><tbody><tr style=" border: 1px solid #dddddd;
  text-align: center;
  padding: 8px;"><th style="border: 1px solid #dddddd;">S No.</th><th style="border: 1px solid #dddddd;">EmployeeName</th><th style="border: 1px solid #dddddd;">Self Input Status</th>`;
        for (let j = 0; j < resultArr[i].detail.length; j++) {
          tableHtml = tableHtml + `<tr style=" border: 1px solid #dddddd;
  text-align: center;
  padding: 8px;"><td style="border: 1px solid #dddddd;">${j + 1}</td><td style="border: 1px solid #dddddd;">${resultArr[i].detail[j].name}</td><td style="border: 1px solid #dddddd;">${resultArr[i].detail[j].status}</td><tr>`
        }

        tableHtml = tableHtml + `</table></center><br>`;
        //console.log(arr, "DATE ARRAY")
        if (!(arr.indexOf(obj.dateserver.toDateString()) == -1)) {
          //console.log("mail Shoots");
          let emailObj = {
            bcc: resultArr[i].email,
            mailType: 'pmsremindermail',
            subjectVariables: {
              subject: "Reminder to submit supervisor feedback"
            },
            headingVariables: {
              heading: "Reminder to submit supervisor feedback"
            },
            bodyVariables: {
              message: `This e-mail serves as notification that you are required to submit your feedback for your team members as part of the appraisal process by ${new Date(resultArr[i].reviewerenddate).toDateString()} . 
                            If already submitted, Please ignore.
                            <br>
                                ${tableHtml}`
            }
          }
          setTimeout(() => {
            mail.send(emailObj, (err, response) => {
              if (err) { }
              else { }
            })
          }, i * 3000)
        }
      }
    }
  })
}



async function pmsverticalreviewmail() {
  let obj = {
    action: 'verticalreminder',
    dateserver: new Date()
  }
  commonModel.mysqlModelService('call usp_pmsreminder_operation(?)', JSON.stringify(obj), (err, result) => {
    // //console.log(err, result);
    if (err) { }
    else {
      let resultArr = [];

      //console.log(resultArr);
      for (let i = 1; i < result[0].length; i++) {
        //console.log(result[0][i])
        resultArr.push({
          performancePeriodName: result[0][i].performancePeriodName,
          managername: result[0][i].managername,
          email: result[0][i].email,
          reviewerstartdate: result[0][i].reviewerstartdate,
          reviewerenddate: result[0][i].reviewerenddate,
          detail: []
        })
      }
      resultArr = [... new Set(resultArr.map(item => JSON.stringify(item)))];
      resultArr = resultArr.map(item => JSON.parse(item))
      for (let i = 0; i < resultArr.length; i++) {
        for (let j = 0; j < result[0].length; j++) {
          if (result[0][j].performancePeriodName == resultArr[i].performancePeriodName
            && result[0][j].managername == resultArr[i].managername) {
            resultArr[i].detail.push({
              name: result[0][j].name,
              status: result[0][j].status,
              reviewstatus: result[0][j].reviewstatus
            })
          }
        }
      }

      // //console.log(resultArr,"this is Final Object");
      for (let i = 0; i < resultArr.length; i++) {
        let stdate = new Date(resultArr[i].reviewerstartdate);
        let stdate1 = new Date(resultArr[i].reviewerstartdate);
        let enddate = new Date(resultArr[i].reviewerenddate);
        stdate1 = new Date(stdate1.setDate(stdate1.getDate() + 1)).toDateString();
        let arr = [];
        arr.push(stdate1);
        arr.push(enddate.toDateString());

        //console.log(stdate, enddate);
        //console.log((new Date(enddate.getMilliseconds() - 5 * 24 * 3600 * 1000) > new Date(stdate.getMilliseconds())))
        //console.log(stdate.toDateString() < enddate.toDateString());

        while (stdate < enddate
          && ((new Date(enddate.getTime() - 5 * 24 * 3600 * 1000)) > stdate)) {
          //console.log("1");
          arr.push(new Date(stdate.setDate(stdate.getDate() + 5)).toDateString())
        }
        let tableHtml = `<br><center><table style="font-family: arial, sans-serif;
  border-collapse: collapse;
  width: 100%; "><tbody><tr style=" border: 1px solid #dddddd;
  text-align: center;
  padding: 8px;"><th style="border: 1px solid #dddddd;">S No.</th><th style="border: 1px solid #dddddd;">EmployeeName</th><th style="border: 1px solid #dddddd;">Self Input Status</th>
  <th style="border: 1px solid #dddddd;">Supervisor's feedback</th>`;
        for (let j = 0; j < resultArr[i].detail.length; j++) {
          tableHtml = tableHtml + `<tr style=" border: 1px solid #dddddd;
  text-align: center;
  padding: 8px;"><td style="border: 1px solid #dddddd;">${j + 1}</td><td style="border: 1px solid #dddddd;">${resultArr[i].detail[j].name}</td><td style="border: 1px solid #dddddd;">${resultArr[i].detail[j].status}</td><td style="border: 1px solid #dddddd;">${resultArr[i].detail[j].reviewstatus}</td><tr>`
        }
        tableHtml = tableHtml + `</table></center><br>`;
        //console.log(arr, "DATE ARRAY")
        if (!(arr.indexOf(obj.dateserver.toDateString()) == -1)) {
          //console.log("mail Shoots");
          let emailObj = {
            bcc: resultArr[i].email,
            mailType: 'pmsremindermail',
            subjectVariables: {
              subject: "Reminder to submit vertical rating"
            },
            headingVariables: {
              heading: "Reminder to submit vertical rating"
            },
            bodyVariables: {
              message: `This e-mail serves as notification that you are required to submit a rating for your team members as part of the appraisal process by ${new Date(resultArr[i].reviewerenddate).toDateString()} . 
                            If already submitted, Please ignore.
                            <br>${tableHtml}`
            }
          }
          mail.send(emailObj, (err, response) => {
            if (err) { }
            else { }
          })
        }
      }
    }
  })
}



async function ratingdata(req, res) {
  try {
    if (typeof (req.body.hrrating) != undefined && typeof (req.body.pid) != undefined) {
      let obj = {
        hrrating: req.body.hrrating,
        createdby: req.body.createdby,
        pid: req.body.pid,
        action: 'ratingdata'
      }
      commonModel.mysqlModelService('call usp_pms_trxoperations(?,?,?,?)', [JSON.stringify(obj), null, null, null], (err, result) => {
        if (err) {
          throw err;
        }
        else {
          let data = result[0];
          let arr = [];
          if (data[0][`configvalue1`] != null) {
            for (let i = 0; i < data.length; i++) {
              const element = data[i];
              if (arr.length == 0) {
                arr.push({
                  "Employee ID": element[`Employee ID`],
                  "Employee Name": element[`Employee Name`],
                  "Promotion(Y/N)": element[`Promotion(Y/N)`],
                  [element[`configvalue1`]]: element[`configvalue3`],
                  "New Designation": element[`New Designation`],
                  "Effective Date(YYYY-MM-DD)": element[`Effective Date(DD-MM-YYYY)`] && moment(element[`Effective Date(DD-MM-YYYY)`], 'MM-DD-YYYY').format('YYYY-MM-DD')
                })
              }
              else {
                let insert = 1;
                for (let j = 0; j < arr.length; j++) {
                  if (arr[j][`Employee ID`] == data[i][`Employee ID`]) {
                    insert = 0;
                    //console.log(arr[j]);
                    arr[j][[element[`configvalue1`]]] = element[`configvalue3`];
                  }
                }
                if (insert == 1) {
                  arr.push({
                    "Employee ID": element[`Employee ID`],
                    "Employee Name": element[`Employee Name`],
                    "Promotion(Y/N)": element[`Promotion(Y/N)`],
                    [element[`configvalue1`]]: element[`configvalue3`],
                    "New Designation": element[`New Designation`],
                    "Effective Date(YYYY-MM-DD)": element[`Effective Date(DD-MM-YYYY)`] && moment(element[`Effective Date(DD-MM-YYYY)`], 'MM-DD-YYYY').format('YYYY-MM-DD')
                  })
                }

              }
            }
          }
          else {
            for (let i = 0; i < data.length; i++) {
              const element = data[i];
              arr.push({
                "Employee ID": element[`Employee ID`],
                "Employee Name": element[`Employee Name`],
                "Promotion(Y/N)": element[`Promotion(Y/N)`],
                "Rating": element[`configvalue3`],
                "New Designation": element[`New Designation`],
                "Effective Date(YYYY-MM-DD)": element[`Effective Date(DD-MM-YYYY)`] && moment(element[`Effective Date(DD-MM-YYYY)`], 'MM-DD-YYYY').format('YYYY-MM-DD')
              })
            }
          }
          //console.log(arr);
          res.json({
            state: 1,
            message: 'Data Patch SucessFully',
            result: arr
          })
        }
      })
    }
    else {
      throw Error('Some Keys Are missing')
    }
  } catch (error) {
    res.json({
      state: -1,
      message: (error && error.message) || 'Something Went Wrong',
      result: error
    })
  }
}


async function griddata(req, res) {
  try {
    let obj = {
      hrrating: req.body.hrrating,
      createdby: req.body.createdby,
      pid: req.body.pid,
      action: 'griddata'
    }
    if (typeof (req.body.hrrating) != undefined && typeof (req.body.pid) != undefined) {
      commonModel.mysqlModelService('call usp_pms_trxoperations(?,?,?,?)', [JSON.stringify(obj), null, null, null], (err, result) => {
        let data = result[0];
        for (let i = 0; i < data.length; i++) {
          if (data[i][`Rating`] == 'null') {
            data[i][`Rating`] = undefined
          }
        }
        res.json({
          state: 1,
          message: 'Data Patch SucessFully',
          result: data
        })
      })
    }
    else {
      throw Error('Some Keys Are missing')
    }
  } catch (error) {
    res.json({
      state: -1,
      message: (error && error.message) || 'Something Went Wrong',
      result: error
    })
  }
}


async function uploadQuestionRating(req, res) {
  try {
    let sampleFile;
    let uploadPath;
    if (req.files && Object.keys(req.files).length == 0) {
      throw Error('Something Went Wrong in Uploading ');
    }
    sampleFile = req.files.file;
    var fileformat = sampleFile.name.split('.')[1].toLowerCase();
    if (fileformat != 'xlsx') {
      throw Error('Unsupported File Format. Upload XLSX File Format');
    }
    //console.log('This is here 3')
    uploadPath = makeDirectories(path.join('uploads', 'pms', sampleFile.name));
    //console.log('This is here 2')
    sampleFile.mv(uploadPath, (err) => {
      if (err) {
        throw Error(`Something Went Wrong in Uploading ${err}`)
      } else {
        sheetToJson.process(uploadPath, (err, result) => {
          //console.log(err, result);
          if (result.length == 0) {
            throw Error('Something is Wrong in File');
          }
          let arr = [];
          for (let i = 0; i < result.length; i++) {
            const element = result[i];
            let obj = {
              rating: element.Rating,
              empid: element['Employee ID'],
              empname: element['Employee Name'],
              question: element.Question
            }
            arr.push(obj);
          }
          var headerkeys = Object.keys(result[0]).sort();
          headerkeys = headerkeys && headerkeys.toString();
          let headerkeyname = req.body.headerkeyname;
          if (headerkeys == headerkeyname) {
            // //console.log(req.body,result)
            let obj = JSON.stringify(arr);
            let obj1 = JSON.stringify(req.body);
            commonModel.mysqlPromiseModelService('call usp_pmsgrid_upload(?,?)', [obj, obj1])
              .then(results => {
                if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
                  return res.json({ state: results[1][0].state, message: results && results[1] && results[1][0] && results[1][0].message, data: results, time: res.time });
                }
                else if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == -1) {
                  return res.json({ state: results[1][0].state, message: results && results[1] && results[1][0] && results[1][0].message, data: results, time: res.time });
                } else {
                  return res.json({ state: -1, message: "Something Went Wrong", data: null });
                }
              })
              .catch(err => {
                return res.json({ state: -1, data: null, message: err && err.message || err });
              })
          }
          else {
            throw Error(`Headers Doesn't Match`)
          }
        })
      }
    })
  } catch (error) {
    res.json({
      state: -1,
      message: (error && error.message) || 'Something Went Wrong',
      result: error
    })
  }
}