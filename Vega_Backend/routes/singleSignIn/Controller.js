
const commonModel = require('../common/Model');
const proc = require('../common/procedureConfig');
const config = require('../../config/config');
const jwt = require('jsonwebtoken');
// var crypto= require("crypto");
// const bcrypt = require('bcrypt');
const moment = require('moment');
// var authService = require('../../services/authService');
const _ = require('underscore');
// const mailService = require('../../services/mailerService');

module.exports = {
  syncdb: syncdb,
  Authorize: Authorize
}



function syncdb(req, res) {
  if (!req.body || !req.body.createdby) {
    return res.json({ message: "Invalid Json File", state: -1, data: null });
  }
  var obj = req.body.key;
  obj = JSON.stringify(obj);
  commonModel.mysqlModelService('call usp_syncuser_operations(?)', [obj], function (error, result) {
    if (error) {
      return res.json({ state: -1, message: error, data: null });
    } else {
      // if (result && result[1] && result[1][0] && result[1][0].state && result[1][0].state == 1) {
      //     return res.json({
      //         data: result[0],
      //         state: result[1][0].state,
      //         message: result[1][0].message
      //     })
      // } else {
      //     return res.status(400).json({ message: "Something went wrong.", state: -1, data: null });
      // }
      return res.json({ state: 1, message: "success", data: result[0] });

    }
  });
}


function Authorize(req, res) {
  //console.log('asfkjasdjhfajhsfasdjhfasjhd')
  if (req.body && req.body.token) {
    tokenCheck(req.body.token, (err, response) => {
      if (err) {
        res.json(err);
      } else {
        jwt.verify(req.body.token, 'copycatIsGre3t', (err, result) => {
          if (err) {
            res.json({
              "state": "-1",
              "message": "Invalid Token",
              "result": null
            })
          } else {
            // //console.log('token---------------->',result);
            var data = result.data;
            //console.log("dtataaatatat", data)
            // res.json({data});

            var obj = JSON.stringify({ "useremail": data.emailid });

            commonModel.mysqlModelService(proc.uservalidate, [obj], function (err, results) {
              if (err) {
                //console.log("errorororor", err);
                return res.json({ state: -1, message: err, data: null });
              }
              var response = results && results[0] && results[0][0];
              obj = JSON.stringify({
                guid: response.guid,
                createdby: response.id,
                id: response.id
              });

              commonModel.mysqlModelService(proc.userview, [obj], function (err, results1) {
                if (err) {
                  return res.json({ state: -1, message: err, data: null });
                }
                var userInfo = results1[0][0];
                if (!userInfo) {
                  return res.json({ state: -1, message: 'Invalid User.', data: null });
                }
                var tokenData = {
                  id: userInfo.id,
                  email: userInfo.useremail,
                  firstname: userInfo.firstname,
                  lastname: userInfo.lastname,
                  managerid: userInfo.managerid,
                  accessType: 'user',
                  timestamp: moment().format('LLLL'),
                  guid: userInfo.guid
                }
                var token = jwt.sign(tokenData, config.jwt.secretcode, {
                  expiresIn: config.jwt.expiresin// expires in 24 hours
                });
                var tokendata = {
                  utoken: token,
                  jsondata: tokenData,
                  userid: tokenData.id,
                  guid: tokenData.guid,
                  action: 'login'
                }
                var ua = req.headers['user-agent'],
                  browserobj = {};
                devicetype = '';
                deviceversion = '';
                browsername = '';
                if (/mobile/i.test(ua)) {
                  browserobj.Mobile = true;
                  browserobj.browsername = 'mobile';
                }

                if (/like Mac OS X/.test(ua)) {
                  browserobj.iOS = /CPU( iPhone)? OS ([0-9\._]+) like Mac OS X/.exec(ua)[2].replace(/_/g, '.');
                  browserobj.iPhone = /iPhone/.test(ua);
                  browserobj.iPad = /iPad/.test(ua);
                }

                if (/Android/.test(ua))
                  browserobj.Android = /Android ([0-9\.]+)[\);]/.exec(ua)[1];

                if (/webOS\//.test(ua))
                  browserobj.webOS = /webOS\/([0-9\.]+)[\);]/.exec(ua)[1];

                if (/(Intel|PPC) Mac OS X/.test(ua))
                  browserobj.Mac = /(Intel|PPC) Mac OS X ?([0-9\._]*)[\)\;]/.exec(ua)[2].replace(/_/g, '.') || true;

                if (/Windows NT/.test(ua))
                  browserobj.Windows = /Windows NT ([0-9\._]+)[\);]/.exec(ua)[1];

                if (/firefox/i.test(ua)) {
                  browser = 'firefox';

                }
                else if (/chrome/i.test(ua)) {
                  browser = 'chrome';
                }
                else if (/safari/i.test(ua))
                  browser = 'safari';
                else if (/msie/i.test(ua))
                  browser = 'msie';
                else
                  browser = 'chrome';
                tokendata['browserobj'] = browserobj;
                tokendata['browser'] = browser;
                tokendata['devicetype'] = browser;
                tokendata['devicename'] = browser;
                tokendata['browsername'] = browser;

                var tokendataobj = JSON.stringify(tokendata);

                commonModel.mysqlModelService(proc.tokenmgm, [tokendataobj], function (err, results1) {
                  if (err) {
                    return res.json({ state: -1, message: err, data: null });
                  } else {
                    return res.json({
                      state: 1, message: 'Success',
                      data: results1,
                      token: token,
                      RMSrole: userInfo.RMSrole,
                      isclientadmin: userInfo.isclientadmin,
                      defaultrole: userInfo.defaultmodulerole,
                      defaultModule: userInfo.defaultmodulename,
                      ispremium: userInfo.ispremium,
                      islicense: userInfo.islicense
                    });
                  }
                });
              });

            });

          }
        });
      }
    });
  } else {
    res.json({
      "state": "-1",
      "message": "Token Not Found",
      "result": null
    })
  }
}


function tokenCheck(obj, cb) {
  //console.log(obj,"rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr");
  var obj1 = {
    token: obj
  }
  commonModel.mysqlModelService('call usp_token_fusionData(?)', [JSON.stringify(obj1)], (err, res) => {
    if (err) {
      var err = {
        "state": "-1",
        "message": "Something Went Wrong",
        "result": null
      };
      return cb(err, null);
    } else {
      return cb(null, res);
    }
  })
}