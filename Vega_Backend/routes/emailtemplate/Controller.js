"use strict";

const proc = require("../common/procedureConfig");
const config = require("../../config/config");
const commonModel = require("../common/Model");
const commonCtrl = require("../common/Controller");
const path = require("path");
const mailservice = require("../../services/mailerService");
const mysqlserv = require("../../services/mysqlService");
const uploadService = require("../../services/uploadService");
const _ = require("underscore");
const async = require("async");
const moment = require("moment");
const fs = require("fs");
const appRoot = require("app-root-path");
appRoot.originalPath = appRoot.path
const directoryPath = path.join(
  appRoot.path,
  "assets/mailtemplate/contenttype"
);
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;
const cheerio = require("cheerio");

module.exports = {
  mailtypelist: mailtypelist,
  uploadEmailAssets: uploadEmailAssets,
  testmailtemplate: testmailtemplate,
  viewEmailAssetsParams: viewEmailAssetsParams,
  updateEmailAssetsParams: updateEmailAssetsParams,
  addEmailParams: addEmailParams,
  saveEmailTemplate: saveEmailTemplate,
  deactivatetemplate: deactivatetemplate,
  getcustomroles: getcustomroles,
};
function mailtypelist(req, res) {
  if (!req.body || !req.body.reqtype || !req.body.moduleid) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    var obj = JSON.stringify(req.body);
    var obj2 = [];
    commonModel
      .mysqlPromiseModelService("call usp_emailtemplate_operations(?,?,?)", [
        obj,
        JSON.stringify(obj2),
        "",
      ])
      .then((results) => {
        if (
          results &&
          results[1] &&
          results[1][0] &&
          results[1][0].state &&
          results[1][0].state == 1
        ) {
          // if(req.body.reqtype == "view"){
          ////console.log("head",results[0])
          results[0].forEach(function (item) {
            // var defheader = item && item.header
            //    var deffooter = item && item.footer
            //var fullhtml2 = (item && item.fullhtml)//.replace(//\/g, '\"');
            var defcontent = item && item.fullhtml;
            var clientlogo = "";
            var logo;
            logo = "/email/img/logo.png";
            var logopath1 = path.join(appRoot.path, "assets/img/logo.png");
            if (!fs.existsSync(logopath1)) {
              logo = "/email/img/logo-login.png";
            }

            var fb = "/email/img/fbnew.png";
            var twt = "/email/img/twtnew.png";
            var lnkd = "/email/img/linkedin.png";
            var ios = "/email/img/iosf.png";
            var android = "/email/img/androidf.png";

            var profilepathcl =
              results[1] && results[1][0] && results[1][0].clientpath;
            var clientlogo = "/email/img/client-logo.jpg";

            if (profilepathcl) {
              var filepath = path.join(appRoot.path, "uploads" + profilepathcl);
              if (fs.existsSync(filepath)) {
                clientlogo = "/email" + profilepathcl;
              }
            }
            //config.webUrlLink + '/webapi/anniversary/happy-work-anniversary-4.jpg'
            ////console.log("client",clientlogo)

            //  defheader =defheader && defheader.replace('cid:trxlnkd', lnkd).replace('cid:trxtwt', twt)
            //    .replace('cid:trxfb', fb).replace('cid:trxclientlogo', clientlogo).replace('cid:trxapplogo',logo)
            //deffooter =deffooter && deffooter.replace('cid:trxlnkd', lnkd).replace('cid:trxtwt', twt)
            //   .replace('cid:trxfb', fb).replace('cid:trxclientlogo', clientlogo).replace('cid:trxapplogo', logo)

            defcontent =
              defcontent &&
              defcontent
                .replace("cid:trxlnkd", lnkd)
                .replace("cid:trxtwt", twt)
                .replace("cid:trxfb", fb)
                .replace("cid:trxclientlogo", clientlogo)
                .replace("cid:trxapplogo", logo)
                .replace("cid:android", android)
                .replace("cid:ios", ios);

            ////console.log("imgrep",defheader)
            //  var commentpart = "/\<\!\-\-((.|[\n|\r|\r\n])*?)\-\-\>[\n|\r|\r\n]?(\s+)?/g";
            //defheader = defheader.replace(/ *\<\!\-\-[^)]*\-\-\> */g, "");
            //     defheader = defheader && defheader.replace(/ *\<\!\-\-[^]*\-\-\> */g, "");

            // //console.log("afetrcomm",defheader)
            //      deffooter = deffooter && deffooter.replace(/ *\<\!\-\-[^]*\-\-\> */g, "");
            //  defcontent = defcontent && defcontent.replace(/ *\<\!\-\-[^)]*\-\-\> */g, "");
            // //console.log("afetrcomm", defcontent)
            //  item.header = defheader
            //     item.footer = deffooter

            //  //console.log("arrem",emailParamsList)
            // if (item.activate == null  ){
            //     var emailParamsList = item && item.parameterscode.split(',');
            //     emailParamsList.map(function (code) {
            //         item.subject = item && item.subject && item.subject.replace(code, "{{"+code+"}}");
            //         var match = new RegExp(code, "ig");
            //         defcontent = defcontent && defcontent.replace(match, "{{" + code + "}}");

            //     });

            // }
            var emailParamsList =
              item && item.parameterscode && item.parameterscode.split(",");
            var emailParamsnames =
              item && item.parametersname && item.parametersname.split(",");

            //  //console.log("arrem",emailParamsList)
            //    emailParamsList.map(function (keycode,index) {
            //        var replacementvar = "<a _ngcontent-kqr-c23='' class='custom - link' draggable='true' href='#' emailtemplateparam="+keycode+">&nbsp;"+emailParamsnames[index]+"</a>"
            //        // $('a.custom-link[emailtemplateparam=' + item + ']').html(item || '<a style="color:red">Not Specified</a>');
            //        var match = new RegExp(keycode, "ig");
            //        defcontent = defcontent && defcontent.replace(match, replacementvar);
            //     });
            // $("a.custom-link").each(function () {
            //     $(this).attr("style", "color:black;text-decoration: none !important;cursor:none");
            //     $(this).attr("href", "#")
            // });

            item.fullhtml = defcontent;
            item.toemail = (item.toemail && item.toemail.split(",")) || ""; // && _.pluck(, 'name');
            item.ccemail = (item.ccemail && item.ccemail.split(",")) || "";
            item.others = (item.others && item.others.split(",")) || "";
            item.ccothers = (item.ccothers && item.ccothers.split(",")) || "";
            item.toemail = (item.toemail && item.toemail.map(Number)) || "";
            item.ccemail = (item.ccemail && item.ccemail.map(Number)) || "";
          });
          //    }

          ////console.log("resll",results[0][0])
          return res.json({
            state: results[1][0].state,
            message: results[1][0].message,
            data: results[0],
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
        return res.json({ state: -1, data: null, message: err.message || err });
      });
  }
}

function updatemailtypehtml() {
  fs.readdir(directoryPath, function (err, files) {
    if (err) {
      return //console.log("Unable to scan directory: " + err);
    }

    files.forEach(function (file) {
      //console.log(file);
    });
  });
}
function uploadEmailAssets(req, res) {
  if (!req.files) {
    return res.json({ state: -1, message: "No Files were uploaded" });
  } else {
    if (!fs.existsSync(path.join(appRoot.path, "uploads/emailassets"))) {
      fs.mkdirSync(path.join(appRoot.path, "uploads/emailassets"));
    }
    var tmpfilename = "uploads/emailassets/";
    uploadService
      .uploadmultipledoc(req, tmpfilename)
      .then(async (uploaddata) => {
        let obj = {
          createdby: req.body.createdby,
          reqtype: "insert_asset",
        };
        let obj2 = uploaddata;
        const results = await commonModel.mysqlPromiseModelService(
          "call usp_emailtemplate_operations(?,?,?)",
          [JSON.stringify(obj), JSON.stringify(obj2), ""]
        );
        return res.json({
          data: uploaddata,
          state: results[0] && results[0][0] && results[0][0].state,
          message: results[0] && results[0][0] && results[0][0].message,
        });
      })
      .catch((err) => {
        //console.log("err", err);
        return res.json({
          state: -1,
          message: "Something went wrong while uploading file(s)",
        });
      });
  }
}

function viewEmailAssetsParams(req, res) {
  let obj = req.body;
  //obj.reqtype = 'view_asset';
  let obj2 = [];
  commonModel
    .mysqlPromiseModelService("call usp_emailtemplate_operations(?,?,?)", [
      JSON.stringify(obj),
      JSON.stringify(obj2),
      "",
    ])
    .then((results) => {
      return res.json({
        state: results[1] && results[1][0] && results[1][0].state,
        message: results[1] && results[1][0] && results[1][0].message,
        data: results[0],
      });
    })
    .catch((err) => {
      //console.log("err", err);
      return res.json({
        state: -1,
        message: "Something went wrong while Viewing file(s)",
      });
    });
}
function updateEmailAssetsParams(req, res) {
  if (!req.body.id) {
    return res.json({ state: -1, message: "Required Parameters are missing" });
  }
  let obj = req.body;
  //obj.reqtype = 'delete_asset';
  let obj2 = [];
  commonModel
    .mysqlPromiseModelService("call usp_emailtemplate_operations(?,?,?)", [
      JSON.stringify(obj),
      JSON.stringify(obj2),
      "",
    ])
    .then((results) => {
      return res.json({
        state: results[0] && results[0][0] && results[0][0].state,
        message: results[0] && results[0][0] && results[0][0].message,
      });
    })
    .catch((err) => {
      //console.log("err", err);
      return res.json({
        state: -1,
        message: "Something went wrong while Deleting file(s)",
      });
    });
}

function testmailtemplate(req, res) {
  if (!req.body || !req.body.subject || !req.body.moduleid || !req.body.type) {
    return res.json({ state: -1, message: "Required Parameters are missing" });
  }
  // var attachments = req.body.attachments
  var attach = {
    filename: "",
    path: "",
  };
  // //console.log("cont",req.body.fullhtml)
  // var defheader = req.body && req.body.header
  //  var deffooter = req.body && req.body.footer
  var defcontent = req.body && req.body.fullhtml;
  var logo = "/email/img/logo.png"; //(path.join(appRoot.path, 'uploads' + mailInfo.logo))
  var logo2 = "/email/img/logo-login.png";

  var fb = "/email/img/fbnew.png";
  var twt = "/email/img/twtnew.png";
  var lnkd = "/email/img/linkedin.png";
  var ios = "/email/img/iosf.png";
  var android = "/email/img/androidf.png";
  var clientlogo = "/email/img/client-logo.jpg";
  mysqlserv.executeQuery(
    "Select profilepicpath from trx_admin_details where isactive=1",
    function (erre, rese) {
      var profilepathlogo = rese && rese[0] && rese[0].profilepicpath;
      profilepathlogo = "/email" + profilepathlogo;
      // var profilepathlogo = '/email/admin/photo-1494548162494-384bba4ab999 (1).jpeg';
      // defheader = defheader && defheader.replace(lnkd, 'cid:trxlnkd').replace(twt, 'cid:trxtwt')
      //    .replace(fb, 'cid:trxfb').replace(clientlogo, 'cid:trxclientlogo').replace(logo, 'cid:trxapplogo').replace(logo2, 'cid:trxapplogo').replace(profilepathlogo, 'cid:trxclientlogo');
      // deffooter = deffooter && deffooter.replace(lnkd, 'cid:trxlnkd').replace(twt, 'cid:trxtwt')
      //     .replace(fb, 'cid:trxfb').replace(clientlogo, 'cid:trxclientlogo').replace(logo, 'cid:trxapplogo').replace(logo2, 'cid:trxapplogo').replace(profilepathlogo, 'cid:trxclientlogo');
      defcontent =
        defcontent &&
        defcontent
          .replace(lnkd, "cid:trxlnkd")
          .replace(twt, "cid:trxtwt")
          .replace(fb, "cid:trxfb")
          .replace(clientlogo, "cid:trxclientlogo")
          .replace(logo, "cid:trxapplogo")
          .replace(logo2, "cid:trxapplogo")
          .replace(profilepathlogo, "cid:trxclientlogo")
          .replace(ios, "cid:ios")
          .replace(android, "cid:android");
      //req.body.header = defheader;
      //  req.body.footer = deffooter;
      req.body.fullhtml = defcontent;
      var emailObj = {
        id: req.body.createdby,
        createdby: req.body.createdby,
        //    attachments: attachments,
        mailType: req.body.type,
        // header:req.body.header,
        //footer:req.body.footer,
        content: req.body.fullhtml,
        trxtestmail: "test_mail",
        subject: req.body.subject,
        moduleid: req.body.moduleid,
        subjectVariables: {
          subject: req.body.subject,
        },
      };
      mailservice.mail(emailObj, function (err, response) {
        if (err) {
          //console.log(err);
        } else {
          //console.log("mail sent");
        }
      });
      return res.json({ state: 1, message: "Success", data: null });
    }
  );
}
function addEmailParams(req, res) {
  if (!req.body.category || !req.body.keycode || !req.body.keyname) {
    return res.json({ state: -1, message: "Required Parameters are missing" });
  }
  let obj = req.body;
  obj.reqtype = "add_parameter";
  let obj2 = [];
  commonModel
    .mysqlPromiseModelService("call usp_emailtemplate_operations(?,?,?)", [
      JSON.stringify(obj),
      JSON.stringify(obj2),
      "",
    ])
    .then((results) => {
      return res.json({
        state: results[0] && results[0][0] && results[0][0].state,
        message: results[0] && results[0][0] && results[0][0].message,
      });
    })
    .catch((err) => {
      //console.log("err", err);
      return res.json({
        state: -1,
        message: "Something went wrong while Adding Parameter(s)",
      });
    });
}
function saveEmailTemplate(req, res) {
  if (!req.body || !req.body.reqtype || !req.body.id || !req.body.type) {
    return res.json({ message: "send required data", state: -1, data: null });
  } else {
    //     //console.log("ren",req.body.fullhtml)

    mysqlserv.executeQuery(
      "Select profilepicpath from trx_admin_details where isactive=1",
      function (erre, rese) {
        // var defheader = req.body && req.body.header
        // var deffooter = req.body && req.body.footer
        //  var fullhtml2= ( req.body && req.body.fullhtml)//.replace(/"/g, '\\"');
        var defcontent = req.body && req.body.fullhtml;
        ////console.log("ren", req.body); //console.log("ren2", fullhtml2)
        var logo = "/email/img/logo.png"; //(path.join(appRoot.path, 'uploads' + mailInfo.logo))
        var logo2 = "/email/img/logo-login.png";

        var fb = "/email/img/fbnew.png";
        var twt = "/email/img/twtnew.png";
        var lnkd = "/email/img/linkedin.png";
        var ios = "/email/img/iosf.png";
        var android = "/email/img/androidf.png";
        var clientlogo = "/email/img/client-logo.jpg";
        var profilepathlogo = rese && rese[0] && rese[0].profilepicpath;
        profilepathlogo = "/email" + profilepathlogo;
        //  var profilepathlogo = '/email/admin/photo-1494548162494-384bba4ab999 (1).jpeg';
        // defheader = defheader && defheader.replace(lnkd, 'cid:trxlnkd').replace(twt,'cid:trxtwt')
        // .replace(fb, 'cid:trxfb').replace(clientlogo, 'cid:trxclientlogo').replace(logo, 'cid:trxapplogo').replace(logo2, 'cid:trxapplogo').replace(profilepathlogo, 'cid:trxclientlogo');
        // deffooter = deffooter && deffooter.replace(lnkd, 'cid:trxlnkd').replace(twt, 'cid:trxtwt')
        // .replace(fb, 'cid:trxfb').replace(clientlogo, 'cid:trxclientlogo').replace(logo, 'cid:trxapplogo').replace(logo2, 'cid:trxapplogo').replace(profilepathlogo, 'cid:trxclientlogo');
        defcontent =
          defcontent &&
          defcontent
            .replace(lnkd, "cid:trxlnkd")
            .replace(twt, "cid:trxtwt")
            .replace(fb, "cid:trxfb")
            .replace(clientlogo, "cid:trxclientlogo")
            .replace(logo, "cid:trxapplogo")
            .replace(logo2, "cid:trxapplogo")
            .replace(profilepathlogo, "cid:trxclientlogo")
            .replace(ios, "cid:ios")
            .replace(android, "cid:android");
        //req.body.header = defheader;
        // req.body.footer = deffooter;
        req.body.fullhtml = defcontent;
        req.body.toemail =
          (req.body.toemail && req.body.toemail.toString()) || ""; // && _.pluck(, 'name');
        req.body.ccemail =
          (req.body.ccemail && req.body.ccemail.toString()) || "";
        ////console.log("reqbodycc", req.body.ccemail)
        // //console.log("reqbodyoth", req.body.others)

        req.body.others = (req.body.others && req.body.others.toString()) || "";
        req.body.ccothers =
          (req.body.ccothers && req.body.ccothers.toString()) || "";

        //console.log("reqbodyothr", req.body.ccothers);

        //req.body.fullhtml;//console.log(fullhtmlnew)
        //delete req.body.fullhtml;
        var obj = JSON.stringify(req.body);
        var obj2 = [];
        commonModel
          .mysqlPromiseModelService(
            "call usp_emailtemplate_operations(?,?,?)",
            [obj, JSON.stringify(obj2), req.body.fullhtml]
          )
          .then((results) => {
            //console.log("res", results);
            ////console.log("res1", results[1][0].state)
            if (
              results &&
              results[0] &&
              results[0][0] &&
              results[0][0].state &&
              results[0][0].state == 1
            ) {
              return res.json({
                state: results[0][0].state,
                message: results[0][0].message,
                data: results[0],
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
    );
  }
}

function deactivatetemplate(req, res) {
  if (!req.body.id || !req.body.reqtype) {
    return res.json({ state: -1, message: "Required Parameters are missing" });
  }
  let obj = req.body;
  //obj.reqtype = 'deactivate';id,activate,deftemp=0(active)
  let obj2 = [];
  commonModel
    .mysqlPromiseModelService("call usp_emailtemplate_operations(?,?,?)", [
      JSON.stringify(obj),
      JSON.stringify(obj2),
      "",
    ])
    .then((results) => {
      return res.json({
        state: results[0] && results[0][0] && results[0][0].state,
        message: results[0] && results[0][0] && results[0][0].message,
      });
    })
    .catch((err) => {
      //console.log("err", err);
      return res.json({ state: -1, message: "Something went wrong" });
    });
}

function resettemplate(req, res) {
  if (!req.body || !req.body.reqtype) {
    return res.json({ state: -1, message: "Required Parameters are missing" });
  }
  let obj = req.body;
  //obj.reqtype = 'deactivate';id,activate,deftemp=0(active)
  let obj2 = [];
  commonModel
    .mysqlPromiseModelService("call usp_emailtemplate_operations(?,?,?)", [
      JSON.stringify(obj),
      JSON.stringify(obj2),
      "",
    ])
    .then((results) => {
      return res.json({
        state: results[0] && results[0][0] && results[0][0].state,
        message: results[0] && results[0][0] && results[0][0].message,
      });
    })
    .catch((err) => {
      //console.log("err", err);
      return res.json({ state: -1, message: "Something went wrong" });
    });
}

function getcustomroles(req, res) {
  //viewcustomroles
  if (!req.body || !req.body.reqtype) {
    return res.json({ state: -1, message: "Required Parameters are missing" });
  }
  let obj = req.body; ////console.log(req.body);
  //obj.reqtype = 'deactivate';id,activate,deftemp=0(active)
  let obj2 = [];
  commonModel
    .mysqlPromiseModelService("call usp_emailtemplate_operations(?,?,?)", [
      JSON.stringify(obj),
      JSON.stringify(obj2),
      "",
    ])
    .then((results) => {
      //    //console.log("he",results[1])
      return res.json({
        state: results[1] && results[1][0] && results[1][0].state,
        message: results[1] && results[1][0] && results[1][0].message,
        data: results[0],
      });
    })
    .catch((err) => {
      //console.log("err", err);
      return res.json({ state: -1, message: "Something went wrong" });
    });
}
