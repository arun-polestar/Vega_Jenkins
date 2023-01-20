const commonModel = require('../../common/Model');
var Cryptr = require('cryptr'),
  cryptr = new Cryptr('polestarsecretkey');
var _ = require('underscore');
const fs = require('fs');
// var Promise = require('Promise');
const appRoot = require('app-root-path');
const { google } = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
const webUrlLink = require('../../../config/config').webUrlLink;

const config = require("../../../config/config");
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;



module.exports = {
  getSchedulerData: getSchedulerData,
  saveSchedulerData: saveSchedulerData,
  changeSchedulerStatus: changeSchedulerStatus,
  finalSchedulerData: finalSchedulerData,
  getVerificationUrl: getVerificationUrl,
  generateToken: generateToken
}
function getSchedulerData(req, res, next) {
  req.body.action = 'view';
  var obj = JSON.stringify(req.body);
  //console.log(obj);
  global.scheduledData = [];
  commonModel.mysqlModelService('call usp_trxscheduler_mgm(?)', [obj], function (err, results) {
    if (err) {
      return res.json({ data: null, state: -1, message: err.message || err });
    }
    const resultData = results[0];

    var resultDataresult = [];
    for (let i = 0; i < resultData.length; i++) {

      resultDataresult[i] = resultData[i];

      if (resultData[i].token && resultData[i].isactive && resultData[i].levelid) {
        resultData[i].isverified = 1;
        global.scheduledData.push(resultDataresult[i]);
      } else {
        resultData[i].isverified = 0;
      }
    }

    req.body.resultFinal = JSON.parse(JSON.stringify(results[0]));
    next();

  });
}

function finalSchedulerData(req, res) {

  let newData = req.body.resultFinal;
  let finalData = [];


  for (let i = 0; i < newData.length; i++) {
    // newData[i].password = null;
    newData[i].frequency = newData[i].frequency && newData[i].frequency.toString();
    newData[i].resumesource = newData[i].resumesource && newData[i].resumesource.toString();
    finalData.push(newData[i]);
  }
  res.json({ message: 'success', data: finalData, state: 1 });
}


function saveSchedulerData(req, res) {

  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService('call usp_trxscheduler_mgm(?)', [obj], function (err, results) {
    if (err) {
      return res.json({ message: err.message || err, state: -1, data: null });
    }
    res.json({ message: 'success', data: results[0], state: 1 });
  });
}


function changeSchedulerStatus(req, res) {
  if (!req.body) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  var body = req.body;
  var obj = JSON.stringify(body);
  commonModel.mysqlModelService("call usp_trxscheduler_mgm(?)", [obj], function (err, results) {
    if (err) {
      return res.json({ message: err, state: -1, data: null });
    }
    res.json({ message: 'success', data: results, state: 1 });
  });
}


/**
 * It generates url to verify the requested email
 * 
 * @param {*} req  Request will contain email to verify
 * @param {*} res  A URL link to veify the email 
 */
function getVerificationUrl(req, res) {

  if (!req.body.id) {
    //console.log("Id not found!", req.body.id);
    return res.json({
      message: "Required parameters are missing.",
      state: -1,
      data: null
    });
  }

  global.id = req.body.id;
  global.createdby = req.body.createdby;
  let obj = JSON.stringify({
    id: req.body.id,
    createdby: req.body.createdby,
    action: 'view'
  });

  commonModel.mysqlModelService('call usp_trxscheduler_mgm(?)', [obj], (err, results) => {
    if (err || !results || !results[0] || !results[0][0] || !results[0][0].email) {
      return res.json({
        message: err || "Invalid Id",
        data: null,
        state: -1
      });
    }
    fs.readFile(`${appRoot}/config/credentials.json`, (err, credential) => {
      if (err) {
        //console.log('Error loading client secret file:', err);
        return res.json({
          message: "No credentials found",
          state: -1,
          data: null
        });
      }
      try {
        //Creating a new OAuth client and generating the varification url
        const { client_secret, client_id, redirect_uris } = JSON.parse(credential).web;
        const oAuth2Client = new google.auth.OAuth2(
          client_id, client_secret, redirect_uris[0]);

        // //console.log("rreesssss", results[0][0].email);
        const authUrl = oAuth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: SCOPES,
          state: `${webUrlLink}/#/scheduler/`,
          prompt: 'consent',
          // login_hint: results[0][0].email
        });

        //storing data to use in generateToken call
        global.id = req.body.id;
        global.createdby = req.body.createdby;

        return res.json({
          message: "success",
          state: 1,
          data: authUrl
        });
      } catch (err) {
        console.error("Error while generating auth Url", err);
        return res.json({
          message: "Error while generating auth Url",
          state: -1,
          data: null
        });
      }
    });
  });
}


/**
 * Generates token using varification code and writes 
 * code to database for verified email
 */
function generateToken(req, res) {
  params = req.query;
  params.id = global.id;
  params.createdby = global.createdby;
  global.id = null;
  global.createdby = null;

  if (!params || !params.id || !params.createdby || !params.code) {
    return res.send(`<!DOCTYPE html><html><head><script>window.open('${req.query.state}?status="Something went wrong!"','_self');</script></head></html>`);
  }
  //console.log("parameters that will be used by generateToken api:", params);

  fs.readFile(`${appRoot}/config/credentials.json`, (err, credential) => {
    if (err) {
      //console.log('Error loading client secret file:', err);
      return res.send(`<!DOCTYPE html><html><head><script>window.open('${req.query.state}?status="Something went wrong!"','_self');</script></head></html>`);
    }

    //Creating a new OAuth client and generating the token
    const { client_secret, client_id, redirect_uris } = JSON.parse(credential).web;
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

    oAuth2Client.getToken(params.code, (err, token) => {
      if (err) {
        console.error("Error in token generation from googleapi", err);
        return res.send(`<!DOCTYPE html><html><head><script>window.open('${req.query.state}?status="Something went wrong!"','_self');</script></head></html>`);
      }
      oAuth2Client.setCredentials(token);
      //create a new lable VEGA_READ
      const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
      gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name: "VEGA_READ",
          labelListVisibility: "LABEL_HIDE",
          messageListVisibility: "HIDE"
        }
      }, (err, result) => {

        if (err && err.error && err.error.code !== 409) {
          console.error('The API for label creation returned an error: ' + err);
          return res.send(`<!DOCTYPE html><html><head><script>window.open('${req.query.state}?status="Something went wrong!"','_self');</script></head></html>`);
        }

        let levelid = result && result.data && result.data.id;
        //console.log(`${levelid && result.data.name} label created`, levelid);
        //Get verified user email
        gmail.users.getProfile({
          userId: 'me',
        }, (err, result) => {

          if (err || !result.data) {
            console.error('The API for user email returned an error: ' + err);
            return res.send(`<!DOCTYPE html><html><head><script>window.open('${req.query.state}?status="Something went wrong!"','_self');</script></head></html>`);
          }
          //console.log(result.data);

          //save token to database
          obj = {
            token: token,
            id: params.id,
            email: result.data.emailAddress,
            createdby: params.createdby,
            action: 'savetoken'
          };
          if (levelid) obj.levelid = levelid;
          commonModel.mysqlModelService('call usp_trxscheduler_mgm(?)', [JSON.stringify(obj)], (err, results) => {
            if (err) {
              //console.log("Error in Saving token and levelid to database:", err);
              return res.send(`<!DOCTYPE html><html><head><script>window.open('${req.query.state}?status="Something went wrong!"','_self');</script></head></html>`);
            }

            return res.send(`<!DOCTYPE html><html><head><script>window.open('${req.query.state}?status=success','_self');</script></head></html>`);

          });

        });

      });

    });

  });
}
