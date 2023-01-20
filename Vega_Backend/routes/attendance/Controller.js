const proc = require('../common/procedureConfig');
const config = require('../../config/config');
const commonModel = require('../common/Model');
const commonCtrl = require('../common/Controller');
const path = require('path');
const mailservice = require('../../services/mailerService');
var moment = require('moment-timezone');
const axios = require('axios');
const query = require('../common/Model').mysqlPromiseModelService;
const feedbackController = require("../feedback/Controller");

module.exports = {
  attendanceview: attendanceview,
  attendanceteam: attendanceteam,
  viewattendance: viewattendance,
  getDailyAttendance,
  getMissedAttendance,
  getLocationByCoordinates,
  getCurrentWeekAttendance,
  getDistanceBetweenTwoCoordinates,
  getLastThirtyDaysLeaveDetails,
  validateQrCode,
  findDistanceBetweenTwoCoordinates,
  checkoutDetails
}


function attendanceview(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({ message: "Send required data", state: -1 })

  }
  let obj = commonCtrl.verifyNull(req.body);
  let trxcheckinstatus, trxdate, typemail, headingtype, subjecttype;
  obj = JSON.stringify(obj);
  commonModel.mysqlPromiseModelService(proc.attendance, [obj])
    .then(results => {

      if (results && results[0] && results[0][0] && results[0][0].emailid) {
        if (req.body.action == 'checkin-request') {
          trxdate = req.body && req.body.requestDate && moment(req.body.requestDate, 'YYYY-MM-DD').format('DD MMMM YYYY');
          typemail = 'checkinrequested';
          subjecttype = "Check-in/Check-out is requested by trxempname";
          headingtype = "Check-in/Check-out is requestedby ( " + results && results[0] && results[0][0] && results[0][0].trxempname || '' + " )>";
        } else if (req.body.action == 'approve') {
          //console.log("hhhh",req.body)
          trxdate = req.body && req.body.fulldate && moment(req.body.fulldate, 'YYYY-MM-DD').format('DD MMMM YYYY')
          if (req.body.ispending == 0) {
            trxcheckinstatus = 'Approved'
          } else if (req.body.ispending == 2) {
            trxcheckinstatus = 'Rejected'
          }

          typemail = 'checkinrequestaction';
          subjecttype = "Check-in/Check-out is trxcheckinstatus by trxcheckinactionby";
          headingtype = "Check-in/Check-out is trxcheckinstatus by trxcheckinactionby";
        }
        let emailObj = {
          email: results[0][0].emailid || " ",
          //cc: results[0][0].emailid || " ",
          mailType: typemail,
          moduleid: req.body.moduleid ? req.body.moduleid : 'attendance',
          userid: req.body.userid ? req.body.userid : req.body.createdby,


          bodyVariables: {
            trxempname: results && results[0] && results[0][0] && results[0][0].trxempname || '',
            trxcheckindate: trxdate,//results && results[0] && results[0][0] && results[0][0].trxdate || '',
            trxcheckinreason: results && results[0] && results[0][0] && results[0][0].trxreason,
            trxcheckinstatus: trxcheckinstatus || '',
            trxcheckinactionby: req.body.tokenFetchedData.firstname + ' ' + req.body.tokenFetchedData.lastname || '',
            // userid: req.body && req.body.userid
          }, subjectVariables: {
            trxcheckinstatus: trxcheckinstatus || '',
            subject: subjecttype
          },
          headingVariables: {
            heading: headingtype
          }
        }
        mailservice.mail(emailObj, function (err) {
          if (err) {
            //console.log("MAILLLLLLLLLLL", err);
          }
        });
      }
      res.json({ state: 1, message: "Success", data: results });
    })
    .catch(err => {
      return res.json({ state: -1, data: null, message: err.message || err });
    })
}


async function attendanceteam(req, res) {
  try {
    if (!req.body) {
      return res.json({ message: "send required data", state: -1, data: null })
    } else {
      let allreportees = await feedbackController.userhierarcy(req, res);
      let obj = req.body.action == "attendanceteam" ? { allreportees, ...req.body } : req.body;
      let results = await query(proc.attendance, [JSON.stringify(obj)]);
      let dbresult = commonCtrl.lazyLoading(results[0], obj);
          if (dbresult && "data" in dbresult && "count" in dbresult) {
            return res.json({ "state": 1, message: "success", "data": dbresult.data, "count": dbresult.count });
          }
          else {
            return res.json({ state: -1, message: "something went wrong", data: null })
          }
    }
  } catch (error) {
      return res.json({ state: -1, data: null, message: err.message || err });
    }
  }



function viewattendance(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null })
  } else {
    var obj = JSON.stringify(req.body);
    //console.log('AAAAAAAAAAAAAAAAAAAA',obj);
    commonModel.mysqlPromiseModelService(proc.attendance, [obj])
      .then(results => {
        return res.json({ state: 1, message: "Success", data: results })

      })
      .catch(err => {
        return res.json({ state: -1, data: null, message: err.message || err });
      })
  }
}
function getDailyAttendance(req, res) {
  try {
    let { k: key, d: date } = req.query;
    if (!key) return res.json({ state: -1, message: 'Invalid Key' })
    let obj = {
      action: 'daily_attendance',
      s_key: key,
      requestDate: date
    }
    commonModel.mysqlPromiseModelService(proc.attendance, [JSON.stringify(obj)])
      .then(results => {
        return res.json({ state: 1, message: "Success", data: results[0] })

      })
      .catch(err => {
        return res.json({ state: -1, data: null, message: err.message || err });
      })
  } catch (error) {
    console.error('Error', error);
    return res.json({ state: -1, message: catchErr });
  }

}
function getMissedAttendance(req, res) {
  try {
    let { k: key } = req.query;
    if (!key) return res.json({ state: -1, message: 'Invalid Key' })
    let obj = {
      action: 'missed_attendance',
      s_key: key,
      ...req.body
    }

    commonModel.mysqlPromiseModelService(proc.attendance, [JSON.stringify(obj)])
      .then(results => {
        return res.json({ state: 1, message: "Success", data: results[0] })

      })
      .catch(err => {
        return res.json({ state: -1, data: null, message: err.message || err });
      })
  } catch (error) {
    console.error('Error', error);
    return res.json({ state: -1, message: catchErr });
  }
}
function getLocationByCoordinates(req, res) {
  if (!req.body.latitude || !req.body.longitude) {
    return res.json({ state: -1, message: "Something went wrong", err: "Required Parameters are missing" })
  }
  let obj = JSON.stringify({ action: 'coordinates', ...req.body })
  commonModel.mysqlPromiseModelService(proc.attendance, [obj])
    .then(async results => {
      /**
       * IF google Map is allow take key from the database and Call it
       */
      let google_obj = results[1] && results[1][0] && results[1][0]
      if ((results[0] && results[0].length == 1)
        || (google_obj && google_obj.isgoogle_map == 0)) {
        return res.json({ state: 1, message: "Success", data: results[0] })
      } else {
        if (google_obj && google_obj.googlemap_key) {
          let resp = await getLocationNamebyCoordinates(req.body.latitude, req.body.longitude, google_obj.googlemap_key);
          await query('call usp_attendance_operations(?)', [JSON.stringify({ ...resp, action: "location_master" })]);
          return res.json({ state: 1, message: 'Success', data: [resp] })
        } else {
          return res.json({ state: 1, message: "Success", data: results[0] })
        }
      }
    })
    .catch(err => {
      return res.json({ state: -1, data: null, message: err.message || err });
    })
}

async function getLocationNamebyCoordinates(lat, long, key) {
  let result = {
    latitude: lat,
    longitude: long
  };
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${key}`)
    ////console.log(response.data,'here')
    if (response && response.data && response.data.status && response.data.status == 'OK') {
      let locationJson = response.data['results']
      let locationname = locationJson[0].formatted_address
      result = {
        ...result,
        locationJson,
        locationname
      }
      return result;
    }
    else {
      return result;
    }
  } catch (err) {
    //console.log('err from google api',err);
    return result;
  }
}

function getCurrentWeekAttendance(req, res) {
  if (!req.body) {
    return res.json({ message: "send required data", state: -1, data: null })
  } else {
    var obj = JSON.stringify(req.body);
    ////console.log(obj, "ddddddddddddddd");
    commonModel.mysqlPromiseModelService(proc.attendance, [obj])
      .then(results => {
        return res.json({ state: 1, message: "Success", data: results })

      })
      .catch(err => {
        return res.json({ state: -1, data: null, message: err.message || err });
      })
  }
}


async function findDistanceBetweenTwoCoordinates(lat1, lon1, lat2, lon2) {
  try {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1); 
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = Number((R * c * 1000).toFixed(2)); // Distance in metre

    return d;
  } catch (error) {
    return error;
  }
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

async function getDistanceBetweenTwoCoordinates(req,res) {
  try {
    var obj = req.body;
    obj.action = "office_coordinate" ;
    //await verifyNull(obj);
    var result = await query('call usp_attendance_operations(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }
    let lat1 = req.body.latitude;
    let lon1 = req.body.longitude;
    let lat2 = result && result[0] && result[0][0].latitude;
    let lon2 = result && result[0] && result[0][0].longitude;
    let distance = await findDistanceBetweenTwoCoordinates(lat1, lon1, lat2, lon2);
    return res.json({
      state: 1,
      message: "success",
      data: distance
    })
  } catch (error) {
    //console.log("error", error);
    return res.json({
      state: -1,
      message: error,
      data: null
    });
  }
}

async function getLastThirtyDaysLeaveDetails(req,res) {
  try {
    var obj = req.body;
    obj.action = "leave_details";
    var result = await query('call usp_attendance_operations(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }
    
    return res.json({
      state: 1,
      message: "success",
      data: result && result[0]
    })
  } catch (error) {
    //console.log("error", error);
    return res.json({
      state: -1,
      message: error,
      data: null
    });
  }
}
async function validateQrCode(req, res) {
  if (!req.body.qr_code) {
    return res.json({ state: -1, message: "Required Parameters are Missing" })
  }
  try {
    let reqData = req.body;
    reqData.action = 'qrvalidate';
    let [results] = await query('call usp_attendance_operations(?)', [JSON.stringify(reqData)])
    return res.json({ state: 1, message: "Success", results: results });
  } catch (err) {
    return res.json({ state: -1, message: err || 'Something went wrong', err: err })
  }

}

async function checkoutDetails(req, res, next) {
  try {
    let reqData = req.body
    let [results] = await query('call usp_attendance_operations(?)', [JSON.stringify(reqData)])
    return res.json({ state: 1, message: "Success", data: results });

  } catch (err) {
    return res.json({ state: -1, message: err })
  }
}