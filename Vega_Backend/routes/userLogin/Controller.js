const commonModel = require("../common/Model");
const proc = require("../common/procedureConfig");
const config = require("../../config/config");
const jwt = require("jsonwebtoken");
// var crypto= require("crypto");
const bcrypt = require("bcryptjs");
const moment = require("moment");
var authService = require("../../services/authService");
const _ = require("underscore");
// const mailService = require('../../services/mailerService');
module.exports = {
  login: login,
  //  appLogin: appLogin,
  checkSession: checkSession,
  // forgetPassword:forgetPassword
};

function login(req, res) {
  //console.log("dshdshdhdhdh");
  if (!req.body.useremail || !req.body.userpassword) {
    // return res.badRequest();
    return res.json({
      state: -1,
      message: "Don't leave a field empty",
      data: null,
    });
  }
  var obj = JSON.stringify({ useremail: req.body.useremail });
  commonModel.mysqlModelService(
    proc.uservalidate,
    [obj],
    function (err, results) {
      if (err) {
        return res.json({ state: -1, message: err, data: null });
      }
      var response = results[0][0];
      bcrypt.compare(
        req.body.userpassword,
        response.userpassword,
        function (err, result) {
          if (!result) {
            return res.json({
              state: -1,
              message: "User name/password is incorrect.",
              data: null,
            });
          }
          obj = JSON.stringify({
            id: response.id,
            createdby: response.id,
          });
          commonModel.mysqlModelService(
            proc.userview,
            [obj],
            function (err, results1) {
              if (err) {
                return res.json({ state: -1, message: err, data: null });
              }
              //console.log("a------------------", results1[0][0]);
              var userInfo = results1[0][0];
              if (!userInfo) {
                return res.json({
                  state: -1,
                  message: "Invalid User.",
                  data: null,
                });
              }
              var tokenData = {
                id: userInfo.id,
                email: userInfo.useremail,
                firstname: userInfo.firstname,
                lastname: userInfo.lastname,
                managerid: userInfo.managerid,
                accessType: "user",
                timestamp: moment().format("MMMM Do YYYY, h:mm:ss a"),
              };
              ////console.log('token-data----------',tokenData,'sails.jwtsecret  value----',sails.config.jwtSecret);
              var token = jwt.sign(tokenData, config.jwtSecret, {
                expiresIn: 84000 * 7, // expires in 24 hours
                //   expiresIn:"7 days"
              });
              ////console.log("token in home---==",token);

              var tokendata = {
                utoken: token,
                jsondata: tokenData,
                userid: tokenData.id,
                action: "login",
              };
              var ua = req.headers["user-agent"],
                browserobj = {};
              devicetype = "web";
              deviceversion = "";
              browsername = "";
              if (/mobile/i.test(ua)) {
                browserobj.Mobile = true;
                browserobj.browsername = "mobile";
                devicetype = "mobile";
              }

              if (/like Mac OS X/.test(ua)) {
                browserobj.iOS = /CPU( iPhone)? OS ([0-9\._]+) like Mac OS X/
                  .exec(ua)[2]
                  .replace(/_/g, ".");
                browserobj.iPhone = /iPhone/.test(ua);
                browserobj.iPad = /iPad/.test(ua);
              }

              if (/Android/.test(ua))
                browserobj.Android = /Android ([0-9\.]+)[\);]/.exec(ua)[1];

              if (/webOS\//.test(ua))
                browserobj.webOS = /webOS\/([0-9\.]+)[\);]/.exec(ua)[1];

              if (/(Intel|PPC) Mac OS X/.test(ua))
                browserobj.Mac =
                  /(Intel|PPC) Mac OS X ?([0-9\._]*)[\)\;]/
                    .exec(ua)[2]
                    .replace(/_/g, ".") || true;

              if (/Windows NT/.test(ua))
                browserobj.Windows = /Windows NT ([0-9\._]+)[\);]/.exec(ua)[1];

              if (/firefox/i.test(ua)) {
                browser = "firefox";
              } else if (/chrome/i.test(ua)) {
                browser = "chrome";
                ////console.log('browaer3333333333333',browser)
              } else if (/safari/i.test(ua)) browser = "safari";
              else if (/msie/i.test(ua)) browser = "msie";
              else browser = "chrome";
              tokendata["browserobj"] = browserobj;
              tokendata["browser"] = browser;
              tokendata["devicetype"] = devicetype;
              tokendata["devicename"] = browser;
              tokendata["browsername"] = browser;
              //console.log("browsxxxerobj=============", browserobj);

              var tokendataobj = JSON.stringify(tokendata);
              //console.log("tokendataObj----------", tokendataobj);

              commonModel.mysqlModelService(
                proc.tokenmgm,
                [tokendataobj],
                function (err, results1) {
                  if (err) {
                    return res.json({ state: -1, message: err, data: null });
                  } else {
                    return res.json({
                      state: 1,
                      message: "Success",
                      data: null,
                      token: token,
                    });
                  }
                }
              );
            }
          );
        }
      );
    }
  );
}

function checkSession(req, res) {
  authService.getData(req.headers, "user", function (err, data) {
    if (err) {
      return res.json({ state: -1, message: err, data: null });
    }
    var userId = data.id;
    obj = JSON.stringify({
      id: userId,
      createdby: userId,
      guid: data.guid,
      apiname: "checksession",
      //guid:data.guid
      //  type : 'active'
    });

    commonModel.mysqlModelService(
      proc.userview,
      [obj],
      function (err, userData) {
        if (err) {
          return res.json({ state: -1, message: err, data: null });
        }
        // errorService.getError(userData[0][0],function(err){
        // if(err) return res.status(422).send(err);
        // var userInfo = userData[0][0];
        // if(!userInfo){
        // 	return res.forbidden('Invalid User.');
        // }
        var userInfo = userData[0][0];
        if (!userInfo) {
          return res.json({ state: -1, message: "Invalid User.", data: null });
        }

        userInfo.lastLogin = data.timestamp;
        userInfo.theme = {
          primary: userInfo.primarytheme || "rgb(19,30,37)",
          secondry: userInfo.secondrytheme || "#1ABB9C",
        };
        obj = JSON.stringify({
          userid: userId,
          createdby: userId,
          populate: 1,
          guid: data.guid,
        });

        commonModel.mysqlModelService(
          proc.mstusermoduleView,
          [obj],
          function (err, moduleData) {
            ////console.log("%%%%%%%%%%%%%%%%%%%%dd",moduleData);
            if (err) {
              return res.json({ state: -1, message: err, data: null });
            }
            //     errorService.getError(moduleData[0][0],function(err){
            // if(err)  return res.status(422).send(err);
            var userModules = _.mapObject(
              _.groupBy(_.where(moduleData[0], { isactive: 1 }), "module"),
              function (val, key) {
                return val[0];
              }
            );
            if (userModules.Settings) userInfo.isAdmin = true;
            userModules.defaultModule = _.where(moduleData[0], {
              isdefault: 1,
            })[0]
              ? _.where(moduleData[0], { isdefault: 1 })[0].module
              : "";
            return res.json({
              state: 1,
              userInfo: userInfo,
              userModules: userModules,
              logo: data.logo,
            });

            // return res.ok({userInfo:userInfo,userModules:userModules});
            //     });
          }
        );
        //   });
      }
    );
  });
}
