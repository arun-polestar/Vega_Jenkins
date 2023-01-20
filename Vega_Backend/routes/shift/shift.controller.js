const commonModel = require('../../routes/common/Model');
const commonCtrl = require('../../routes/common/Controller');
const _ = require('underscore');
const moment = require('moment');

module.exports = {
  shiftOperation: shiftOperation,
  shiftView: shiftView,
  deactivateShift: deactivateShift,
  getAlternateShift: getAlternateShift
}

async function shiftOperation(req, res) {
  if (!req.body.action) {
    return res.json({ state: -1, message: 'required parameters are missing' })
  }
  req.body = _.mapObject(req.body, function (val, key) {
    if (val && val.constructor === Array) {
      val = val.toString();
    }
    return val;
  })
  var obj = req.body;
  obj.firstoffday = req.body.firstoffday && moment(req.body.firstoffday).format("YYYY-MM-DD HH:mm");
  obj = await commonCtrl.verifyNull(obj);

  commonModel.mysqlModelService('call usp_shift_operations(?)', [JSON.stringify(obj)], (err, result) => {
    if (err) {
      return res.json({
        state: -1,
        message: err,
        data: err
      })
    }
    else {
      if (req.body.action == 'add' || req.body.action == 'edit') {
        let mapobj = {
          countryid: req.body.country,
          workforceid: req.body.workforce,
          locationid: req.body.state,
          businessunitid: req.body.businessunit,
          createdby: req.body.createdby,
          configcode: 'shift',
          mapaction: req.body.action
        }
        mapobj.id = req.body.id ? req.body.id : result[0][0].state
        commonModel.mysqlModelService('call usp_hr_mapping_operations(?)', [JSON.stringify(mapobj)], (err, mapresult) => {
          //console.log('errrr',err,mapresult)
          if (err) {
            return res.json({
              state: -1,
              message: err,
              data: err
            })
          } else {
            return res.json({
              state: 1,
              message: result[0] && result[0][0] && result[0][0].message,
              data: null
            })
          }
        });
      }
      else {
        return res.json({
          state: result[0] && result[0][0] && result[0][0].state,
          message: result[0] && result[0][0] && result[0][0].message,
          data: null
        })
      }

    }
  })
}
function shiftView(req, res) {
  if (!req.body.action) {
    return res.json({ state: -1, message: 'required parameters are missing' })
  }
  var obj = req.body;
  // obj.action='view';
  commonModel.mysqlModelService('call usp_shift_operations(?)', [JSON.stringify(obj)], (err, result) => {
    if (err) {
      return res.json({
        state: -1,
        message: err,
        data: err
      })
    }
    else {
      return res.json({
        state: result[1] && result[1][0] && result[1][0].state,
        message: result[1] && result[1][0] && result[1][0].message,
        data: result[0]
      })
    }
  })
}

function deactivateShift(req, res) {
  if (!req.body.id) {
    return res.json({ state: -1, message: 'required parameters are missing' })
  }
  var obj = req.body;
  obj.action = 'deactivate';

  // obj.action='view';
  commonModel.mysqlModelService('call usp_shift_operations(?)', [JSON.stringify(obj)], (err, result) => {
    if (err) {
      return res.json({ state: -1, message: err, data: null })
    }
    else {
      if (result[1] && result[1][0] && result[1][0].state && result[1][0].state == -1)
        if (result[0] && result[0].length > 0) {
          return res.json({
            state: 2,
            message: 'Shift mapping already exists with active user(s). Please Select alternate shift to deactivate',
            data: result[0]
          })
        } else {
          return res.json({
            state: -1,
            message: 'Cannot Deactivate Shift, as mapping already exists with active user(s) and no other alternate shift available',
            data: null
          })
        }
      return res.json({
        state: 1,
        message: "Deactivated Successfully",
        data: null
      })
    }
  })
}

function getAlternateShift(req, res) {
  if (!req.body.action || !req.body.reqtype) {
    return res.json({ state: -1, message: 'Required Paramteres are mssing' })
  }
  let obj = req.body;
  let obj1 = [];

  if (req.body.data) {
    obj1 = req.body.data;
  }
  var objp = JSON.stringify(obj);
  var objsub = JSON.stringify(obj1);
  commonModel.mysqlModelService(`call usp_hrmconfig_operations(?,?)`, [objp, objsub], (err, result) => {
    if (err) {
      return res.json({ state: -1, message: 'Something Went Wrong' })
    } else {
      if (req.body.reqtype == 'updateactivestatus') {
        return res.json({ state: 1, message: 'Success', data: null });
      }
      else {
        if (result && result[0] && result[0].length == 0) {
          return res.json({ state: -1, message: 'Cannot Deactivate these shifts, as they are assigned to active users and No Alternate Shifts available' })
        }
        return res.json({ state: 1, message: 'Success', data: result[0] })
      }
    }
  })

}