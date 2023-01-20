"use strict";

var config = require("../../config/config");
var axios = require("axios");
const log = require("log-to-file");
const path = require("path");
const appRoot = require("app-root-path");
const empCtrl = require("../employee/employee.controller");
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;

module.exports = {
  clientApiCallValidation,
  clientApiDataTransmission,
  clientApiCallClosure,
};

/**
 * 
 * Step 1 API-> https://dataapi.savistaglobal.com/colleagues/authenticate
 * JSON ->{
username: ‘********’,
token: ‘********’
}
 */
function clientApiCallValidation() {
  const newnow = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
  });
  if (!fs.existsSync(path.join(appRoot.path, "uploads/errorlogs"))) {
    fs.mkdirSync(path.join(appRoot.path, "uploads/errorlogs"));
  }

  let linkUrl = config.webUrlLink;
  var errlogfile = path.join(
    appRoot.path,
    "uploads/errorlogs",
    "clientempapiservice.log"
  );

  //console.log("This is For clientApiCallValidation");
  log("Inside clientApiCallValidation", errlogfile);
  let apiurl = config.clientapi.validationurl;
  let apiusername = config.clientapi.username;
  let apitoken = config.clientapi.token;

  var obj = { username: apiusername, token: apitoken };
  // axios.post(apiurl); // for only ping on the server (savista)
  axios
    .post(apiurl, obj, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((response) => {
      log("status-> " + response.status, errlogfile);
      log("Data->" + response.data, errlogfile);
      log("sessionId->" + response.data.sessionId, errlogfile);

      if (response.status === 200 && response.data.sessionId) {
        clientApiDataTransmission(response.data.sessionId);
      }
    })
    .catch((error) => {
      //console.log("Error in authenticate Api->", error);
      log("Error in authenticate Api->" + error, errlogfile);

      empCtrl.sendNotificationEmpApiErr(error, apiurl);
    });
}

/**
 *
 * Step 2 API-> https://dataapi.savistaglobal.com/colleagues/transmitdata
 * JSON ->{
token: ‘********’,
sessionId: ‘********’
}
 */
function clientApiDataTransmission(sessionId) {
  //console.log("This is For clientApiDataTransmission->>");
  var errlogfile = path.join(
    appRoot.path,
    "uploads/errorlogs",
    "clientempapiservice.log"
  );
  log("Inside clientApiDataTransmission->>" + sessionId, errlogfile);
  let webUrlLink = config.webUrlLink;
  let apiurl = config.clientapi.transmissionurl;
  let apitoken = config.clientapi.token;
  var errlogfile = path.join(
    appRoot.path,
    "uploads/errorlogs",
    "clientempapiservice.log"
  );

  var obj = { token: apitoken, sessionId: sessionId };

  axios
    .post(apiurl, obj, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((response) => {
      //console.log("Status ->", response.status);
      // //console.log("Data ->", response.data);
      //console.log("length->>", response.data.length);
      log("Status ->" + response.status, errlogfile);
      //log("Data ->" + JSON.stringify(response.data), errlogfile);
      log("length->>" + response.data.length, errlogfile);
      let jsondata = response.data;
      let countupdate = empCtrl.clientWiseEmployeeSync(
        jsondata,
        webUrlLink,
        apiurl
      );
      //log("Count Updated" + countupdate, errlogfile);
      clientApiCallClosure(response.data.length, sessionId);
    })
    .catch((error) => {
      //console.log("Error in authenticate Api->", error);
      log("Error in authenticate Api->" + error, errlogfile);

      empCtrl.sendNotificationEmpApiErr(error, apiurl);
    });
}

/**
 *
 * Step 3 API-> https://dataapi.savistaglobal.com/colleagues/callclosure
 * JSON ->{
token: ‘********’,
sessionId: ‘********’,"receivedCount":""
}
 */

function clientApiCallClosure(count, sessionId) {
  //console.log("This is For clientApiCallClosure->>", count);
  var errlogfile = path.join(
    appRoot.path,
    "uploads/errorlogs",
    "clientempapiservice.log"
  );
  log("Inside clientApiCallClosure->>sesssionid:" + sessionId, errlogfile);
  log("Inside clientApiCallClosure->>count:" + count, errlogfile);
  let apiurl = config.clientapi.closureurl;

  let apitoken = config.clientapi.token;
  var obj = { token: apitoken, sessionId: sessionId, receivedCount: count };

  axios
    .post(apiurl, obj, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((response) => {
      //console.log("Status ->", response.status);
      //console.log("Data ->", response.data);
      log("Status ->" + response.status, errlogfile);
      log("Data ->" + response.data, errlogfile);
      //log("length->>" + response.data.length, errlogfile);
    })
    .catch((error) => {
      //console.log("Error in Closure Api->", error);
      log("Error in Closure Api->" + error, errlogfile);
      empCtrl.sendNotificationEmpApiErr(error, apiurl);
    });
}
