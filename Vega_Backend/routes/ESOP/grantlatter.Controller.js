var path = require("path");
var moment = require("moment-timezone");
moment.tz.setDefault("Asia/Kolkata");
var _ = require("underscore");
const config = require("../../config/config");
const JSZip = require("jszip");
const AdmZip = require("adm-zip");
const uuid = require("uuid");
//const stylecss = require("../../assets/style.css");

// var htmlToPdf = require('html-to-pdf');
var appRoot = require("app-root-path");
var proc = require("../../routes/common/procedureConfig");
var htmlpdf = require("html-pdf");
const image2base64 = require("image-to-base64");
const makeDir = require("../../routes/common/utils").makeDirectories;

const commonModel = require("../../routes/common/Model");
const fs = require("fs");
var mailservice = require("./../../services/mailerService");
const { reject } = require("underscore");
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;
const cheerio = require("cheerio");

module.exports = {
  // uploadOfferLetterFile:uploadOfferLetterFile,
  saveGrantLetter: saveGrantLetter,
  fetchGrantLetter: fetchGrantLetter,
  deleteGrantLetter: deleteGrantLetter,
  updateGrantLetter: updateGrantLetter,
  sendGrantLetter: sendGrantLetter,
  // fetchOfferLetterRequiredFields: fetchOfferLetterRequiredFields,
  grantLetterPreview: grantLetterPreview,
  sampleLetterPreview: sampleLetterPreview,
  createLetterPDF: createLetterPDF,
  exerciseLetter: exerciseLetter,
  createGrantLetter: createGrantLetter,
  uploadzipfile: uploadzipfile,
};

function saveGrantLetter(req, res) {
  if (!req.body.title || !req.body.html) {
    return res.json({
      state: -1,
      message: "Required Parameters missing.",
      data: null,
    });
  }
  var html = req.body.html;
  var mailbody = req.body.mailcontent;
  delete req.body.html;
  delete req.body.mailcontent;
  req.body.toemail = req.body.toemail && req.body.toemail.toString(); // && _.pluck(, 'name');
  req.body.ccemail = req.body.ccemail && req.body.ccemail.toString();
  req.body.others = req.body.others && req.body.others.toString();
  req.body.ccothers = req.body.ccothers && req.body.ccothers.toString();

  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService(
    "call usp_mst_ESOP_template(?,?,?)",
    [obj, html, mailbody],
    function (err, results) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
          data: null,
        });
      }
      return res.json({
        state: 1,
        message: "Succeess",
        data: results,
      });
    }
  );
}

function fetchGrantLetter(req, res) {
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService(
    "call usp_mst_ESOP_gettemplate(?)",
    [obj],
    function (err, results) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
          data: null,
        });
      }
      return res.json({
        state: 1,
        message: "Data Successfully Send",
        data: results,
      });
    }
  );
}

function deleteGrantLetter(req, res) {
  if (!req.body.id) {
    return res.json({
      state: -1,
      message: "id Not Found",
      data: null,
    });
  }
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService(
    "call usp_mst_ESOP_template(?,?,?)",
    [obj, null, null],
    function (err, results) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
          data: null,
        });
      }
      return res.json({
        state: 1,
        message: "Succeess",
        data: results,
      });
    }
  );
}

function updateGrantLetter(req, res) {
  if (!req.body.id) {
    return res.json({
      state: -1,
      message: "id Not Found",
      data: null,
    });
  }
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService(
    "call usp_mst_ESOP_template(?,?,?)",
    [obj, null, null],
    function (err, results) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
          data: null,
        });
      }
      return res.json({
        state: 1,
        message: "Succeess",
        data: results,
      });
    }
  );
}

async function grantLetterPreview(req, res) {
  if (!req.body.id) {
    return res.json({
      message: "Required Parameter is missing",
      data: null,
      state: -1,
    });
  }
  try {
    var grantobj = JSON.stringify({
      action: "grantletterpreview",
      createdby: req.body.createdby,
      id: req.body && req.body.id,
    });
    let resdata = await createLetterHtml(grantobj);
    return res.json({
      data: resdata.html,
      mailcontent: resdata.mailcontent,
      state: 1,
      message: "Success",
    });
  } catch (e) {
    return res.json({
      message: e.message || e,
      data: null,
      state: -1,
    });
  }
}

function createLetterHtml(grantobj) {
  return new Promise((resolve, reject) => {
    try {
      commonModel
        .mysqlPromiseModelService(proc.esop, [grantobj])
        .then(async (results) => {
          if (!results[1] || !results[1][0]) {
            reject("Letter Template not found");
          }
          let Vestingschedule = "";
          let tabledata = "";
          results[2].forEach(function (item) {
            tabledata += `<tr>
        <td style="text-align:center;border: 1px solid #ddd;padding: 5px !important;">${item.vesting_Date} </td> 
        <td style="text-align:center;border: 1px solid #ddd;padding: 5px !important;"> ${item.stock_Quanity}</td> 
        </tr>`;
          });
          Vestingschedule = `<table cellspacing="0" cellpadding="0"; style ="font-family: arial, sans-serif;font-size:7px
        border-collapse: collapse;
        width: 90%;margin:auto; text-align:center;border:1px solid #ddd;"> <tr> 
        <th style ="width: 300px;text-align: center;padding: 6px;background: #f5f1f1;border: 1px solid #ddd;">
         Vesting Date </th>
         <th style ="width: 300px;text-align: center;padding: 6px;background: #f5f1f1;border: 1px solid #ddd;">
          Quantity </th> </tr> ${tabledata} </table>`;
          // //console.log('results', Vestingschedule);
          // var offerLetterParamsList = results[0];
          var html = results[1][0].description;
          var mailcontent = results[1][0].mailcontent;
          let usersign = path.join(
            appRoot && appRoot.path,
            (results &&
              results[0] &&
              results[0][0] &&
              results[0][0].usersign) ||
              "abc.png"
          );
          if (fs.existsSync(usersign)) {
            usersign = usersign;
          } else {
            usersign = config.webUrlLink + "/webapi/cert/default-sign.png";
          }
          usersign = await image2base64(usersign);
          usersign = "data:image/bmp;base64," + usersign;

          let adminsign = path.join(
            appRoot && appRoot.path,
            (results &&
              results[0] &&
              results[0][0] &&
              results[0][0].adminsign) ||
              "abc.png"
          );
          if (fs.existsSync(adminsign)) {
            adminsign = adminsign;
          } else {
            adminsign = config.webUrlLink + "/webapi/cert/default-sign.png";
          }
          adminsign = await image2base64(adminsign);
          adminsign = "data:image/bmp;base64," + adminsign;

          let trxcompanylogo = path.join(
            appRoot && appRoot.path,
            "/uploads/" +
              (results &&
                results[0] &&
                results[0][0] &&
                results[0][0].trxcompanylogo)
          );
          if (fs.existsSync(trxcompanylogo)) {
            trxcompanylogo =
              config.webUrlLink +
              "/webapi/" +
              (results &&
                results[0] &&
                results[0][0] &&
                results[0][0].trxcompanylogo);
          } else {
            trxcompanylogo =
              config.webUrlLink + "/webapi/cert/default-logo.png";
          }

          let Usersignature = `<img src=${usersign} alt="" height="40" width="180" style=" margin: 10px;">`;
          let Adminsignature = `<img src=${adminsign} alt="" height="40" width="180" style=" margin: 10px;">`;
          let Companylogo = `<img src=${trxcompanylogo} alt="" height="70" width="100" style=" margin: 10px;">`;
          let grantLetterParamsList = {
            trxFullName:
              (results &&
                results[0] &&
                results[0][0] &&
                results[0][0].Fullname) ||
              "",
            trxEcode:
              (results && results[0] && results[0][0] && results[0][0].Ecode) ||
              "",
            trxOfficialEmail:
              (results &&
                results[0] &&
                results[0][0] &&
                results[0][0].Officialemail) ||
              "",
            trxPersonalEmail:
              (results &&
                results[0] &&
                results[0][0] &&
                results[0][0].Personalemail) ||
              "",
            trxContactNumber:
              (results &&
                results[0] &&
                results[0][0] &&
                results[0][0].Contactnumber) ||
              "",
            trxDateOfBirth:
              (results &&
                results[0] &&
                results[0][0] &&
                results[0][0].Dateofbirth) ||
              "",
            trxGrantDate:
              (results &&
                results[0] &&
                results[0][0] &&
                results[0][0].Grantdate) ||
              "",
            trxGrantStocks:
              (results &&
                results[0] &&
                results[0][0] &&
                results[0][0].Grantstocks) ||
              "",
            trxExercisePrice:
              (results &&
                results[0] &&
                results[0][0] &&
                results[0][0].Exerciseprice) ||
              "",
            trxPanNo:
              (results && results[0] && results[0][0] && results[0][0].Panno) ||
              "",
            trxJoiningDate:
              (results &&
                results[0] &&
                results[0][0] &&
                results[0][0].Joiningdate) ||
              "",
            trxDepartment:
              (results &&
                results[0] &&
                results[0][0] &&
                results[0][0].Department) ||
              "",
            trxDesignation:
              (results &&
                results[0] &&
                results[0][0] &&
                results[0][0].Designation) ||
              "",
            trxCountry:
              (results &&
                results[0] &&
                results[0][0] &&
                results[0][0].Country) ||
              "",
            trxLocation:
              (results &&
                results[0] &&
                results[0][0] &&
                results[0][0].Location) ||
              "",
            trxExerciseDate:
              (results &&
                results[0] &&
                results[0][0] &&
                results[0][0].Exercisedate) ||
              "",
            trxExerciseStocks:
              (results &&
                results[0] &&
                results[0][0] &&
                results[0][0].Exercisestocks) ||
              "",
            trxVestingSchedule: Vestingschedule,
            trxUserSignature: Usersignature,
            trxAdminSignature: Adminsignature,
            trxCompanyLogo: Companylogo,
            trxIssueDate:
              (results &&
                results[0] &&
                results[0][0] &&
                results[0][0].Issuedate) ||
              "",
          };

          if (grantLetterParamsList) {
            var paramArr = _.keys(grantLetterParamsList);
            paramArr.forEach((item) => {
              var replacementvar = grantLetterParamsList[item]
                ? grantLetterParamsList[item]
                : "";
              var match = new RegExp(item, "g");
              html = html && html.replace(match, replacementvar);
              mailcontent =
                mailcontent && mailcontent.replace(match, replacementvar);
              // //console.log('item', item)
            });
            const replacer = new RegExp("\r", "g"),
              replacer1 = new RegExp("\ufeff", "g"),
              replacer2 = new RegExp("\n", "g");

            html = html
              .replace(replacer, "")
              .replace(replacer1, "")
              .replace(replacer2, "");
            mailcontent =
              mailcontent &&
              mailcontent
                .replace(replacer, "")
                .replace(replacer1, "")
                .replace(replacer2, "");
          }
          // const $ = cheerio.load(html);
          // $("head")
          //   .append(
          //     `<link rel="stylesheet" href="${appRoot.path}/assets/style.css">`
          //   )
          //   .html();
          resolve({
            // html: $.html(),
            html: html,
            mailcontent: mailcontent,
          });
        })
        .catch((err) => {
          reject((err && err.message) || "Something went Wrong");
        });
    } catch (err) {
      reject((err && err.message) || "Something went Wrong");
    }
  });
}

async function sendGrantLetter(req, res) {
  if (!req.body.id) {
    return res.json({
      state: -1,
      message: "Required Parameters missing.",
      data: null,
    });
  }
  try {
    var grantobj = JSON.stringify({
      action: "grantletterpreview",
      createdby: req.body.createdby,
      id: req.body && req.body.id,
    });
    let checkUploadDir = path.join("uploads");
    makeDir(checkUploadDir);

    let checkESOPDir = path.join("uploads", "esop");
    makeDir(checkESOPDir);

    let checkgrantletterDir = path.join("uploads", "esop", "grantletter");
    makeDir(checkgrantletterDir);

    let dbFilePath = "esop/grantletter";
    let resdata = await createLetterHtml(grantobj),
      html = resdata && resdata.html,
      mailcontent = resdata && resdata.mailcontent,
      lettername = `${Date.now()}_${(
        (req.body && req.body.id) ||
        "a"
      ).toString()}Grant-letter.pdf`;
    var resletter = await createLetterPDF(
      html,
      lettername,
      checkgrantletterDir,
      dbFilePath
    );
    let obj = {
      createdby: req.body.createdby,
      action: "sendgranttletter",
      id: req.body.id,
      filepath: `${resletter.filepath}`,
    };
    commonModel
      .mysqlPromiseModelService(proc.sendletter, [JSON.stringify(obj)])
      .then((results) => {
        let alltomails, ccallmails;
        if (results && results[0][0] && results[0][0].alltomails) {
          alltomails = results[0][0].alltomails;
        }
        if (results && results[0][0] && results[0][0].ccallmails) {
          ccallmails = results[0][0].ccallmails;
        }
        let emailObj = {
          to: alltomails || "",
          cc: ccallmails || "",
          subject:
            (results && results[0][0] && results[0][0].subject) ||
            "<ESOPs Grant Letter>",
          html: mailcontent,
          offerletter: 1,
          attachments: [
            {
              filename: "Grant-letter.pdf",
              path: path.join(appRoot.path, "uploads", `${resletter.filepath}`),
            },
          ],
        };
        mailservice.sendCustomEmail(emailObj, function (err, response) {
          if (err) {
            return res.json({
              state: -1,
              message: err.message || JSON.stringify(err),
              data: null,
            });
          } else {
            return res.json({
              state: 1,
              message: "Sucess",
              data: null,
            });
          }
        });
      })
      .catch((err) => {
        return res.json({
          message: err,
          data: null,
          state: -1,
        });
      });
    // }
    // })
  } catch (e) {
    return res.json({
      message: e.message || e,
      data: null,
      state: -1,
    });
  }
}

async function sampleLetterPreview(req, res) {
  if (!req.body.id || !(req.body && req.body.type)) {
    // id of Grant Letter
    return res.json({
      state: -1,
      message: "Required Parameters missing.",
      data: null,
    });
  }
  try {
    var grantobj = JSON.stringify({
      action: "sampleletterpreview",
      createdby: req.body.createdby,
      id: req.body && req.body.id,
    });
    let checkUploadDir = path.join("uploads");
    makeDir(checkUploadDir);

    let checkESOPDir = path.join("uploads", "esop");
    makeDir(checkESOPDir);

    let checkgrantletterDir = path.join("uploads", "esop", "grantletter");
    makeDir(checkgrantletterDir);

    let checkexerciseletterDir = path.join("uploads", "esop", "exerciseletter");
    makeDir(checkexerciseletterDir);

    let checksurrenderletterDir = path.join(
      "uploads",
      "esop",
      "surrenderletter"
    );
    makeDir(checksurrenderletterDir);

    var dbFilePath = "esop/grantletter";
    var uploadDirPath = checkgrantletterDir;
    let resdata = await createLetterHtml(grantobj);
    let type = (req.body && req.body.type) || "-";
    var lettertype;
    if (type == 1) {
      lettertype = "Grant";
      dbFilePath = "esop/grantletter";
      uploadDirPath = checkgrantletterDir;
    } else if (type == 2) {
      lettertype = "Exercise";
      dbFilePath = "esop/exerciseletter";
      uploadDirPath = checkexerciseletterDir;
    } else if (type == 3) {
      lettertype = "Surrender";
      dbFilePath = "esop/surrenderletter";
      uploadDirPath = checksurrenderletterDir;
    } else {
      lettertype = "@";
    }
    let html = resdata && resdata.html,
      lettername = `Sample_${lettertype}_letter.pdf`;
    let resletter = await createLetterPDF(
      html,
      lettername,
      uploadDirPath,
      dbFilePath
    );
    return res.json({
      state: 1,
      message: "Sucess",
      data: resletter && resletter.filepath,
    });
  } catch (e) {
    return res.json({
      message: e.message || e,
      data: null,
      state: -1,
    });
  }
}

async function exerciseLetter(req, res) {
  if (!req.body.id) {
    // id of Exercise Letter
    return res.json({
      state: -1,
      message: "Required Parameters missing.",
      data: null,
    });
  }
  try {
    var grantobj = JSON.stringify({
      action: "employeeexerciseletter",
      createdby: req.body.createdby,
      id: req.body && req.body.id,
    });
    let checkexerciseletterDir = path.join("uploads", "esop", "exerciseletter");
    makeDir(checkexerciseletterDir);
    let dbFilePath = "esop/grantletter";

    let resdata = await createLetterHtml(grantobj);
    let html = resdata && resdata.html,
      lettername = `${Date.now()}_${(
        (req.body && req.body.id) ||
        "a"
      ).toString()}Exercise-letter.pdf`;
    let resletter = await createLetterPDF(
      html,
      lettername,
      checkexerciseletterDir,
      dbFilePath
    );
    let obj = {
      createdby: req.body.createdby,
      action: "updateexerciseletter",
      id: req.body.id,
      filepath: `${resletter.filepath}`,
    };
    let dbresulst = await commonModel.mysqlPromiseModelService(proc.esop, [
      JSON.stringify(obj),
    ]);
    return res.json({
      state: 1,
      message: "Sucess",
      data: resletter && resletter.filepath,
    });
  } catch (e) {
    return res.json({
      message: e.message || e,
      data: null,
      state: -1,
    });
  }
}

function createLetterPDF(html, letterName, fullLetterPath, dbLetterPath) {
  return new Promise((resolve, reject) => {
    // let filePath = `${fullLetterPath}/${letterName}`;
    let filePath = path.join(
      appRoot && appRoot.path,
      `${fullLetterPath}/${letterName}`
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    let htmlOptions = {
      format: "A4",
      header: {
        height: "5mm",
      },
      footer: {
        height: "5mm",
      },
      border: {
        top: "5mm",
        bottom: "5mm",
        left: "3mm",
        right: "3mm",
      },
      margin: {
        right: "5mm",
        left: "5mm",
        top: "2mm",
        bottom: "2mm",
      },
    };
    htmlpdf
      .create(html, htmlOptions)
      .toFile(filePath, async function (err, res1) {
        if (err) {
          reject("Error during create letter");
        } else {
          let obj = {};
          obj = {
            filepath: `${dbLetterPath}/${letterName}`,
          };
          resolve(obj);
        }
      });
  });
}

async function createGrantLetter() {
  try {
    let results = await commonModel.mysqlPromiseModelService(
      proc.mstesopupdateletter,
      [JSON.stringify({ action: "creategrantletter" })]
    );
    if (results && results[1] && results[1][0].state != 1) {
    } else {
      let checkUploadDir = path.join("uploads");
      makeDir(checkUploadDir);

      let checkESOPDir = path.join("uploads", "esop");
      makeDir(checkESOPDir);

      let checkgrantletterDir = path.join("uploads", "esop", "grantletter");
      makeDir(checkgrantletterDir);

      let dbFilePath = "esop/grantletter";
      var dbArray = [];

      const asyncLoopFunction = async (array) => {
        for (const item of array) {
          let grantobj = {};
          grantobj = JSON.stringify({
            action: "grantletterpreview",
            createdby: item && item.userid,
            id: item && item.id,
          });
          let resData = await createLetterHtml(grantobj);
          let html = resData && resData.html,
            letterName = `${uuid.v1()}_${item.id.toString()}Grant-letter.pdf`;
          let resletter = await createLetterPDF(
            html,
            letterName,
            checkgrantletterDir,
            dbFilePath
          );
          dbArray.push({
            filepath: resletter && resletter.filepath,
            id: item.id,
            userid: item.userid,
          });
        }
        return dbArray;
      };
      let asyncLoopFunctionResult = await asyncLoopFunction(results[0]);
      let results2 = await commonModel.mysqlPromiseModelService(
        proc.mstesopupdateletter,
        [
          JSON.stringify({
            mappingData: asyncLoopFunctionResult,
            action: "updategrantletter",
          }),
        ]
      );
      if (results2 && results2[0] && results2[0][0].state == 1) {
        console.log("Success");
      } else {
        console.log("Error from 2nd response of DB");
      }
    }
  } catch (e) {
    console.log("Error", e);
  }
}

async function uploadzipfile(req, res) {
  try {
    if (!req.body || !req.body.action) {
      return res.json({
        state: -1,
        message: "Send required data",
      });
    }
    if (!req.files)
      return res.json({
        state: -1,
        message: "File is required!",
      });

    let checkUploadDir = path.join("uploads");
    makeDir(checkUploadDir);

    let checkZipDir = path.join("uploads", "zip");
    makeDir(checkZipDir);

    let checkZipESOPDir = path.join("uploads", "zip", "esop");
    makeDir(checkZipESOPDir);

    let checkESOPDir = path.join("uploads", "esop");
    makeDir(checkESOPDir);

    let checkgrantletterDir = path.join("uploads", "esop", "grantletter");
    makeDir(checkgrantletterDir);

    let checkexerciseletterDir = path.join("uploads", "esop", "exerciseletter");
    makeDir(checkexerciseletterDir);

    let checksurrenderletterDir = path.join(
      "uploads",
      "esop",
      "surrenderletter"
    );
    makeDir(checksurrenderletterDir);

    let zipFilePath = checkZipESOPDir;
    let unzipFilePath = checkgrantletterDir;
    let datetime = Date.now();
    let file = req.files.file;

    var fileType;
    var dbFilePath;
    let action = (req.body && req.body.action) || "";

    if (action == "uploadgrantletter") {
      fileType = "GrantLetter";
      dbFilePath = "esop/grantletter";
      unzipFilePath = checkgrantletterDir;
    } else if (action == "uploadexexerciseletter") {
      dbFilePath = "esop/exerciseletter";
      fileType = "ExerciseLetter";
      unzipFilePath = checkexerciseletterDir;
    } else if (action == "uploadsurrendereletter") {
      fileType = "SurrenderLetter";
      dbFilePath = "esop/surrenderletter";
      unzipFilePath = checksurrenderletterDir;
    }

    let zipFileName = `${datetime}_${fileType}_${file.name}`;

    await file.mv(path.join(appRoot && appRoot.path,zipFilePath, zipFileName));

    var allFileNameObj = [];

    //create a zip object to hold the new zip files
    var newZip = new AdmZip();

    // reading archives
    var zip = new AdmZip(path.join(appRoot && appRoot.path,zipFilePath, zipFileName));
    var zipEntries = zip.getEntries(); // an array of ZipEntry records

    zipEntries.forEach(function (zipEntry) {
      let fileName = zipEntry.entryName;
      let fileContent = zip.readFile(fileName);

      //Here remove the top level directory

      let newFileName =
        fileName && fileName.substring(fileName.indexOf("/") + 1);
      let id = newFileName && newFileName.match(/\d+/)[0];
      newFileName = `${uuid.v1()}_${newFileName}`;
      newZip.addFile(newFileName, fileContent);

      allFileNameObj.push({
        filepath: `${dbFilePath}/${newFileName}`,
        filename: `${newFileName}`,
        id: id,
      });
    });

    newZip.writeZip(path.join(appRoot && appRoot.path,`${zipFilePath}/rename_${zipFileName}`)); //write the new zip

    const zipfiles = new AdmZip(path.join(appRoot && appRoot.path,`${zipFilePath}/rename_${zipFileName}`));
    zipfiles.extractAllTo(path.join(appRoot && appRoot.path,unzipFilePath));
    let obj = req.body;
    obj.allFileNameObj = allFileNameObj;
    obj = JSON.stringify(obj);
    commonModel
      .mysqlPromiseModelService(proc.mstuploadzip, [obj])
      .then((results) => {
        return res.json({
          state: 1,
          message: "Success",
          data: null,
        });
      })
      .catch((err) => {
        return res.json({
          state: -1,
          message: err.message || err,
        });
      });
  } catch (e) {
    return res.json({
      state: -1,
      message: e.message || e,
      data: null,
    });
  }
}

// async function viewESOPCertificate(req, res) {
//   if (!req.body) {
//     return res.json({
//       message: "Send required data",
//       state: -1,
//     });
//   }
//   try {
//     let obj = req.body;
//     obj.action = "esopcertificatedata";
//     commonModel
//       .mysqlPromiseModelService("call usp_esop_operation(?)", [obj])
//       .then(async (results) => {
//         if (
//           results &&
//           results[0] &&
//           results[1][0] &&
//           results[1][0].state == 1
//         ) {
//           var html =
//             results && results[0] && results[0][0] && results[0][0].html;
//           if (!html) {
//             return res.json({
//               message: "No Template found !",
//               state: -1,
//             });
//           }
//           let trxbackgroundfilepath,
//             trxpoweredby,
//             trxcompanylogo,
//             trxuserprofile;
//           if (config && config.env && config.env == "developments") {
//             trxbackgroundfilepath =
//               config.webUrlLink +
//               "/cert/" +
//               (results &&
//                 results[0] &&
//                 results[0][0] &&
//                 results[0][0].trxbackgroundfilepath);
//             trxribbonimg =
//               config.webUrlLink +
//               "/cert/" +
//               (results &&
//                 results[0] &&
//                 results[0][0] &&
//                 results[0][0].trxribbonimg);
//             trxotherimg =
//               config.webUrlLink +
//               "/cert/" +
//               (results &&
//                 results[0] &&
//                 results[0][0] &&
//                 results[0][0].trxribbonimg);
//             trxpoweredby = config.webUrlLink + "/cert/poweredbyVegaHr.png";
//             trxcompanylogo = path.join(
//               appRoot && appRoot.path,
//               "/uploads/" +
//                 (results &&
//                   results[0] &&
//                   results[0][0] &&
//                   results[0][0].trxcompanylogo)
//             );
//             if (fs.existsSync(trxcompanylogo)) {
//               trxcompanylogo =
//                 config.webUrlLink +
//                 (results &&
//                   results[0] &&
//                   results[0][0] &&
//                   results[0][0].trxcompanylogo);
//             } else {
//               trxcompanylogo = config.webUrlLink + "/cert/default-logo.png";
//             }
//             trxuserprofile = path.join(
//               appRoot && appRoot.path,
//               "/uploads/" +
//                 (results &&
//                   results[0] &&
//                   results[0][0] &&
//                   results[0][0].trxuserprofile)
//             );
//             if (fs.existsSync(trxuserprofile)) {
//               trxuserprofile =
//                 config.webUrlLink +
//                 (results &&
//                   results[0] &&
//                   results[0][0] &&
//                   results[0][0].trxuserprofile);
//             } else {
//               trxuserprofile = config.webUrlLink + "/img/user-placeholder.png";
//             }

//             /* for Staging */
//           } else {
//             trxbackgroundfilepath =
//               config.webUrlLink +
//               "/webapi/cert/" +
//               (results &&
//                 results[0] &&
//                 results[0][0] &&
//                 results[0][0].trxbackgroundfilepath);
//             trxribbonimg =
//               config.webUrlLink +
//               "/webapi/cert/" +
//               (results &&
//                 results[0] &&
//                 results[0][0] &&
//                 results[0][0].trxribbonimg);
//             trxotherimg =
//               config.webUrlLink +
//               "/webapi/cert/" +
//               (results &&
//                 results[0] &&
//                 results[0][0] &&
//                 results[0][0].trxribbonimg);
//             trxpoweredby =
//               config.webUrlLink + "/webapi/cert/poweredbyVegaHr.png";
//             trxcompanylogo = path.join(
//               appRoot && appRoot.path,
//               "/uploads/" +
//                 (results &&
//                   results[0] &&
//                   results[0][0] &&
//                   results[0][0].trxcompanylogo)
//             );
//             if (fs.existsSync(trxcompanylogo)) {
//               trxcompanylogo =
//                 config.webUrlLink +
//                 "/webapi/" +
//                 (results &&
//                   results[0] &&
//                   results[0][0] &&
//                   results[0][0].trxcompanylogo);
//             } else {
//               trxcompanylogo =
//                 config.webUrlLink + "/webapi/cert/default-logo.png";
//             }
//             trxuserprofile = path.join(
//               appRoot && appRoot.path,
//               "/uploads/" +
//                 (results &&
//                   results[0] &&
//                   results[0][0] &&
//                   results[0][0].trxuserprofile)
//             );
//             if (fs.existsSync(trxuserprofile)) {
//               trxuserprofile =
//                 config.webUrlLink +
//                 "/webapi/" +
//                 (results &&
//                   results[0] &&
//                   results[0][0] &&
//                   results[0][0].trxuserprofile);
//             } else {
//               trxuserprofile =
//                 config.webUrlLink + "/webapi/img/user-placeholder.png";
//             }

//             /* for production */
//           }
//           let trxsignaturedesg1 =
//             (results &&
//               results[0] &&
//               results[0][0] &&
//               results[0][0].trxsignaturedesg1) ||
//             "";
//           let trxdesgnation1 =
//             (results &&
//               results[0] &&
//               results[0][0] &&
//               results[0][0].trxdesgnation1) ||
//             "";
//           let trxsignaturedesg2 =
//             (results &&
//               results[0] &&
//               results[0][0] &&
//               results[0][0].trxsignaturedesg2) ||
//             "";
//           let trxdesgnation2 =
//             (results &&
//               results[0] &&
//               results[0][0] &&
//               results[0][0].trxdesgnation2) ||
//             "";
//           let feedbackdescription =
//             (results &&
//               results[0] &&
//               results[0][0] &&
//               results[0][0].feedbackdescription) ||
//             "";
//           feedbackdescription = feedbackdescription.replace(/\\n/g, " ");
//           feedbackdescription = feedbackdescription.replace(/\\r/g, " ");

//           let left_arrow = config.webUrlLink + "/webapi/cert/left-arrow.png",
//             right_arrow = config.webUrlLink + "/webapi/cert/right-arrow.png",
//             vega_logo = config.webUrlLink + "/webapi/cert/vega-logo.png",
//             bg_image = config.webUrlLink + "/webapi/cert/certificate-bg.png";

//           trxsignaturedesg1 = path.join(
//             appRoot && appRoot.path,
//             results &&
//               results[0] &&
//               results[0][0] &&
//               results[0][0].trxsignaturedesg1
//           );
//           if (fs.existsSync(trxsignaturedesg1)) {
//             trxsignaturedesg1 = trxsignaturedesg1;
//           } else {
//             trxsignaturedesg1 =
//               config.webUrlLink + "/webapi/cert/default-sign.png";
//           }
//           trxsignaturedesg1 = await image2base64(trxsignaturedesg1);
//           trxsignaturedesg1 = "data:image/bmp;base64," + trxsignaturedesg1;

//           trxsignaturedesg2 = path.join(
//             appRoot && appRoot.path,
//             results &&
//               results[0] &&
//               results[0][0] &&
//               results[0][0].trxsignaturedesg2
//           );
//           if (fs.existsSync(trxsignaturedesg2)) {
//             trxsignaturedesg2 = trxsignaturedesg2;
//           } else {
//             trxsignaturedesg2 =
//               config.webUrlLink + "/webapi/cert/default-sign.png";
//           }

//           trxsignaturedesg2 = await image2base64(trxsignaturedesg2);
//           trxsignaturedesg2 = "data:image/bmp;base64," + trxsignaturedesg2;
//           let badgevalue;
//           if (req.body.action == "preview_certificate") {
//             badgevalue =
//               config.webUrlLink + "/webapi/" + "training_certificate_icon.svg";
//           } else {
//             badgevalue =
//               config.webUrlLink +
//               "/webapi/" +
//               ((req.body && req.body.badgevalue) || "default.png");
//           }
//           let certficationparams = {
//             feedbackdescription: feedbackdescription,
//             left_arrow: left_arrow,
//             right_arrow: right_arrow,
//             vega_logo: vega_logo,
//             bg_image: bg_image,
//             badgevalue: badgevalue,
//             trxsignaturedesg1: trxsignaturedesg1,
//             trxsignaturedesg2: trxsignaturedesg2,
//             trxdesgnation1: trxdesgnation1,
//             trxdesgnation2: trxdesgnation2,
//             trxbackgroundfilepath: trxbackgroundfilepath,
//             trxcompanylogo: trxcompanylogo,
//             trxribbonimg: trxribbonimg,
//             trxpoweredby: trxpoweredby,
//             trxotherimg: trxotherimg,
//             trxuserprofile: trxuserprofile,
//             trxcompanyname:
//               (results &&
//                 results[0] &&
//                 results[0][0] &&
//                 results[0][0].trxcompanyname) ||
//               "",
//             trxemployeename:
//               (results &&
//                 results[0] &&
//                 results[0][0] &&
//                 results[0][0].trxemployeename) ||
//               "",
//             trxdummytext:
//               (results &&
//                 results[0] &&
//                 results[0][0] &&
//                 results[0][0].trxdummytext) ||
//               "",
//             trxfeedbackawardtype:
//               (results &&
//                 results[0] &&
//                 results[0][0] &&
//                 results[0][0].trxfeedbackawardtype) ||
//               "",
//             trxpresentedby:
//               (results &&
//                 results[0] &&
//                 results[0][0] &&
//                 results[0][0].trxpresentedby) ||
//               "",
//             trxhrname:
//               (results &&
//                 results[0] &&
//                 results[0][0] &&
//                 results[0][0].trxhrname) ||
//               "",
//             trxmanagingdirectorname:
//               (results &&
//                 results[0] &&
//                 results[0][0] &&
//                 results[0][0].trxmanagingdirectorname) ||
//               "",
//             trxawardeddate:
//               (results &&
//                 results[0] &&
//                 results[0][0] &&
//                 results[0][0].trxawardeddate) ||
//               "",
//           };
//           if (certficationparams) {
//             var paramArr = _.keys(certficationparams);
//             paramArr.forEach((item) => {
//               var replacementvar = certficationparams[item]
//                 ? certficationparams[item]
//                 : "";
//               var match = new RegExp(item, "g");
//               html = html && html.replace(match, replacementvar);
//             });
//           }
//           const search = "\r";
//           const replacer = new RegExp(search, "g");
//           html = html.replace(replacer, "\n");
//           let checkdir1 = path.join(appRoot.path, "/uploads");
//           if (!fs.existsSync(checkdir1)) {
//             fs.mkdirSync(checkdir1);
//           }
//           let checkdir = path.join(appRoot.path, "/uploads/certification");
//           if (!fs.existsSync(checkdir)) {
//             fs.mkdirSync(checkdir);
//           }
//           let cer_name = (
//             (
//               results &&
//               results[0] &&
//               results[0][0] &&
//               results[0][0].guid
//             ).toString() || "123#"
//           ).concat(
//             (results &&
//               results[0] &&
//               results[0][0] &&
//               results[0][0].feedbackid) ||
//               "@#@"
//           );
//           let filepath = path.resolve(
//             appRoot.path,
//             "uploads/certification",
//             `${cer_name}_certification-letter.pdf`
//           );
//           let uploadpath = path.join(
//             "certification",
//             `${cer_name}_certification.1.png`
//           );
//           const options = {
//             format: "A4",
//             orientation: "landscape",
//             type: "pdf",
//           };
//           htmlpdf
//             .create(html, options)
//             .toFile(filepath, async function (err, res1) {
//               if (err) {
//                 return res.json({
//                   state: -1,
//                   data: null,
//                   message: err.message || err,
//                 });
//               } else {
//                 try {
//                   let imagecertificate = await pdftoimage(filepath, cer_name);
//                   return res.json({
//                     state: 1,
//                     data: uploadpath || "aa",
//                     message: "Success",
//                   });
//                 } catch (e) {
//                   return res.json({
//                     state: -1,
//                     data: null,
//                     message: e.message || e,
//                   });
//                 }
//               }
//             });
//         } else {
//           return res.json({
//             message: "Something went wrong.",
//             state: -1,
//             data: null,
//           });
//         }
//       })
//       .catch((err) => {
//         return res.json({
//           state: -1,
//           data: null,
//           message: err.message || err,
//         });
//       });
//   } catch (err) {
//     return res.json({
//       state: -1,
//       data: null,
//       message: err.message || err,
//     });
//   }
// }
