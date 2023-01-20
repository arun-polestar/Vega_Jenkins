const _ = require("underscore");
const proc = require("../../common/procedureConfig");
const commonModel = require("../../common/Model");
const commonCtrl = require("../../common/Controller");
var path = require("path");
var stringify = require("csv-stringify");
var AdmZip = require("adm-zip");
const fs = require("fs");
const mailservice = require("../../../services/mailerService");
const optionConfig = require("../../../config/config");
const superadminController = require("../../superAdmin/Controller");
const { content } = require("googleapis/build/src/apis/content");
const { makeDirectories } = require("../../common/utils");
const config = require('../../../config/config')
const appRoot = require('app-root-path');
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;


var stringifier = stringify();
module.exports = {
  getLazyCandidateData: getLazyCandidateData,
  getInactiveCandidate: getInactiveCandidate,
  updateResume: updateResume,
  editCandidateRecord: editCandidateRecord,
  blockCandidate: blockCandidate,
  getlazycandidatedataQuery: getlazycandidatedataQuery,
  getCandidateZip: getCandidateZip,
  duplicate: duplicate,
  searchcandidate: searchcandidate,
  rejectedCandidate,
  advanceSearch,
};

function getLazyCandidateData(req, res) {
  var reqData = req.body;
  var whereString = "1=1";
  var filterObj = reqData;
  //console.log("filterObjfilterObj", filterObj);
  var newreqData = {};
  if (filterObj) {
    _.map(filterObj, function (val, key) {
      //console.log("val=", val, " key=", key);
      if (filterObj[`${key}`]) {
        newreqData[`${key}`] = filterObj[`${key}`];
      }
    });
  }
  newreqData.whereString = whereString;
  delete newreqData.candidateFilter;
  newreqData.startdate = newreqData.startDate;
  newreqData.enddate = newreqData.endDate;
  newreqData.reqtype = "view";
  newreqData.financialyear = newreqData.financialyear;
  //My code Avinash ends here
  delete newreqData.tokenFetchedData;
  if (newreqData.startDate && newreqData.endDate) {
    newreqData.startDate = newreqData.startDate + " 00:00:00";
    newreqData.endDate = newreqData.endDate + " 23:59:59";
  }
  // newreqData.createdby =  req.body.tokenFetchedData.id;

  var obj = JSON.stringify(newreqData);
  commonModel.mysqlModelService(
    proc.rmscandidate,
    [obj],
    function (err, results) {
      if (err) {
        return res.json({ state: -1, message: err });
      } else {
        var dbresult = commonCtrl.lazyLoading(results[0], req.body);
        if (dbresult && "data" in dbresult && "count" in dbresult) {
          return res.json({
            state: 1,
            message: "success",
            data: dbresult.data,
            count: dbresult.count,
          });
        } else {
          return res.json({ state: -1, message: "No Lazy Data" });
        }
      }
    }
  );
}

function getlazycandidatedataQuery(req, res) {
  var reqData = req.body;
  var obj = JSON.stringify(reqData);
  //console.log("sadkjkasdj", obj);
  commonModel.mysqlPromiseModelServiceLazy(
    proc.candidateoperations,
    [obj],
    function (err, results) {
      ////console.log(err,results,'asdasdadsdsaadsadsdasadsdasdasdassdadsadas')

      if (err) {
        return res.json({ state: -1, message: err });
      } else {
        return res.json({
          state: 1,
          message: "success",
          data: results && results.slice(0, 10),
        });
      }
    }
  );
}
function getInactiveCandidate(req, res) {
  if (!req.body.tokenFetchedData) {
    return res.json({
      state: -1,
      message: "User authorization failed",
    });
  }
  var body = req.body;
  body.reqtype = "view";
  body.createdby = req.body.tokenFetchedData.id;
  var dataObject = {};
  _.map(body, function (val, key) {
    if (body[`${key}`]) {
      dataObject[`${key}`] = body[`${key}`];
    }
  });

  var obj = JSON.stringify(dataObject);
  commonModel.mysqlModelService(
    proc.rmscandidate,
    [obj],
    function (err, result) {
      if (err) {
        return res.json({ state: -1, message: err });
      } else {
        var finalresult = commonCtrl.lazyLoading(result[0], req.body);
        if (finalresult && "data" in finalresult && "count" in finalresult) {
          return res.json({
            state: 1,
            message: "success",
            data: finalresult.data,
            totalcount: finalresult.count,
          });
        } else {
          return res.json({ state: -1, message: "No Lazy Data" });
        }
      }
    }
  );
}

/*---------------------------------------------------------------------------------------------------*
 *                                         Update Resume                                              *
 *----------------------------------------------------------------------------------------------------*/

function updateResume(req, res) {
  let dirname;

  if (req.files) {
    if (req.files["file"]) {
      let file = req.files.file;
      let uploadPath = makeDirectories(path.join("uploads", "RMS"));

      let dirname = path.join("RMS", file.name);
      let pathfile = path.join(uploadPath, file.name);
      file.mv(pathfile, function (err) {
        if (err) {
          return res.json({ state: -1, msg: err, data: null });
        } else {
          //update information into database after successful resume upload and update
          var obj = {
            filename: file.name,
            filepath: dirname,
            dmltype: "RU",
            reqtype: req.body.reqtype,
            id: req.body.candidateId,
            createdby: req.body.createdby,
          };
          commonModel.mysqlModelService(
            proc.candidateoperations,
            [JSON.stringify(obj)],
            function (err, results) {
              if (err) {
                return res.json({ state: -1, msg: err, data: null });
              }
              return res.json({ state: 1, msg: "success", data: results });
            }
          );
        }
      });
    } else {
      return res.json({ state: -1, msg: "file is not valid", data: null });
    }
  } else {
    return res.json({ state: -1, msg: "please select a file!!!", data: null });
  }
}

/*-------------------------------------End Update Resume---------------------------------------------*/

/*---------------------------------------------------------------------------------------------------*
 *                                    Edit Candidate Record                                           *
 *----------------------------------------------------------------------------------------------------*/

async function editCandidateRecord(req, res) {
  //Validate Front End Data
  var data = req.body;
  //console.log("djshfsdhflsd", req.body);

  data.skills = data.skills ? data.skills.toString() : "";
  data.qualification = data.qualification ? data.qualification.toString() : "";
  data.dmltype = "U";
  data.reqtype = "edit";

  data = await commonCtrl.verifyNull(data);

  var obj = JSON.stringify(data);

  //Stored procedure call
  commonModel
    .mysqlPromiseModelService(proc.candidateoperations, [obj])
    .then((results) => {
      if (
        results[1] &&
        results[1][0] &&
        results[1][0].state &&
        results[1][0].state == -1
      ) {
        return res.json({
          state: -1,
          message: results[1][0].message,
          result: null,
        });
      } else {
        return res.json({ state: 1, message: "success", result: results });
      }
    })
    .catch((err) => {
      //console.log("Resultssssssssss", err);
      return res.json({ state: -1, message: err });
    });
}

/*-------------------------------------End Edit Candidate Record-----------------------------------*/

/*---------------------------------------------------------------------------------------------------*
 *                                          Block Candidate                                           *
 *----------------------------------------------------------------------------------------------------*/

function blockCandidate(req, res) {
  //validate from front-end
  if (!req || !req.body) {
    //console.log("Error in requested Data!");
    //console.log("Request is:", req);
    //console.log("Request body is:", req.body);
    return res.json({ state: -1, message: "req.body or req not found" });
  }
  var data = req.body;
  data.reqtype = "edit";
  data = JSON.stringify(data);

  //Stored procedure call
  commonModel.mysqlModelService(
    proc.candidateoperations,
    [data],
    function (err, result) {
      if (err) {
        return res.json({ state: -1, message: err });
      } else {
        //console.log("Data from dataBase", result);
        res.json({ state: 1, msg: "success", result: result });
      }
    }
  );
}

/*-------------------------------------End Block Candidate-------------------------------------------*/

/*-------------------------------------End Get Requestion Data---------------------------------------*/
function getCandidateZip(req, res) {
  if (!req.body.tokenFetchedData) {
    return res.json({
      message: "User authorization failed",
      state: 0,
    });
  }
  try {
    var zip = new AdmZip();
    var pathtofile = appRoot.path + "/uploads/RmsCandidateDocs/" + req.body.candidateId + "/";
    if (!fs.existsSync(pathtofile)) {
      return res.json({
        state: -1,
        message: "Candidate documents are not available",
      });
    }
    fs.unlink(pathtofile + req.body.candidatename + "_doc.zip", function (err) {
      if (err) {
        console.error(err);
      }
      var attach = req.body.attachment;
      if (attach && attach.length) {
        _.map(attach, function (at, i) {
          var str = "RmsCandidateDocs/" + req.body.candidateId + "/";
          var data = at.filepath.split(str);
          if (data && data[1]) {
            var exet = at.filename && at.filename.split("."),
              exe = exet && exet[exet.length - 1];

            try {
              var input = fs.readFileSync(pathtofile + data[1]);
              var tmpname = at.doctypeval + "_" + (i + 1) + "." + exe;
              zip.addFile(tmpname, input, "", "0644");
            } catch (err) {
              // Here you get the error when the file was not found,
              // but you also get any other error
            }

            //zip.addLocalFile(pathtofile + data[1]);
          } else {
            throw "Invalid Files";
          }
        });
        var willSendthis = zip.toBuffer();
        zip.writeZip(pathtofile + req.body.candidatename + "_doc.zip");
        res.json({
          data: {
            filename:
              "RmsCandidateDocs/" +
              req.body.candidateId +
              "/" +
              req.body.candidatename +
              "_doc.zip",
          },
          state: 1,
          message: "Success",
        });
      } else {
        res.json({
          state: 1,
          data: {
            filename:
              "RmsCandidateDocs/" +
              req.body.candidateId +
              "/" +
              req.body.candidatename +
              "_doc.zip",
          },
          message: "No attach Found",
        });
      }
    });
  } catch (e) {
    res.json({
      state: -1,
      message: e,
      data: null,
    });
  }
}

function duplicate(req, res) {
  if (!req.body.tokenFetchedData) {
    return res.json({
      message: "User authorization failed",
      state: 0,
    });
  } else {
    var obj = {
      action: "duplicate",
      reqtype: "view",
      createdby: req.body.createdby,
    };
    commonModel.mysqlModelService(
      "call usp_rmscandidate_operations(?)",
      JSON.stringify(obj),
      (err, result) => {
        if (err) {
          return res.json({ state: -1, message: err });
        } else {
          //console.log("Data from dataBase", result);
          res.json({ state: 1, message: "success", data: result[0] });
        }
      }
    );
  }
}

function searchcandidate(req, res) {
  if (!req.body || !(req.body.phone || req.body.email)) {
    return res.json({ message: "Send required data", state: -1 });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService("call usp_rmscandidate_edit(?)", [obj])
    .then((results) => {
      var dbresult = commonCtrl.lazyLoading(results[0], req.body);
      if (dbresult && "data" in dbresult && "count" in dbresult) {
        return res.json({
          state: 1,
          message: "success",
          data: dbresult.data,
          count: dbresult.count,
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

function rejectedCandidate(number) {
  try {
    var obj = JSON.stringify({ type: "rejectedCandidate" });
    var options = {
      method: "POST",
      rejectUnauthorized: false,
    };
    let domain = optionConfig.webUrlLink.substring(
      optionConfig.webUrlLink.indexOf("/") + 2,
      optionConfig.webUrlLink.indexOf(".")
    );
    var data = JSON.stringify({ domain: domain });
    options.path = "/getfeatures";
    options.data = data;
    headers = {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
    };
    options.headers = headers;
    superadminController
      .commonfunc(options)
      .then((res33) => {
        if (res33) {
          //console.log("ress33", res33);
          commonModel
            .mysqlPromiseModelService("call usp_mail_notifications(?)", [obj])
            .then((results) => {
              //  //console.log("results",results)
              var emailList = _.pluck(results[0], "useremail");
              var emailObj = {
                bcc: emailList,
                mailType: "rejectCandidate",
                bodyVariables: {
                  trxcompanyname:
                    res33 && res33.expire && res33.expire[0]["CompanyName"]
                      ? res33.expire[0]["CompanyName"]
                      : "",
                  trxcandidatename: "",
                },
                subjectVariables: {
                  subject: "trxcompanyname Interview Update",
                },
              };
              mailservice.mail(emailObj, function (err) {
                if (err) {
                  //console.log("MAILLLLLLLLLLL", err);
                }
              });
            })
            .catch((err) => {
              //console.log("err", err);
            });
        }
      })
      .catch((err) => {
        //console.log("err in retrieving company name", err);
      });
    // dbService.query('call usp_mail_notifications(?)', [obj], function (err, results) {
    //     if (err) {
    //         recordMailStatus({ mailType: 'rejectedCandidate', attribute2: number, status: 'failure', failedReason: 'db error 1' });
    //     }
    //     else {
    //         errorService.getError(results[0][0], function (err) {
    //             if (err) {
    //                 recordMailStatus({ mailType: 'rejectedCandidate', attribute2: number, status: 'failure', failedReason: 'db error 2' });
    //             }
    //             else {
    //                 var emailList = _.pluck(results[0], 'useremail');
    //                 var emailObj = { bcc: emailList, mailType: 'rejectedCandidate', bodyVariables: {}, subjectVariables: {} };

    //                 mailservice.mail(emailObj, function (err, response) {
    //                     if (err) {
    //                         recordMailStatus({ mailType: 'rejectedCandidate', attribute2: number, status: 'failure', failedReason: JSON.stringify(err) });
    //                         return;
    //                     }
    //                     recordMailStatus({ mailType: 'rejectedCandidate', attribute2: number, status: 'success' });
    //                 });
    //             }
    //         });
    //     }
    // });
  } catch (err) {
    //console.log("err", err);
  }
}

async function advanceSearch(req, res) {
  const keys = req.body;
  if (!keys)
    return res.json({
      message: "Invalid Request",
      status: -1,
      data: null,
    });

  let searchKeys = {
    allwords:
      typeof keys.allwords === "string" ? keys.allwords.split(",") : undefined,
    exact: typeof keys.exact === "string" ? keys.exact.split(",") : undefined,
    anywords:
      typeof keys.anywords === "string" ? keys.anywords.split(",") : undefined,
    nowords:
      typeof keys.nowords === "string" ? keys.nowords.split(",") : undefined,
    expForm:
      typeof keys.expForm === "string" ? parseFloat(keys.expForm) : undefined,
    expTo: typeof keys.expTo === "string" ? parseFloat(keys.expTo) : undefined,
    tenth: typeof keys.tenth === "string" ? parseFloat(keys.tenth) : undefined,
    twelth:
      typeof keys.twelth === "string" ? parseFloat(keys.twelth) : undefined,
    gradtuation:
      typeof keys.gradtuation === "string"
        ? parseFloat(keys.gradtuation)
        : undefined,
    postgrad:
      typeof keys.postgrad === "string" ? parseFloat(keys.postgrad) : undefined,
  };

  console.time("abc2");
  let result = await searchInRedisDB(searchKeys);
  //console.log("resilt.length", result.length);
  console.timeEnd("abc2");
  return res.json({
    message: "success",
    state: 1,
    data: result.slice(0, 10),
    totalCount: result.length,
  });
}

/**
 * @function
 * This will filter the resumes based on filter keys
 * returns the array of filepath
 * @param {Object} keys
 */
async function searchInRedisDB(keys) {
  const {
    getAllCandidates,
    setCandidate,
    deleteCandidate,
  } = require("../../../redisconnect");
  const contents = await getAllCandidates("candidates");
  // setCandidate('candidates',1,"This tis nrer dfksjfdksfjksjfksjfksjkfj");
  // deleteCandidate('candidates','2');
  //console.log("keys", keys);
  if (!contents || contents.length < 1) return [];
  //console.log("sadadsas", contents.length);

  return contents.filter((obj) => {
    let candidate = JSON.parse(obj);
    let content = candidate.resume_content;
    //Search In field

    if (!content) return false;
    let tenthFlag = keys.tenth
      ? Math.floor(keys.tenth) === Math.floor(candidate.tenthPercentage || 0)
      : true;
    let twelfthFlag = keys.twelfth
      ? Math.floor(keys.twelfth) ===
      Math.floor(candidate.twelfthPercentage || 0)
      : true;
    let gradutionFlag = keys.gradution
      ? Math.floor(keys.gradution) ===
      Math.floor(candidate.highestDegreePercentage || 0)
      : true;
    let postgradFlag = keys.postgrad
      ? Math.floor(keys.postgrad) ===
      Math.floor(candidate.highestDegreePercentage || 0)
      : true;
    let experienceFlag =
      keys.expFrom && keys.expTo
        ? candidate.exp >= keys.expFrom && candidate.exp <= keys.expTo
        : true;
    //Search in resume content
    let exactFlag = keys.exact
      ? content.includes(String(keys.exact).toLowerCase())
      : true;
    let allwordsFlag = true; //keys.allwords && keys.allwords.length ? true : false;
    let anywordsFlag = keys.anywords && keys.anywords ? false : true;
    let nowordsFlag = true; //keys.nowords && keys.nowords.length ? false : true;

    for (let j = 0; j < ((keys.allwords && keys.allwords.length) || 0); j++) {
      // allwordsFlag = allwordsFlag && (keys.allwords[j] == contentArray[i]);
      allwordsFlag =
        allwordsFlag &&
        content.includes(String(keys.allwords[j]).toLowerCase());
      // //console.log("All words:",allwordsFlag,keys.allwords[j]);
    }

    for (let j = 0; j < ((keys.anywords && keys.anywords.length) || 0); j++) {
      // anywordsFlag = anywordsFlag || (keys.anywords[j] == contentArray[i]);
      anywordsFlag =
        anywordsFlag ||
        content.includes(String(keys.anywords[j]).toLowerCase());
      // //console.log("Any words:", anywordsFlag, keys.anywords[j]);
    }

    for (let j = 0; j < ((keys.nowords && keys.nowords.length) || 0); j++) {
      // nowordsFlag = nowordsFlag && (keys.nowords[j] !== contentArray[i]);
      nowordsFlag =
        nowordsFlag && !content.includes(String(keys.nowords[j]).toLowerCase());
      // //console.log("No words:", nowordsFlag, keys.nowords[j]);
    }
    return (
      exactFlag &&
      allwordsFlag &&
      anywordsFlag &&
      nowordsFlag &&
      tenthFlag &&
      twelfthFlag &&
      gradutionFlag &&
      postgradFlag &&
      experienceFlag
    );
  });
  // .map(x => JSON.parse(x));
}
