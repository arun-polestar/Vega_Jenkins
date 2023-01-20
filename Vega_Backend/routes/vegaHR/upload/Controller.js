const uploadModel = require("../../common/Model");
const proc = require("../../common/procedureConfig");
const common = require("../../common/Controller");
const fs = require("fs");
var mime = require("mime-types");
var textract = require("textract");
var path = require("path");
var AdmZip = require("adm-zip");
var async = require("async");
const appRoot = require("app-root-path");
const _ = require("underscore");
var toPdf = require("office-to-pdf");
const commonModel = require("../../common/Model");
const stringSimilarity = require("string-similarity");
const makeDir = require("../../common/utils").makeDirectories;
const xlsx = require("xlsx");

const config = require("../../../config/config");
appRoot.originalPath = appRoot.path
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;



var textractConfig = {
  preserveLineBreaks: true,
  tesseract: {
    lang: "eng",
  },
};
var parserService = require("../../../services/parserService");
const { decodeBase64 } = require("bcryptjs");
const rdb = require("../../../redisconnect");

module.exports = {
  parseData: parseData,
  regCheck: regCheck,
  getParsedData: getParsedData,
  deleteTemporaryCandidate: deleteTemporaryCandidate,
  addCandidate: addCandidate,
  rmsUpload: rmsUpload,
  getfile: getfile,
  getMedia: getMedia,
  editTemporaryRecord: editTemporaryRecord,
  percentageFromWords: percentageFromWords,
  getExperienceFromWords: getExperienceFromWords,
  experienceFromCareerObjective: experienceFromCareerObjective,
  rerunRanking: rerunRanking,
  getCandidateRanking: getCandidateRanking,
  downloadFile: downloadFile,
  getDuplicateCandidate: getDuplicateCandidate,
  uploadCandidateExcel,
};

//start new-----------------------------

function getfile(req, res) {
  try {
    const error = "File does not exist";
    if (req.body["_path"]) {
      req.body.url = req.body["_path"];
    }
    if (!req.body.url) {
      throw new Error(error)
      // return res.status(432).send(error);
    }
    if (
      req.body.url.includes("./") === true ||
      req.body.url.includes("../") === true
    ) {
      throw new Error(error)
      //return res.status(432).send(error);
    } else {
      var filePath;
      if (req.body.url == "img/logo-login.png") {
        filePath = path.join(appRoot && appRoot.originalPath, "/assets", req.body.url);
      } else if (req.body["_path"]) {
        if (
          req.body["_path"].includes("veSignature") === true ||
          req.body["_path"].includes("certificateSignature") === true
        ) {
          filePath = path.join(appRoot && appRoot.path, req.body.url);
        } else {
          throw new Error(error)
          // return res.status(432).send(error);
        }
      } else {
        filePath = path.join(appRoot && appRoot.path, "uploads", req.body.url);
      }
      if (!fs.existsSync(filePath)) {
        throw new Error(error)
        //return res.status(432).send(error);
      } else {
        var fileName = path.basename(req.body.url);
        var extention = path.extname(fileName);

        var pdfdirectory = makeDir(path.join("uploads", "temp"));
        /*-------------------------------code for convert docx to pdf----------------------------------- */
        if (extention == ".docx" || extention == ".doc" || extention == ".rtf") {
          var outfilename = fileName.split(".")[0].concat(".pdf");

          var pdfPath = path.join(pdfdirectory, outfilename);
          var wordBuffer = fs.readFileSync(filePath.toString());
          console.log('pdfPath', pdfPath)
          toPdf(wordBuffer).then(
            (pdfBuffer) => {
              fs.writeFileSync(pdfPath, pdfBuffer);
              filestream = fs.createReadStream(pdfPath);
              var pdfmimetype = mime.lookup(pdfPath);
              filestream.on("open", function () {
                var validDisplayName = outfilename
                  .replace(/,/g, "_")
                  .replace(/;/g, "_");
                res.setHeader(
                  "Content-disposition",
                  "attachment; filename=" + validDisplayName
                );
                res.setHeader("Content-type", pdfmimetype);
                //fs.unlinkSync(pdfPath);
                filestream.pipe(res);
              });
              filestream.on("error", function (err) {
                throw new Error(err)
                // return res.status(432).send(err);
              });
            })
            .catch(err => {
              throw new Error(err)

            });
        } else {
          /**--------------------------------------end convert docx to pdf--------------------------- */
          var mimetype = mime.lookup(filePath);
          var filestream = fs.createReadStream(filePath);
          filestream.on("open", function () {
            var validDisplayName = fileName.replace(/,/g, "_").replace(/;/g, "_");
            res.setHeader(
              "Content-disposition",
              "attachment; filename=" + validDisplayName
            );
            res.setHeader("Content-type", mimetype);
            filestream.pipe(res);
          });
          filestream.on("error", function (err) {
            return res.json({
              state: -1,
              message: "File does not exist.",
              data: null,
            });
          });
        }
      }
    }
  } catch (e) {
    return res.status(432).send(e.message || e);
  }

}
function getMedia(req, res, next) {
  //console.log("jsdjdjddjjdjdjdjd", req.params);
  var guid = req.params.id;

  var obj = JSON.stringify({
    guid: guid,
    action: "getvideopath",
  });
  commonModel
    .mysqlPromiseModelService(proc.screening, [obj])
    .then((results) => {
      //console.log("resultsss", results);
      var filepathMedia =
        results && results[0] && results[0][0] && results[0][0].screenmediapath;
      const fpath = path.join(appRoot.path, filepathMedia);
      if (!fs.existsSync(fpath)) {
        return res.json({
          state: -1,
          message: "File does not exist",
        });
      }

      const stat = fs.statSync(fpath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        const chunksize = end - start + 1;
        const file = fs.createReadStream(fpath, { start, end });
        const head = {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": "video/mp4",
        };

        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          "Content-Length": fileSize,
          "Content-Type": "video/mp4",
        };
        res.writeHead(200, head);
        fs.createReadStream(fpath).pipe(res);
      }
    })
    .catch((err) => {
      return res.json({
        state: -1,
        message: "File does not exist",
      });
    });
}
function downloadFile(req, res) {
  //console.log("req.body.urllllllll", req.body.url);

  var filePath = path.join(appRoot && appRoot.path, "/uploads", req.body.url);

  if (!fs.existsSync(filePath)) {
    //console.log("111111111111111111111111");
    var error = {
      state: -1,
      message: "File Not found",
    };
    //var error = new Blob([{state:-1}],{type:'text/plain'})
    return res.status(432).send(error);
  } else {
    var fileName = path.basename(req.body.url);
    var mimetype = mime.lookup(filePath);
    var filestream = fs.createReadStream(filePath);
    filestream.on("error", function (err) {
      var error = {
        state: -1,
        message: "File Not found",
      };
      //var error = new Blob([{state:-1}],{type:'text/plain'})
      return res.status(432).send(error);
    });

    filestream.on("open", function () {
      var validDisplayName = fileName.replace(/,/g, "_").replace(/;/g, "_");
      res.setHeader(
        "Content-Disposition", "attachment; filename=" + validDisplayName
      );
      res.setHeader("Content-type", mimetype);
      filestream.pipe(res);
      ////console.log('!~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',res.body);
    });
  }
}

/**
 * Function to upload resume file/s to be parse
 */
function rmsUpload(req, res) {
  let dirname;
  if (req.files) {
    if (req.files["file"]) {
      let file = req.files.file,
        filename = file.name.split("."),
        dirname = path.join(
          appRoot && appRoot.path,
          "/uploads/Recruitment/hr/" +
          filename[0] +
          Date.now() +
          "." +
          filename[1]
        );
      makeDir(path.join("uploads", "Recruitment", "hr"));
      //console.log("dirnamemeeee", dirname);
      var uploadedData = {
        filename: file.name,
        uploadedpath: dirname,
      };
      file.mv(dirname, function (err) {
        if (err) {
          return res.json({
            state: -1,
            message: err.message || "Error in uploading File",
            data: null,
          });
        } else {
          parseData(
            uploadedData,
            req.body.createdby,
            req.body.sourceId,
            req.body.referredby,
            "HR"
          )
            .then((results) => {
              return res.json({ state: 1, message: "success", data: results });
            })
            .catch((e) => {
              return res.json({ state: -1, message: e.reason, data: null });
            });
        }
      });
    } else {
      res.json({ state: -1, message: "file is not valid", data: null });
    }
  } else {
    res.json({ state: -1, message: "please select a file!!!", data: null });
  }
}

/*---------------------------------------------------------------------------------------------------*
 *                                          PARSING START                                            *
 *---------------------------------------------------------------------------------------------------*/

/**
 * function to parse data from uploaded file
 */
function parseData(
  uploadedData,
  currentUser,
  resumesource,
  referredby,
  uploadType,
  parsedMail = {}
) {
  if (
    uploadedData == undefined ||
    !uploadedData.filename ||
    !uploadedData.uploadedpath
  ) {
    return { message: "failure2", reason: "file not found" };
  }

  return new Promise((resolve, reject) => {
    if (
      uploadedData == undefined ||
      !uploadedData.filename ||
      !uploadedData.uploadedpath
    ) {
      console.error("File not found to parse");
      reject({ message: "failure", reason: "file not found" });
    }

    var dataTrack = [];
    var institituefromdb = [],
      instititueIdfromdb = [],
      location = [],
      locationId = [],
      extSupported = ["pdf", "doc", "docx", "rtf", "jpg"],
      resumesourceName,
      mimeSupported = [
        "text/rtf",
        "application/rtf",
        "application/x-rtf",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      //dataTrack = [],
      qualificationFromDb = [],
      qualificationIdFromDb = [];
    var obj = JSON.stringify({
      configcode:
        "technology,location,rmsJobType,rmsInstitute,qualification,rmsResumeSource",
      createdby: currentUser || 1,
    });

    /**
     * Getting parsing parameter from database
     * and extracting it into variables to pass
     * these parameters to the parsing function
     */
    uploadModel.mysqlModelService(
      proc.mstconfigview,
      [obj],
      function (err, results) {
        if (err) {
          reject({ message: "failure3", reason: err });
        }

        /**
         * Extracting values
         */
        for (var i = 0; i < (results && results[0] && results[0].length); i++) {
          if (results[0][i].id == resumesource) {
            resumesourceName = results[0][i].configvalue1;
            //console.log("rseme", resumesourceName);
          }
          if (results[0][i].configcode === "location") {
            location.push(results[0][i].configvalue1);
            locationId.push(results[0][i].id);
          }
          if (results[0][i].configcode === "rmsInstitute") {
            institituefromdb.push(results[0][i].configvalue1);
            instititueIdfromdb.push(results[0][i].id);
          }
          if (results[0][i].configcode === "qualification") {
            qualificationFromDb.push(results[0][i].configvalue1);
            qualificationIdFromDb.push(results[0][i].id);
          }
        }

        var totalVal = {
          location: location,
          locationId: locationId,
          institituefromdb: institituefromdb,
          instititueIdfromdb: instititueIdfromdb,
          qualificationFromDb: qualificationFromDb,
          qualificationIdFromDb: qualificationIdFromDb,
        };

        /**
         * Check for uploaded file type
         * If it was zip file, extract files and push only those file in to array
         * that has permitted file type
         *
         * If it was not zipped file but it has the permitted file type, simply
         * push it into array
         *
         * otherwise reject the parsing process with a failure message
         */
        let now = Date.now();
        let uploadedFileExtension = uploadedData.filename.split(".").pop();
        let resumes = []; //array to store files info that is to be parsed

        if (uploadedFileExtension.toLowerCase() == "zip") {
          var start = new Date().getTime();
          let modifiedFilename =
            uploadedData.filename.split(".")[0] + "_" + now;
          let folderpath = path.join(
            appRoot && appRoot.path,
            "/uploads/Recruitment/hr" + modifiedFilename
          );
          makeDir(path.join("uploads", "Recruitment", "hr"));
          makeDir(path.join("uploads/Recruitment/hr" + modifiedFilename));

          //var foldername = exet[0] + '_' + now;
          var zip = new AdmZip(uploadedData.uploadedpath);
          zip.extractAllTo(folderpath, false);
          var zipEntries = zip.getEntries();

          for (let i = 0; i < zipEntries.length; i++) {
            if (!zipEntries[i].isDirectory) {
              resumes.push({
                fileName: zipEntries[i].name,
                newPath: path.join(folderpath, zipEntries[i].entryName),
              });
            }
          }
        } else if (
          extSupported.indexOf(uploadedFileExtension.toLowerCase()) > -1
        ) {
          resumes.push({
            fileName: uploadedData.filename,
            newPath: uploadedData.uploadedpath,
          });
        } else {
          reject({
            message: "failure4",
            reason: "This file format is not permitted.",
          });
        }

        /**
         * Asynchronous loop for parsing each resume file
         * pushed into array in above code
         */
        async.each(
          resumes,
          function (resume, callback) {
            var namefile = resume.fileName;
            var newpath = resume.newPath;
            let result = mime.lookup(newpath);
            var exe = namefile.split(".").pop().toLowerCase();
            var sharePath = newpath.split("uploads").pop();

            if (
              extSupported.indexOf(exe) > -1 &&
              mimeSupported.indexOf(result) > -1
            ) {
              textract.fromFileWithPath(
                newpath,
                textractConfig,
                function (error, text) {
                  if (error || typeof text == undefined) {
                    dataTrack.push({
                      filename: namefile,
                      filepath: sharePath,
                      uploadstatus: "failure6",
                      uploadreason: "file cannot process",
                      candidatename: "",
                      email: "",
                      phone: "",
                      skills: "",
                      permanentaddress: "",
                      qualification: "",
                      location: "",
                      years: "",
                      months: "",
                      institutes: "",
                      organization: "",
                      createdby: currentUser || 0,
                      resumesource: resumesource,
                      referredby: referredby || undefined,
                    });
                    callback();
                  } else {
                    regCheck(
                      text,
                      dataTrack,
                      totalVal,
                      newpath,
                      namefile,
                      sharePath,
                      currentUser,
                      resumesource,
                      referredby,
                      callback,
                      parsedMail
                    );
                  }
                }
              );
            } else {
              dataTrack.push({
                filename: namefile,
                filepath: sharePath,
                uploadstatus: "failure7",
                uploadreason: "file format not supported",
                candidatename: "",
                email: "",
                phone: "",
                skills: "",
                permanentaddress: "",
                qualification: "",
                location: "",
                years: "",
                months: "",
                institutes: "",
                organization: "",
                createdby: currentUser || 0,
                resumesource: resumesource,
                referredby: referredby || undefined,
              });
              callback();
            }
          },
          function (err) {
            if (err) {
              reject({ message: "failure5", reason: err });
            } else {
              var end = new Date().getTime();
              var time = end - start;
              var obj = JSON.stringify(dataTrack);
              // //console.log("ooooRRRRResume DUplicityoooooo", obj);
              if (resumesource == "campus-placement") {
                return resolve({ message: "success", result: dataTrack });
              }
              var obj = JSON.stringify(dataTrack);
              //console.log("secondooobbbjjj", obj);
              if (
                resumesourceName == "Employee Referral" &&
                uploadType != "HR"
              ) {
                return resolve({ message: "success", result: dataTrack });
              }
              if (
                resumesourceName &&
                resumesourceName != "Employee Referral" &&
                uploadType == "RequistionTag"
              ) {
                //console.log("inside", resumesourceName);
                return resolve({ message: "success", result: dataTrack });
              }
              uploadModel.mysqlModelService(
                proc.rmstempcandidateadd,
                [obj],
                function (err, results) {
                  if (err || !results || results.length < 2) {
                    return reject({ message: "failure1", reason: err });
                  }
                  // ResumeCompare();
                  // let result = result;
                  //remove last element containnig information
                  //about last query from mysql npm module
                  results.pop();
                  let responseData = results.pop();
                  for (let i = 0; i < results.length; i++) {
                    rdb.setCandidate(
                      "candidates",
                      results[i][0].id,
                      JSON.stringify(results[i][0])
                    );
                  }
                  resolve({ message: "success", result: [responseData] });
                }
              );
            }
          }
        );
      }
    );
  });
}

/**
 * This function contains parsing logic
 */
function regCheck(
  text,
  dataTrack,
  totalVal,
  newpath,
  namefile,
  sharePath,
  currentUser,
  resumesource,
  referredby,
  callback,
  parsedMail = {}
) {
  var textLowerCase = text
    .toLowerCase()
    .replace(/,/g, " ")
    .replace(/-/g, " ")
    .replace(/:/g, " ")
    .replace(/\n/g, " ")
    .replace(/\./g, " ");
  textLowerCase = textLowerCase.replace(/ +/g, " ").replace(/\+/g, "");
  text = text
    .replace(/:/g, " ")
    .replace(/-/g, " ")
    .replace(/,/g, " ")
    .replace(/ +/g, " ")
    .replace(/\+/g, "");
  var textarr = text.split("\n");
  textarr.forEach(function (element, index) {
    textarr[index] = element.concat(" EOL");
  });
  ////console.log("newtextarray", textarr);
  //cb(textarr, textLowerCase);

  //start processing from here
  // regCheck(text, function (textarr, textLowerCase) {
  //code to get name
  let name = parseCandidateName(textarr);

  //code to get experience from career objective
  var years = 0;
  var months = 0;
  var careerExperience = experienceFromCareerObjective(textarr);
  years = careerExperience && careerExperience.years;
  months = careerExperience && careerExperience.months;

  if (years == 0 && months == 0) {
    //code to get experience in years from tillnow + worked at
    //console.log("expppppppppp", years, years);

    var obj = getExperienceFromWords(textarr);
    years = obj && obj.years;
    months = obj && obj.months;
    // //console.log("yearssss",years,"monthssss",months);
  }
  if (years % 1 != 0) {
    var x = years;
    years = Math.floor(years);
    months = Math.floor((x - years) * 100);
  }

  if (months >= 12) {
    years += Math.floor(months / 12);
    months = months % 12;
  }

  /* code to get no. of companies changed
   * we are matching elements with keywords like private ltd. serive ltd etc..
   * count is incremented if such keywords are found
   */
  ////console.log("textaaaaaarrrrrrrr", textarr);
  var noOfCompaniesWorked = parseNumOfCompaniesWorked(textarr);

  //code for college tiering
  /**
   * Extracting tiercode
   */
  let tierThreeCode, tierTwoCode, tierOneCode;
  for (
    let index = 0;
    index < (totalVal.institituefromdb && totalVal.institituefromdb.length);
    index++
  ) {
    if (totalVal.institituefromdb[index] == "Tier 1") {
      tierOneCode = totalVal.instititueIdfromdb[index];
    }
    if (totalVal.institituefromdb[index] == "Tier 2") {
      tierTwoCode = totalVal.instititueIdfromdb[index];
    }
    if (totalVal.institituefromdb[index] == "Tier 3") {
      tierThreeCode = totalVal.instititueIdfromdb[index];
    }
  }

  let collegeDetail = parseCollegeDetail(
    textarr,
    tierOneCode,
    tierTwoCode,
    tierThreeCode
  );
  let tierCode = collegeDetail.tierCode;
  let collegeName = collegeDetail.collegeName;

  //code to get skills from c.v
  let skills = parseSkills(textarr);
  // //console.log("skillssssss",skills)

  let marksPercentage = parseAcademicMarksPercentage();
  //code to get 10th 12th percentage
  //var percentPossibiliy = [];
  let highestDegreePercentage = marksPercentage.highestDegreePercentage;
  let twelfthPercentage = marksPercentage.twelfthPercentage;
  let tenthPercentage = marksPercentage.tenthPercentage;
  ////console.log("textarrqqqqqqqqqq", textarr);

  ////console.log("graduation percentage ", highestDegreePercentage);

  parserService
    .parseAllHr(text, textLowerCase, textarr, newpath, [], totalVal)
    .then((result) => {
      parsedDetails = {
        candidatename: name ? name : result.name,
        email: result.email || "",
        phone: result.phone || "",
        permanentaddress: result.permanentAddress || "",
        qualification: result.Qualification || null,
      };
      let rdObj = JSON.stringify(parsedDetails);
      //console.log(rdObj, "oBjeeeeeResumeee-fetch --if matching------------");

      let duplicateData = {
        isResumeMatched: 0,
        matchflag: 0,
      };
      commonModel
        .mysqlPromiseModelService("call usp_rms_resume_duplicacy(?)", [rdObj])
        .then((results) => {
          let duplicayResults = JSON.parse(
            JSON.stringify(results && results[0] && results[0][0])
          );
          let oldText = JSON.stringify(text);
          //console.log(results, "duplicacy resultss----------");
          if (duplicayResults.isDuplicate == 0) {
            let bestMatch = 0.9;
            let tempCandidateIndex = null;
            let rmsCandidateIndex = null;
            if (results && results[1] && results[1].length > 0) {
              results[1].forEach((data, index) => {
                // //console.log(oldText,data.parsedJsonData, "dataaaa");
                let compareResult = stringSimilarity.compareTwoStrings(
                  oldText,
                  data.parsedJsonData || ""
                );
                if (compareResult > bestMatch) {
                  bestMatch = compareResult;
                  tempCandidateIndex = index;
                }
                //console.log(compareResult, "compareResultt11------");
              });
            }

            if (results && results[2] && results[2].length > 0) {
              results[2].forEach((data, index) => {
                // //console.log(text,data.parsedJsonData, "dataaaa2-----------======");
                let compareResult = stringSimilarity.compareTwoStrings(
                  oldText,
                  data.parsedJsonData || ""
                );
                if (compareResult > bestMatch) {
                  bestMatch = compareResult;
                  rmsCandidateIndex = index;
                  tempCandidateIndex = null;
                }
                //console.log(compareResult, "compareResultt 22------");
              });
            }

            if (bestMatch > 0.9) {
              // duplicateData.isDuplicate = true;
              duplicateData.isResumeMatched = 1;
              duplicateData.matchflag = 1;
              duplicateData.resumeMatchingPercentage = bestMatch * 100;
              if (tempCandidateIndex != null) {
                duplicateData.tempCandidateId =
                  results[1][tempCandidateIndex].id;
                duplicateData.filePath =
                  results[1][tempCandidateIndex].filepath;
              } else {
                duplicateData.rmsCandidateId = results[2][rmsCandidateIndex].id;
                duplicateData.filePath = results[2][rmsCandidateIndex].filepath;
              }
            }
            //console.log(bestMatch, "Matchingg--------");
          } else {
            duplicateData.isResumeMatched = duplicayResults.isDuplicate;
            duplicateData.matchflag = duplicayResults.matchflag;
          }

          // //console.log(duplicateData, "duplicateDattaObj----------");

          dataTrack.push({
            filename: namefile,
            filepath: sharePath,
            uploadstatus: "success",
            uploadreason: "",
            candidatename: name ? name : result.name,
            email: result.email,
            phone: result.phone,
            skills: parsedMail.keySkills || result.skillarrId,
            // skillsText: skills?skills:result.skillarrText,
            skillText:
              parsedMail.keySkills || (skills ? skills : result.skillarrText),
            permanentaddress: result.permanentAddress,
            qualification: result.Qualification,
            location: result.currentlocation,
            // years: years?years:result.years,
            // months: months?months:result.months,
            years: parsedMail.expYears || years,
            months: parsedMail.expMonths || months,
            institutes: tierCode ? tierCode : result.instititutes,
            // institituteName:result.institituteName,
            institituteName:
              parsedMail.institute ||
              (collegeName ? collegeName : result.institituteName),
            highestDegreePercentage:
              Math.round(highestDegreePercentage * 100) / 100,
            twelfthPercentage: Math.round(twelfthPercentage * 100) / 100,
            tenthPercentage: Math.round(tenthPercentage * 100) / 100,
            noOfCompaniesWorked: noOfCompaniesWorked || 0,
            organization: parsedMail.organization || "",
            createdby: currentUser || 0,
            resumesource: resumesource,
            referredby: referredby || undefined,
            Resume: text,
            isResumeMatched: duplicateData.isResumeMatched,
            tempCandidateId: duplicateData.tempCandidateId,
            rmsCandidateId: duplicateData.rmsCandidateId,
            resumeMatchingPercentage: duplicateData.resumeMatchingPercentage,
            resumeMatchingPath: duplicateData.filePath,
            matchflag: duplicateData.matchflag,
            resumeContent: text && text.replace(/\n/g, " ").toLowerCase(),
            jobtitle: parsedMail.jobTitle || undefined,
            mailsubject: parsedMail.jobTitle,
            qualificationtext: parsedMail.qualification || undefined,
            preferredloc: parsedMail.preferredLoc || undefined,
            locationtext: parsedMail.location || undefined,
            noticeperiod: parsedMail.noticePeriod || undefined,
            currentsalary: parsedMail.ctc,
            mailbody: parsedMail.mailbody,
            experiencetext: parsedMail.exptext,
          });

          // if (err) {
          //    //console.log("error in fetching duplicate data");
          // }

          //  duplicateData.isResumeMatched = 1;

          //console.log(dataTrack, "datatTrack------------------");
          var obj = dataTrack;
          var filetext = text.replace(/,/g, " ");
          var resumeobj = {
            filepath: obj[0].filepath,
            text: filetext,
            flag: true,
            comparepath: null,
          };
          makeDir(path.join("resumeJsonFiles", "ResumeCompare"));
          var dir = path.join(
            appRoot && appRoot.path,
            "/resumeJsonFiles/ResumeCompare/latest.json"
          );
          var dir2 = path.join(
            appRoot && appRoot.path,
            "/resumeJsonFiles/ResumeCompare/old.json"
          );

          fs.truncate(dir, 0, function () {
            //console.log("done");
          });
          fs.readFile(dir, function (err, data) {
            if (err) {
              //console.log("ERROR READING LATEST.JSON: ", err);
              callback();
            } else if (data) {
              // //console.log("dataaaaaa",data);
              var arr = [];
              var arr1 = JSON.parse(JSON.stringify(data));
              arr.push(arr1);
              arr.push(resumeobj);
              // //console.log('data : ', arr);
              fs.writeFile(dir, JSON.stringify(arr), function (err) {
                if (err) {
                  //console.log("error", error);
                  callback();
                } else {
                  //console.log("Resume Sent1");
                  callback();
                }
              });
            }
          });
        });
    })
    .catch((error) => {
      //console.log("-----errrroror from parser service_____>>>>", error);
      dataTrack.push({
        filename: namefile,
        filepath: sharePath,
        uploadstatus: "failure",
        uploadreason: "file cannot process",
        candidatename: "",
        email: "",
        phone: "",
        skills: "",
        permanentaddress: "",
        qualification: "",
        location: "",
        years: "",
        months: "",
        institutes: "",
        organization: "",
        createdby: currentUser || 0,
        resumesource: resumesource,
        referredby: referredby || undefined,
      });
      callback();
    });
  //});
}

/**
 * Function to parse candidate name
 */
function parseCandidateName(textarr) {
  var namearr = [];
  var flag = true;
  var emailregx =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  var phonenoregx = /^\d{10}$/;
  var numregx = /\d/;
  var length = textarr.length > 10 ? 10 : textarr.length;
  var checklen = 0;
  for (var index = 0; index < length; index++) {
    checklen++;
    if (textarr[index] != " EOL") {
      if (
        textarr[index].toLowerCase().indexOf("resume") == -1 &&
        textarr[index].toLowerCase().indexOf("c v") == -1 &&
        textarr[index].toLowerCase().indexOf("cv") == -1 &&
        textarr[index].toLowerCase().indexOf("c.v") == -1 &&
        textarr[index].toLowerCase().indexOf("curriculum") == -1 &&
        textarr[index].toLowerCase().indexOf("developer") == -1 &&
        textarr[index].toLowerCase().indexOf("tester") == -1 &&
        textarr[index].toLowerCase().indexOf("analyst") == -1
      ) {
        var tempstr = textarr[index].split(" ");
        for (
          var innerindex = 0;
          innerindex < (tempstr && tempstr.length);
          innerindex++
        ) {
          if (
            tempstr[innerindex].match(phonenoregx) ||
            tempstr[innerindex].match(emailregx)
          ) {
            flag = false;
            break;
          }
        }
        if (flag) {
          if (!textarr[index].match(numregx)) {
            namearr.push(textarr[index]);
          }
        }
      }
    }
    if (!flag) {
      break;
    }
  }

  var name = null;
  if (
    checklen == 10 ||
    checklen == textarr.length ||
    textarr.length == 0 ||
    namearr.length == 0
  ) {
    // name = null;
    if (namearr.length != 0) {
      //logic
      for (i = 0; i < (namearr && namearr.length); i++) {
        // //console.log("nameiitteemmm",namearr[i],namearr[i].includes("Name"));
        if (namearr[i] && namearr[i].toLowerCase().includes("name")) {
          if (
            (namearr[i] &&
              namearr[i].toLowerCase().includes("father's name")) ||
            (namearr[i] && namearr[i].toLowerCase().includes("mother's name"))
          ) {
            name = null;
          } else {
            var tempname =
              namearr[i] && namearr[i].toLowerCase().replace("name", "");
            name =
              tempname &&
              tempname
                .replace(" eol", "")
                .replace(/\\r|\\/g, "")
                .trim();
            // //console.log("naammeee11111",name);
            break;
          }
        } else {
          // name= null;
          if (
            (namearr[i] && namearr[i].trim() == "EOL") ||
            (namearr[i] && namearr[i].replace('" "', "").trim() == "EOL") ||
            (namearr[i] && namearr[i].toLowerCase().includes("corporate")) ||
            (namearr[i] && namearr[i].toLowerCase().includes("service")) ||
            (namearr[i] &&
              namearr[i] &&
              namearr[i].toLowerCase().includes("pvt")) ||
            (namearr[i] && namearr[i].toLowerCase().includes("private")) ||
            (namearr[i] && namearr[i].toLowerCase().includes("salary")) ||
            (namearr[i] && namearr[i].length > 28) ||
            (namearr[i] && namearr[i].toLowerCase().includes("interest"))
          ) {
            // name = item.replace(' EOL','');
            //console.log("nameeeeeeeeerrrmmmmmmmmmrr1", name);
          }
          // else if(namearr[i] == ' EOL'){
          //     //console.log("nameeeeeeeeerrrmmmmmmmmmrr2",name);
          // }
          else {
            name =
              namearr[i] &&
              namearr[i]
                .replace(" EOL", "")
                .replace(/\\r|\\/g, "")
                .trim();
            // //console.log("nameeeeeeeeerrrmmmmmmmmmrr3",name);
            break;
          }
        }
      }
    } else {
      name = null;
    }
    // //console.log("naammeee",name);
  } else {
    // name = namearr[0].replace(' EOL','');
    // //console.log("nameeffff", namearr, "zzeerrrroooo",namearr[0],"length",namearr.length);
    for (i = 0; i < (namearr && namearr.length); i++) {
      //console.log("namearr[i]", namearr[i]);
      if (
        (namearr[i] && namearr[i].trim() == "EOL") ||
        (namearr[i] && namearr[i].replace('" "', "").trim() == "EOL") ||
        (namearr[i] && namearr[i].toLowerCase().includes("corporate")) ||
        (namearr[i] && namearr[i].toLowerCase().includes("service")) ||
        (namearr[i] && namearr[i].toLowerCase().includes("pvt")) ||
        (namearr[i] && namearr[i].toLowerCase().includes("private")) ||
        (namearr[i] && namearr[i].toLowerCase().includes("salary")) ||
        namearr[i].length > 28 ||
        (namearr[i] && namearr[i].toLowerCase().includes("interest"))
      ) {
        //console.log("nameeeeeeeeerrrmmmmmmmmmrr1", name);
      } else {
        name =
          namearr[i] &&
          namearr[i]
            .replace(" EOL", "")
            .replace(/\\r|\\/g, "")
            .trim();
        break;
      }
    }
  }
  return name;
}
/**
 * Function to parse no. of companies worked
 */
function parseNumOfCompaniesWorked(textarr) {
  var noOfCompaniesWorked = 0;
  for (let index = 0; index < textarr.length; index++) {
    if (
      (textarr[index] &&
        textarr[index].toLowerCase().search("industries") != -1) ||
      (textarr[index] &&
        textarr[index].toLowerCase().search("private limited") != -1) ||
      (textarr[index] &&
        textarr[index].toLowerCase().search("service limited") != -1) ||
      (textarr[index] &&
        textarr[index].toLowerCase().search("consultancy services") != -1) ||
      (textarr[index] &&
        textarr[index].toLowerCase().search("pvt ltd") != -1) ||
      (textarr[index] &&
        textarr[index].toLowerCase().search("enterprises") != -1)
    ) {
      //console.log("skskdfhfh", textarr[index]);
      noOfCompaniesWorked++;
    }
  }
  return noOfCompaniesWorked;
}

/**
 * Function to parse college details of candidate
 */
function parseCollegeDetail(textarr, tierOneCode, tierTwoCode, tierThreeCode) {
  var dirName = path.join(
    appRoot && appRoot.path,
    "/resumeJsonFiles/ResumeCompare/collegeTier.json"
  );
  var collegeData;
  var tier = "Others";
  var tierCode;
  var collegeRegexp;
  var collegeName;
  var k = 0;
  collegeData = JSON.parse(fs.readFileSync(dirName));
  // //console.log("collegeData1111",collegeData);
  // var collegeTier =getCollegeTier(textarr,);
  while (k < (textarr && textarr.length)) {
    if (
      (textarr[k] && textarr[k].toLowerCase().search("achievement") != -1) ||
      (textarr[k] && textarr[k].toLowerCase().search("curricular") != -1)
    ) {
      // //console.log("textarrkkkk",textarr[k]);
      k = k + 8;
      //console.log("kkkk", k);
      //console.log("textarrkkkkiii", textarr[k]);
      if (k > textarr && textarr.length) {
        break;
      }
      //console.log("kkkk11111", k);
    }
    for (j = 0; j < (collegeData && collegeData.length); j++) {
      // //console.log("collegedataaa")
      collegeRegexp = new RegExp(
        "[^a-z]" + collegeData[j] &&
        collegeData[j].Name.toLowerCase() + "[^a-z]"
      );
      if (
        k < textarr.length &&
        textarr[k] &&
        textarr[k].toLowerCase().search(collegeRegexp) != -1
      ) {
        //console.log("textttarr[1]", textarr[k], "bjjjh", collegeData[j]);
        tier = collegeData[j] && collegeData[j].Tier;
        collegeName = collegeData[j] && collegeData[j].Name;
        if (tier == "Tier 1") {
          tierCode = tierOneCode;
          // //console.log("tier and college2",tier,collegeName);
          break;
        } else if (tier == "Tier 2") {
          tierCode = tierTwoCode;
          // //console.log("tier and college3",tier,collegeName);
          break;
        }
      }
    }
    if (tier == "Tier 1") {
      break;
    }
    k++;
  }
  if (tier == "Others") {
    tierCode = tierThreeCode;
  }

  return {
    collegeName: collegeName,
    tierCode: tierCode,
  };
}

/**
 * Function to parse candidate's skills
 */
function parseSkills(textarr) {
  var skillPath = path.join(
    appRoot && appRoot.path,
    "/resumeJsonFiles/ResumeCompare/skillSet.json"
  );
  var skillsSet = JSON.parse(fs.readFileSync(skillPath));
  var skillsRegExp;
  var skillsArray = [];
  var skills;
  for (i = 0; i < (textarr && textarr.length); i++) {
    for (j = 0; j < (skillsSet && skillsSet.length); j++) {
      skillsRegExp = new RegExp(
        "[^a-z]" + skillsSet[j] && skillsSet[j].toLowerCase() + "[^a-z]"
      );
      if (textarr[i] && textarr[i].toLowerCase().search(skillsRegExp) != -1) {
        skillsArray.push(skillsSet[j]);
      }
    }
  }

  // //console.log("skillsSettttt",skillsSet);
  var uniq = [...new Set(skillsArray)];
  skills = uniq.join();
  return skills;
}

/**
 * Function to parse experience of candidate from career objective
 */
function experienceFromCareerObjective(textarr) {
  var demoMonths = [];
  var demoYears = [];
  var singleElement = [],
    years = 0,
    months = 0,
    numberGrid = [
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
    ];
  textarr.map(function (eachElement) {
    var array = eachElement && eachElement.split(" ");
    array.map(function (element) {
      element = element && element.replace(/ /g, "");
      if (element != "") singleElement.push(element.trim());
    });
  });
  // //console.log("singleElement", singleElement);
  //loop to get experience if present in career objective  words
  for (i = 0; i < 120; i++) {
    if (
      /^year/i.test(singleElement[i]) ||
      (/^yr/i.test(singleElement[i]) && !/period/i.test(singleElement[i - 2]))
    ) {
      if (
        /^\d+(\.\d{1,4})?$/i.test(singleElement[i - 1]) ||
        numberGrid.indexOf(singleElement[i - 1].toLowerCase()) != -1
      ) {
        demoYears.push(parseFloat(singleElement[i - 1]));
        //console.log("yyyyyearssss", years);
        var j = i;
        while (singleElement[j].indexOf("EOL") != -1) {
          if (
            /month/i.test(singleElement[j]) ||
            /mnth/i.test(singleElement[j])
          ) {
            if (
              /\d{1,2}/gi.test(singleElement[j - 1]) ||
              numberGrid.indexOf(singleElement[j - 1].toLowerCase()) != -1
            ) {
              demoMonths.push(parseFloat(singleElement[j - 1]));
              //console.log("mommmmmnthssss11", months);
            }
          }
          j++;
        }
      }
    }
    if (
      (/month/i.test(singleElement[i]) || /mnth/i.test(singleElement[i])) &&
      !/period/i.test(singleElement[i - 2])
    ) {
      // //console.log("month",textarr[k],textarr[i-2]);
      if (
        /\d{1,2}/gi.test(singleElement[i - 1]) ||
        numberGrid.indexOf(singleElement[i - 1].toLowerCase()) != -1
      ) {
        demoMonths.push(parseFloat(singleElement[i - 1]));
        //console.log("mmmmmmonthssss", months);
      }
    }
  }

  //end of loop
  months = demoMonths.reduce(function (a, b) {
    return a + b;
  }, 0);
  years = demoYears.reduce(function (a, b) {
    return a + b;
  }, 0);

  var object = {
    years: years,
    months: months,
  };
  //console.log("on=bjnsncjdd", object);
  return object;
}

/**
 * Function to parse candidate experience from words
 */
function getExperienceFromWords(textarr) {
  var monthsInYear = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  var j = 0;
  var yearRegex = /^[0-9]{4}$/;
  var date1;
  var d1 = [];
  var d2 = [];
  var date = new Date();
  var date2 = new Date(
    monthsInYear[date.getMonth()] + "-" + date.getFullYear()
  );
  var years = 0;
  var diffDays;
  var timeDiff;
  var months = 0;
  var demoMonths = [];
  var demoYears = [];
  var count = 0;
  for (var index = 0; index < (textarr && textarr.length); index++) {
    if (textarr[index] != " EOL") {
      // //console.log("par-----1111",textarr[index]);
      if (
        (textarr[index] &&
          textarr[index].toLowerCase().includes("till date")) ||
        (textarr[index] &&
          textarr[index].toLowerCase().includes("till present")) ||
        (textarr[index] && textarr[index].toLowerCase().includes("working")) ||
        (textarr[index] && textarr[index].toLowerCase().includes("till now "))
      ) {
        //console.log("aaaaaaaaaa");
        while (j <= 11) {
          if (
            textarr[index] &&
            textarr[index].toLowerCase().includes(monthsInYear[j])
          ) {
            var part1 = monthsInYear[j];
            //console.log("part1111", part1);
            break;
          } else if (
            textarr[index - 1] &&
            textarr[index - 1].toLowerCase().includes(monthsInYear[j])
          ) {
            var part1 = monthsInYear[j];
            textarr[index] = textarr[index - 1];
            //console.log("part333", part1);
            break;
          } else {
            j++;
          }
        }
        var eachWord = textarr[index] && textarr[index].split(" ");
        //console.log("dddddddaaattteee", eachWord);
        j = eachWord && eachWord.length - 1;
        while (j >= 0) {
          //console.log("eachWordddd", eachWord[j]);
          if (
            eachWord[j] &&
            eachWord[j]
              .replace(".", "")
              .replace(/\\r|\\/g, "")
              .trim()
              .match(yearRegex)
          ) {
            //console.log(
            //  "yearsmatchhh",
            //   eachWord[j]
            //     .replace(/\\r|\\/g, "")
            //     .trim()
            //     .match(yearRegex)
            //  );
            var part2 =
              eachWord[j] &&
              eachWord[j]
                .replace(".", "")
                .replace(/\\r|\\/g, "")
                .trim()
                .match(yearRegex);
            //console.log("part2222", part2);
            break;
          }
          j--;
        }
        if (part1 && part2) {
          date1 = new Date(part1 + "-" + part2);
          //console.log("date111", date1);
          timeDiff = Math.abs(date2.getTime() - date1.getTime());
          diffDays = timeDiff / (1000 * 3600 * 24) / 365;
          demoMonths.push(Math.floor((diffDays - Math.floor(diffDays)) * 10));
          demoYears.push(Math.floor(diffDays));
        }

        //console.log("diffDayssss", diffDays);

        //console.log(
        //  "experiencefind",
        //  textarr[index].toLowerCase().includes("experience")
        // );

        //console.log("yearssss", demoYears, "and", demoMonths);

        break;
      }

      if (
        ((textarr[index] &&
          textarr[index].toLowerCase().includes("experience")) ||
          (textarr[index] &&
            textarr[index].toLowerCase().includes("worked"))) &&
        textarr[index] &&
        textarr[index].length > 15
      ) {
        var eachWords = textarr[index] && textarr[index].split(" ");
        //console.log("dddddddaaattteee", eachWords);
        j = eachWords.length - 1;
        while (j >= 0) {
          //console.log("ppppppppppppppp", eachWords[j]);

          if (/year/i.test(eachWords[j]) || /yr/i.test(eachWords[j])) {
            demoYears.push(parseFloat(eachWords[j - 1]));
            //console.log("demoyearsss", eachWords[j - 1]);
            // break;
          }
          //console.log("eachWordddd", eachWords[j]);
          if (/month/i.test(eachWords[j]) || /mnth/i.test(eachWords[j])) {
            //console.log(
            //  "yearsmatchhh",
            //     eachWords[j]
            //       .replace(/\\r|\\/g, "")
            //       .trim()
            //       .match(yearRegex)
            //   );
            // var part2=eachWord[j].replace(/\\r|\\/g, "").trim().match(yearRegex);
            //console.log(
            //   "jjjjjjjj11111",
            //   eachWords[j - 1],
            //   typeof eachWords[j - 1].replace(/\\r|\\/g, "").trim()
            // );
            if (parseFloat(eachWords[j - 1].replace(/\\r|\\/g, "").trim())) {
              demoMonths.push(parseFloat(eachWords[j - 1]));
              //console.log("demomonths", eachWords[j - 1]);
            }
            break;
          }
          //console.log("wwwwwwwwwww", /year/i.test(eachWords[j]));

          j--;
        }
        if (demoYears || demoMonths) {
          break;
        }
      }
    }
  }
  // var k;
  // for(var index=0;index<textarr.length;index++){
  //     if(textarr[index]!=' EOL'){
  //         // code for multiple lines experience
  //         //console.log("textarrrrrrindex",textarr[index]);
  //         j=0;
  //         while(j<11){
  //             if(textarr[index].includes(monthsInYear[j])){
  //                 count++;
  //             }
  //             j++;
  //         }
  //         //console.log("countt111111tt",count);

  //         if(count==2){
  //             eachWords = textarr[index].split(' ');

  //             k=eachWords.length-1;
  //             while(k>=0){
  //                 for(j=0;j<monthsInYear.length;j++){
  //                     if(eachWords[k].includes(monthsInYear[j])){
  //                         d1.push(parseInt(monthsInYear[j]));
  //                         d2.push(parseInt(eachWords[k+1]));
  //                     }
  //                 }
  //             k--;
  //             }
  //             //console.log("daaaaa",d1,d2);

  //         }
  //         //console.log("countttt",count);

  //         if((d1.length==2)&&(d2.length==2)&&(count==2)){
  //             date1=  d1[0] + '-' +d2[0];
  //             date2= d1[1] + '-' +d2[1];
  //             timeDiff = Math.abs(date2.getTime() - date1.getTime());
  //             diffDays = timeDiff / (1000 * 3600 * 24)/365;
  //             demoMonths.push(Math.floor((diffDays-Math.floor(diffDays))*10));
  //             demoYears.push(Math.floor(diffDays));
  //             break;
  //         }
  //     }
  // }
  // //console.log("onbjbjbb",demoMonths,demoYears);

  months = demoMonths.reduce(function (a, b) {
    return a + b;
  }, 0);
  years = demoYears.reduce(function (a, b) {
    return a + b;
  }, 0);
  var obj = {
    years: years,
    months: months,
  };
  // //console.log("on=bjnsncjdd11111",obj)
  return obj;
}

/**
 * Function to parse percentage from words
 */
function percentageFromWords(textarr) {
  var floatRegex = new RegExp(/^(10|\d{1,2})(\.\d{1,2})?$/);
  var twelfthPercentage;
  var tenthPercentage;
  var singleElementArray;
  var highestDegreePercentage;
  for (var i = 0; i < (textarr && textarr.length); i++) {
    //  //console.log("ttteeeexxtttttttt",textarr[i]);

    if (
      (textarr[i] &&
        textarr[i].toLowerCase().replace(/\./g, "").includes("btech")) ||
      (textarr[i] && textarr[i].toLowerCase().includes("bca")) ||
      (textarr[i] && textarr[i].toLowerCase().includes("bba"))
    ) {
      singleElementArray = textarr[i] && textarr[i].split(" ");
      //  //console.log("hhhhhhhhhhhh",singleElementArray);

      for (
        var j = 0;
        j < singleElementArray && singleElementArray.length;
        j++
      ) {
        // //console.log("fffffffff1111",singleElementArray[j]&& singleElementArray[j].replace('"',"").trim().replace(/\\r|\\/g, "").toLowerCase());
        ////console.log("fffffffff22222",singleElementArray[j].replace('"',"").trim().replace(/\\r|\\/g, "").toLowerCase().match(floatRegex));

        if (
          singleElementArray[j] &&
          singleElementArray[j]
            .replace('"', "")
            .replace("%", "")
            .trim()
            .replace(/\\r|\\/g, "")
            .toLowerCase()
            .match(floatRegex)
        ) {
          // //console.log("sssssss",singleElementArray[j]);
          highestDegreePercentage = singleElementArray[j]
            .replace('"', "")
            .replace("%", "")
            .replace(/\\r|\\/g, "")
            .trim()
            .toLowerCase()
            .match(floatRegex)[0];
          // //console.log("logic for 12th percentage now",highestDegreePercentage);
          break;
        }
      }
    }
    if (
      (textarr[i] &&
        textarr[i].toLowerCase().replace(/\./g, "").includes("mtech")) ||
      (textarr[i] &&
        textarr[i].toLowerCase().replace(/\./g, "").includes("pgdac")) ||
      (textarr[i] && textarr[i].toLowerCase().includes("mca")) ||
      (textarr[i] && textarr[i].toLowerCase().includes("mba"))
    ) {
      singleElementArray = textarr[i] && textarr[i].split(" ");
      // //console.log("hhhhhhhhhhhh",singleElementArray);

      for (
        var j = 0;
        j < singleElementArray && singleElementArray.length;
        j++
      ) {
        // //console.log("fffffffff1111",singleElementArray[j].replace('"',"").trim().replace(/\\r|\\/g, "").toLowerCase());
        // //console.log("fffffffff22222",singleElementArray[j].replace('"',"").trim().replace(/\\r|\\/g, "").toLowerCase().match(floatRegex));

        if (
          singleElementArray[j] &&
          singleElementArray[j]
            .replace('"', "")
            .replace("%", "")
            .trim()
            .replace(/\\r|\\/g, "")
            .toLowerCase()
            .match(floatRegex)
        ) {
          // //console.log("sssssss",singleElementArray[j]);
          highestDegreePercentage =
            singleElementArray[j] &&
            singleElementArray[j]
              .replace('"', "")
              .replace("%", "")
              .replace(/\\r|\\/g, "")
              .trim()
              .toLowerCase()
              .match(floatRegex)[0];
          // //console.log("logic for 12th percentage now",highestDegreePercentage);
          break;
        }
      }
    }
    if (
      (textarr[i] && textarr[i].toLowerCase().includes("12th")) ||
      (textarr[i] && textarr[i].toLowerCase().includes("hsc")) ||
      (textarr[i] && textarr[i].toLowerCase().includes("intermediate")) ||
      (textarr[i] &&
        textarr[i].toLowerCase().includes("xii") &&
        ((textarr[i] && textarr[i].toLowerCase().includes("board")) ||
          (textarr[i] &&
            textarr[i].toLowerCase().replace(/\./g, "").includes("cbse")) ||
          (textarr[i] && textarr[i].toLowerCase().includes("school"))))
    ) {
      singleElementArray = textarr[i] && textarr[i].split(" ");
      // //console.log("hhhhhhhhhhhh",singleElementArray);

      for (
        var j = 0;
        j < (singleElementArray && singleElementArray.length);
        j++
      ) {
        // //console.log("fffffffff1111",singleElementArray[j].replace('"',"").trim().replace(/\\r|\\/g, "").toLowerCase());
        // //console.log("fffffffff22222",singleElementArray[j].replace('"',"").trim().replace(/\\r|\\/g, "").toLowerCase().match(floatRegex));

        if (
          singleElementArray[j] &&
          singleElementArray[j]
            .replace('"', "")
            .replace("%", "")
            .trim()
            .replace(/\\r|\\/g, "")
            .toLowerCase()
            .match(floatRegex)
        ) {
          // //console.log("sssssss",singleElementArray[j]&& singleElementArray[j]);
          twelfthPercentage =
            singleElementArray[j] &&
            singleElementArray[j]
              .replace('"', "")
              .replace("%", "")
              .replace(/\\r|\\/g, "")
              .trim()
              .toLowerCase()
              .match(floatRegex)[0];
          // //console.log("logic for 12th percentage now",twelfthPercentage);
          break;
        }
      }
    }
    if (
      (textarr[i] && textarr[i].toLowerCase().includes("10th")) ||
      (textarr[i] && textarr[i].toLowerCase().includes("high school")) ||
      (textarr[i] &&
        textarr[i].toLowerCase().includes("x") &&
        ((textarr[i] && textarr[i].toLowerCase().includes("board")) ||
          (textarr[i] &&
            textarr[i].toLowerCase().replace(/\./g, "").includes("cbse")) ||
          (textarr[i] && textarr[i].toLowerCase().includes("school"))))
    ) {
      // //console.log("mmmmmmmmmmmmmm",textarr[i] && textarr[i].toLowerCase().match(floatRegex) );
      singleElementArray = textarr[i] && textarr[i].split(" ");
      // //console.log("hhhhhhhhhhhh",singleElementArray);

      for (
        var j = 0;
        j < (singleElementArray && singleElementArray).length;
        j++
      ) {
        if (
          singleElementArray[j] &&
          singleElementArray[j]
            .replace('"', "")
            .replace("%", "")
            .replace(/\\r|\\/g, "")
            .trim()
            .toLowerCase()
            .match(floatRegex)
        ) {
          tenthPercentage =
            singleElementArray[j] &&
            singleElementArray[j]
              .replace('"', "")
              .replace("%", "")
              .replace(/\\r|\\/g, "")
              .trim()
              .toLowerCase()
              .match(floatRegex)[0];
          // //console.log("logic for 10th percentage now",tenthPercentage);
          break;
        }
      }
    }
    // if (tenthPercentage && twelfthPercentage) {
    //     break;
    // }
  }
  var obj = {
    tenthPercentage: tenthPercentage,
    twelfthPercentage: twelfthPercentage,
    highestDegreePercentage: highestDegreePercentage,
  };
  //console.log("objwbbcjsdb", obj);

  return obj;
}

/**
 * Function to parse percentage
 */
function parseAcademicMarksPercentage(textarr) {
  let percentPossibiliy = [];
  let highestDegreePercentage = 0;
  let twelfthPercentage = 0;
  let tenthPercentage = 0;
  for (var index = 0; index < (textarr && textarr.length); index++) {
    //console.log(
    //"texttttttttttttttttttttttttttrrrrrrrrr",
    //   textarr[index],
    //   textarr[index].search("%") != -1,
    //   textarr[index].toLowerCase().search("cgpa") != -1
    // );

    if (
      (textarr[index] && textarr[index].search("%") != -1) ||
      (textarr[index] && textarr[index].toLowerCase().search("cgpa") != -1)
    ) {
      percentPossibiliy.push(textarr[index]);
      //console.log("percentPossibiliyyyyyyyy", percentPossibiliy);
    }
  }
  //console.log("percentPossibiliyyyyyyyy", percentPossibiliy);

  for (var i = 0; i < (percentPossibiliy && percentPossibiliy.length); i++) {
    if (
      (percentPossibiliy[i] &&
        percentPossibiliy[i].replace(/\./g, "").toLowerCase().search("btech") !=
        -1) ||
      (percentPossibiliy[i] &&
        percentPossibiliy[i].replace(/\./g, "").toLowerCase().search("bba") !=
        -1) ||
      (percentPossibiliy[i] &&
        percentPossibiliy[i].replace(/\./g, "").toLowerCase().search("bca") !=
        -1)
    ) {
      var gradArray = percentPossibiliy[i] && percentPossibiliy[i].split(" ");
      for (j = 0; j < (gradArray && gradArray.length); j++) {
        if (gradArray[j] && gradArray[j].search("%") != -1) {
          if (parseFloat(gradArray[j - 1]) == "number") {
            highestDegreePercentage = gradArray[j - 1];
            break;
          } else {
            highestDegreePercentage = parseFloat(
              gradArray[j] && gradArray[j].replace("%", "")
            );
            break;
          }
        }
      }
    }
    if (
      (percentPossibiliy[i] &&
        percentPossibiliy[i].replace(/\./g, "").toLowerCase().search("mtech") !=
        -1) ||
      (percentPossibiliy[i] &&
        percentPossibiliy[i].replace(/\./g, "").toLowerCase().search("mba") !=
        -1) ||
      (percentPossibiliy[i] &&
        percentPossibiliy[i].replace(/\./g, "").toLowerCase().search("mca") !=
        -1) ||
      (percentPossibiliy[i] &&
        percentPossibiliy[i].replace(/\./g, "").toLowerCase().search("pgdac") !=
        -1)
    ) {
      var gradArray = percentPossibiliy[i] && percentPossibiliy[i].split(" ");
      for (j = 0; j < (gradArray && gradArray.length); j++) {
        if (gradArray[j].search("%") != -1) {
          if (parseFloat(gradArray[j - 1]) == "number") {
            highestDegreePercentage = gradArray[j - 1];
            break;
          } else {
            highestDegreePercentage = parseFloat(
              gradArray[j] && gradArray[j].replace("%", "")
            );
            break;
          }
        }
      }
    }

    if (
      (percentPossibiliy[i] &&
        percentPossibiliy[i].toLowerCase().search("hsc") != -1) ||
      (percentPossibiliy[i] &&
        percentPossibiliy[i].toLowerCase().search("12") != -1) ||
      (percentPossibiliy[i] &&
        percentPossibiliy[i].toLowerCase().search("xii") != -1) ||
      (percentPossibiliy[i] &&
        percentPossibiliy[i].toLowerCase().search("senior secondary") != -1)
    ) {
      var twelfthArray = percentPossibiliy[i].split(" ");
      //console.log("twelfthArraytyyyytytytyt", twelfthArray);

      for (j = 0; j < (twelfthArray && twelfthArray.length); j++) {
        if (twelfthArray[j] && twelfthArray[j].search("%") != -1) {
          if (parseFloat(twelfthArray[j - 1]) == "number") {
            twelfthPercentage = twelfthArray[j - 1];
            break;
          } else {
            twelfthPercentage = parseFloat(
              twelfthArray[j] && twelfthArray[j].replace("%", "")
            );
            break;
          }
        }
      }
    }
    if (
      (percentPossibiliy[i] &&
        percentPossibiliy[i].toLowerCase().search("ssc") != -1) ||
      (percentPossibiliy[i] &&
        percentPossibiliy[i].toLowerCase().search("10th") != -1) ||
      (percentPossibiliy[i] &&
        percentPossibiliy[i].toLowerCase().search("secondary") != -1) ||
      (percentPossibiliy[i] &&
        percentPossibiliy[i].toLowerCase().search(/xth[^a-z]/) != -1)
    ) {
      var tenthArray = percentPossibiliy[i] && percentPossibiliy[i].split(" ");
      for (j = 0; j < (tenthArray && tenthArray.length); j++) {
        if (tenthArray[j] && tenthArray[j].search("%") != -1) {
          if (parseFloat(tenthArray[j - 1]) == "number") {
            tenthPercentage = tenthArray[j - 1];
            break;
          } else {
            tenthPercentage = parseFloat(
              tenthArray[j] && tenthArray[j].replace("%", "")
            );
            break;
          }
        }
      }
    }
  }
  // //console.log("rrrrrrrrrrrrrrr",twelfthPercentage,tenthPercentage);

  for (let index = 0; index < (textarr && textarr.length); index++) {
    if (!highestDegreePercentage) {
      for (
        let k = 0;
        k < (percentPossibiliy && percentPossibiliy.length);
        k++
      ) {
        //    //console.log("eeeeeeeeeeeeeeeeeee",index,textarr[index],percentPossibiliy[k]);

        if (
          textarr[index] &&
          textarr[index]
            .replace(/[^A-Za-z0-9%]/g, "")
            .search(percentPossibiliy[k].replace(/[^A-Za-z0-9%]/g, "")) != -1
        ) {
          for (let m = 1; m < 6; m++) {
            if (
              (textarr[index - m] &&
                textarr[index - m]
                  .replace(/\./g, "")
                  .toLowerCase()
                  .search("btech") != -1) ||
              (textarr[index - m] &&
                textarr[index - m]
                  .replace(/\./g, "")
                  .toLowerCase()
                  .search("bca") != -1) ||
              (textarr[index - m] &&
                textarr[index - m]
                  .replace(/\./g, "")
                  .toLowerCase()
                  .search("bba") != -1)
            ) {
              var gradArray =
                percentPossibiliy[k] && percentPossibiliy[k].split(" ");
              //  //console.log("twelfthhhhhhhh",twelfthArray);

              for (var j = 0; j < (gradArray && gradArray.length); j++) {
                if (gradArray[j] && gradArray[j].search("%") != -1) {
                  ////console.log("jjjjjjjjjjjjj",twelfthArray[j]);
                  ////console.log("ppasrseseseeseses",twelfthArray[j].replace("%",''));

                  twelfthPercentage = parseFloat(
                    gradArray[j] &&
                    gradArray[j].replace('"', "").replace("%", "").trim()
                  );
                  // //console.log("twelfthPercentageeeee",twelfthPercentage);

                  break;
                }
              }
              break;
            }
          }
        }
      }
      for (let k = 0; k < percentPossibiliy.length; k++) {
        //    //console.log("eeeeeeeeeeeeeeeeeee",index,textarr[index],percentPossibiliy[k]);

        if (
          textarr[index] &&
          textarr[index]
            .replace(/[^A-Za-z0-9%]/g, "")
            .search(percentPossibiliy[k].replace(/[^A-Za-z0-9%]/g, "")) != -1
        ) {
          for (let m = 1; m < 6; m++) {
            if (
              (textarr[index - m] &&
                textarr[index - m]
                  .toLowerCase()
                  .replace(/\./g, "")
                  .search("mtech") != -1) ||
              (textarr[index - m] &&
                textarr[index - m]
                  .toLowerCase()
                  .replace(/\./g, "")
                  .search("mca") != -1) ||
              (textarr[index - m] &&
                textarr[index - m]
                  .toLowerCase()
                  .replace(/\./g, "")
                  .search("mba") != -1)
            ) {
              var gradArray =
                percentPossibiliy[k] && percentPossibiliy[k].split(" ");
              //  //console.log("twelfthhhhhhhh",twelfthArray);

              for (var j = 0; j < (gradArray && gradArray.length); j++) {
                if (gradArray[j] && gradArray[j].search("%") != -1) {
                  ////console.log("jjjjjjjjjjjjj",twelfthArray[j]);
                  ////console.log("ppasrseseseeseses",twelfthArray[j].replace("%",''));

                  twelfthPercentage = parseFloat(
                    gradArray[j] &&
                    gradArray[j].replace('"', "").replace("%", "").trim()
                  );
                  // //console.log("twelfthPercentageeeee",twelfthPercentage);

                  break;
                }
              }
              break;
            }
          }
        }
      }
    }

    if (!twelfthPercentage) {
      for (let k = 0; k < percentPossibiliy.length; k++) {
        // //console.log("eeeeeeeeeeeeeeeeeee",index,textarr[index],percentPossibiliy[k]);

        if (
          textarr[index] &&
          textarr[index]
            .replace(/[^A-Za-z0-9%]/g, "")
            .search(percentPossibiliy[k].replace(/[^A-Za-z0-9%]/g, "")) != -1
        ) {
          for (let m = 1; m < 6; m++) {
            if (
              (textarr[index - m] &&
                textarr[index - m].toLowerCase().search("xii") != -1) ||
              (textarr[index - m] &&
                textarr[index - m].toLowerCase().search("12th") != -1) ||
              (textarr[index - m] &&
                textarr[index - m].toLowerCase().search("intermediate") !=
                -1) ||
              (textarr[index - m] &&
                textarr[index - m].toLowerCase().search("senior secondary") !=
                -1)
            ) {
              var twelfthArray = percentPossibiliy[k].split(" ");
              // //console.log("twelfthhhhhhhh",twelfthArray);

              for (var j = 0; j < (twelfthArray && twelfthArray.length); j++) {
                if (twelfthArray[j] && twelfthArray[j].search("%") != -1) {
                  twelfthPercentage = parseFloat(
                    twelfthArray[j] &&
                    twelfthArray[j].replace('"', "").replace("%", "")
                  );
                  // //console.log("twelfthPercentageeeee",tenthPercentage);

                  break;
                }
              }
              break;
            }
          }
        }
      }
    }
    if (!tenthPercentage) {
      for (
        let k = 0;
        k < (percentPossibiliy && percentPossibiliy.length);
        k++
      ) {
        if (
          textarr[index] &&
          textarr[index].search(
            percentPossibiliy[k].replace(/[^A-Za-z0-9%]/g, "")
          ) != -1
        ) {
          for (let m = 1; m < 6; m++) {
            // //console.log("textarrindexmmmm",index-m,textarr[index-m].toLowerCase(),textarr[index-m].toLowerCase().search(/x+$/) ,
            // textarr[index-m].toLowerCase().search(/xth[^a-z]/)+1
            // ,textarr[index-m].toLowerCase().search("10th") );

            if (
              (textarr[index - m] &&
                textarr[index - m].toLowerCase().search(/x[^a-z]/) != -1) ||
              (textarr[index - m] &&
                textarr[index - m].toLowerCase().search(/xth[^a-z]/) + 1) !=
              0 ||
              (textarr[index - m] &&
                textarr[index - m].toLowerCase().search("10th") != -1) ||
              (textarr[index - m] &&
                textarr[index - m].toLowerCase().search("high school") != -1) ||
              (textarr[index - m] &&
                textarr[index - m].toLowerCase().search("secondary") != -1)
            ) {
              // //console.log("textarrrmmmmm",textarr[index-m]);

              var tenthArray =
                percentPossibiliy[k] && percentPossibiliy[k].split(" ");
              // //console.log("tentharraaaayyy",tenthArray);

              for (var j = 0; j < (tenthArray && tenthArray.length); j++) {
                if (tenthArray[j] && tenthArray[j].search("%") != -1) {
                  tenthPercentage = parseFloat(
                    tenthArray[j] &&
                    tenthArray[j].replace('"', "").replace("%", "")
                  );
                  // //console.log("tenthPercentageee",tenthPercentage);

                  break;
                }
              }
              break;
            }
          }
        }
      }
    }
  }
  // //console.log("lllllllllllllllllllllll",twelfthPercentage,tenthPercentage);

  if (!twelfthPercentage) {
    // //console.log("aaaaaaaaaaaa=====>>>>>");
    var obj = percentageFromWords(textarr);
    twelfthPercentage = obj && obj.twelfthPercentage;
  }
  if (!tenthPercentage) {
    // //console.log("aaaaaaaaaaaa=====>>>>>");
    var obj = percentageFromWords(textarr);
    tenthPercentage = obj && obj.tenthPercentage;
  }
  if (!highestDegreePercentage) {
    // //console.log("aaaaaaaaaaaa=====>>>>>");
    var obj = percentageFromWords(textarr);
    highestDegreePercentage = obj && obj.highestDegreePercentage;
  }

  return {
    highestDegreePercentage: highestDegreePercentage,
    twelfthPercentage: twelfthPercentage,
    tenthPercentage: tenthPercentage,
  };
}

function rerunRanking(req, res) {
  var body = req && req.body;
  var obj = {
    type: "getExperienceMasterData",
    createdby: body.createdby,
    isactive: body.isactive,
    requisitionid: body && body.id,
  };
  obj = JSON.stringify(obj);
  //console.log("objjjjjjj", obj);
  uploadModel.mysqlModelService(
    proc.mstconfigview,
    [obj],
    function (err, results) {
      if (err) {
      } else {
        var mastersFromDb;
        mastersFromDb = results;
      }
      //console.log("mastersFromDbbbbbbbbbbb", mastersFromDb);

      var obj = {
        action: "getCandidatesInfo",
        requisitionid: body && body.id,
      };
      obj = JSON.stringify(obj);
      //console.log("objecttttttt", obj);
      uploadModel.mysqlModelService(
        proc.rmsparseroperation,
        [obj],
        function (err, results) {
          if (err) {
            //console.log("errroooorrrmmmsssss", err);
          } else {
            var candidates = results;
            //console.log("candidatessssssss", candidates[0][0]);

            var collegeTier;
            var collegeNameFromDb = mastersFromDb[0];
            var tierOneCode, tierTwoCode, tierThreeCode;
            //console.log("collegeNameFromDbeeeeeeeee", collegeNameFromDb);
            for (
              let k = 0;
              k < (collegeNameFromDb && collegeNameFromDb.length);
              k++
            ) {
              if (
                (collegeNameFromDb && collegeNameFromDb[k].configcode) ==
                "rmsInstitute"
              ) {
                //code to get tier1 tier2 and tier 3 codes starts here
                if (
                  (collegeNameFromDb && collegeNameFromDb[k].configvalue1) ==
                  "Tier 1"
                ) {
                  tierOneCode = collegeNameFromDb && collegeNameFromDb[k].id;
                }
                if (
                  (collegeNameFromDb && collegeNameFromDb[k].configvalue1) ==
                  "Tier 2"
                ) {
                  tierTwoCode = collegeNameFromDb && collegeNameFromDb[k].id;
                }
                if (
                  (collegeNameFromDb && collegeNameFromDb[k].configvalue1) ==
                  "Tier 3"
                ) {
                  tierThreeCode = collegeNameFromDb && collegeNameFromDb[k].id;
                }
                //console.log(
                // "codeeeee3eeeee",
                //   tierOneCode,
                //   tierTwoCode,
                //    tierThreeCode
                //  );

                //code to get tier1 tier2 and tier 3 codes ends here
              }
            }

            //college data from our file collegeTier.json

            var dirName = path.join(
              appRoot && appRoot.path,
              "/resumeJsonFiles/ResumeCompare/collegeTier.json"
            );
            collegeData = JSON.parse(fs.readFileSync(dirName));

            for (
              let index = 0;
              index < (candidates && candidates[0] && candidates[0].length);
              index++
            ) {
              var candidateInfo = candidates[0][index];

              //code to get tier of edited college
              //id in institutes is matched with rmsInstitutes master
              //configvalue1 is fetched
              //matched from our colleTier.json tier is alloted
              //real code of collegeTier is recieved

              //console.log("bodyinstitutsessss", body.institutes);

              for (
                let m = 0;
                m < (collegeNameFromDb && collegeNameFromDb.length);
                m++
              ) {
                if (
                  (collegeNameFromDb && collegeNameFromDb[m].configcode) ==
                  "rmsInstitute"
                ) {
                  //console.log(
                  //   "bbbbbbbbbbbbbbbtttttttttt",
                  //     candidateInfo.institutes
                  //   );

                  if (
                    (collegeNameFromDb && collegeNameFromDb[m].id) ==
                    (candidateInfo && candidateInfo.institutes)
                  ) {
                    //console.log(
                    // "idddddddddddddd",
                    //   collegeNameFromDb[m].id,
                    //   candidateInfo.institutes
                    //             );

                    if (
                      (collegeNameFromDb &&
                        collegeNameFromDb[m].configvalue1 != "Tier 1") ||
                      (collegeNameFromDb &&
                        collegeNameFromDb[m].configvalue1 != "Tier 2") ||
                      (collegeNameFromDb &&
                        collegeNameFromDb[m].configvalue1 != "Tier 3")
                    ) {
                      var editedCollegeName =
                        collegeNameFromDb && collegeNameFromDb[m].configvalue1;
                      //console.log("colleeeeeeeheeeeedaaa", editedCollegeName);

                      for (
                        let i = 0;
                        i < (collegeData && collegeData.length);
                        i++
                      ) {
                        // //console.log("colleeeeeeeheeeeedaaa",collegeData[i]);

                        if (
                          (collegeData && collegeData[i].Name.toLowerCase()) ==
                          (editedCollegeName && editedCollegeName.toLowerCase())
                        ) {
                          //console.log(
                          // "collegeTiercollegeTier",
                          //   collegeData[i].Name,
                          //   collegeData[i].Tier
                          //                   );

                          collegeTier = collegeData[i].Tier;
                          break;
                        }
                      }
                      //console.log("clgtierrrrrrr", collegeTier);
                    }
                  }
                  if (collegeTier == "Tier 1") {
                    candidateInfo.institutes = tierOneCode;
                  } else if (collegeTier == "Tier 2") {
                    candidateInfo.institutes = tierTwoCode;
                  }
                }
              }
              //console.log("dsbcjdbc", candidateInfo.institutes);

              //code for edited college ends here

              var rankingParameters = getCandidateRanking(
                candidateInfo,
                mastersFromDb
              );
              //console.log("rankingParameterssssssssseeee", rankingParameters);
              var object = {
                action: "updateCandidate",
              };
              object.ranking = rankingParameters.ranking || 0;
              object.tenthScore = rankingParameters.tenthScore || 0;
              object.twelfthScore = rankingParameters.twelfthScore || 0;
              object.highestDegreeScore =
                rankingParameters.highestDegreeScore || 0;
              object.yearsWithCompanyScore =
                rankingParameters.yearsWithCompanyScore || 0;
              object.collegeTierScore = rankingParameters.collegeTierScore || 0;
              object.experienceScore = rankingParameters.experienceScore || 0;
              object.skillsScore = rankingParameters.skillsScore || 0;
              object.ctcExpectationScore =
                rankingParameters.ctcExpectationScore || 0;
              object.candidateId = candidates[0][index].id || 0;
              object.requisitionid = body.id || 0;
              object = JSON.stringify(object);
              //console.log("objehhhhhhhhhcdsdsdssddstttttt", object);
              uploadModel.mysqlModelService(
                proc.rmsparseroperation,
                [object],
                function (err, results) {
                  //console.log(
                  //"ashashdjhadsddddffdfddfdfdsdsdsdsjhjashasd",
                  //   err,
                  //   results
                  // );
                  if (err) {
                    //console.log("errrroorrrrrrrrrrr", err);
                  } else {
                    // res.ok({message: 'success', result: results});
                    //console.log("ndndnfmfkfmjfkmjfkfk", results);
                  }
                }
              );
            }
          }
        }
      );
    }
  );

  res.json({
    message: "Ranking is being calculated. Please check after a while !",
    data: [],
    state: 1,
  });
}

/*---------------------------------------------------------------------------------------------------*
 *                                        Get Parsed Data                                            *
 *---------------------------------------------------------------------------------------------------*/

function getParsedData(req, res, next) {
  //step1: validation of data sent from frontend
  if (!req) {
    return res.json({
      state: -1,
      message: "No request Data from backend",
    });
  } else {
    //step2:If all the Entry was correct set data that will be sent to Database
    var data = JSON.stringify({
      createdby: req.body.createdby,
      id: req.body.id,
      type: req.body.type,
    });

    //step3:Call the procedure to Get Data Back from database
    //console.log("ajjjjj", data);
    uploadModel.mysqlModelService(
      proc.uploadview,
      [data],
      function (err, result) {
        //proc.uploadoperations
        if (err) {
          return res.json({ state: -1, message: err });
        } else {
          if (!result[0] || !result[1] || !result[2]) {
            return res.json({ state: -1, err: "result not found" });
          }
          var rmsupload = result[0];
          var mstemp = result[1];
          mstemp.sort((a, b) => {
            return a.userid - b.userid;
          });

          //Adding New column 'referredby' in rmstempcandidate data
          for (var i = 0; i < rmsupload.length; i++) {
            var referredby = rmsupload[i].referredbyid;
            if (referredby) {
              var index = binarySearch(mstemp, referredby);

              if (index > -1 && rmsupload[i].isactive) {
                result[0][i].referredby =
                  mstemp[index].firstname +
                  " " +
                  mstemp[index].lastname +
                  "(" +
                  mstemp[index].ecode +
                  ")";
              }
            }
          }
          data = common.lazyLoading(result[0], req.body);
          if (data && "count" in data && "data" in data) {
            result[2][0].totalcount = data.count;
            return res.json({
              state: 1,
              message: "success",
              data: data.data,
              referrelCount: result[2],
            });
          } else {
            return res.json({ state: -1, message: "No Lazy Data" });
          }
        }
      }
    );
  }
}

const binarySearch = function (mstemp, key) {
  var start = 0,
    last = mstemp.length - 1;
  while (start <= last) {
    var mid = Math.floor((start + last) / 2);
    if (mstemp[mid].userid === key) return mid;
    else if (mstemp[mid].userid < key) start = mid + 1;
    else last = mid - 1;
  }
  return -1;
};

/*-------------------------------------End Get Parsed Data-----------------------------------*/

/*---------------------------------------------------------------------------------------------------*
 *                                         Delete candidate                                           *
 *----------------------------------------------------------------------------------------------------*/

function deleteTemporaryCandidate(req, res) {
  var body = req.body;
  body.dmltype = "D";
  body.reqtype = "edit";
  var data = JSON.stringify(body);

  uploadModel.mysqlModelService(
    proc.tempoperation,
    [data],
    function (err, result) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
        });
      } else {
        // //console.log("Data from dataBase", result);
        res.json({ state: 1, message: "success", result: result });
      }
    }
  );
}

/*----------------------------------------End delete candidate -------------------------------------*/

/*---------------------------------------------------------------------------------------------------*
 *                                          Add candidate                                             *
 *----------------------------------------------------------------------------------------------------*/

function addCandidate(req, res) {
  var body = req.body;
  body.reqtype = "add";
  var data = JSON.stringify(body);

  uploadModel.mysqlModelService(
    proc.candidateoperations,
    [data],
    function (err, result) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
        });
      }
      //console.log("Data from dataBase", result);
      result.pop(); //remove Detail about last executed query
      let responseData = result.pop();
      let deletedId = result.pop().deleted_id;
      //Remove temp candidate record from redis
      if (deletedId) {
        deletedId = deletedId.split(",");
        for (let i = 0; i < deletedId.length; i++) {
          rdb.deleteCandidate("candidates", deletedId[i]);
        }
        //Insert candidate record in to redis
        for (let i = 0; i < result.length; i++) {
          rdb.setCandidate(
            "candidates",
            `candidate_${result[i][0].id}`,
            JSON.stringify(result[i][0])
          );
        }
      }
      res.json({ state: 1, message: "success", result: [responseData] });
    }
  );
}

/*----------------------------------------End Add candidate -------------------------------------*/

function editTemporaryRecord(req, res) {
  var body = req && req.body;

  if (body.requisitionid) {
    var obj = {
      type: "getExperienceMasterData",
      isactive: 1,
      requisitionid: body && body.requisitionid,
      createdby: body.tokenFetchedData.id,
    };

    obj = JSON.stringify(obj);
    uploadModel.mysqlModelService(
      "call usp_mstconfig_view(?)",
      [obj],
      function (err, results) {
        if (err) {
          return res.json({
            state: -1,
            message: err,
          });
        } else {
          var experienceFromDb;
          experienceFromDb = results;

          var rankingParameters = getCandidateRanking(body, experienceFromDb);

          body.skills = body.skills ? body.skills.toString() : "";
          body.qualification = body.qualification
            ? body.qualification.toString()
            : "";
          body.dmltype = req.body.id ? "U" : undefined;
          body.ranking = rankingParameters.ranking || 0;
          body.tenthScore = rankingParameters.tenthScore || 0;
          body.twelfthScore = rankingParameters.twelfthScore || 0;
          body.highestDegreeScore = rankingParameters.highestDegreeScore || 0;
          body.yearsWithCompanyScore =
            rankingParameters.yearsWithCompanyScore || 0;
          body.collegeTierScore = rankingParameters.collegeTierScore || 0;
          body.experienceScore = rankingParameters.experienceScore || 0;
          body.skillsScore = rankingParameters.skillsScore || 0;
          body.ctcExpectationScore = rankingParameters.ctcExpectationScore || 0;
          body.uploadstatus = rankingParameters.uploadstatus;
          body.uploadreason = rankingParameters.uploadreason;

          var data = req.body.id ? body : [body];
          data.reqtype = req.body.id ? "edit" : "add";
          var obj = JSON.stringify(data);
          var call = req.body.id
            ? "call usp_rmstempcandidate_edit(?)"
            : "call usp_rmstempcandidate_add(?)";

          uploadModel
            .mysqlPromiseModelService(call, [obj])
            .then((results) => {
              return res.json({ state: 1, msg: "success", data: results });
            })
            .catch((err) => {
              return res.json({ state: -1, message: err });
            });
        }
      }
    );
  } else {
    body.skills = body.skills ? body.skills.toString() : "";
    body.qualification = body.qualification
      ? body.qualification.toString()
      : "";
    body.dmltype = req.body.id ? "U" : undefined;
    var data = req.body.id ? body : [body];
    data.reqtype = req.body.id ? "edit" : "add";
    var obj = JSON.stringify(data);
    var call = req.body.id
      ? "call usp_rmstempcandidate_edit(?)"
      : "call usp_rmstempcandidate_add(?)";
    //console.log("calllllllllllll", call, req.body.id, obj);

    uploadModel
      .mysqlPromiseModelService(call, [obj])
      .then((results) => {
        return res.json({ state: 1, msg: "success", data: results });
      })
      .catch((err) => {
        return res.json({ state: -1, message: err });
      });
  }
}

/*-------------------------------------End Edit Candidate Record-----------------------------------*/

/*-------------------------------------getCandidateRanking Starts----------------------------------------- */

function getCandidateRanking(factors, results) {
  ////console.log("factors", factors);
  ////console.log("results", results);
  var masterResult = results && results[0];
  var requisitionResult = results && results[1];
  var tenthScore;
  var twelfthScore;
  var highestDegreeScore;
  var years = factors && factors.years;
  var months = factors && factors.months;
  var experience = parseFloat(years || 0 + "." + months || 0);
  var numberOfCompanyChanged = parseFloat(factors && factors.noofcompanyworked);
  var avgExperience = (experience && experience / numberOfCompanyChanged) || 0;
  var ranking;
  var tenthPercentage = (factors && factors.tenthPercentage) || 0;
  var twelfthPercentage = (factors && factors.twelfthPercentage) || 0;
  var tierCode = factors && factors.institutes;
  var skills = factors && factors.skilltext + "," + factors.skillsName;
  var ctcExpectations = (factors && factors.expectedsalary) || 0;
  var highestDegreePercentage =
    (factors && factors.highestDegreePercentage) || 0;
  var rankingParameters = {};
  //code to get tierCode of different tier college from rmsInstitute
  var tierOneCode, tierTwoCode, tierThreeCode;
  //console.log("masterResulttttt", masterResult);

  for (let index = 0; index < masterResult.length; index++) {
    if (
      (masterResult[index] && masterResult[index].configcode) == "rmsInstitute"
    ) {
      if (
        (masterResult[index] && masterResult[index].configvalue1) == "Tier 1"
      ) {
        tierOneCode = masterResult[index] && masterResult[index].id;
      }
      if (
        (masterResult[index] && masterResult[index].configvalue1) == "Tier 2"
      ) {
        tierTwoCode = masterResult[index] && masterResult[index].id;
      }
      if (
        (masterResult[index] && masterResult[index].configvalue1) == "Tier 3"
      ) {
        tierThreeCode = masterResult[index] && masterResult[index].id;
      }
    }
  }
  //console.log("twelfthPercentage", twelfthPercentage);
  //console.log("tierCode", tierCode);
  //console.log("highestDegreePercentage", highestDegreePercentage);
  //console.log("years", years);
  //console.log("months", months);
  //console.log("skills", skills);
  //console.log("ctcExpectations", ctcExpectations);
  if (requisitionResult && requisitionResult.length) {
    if (factors && factors.readytorelocate && factors.readytorelocate != 1) {
      rankingParameters.ranking = 0.5;
      return rankingParameters;
    } else {
      for (
        let index = 0;
        index < (masterResult && masterResult.length);
        index++
      ) {
        if (masterResult[index].configcode == "percentage") {
          //score from 10th percentage
          if (
            masterResult[index] &&
            masterResult[index].configvalue1 == "10th"
          ) {
            let tenthLowerLimit =
              masterResult[index] && masterResult[index].configvalue2;
            let tenthUpperLimit =
              masterResult[index] && masterResult[index].configvalue3;
            if (!tenthPercentage) {
              tenthScore = 50;
            } else {
              tenthScore =
                ((tenthPercentage - tenthLowerLimit) /
                  (tenthUpperLimit - tenthLowerLimit)) *
                100;
              if (tenthScore < 0) {
                tenthScore = 0;
              } else if (tenthScore > 100) {
                tenthScore = 100;
              }
            }
            //console.log(
            //  "tttttttttttttttttsssssssssssss",
            //    tenthLowerLimit,
            //    tenthUpperLimit,
            //    tenthPercentage,
            //    tenthScore
            //  );
          }
          rankingParameters.tenthScore = tenthScore && tenthScore.toFixed(2);

          //score from 12th percentage
          if (
            masterResult[index] &&
            masterResult[index].configvalue1 == "12th"
          ) {
            let twelfthLowerLimit =
              masterResult[index] && masterResult[index].configvalue2;
            let twelfthUpperLimit =
              masterResult[index] && masterResult[index].configvalue3;
            if (!twelfthPercentage) {
              twelfthScore = 50;
            } else {
              twelfthScore =
                ((twelfthPercentage - twelfthLowerLimit) /
                  (twelfthUpperLimit - twelfthLowerLimit)) *
                100;
              if (twelfthScore < 0) {
                twelfthScore = 0;
              } else if (twelfthScore > 100) {
                twelfthScore = 100;
              }
            }
          }
          rankingParameters.twelfthScore =
            twelfthScore && twelfthScore.toFixed(2);

          //score from graduation or masters other tier
          if (
            masterResult[index] &&
            masterResult[index].configvalue1 == "highestDegreeOthers" &&
            tierCode == tierThreeCode
          ) {
            let graduationThreeTierLowerLimit =
              masterResult[index] && masterResult[index].configvalue2;
            let graduationThreeTierUpperLimit =
              masterResult[index] && masterResult[index].configvalue3;
            if (!highestDegreePercentage) {
              highestDegreeScore = 50;
            } else {
              highestDegreeScore =
                ((highestDegreePercentage / 1.5 -
                  graduationThreeTierLowerLimit) /
                  (graduationThreeTierUpperLimit -
                    graduationThreeTierLowerLimit)) *
                100;
              if (highestDegreeScore < 0) {
                highestDegreeScore = 0;
              } else if (highestDegreeScore > 100) {
                highestDegreeScore = 100;
              }
              //console.log("00000000000000");
            }
          }
          //score from graduation or masters tier 1 and tier 2
          if (
            masterResult[index] &&
            masterResult[index].configvalue1 ==
            "Highest Degree(Tier 1 & Tier 2)" &&
            tierCode != tierThreeCode
          ) {
            let graduationOneTwoTierLowerLimit =
              masterResult[index] && masterResult[index].configvalue2;
            let graduationOneTwoTierUpperLimit =
              masterResult[index] && masterResult[index].configvalue3;
            if (!highestDegreePercentage) {
              highestDegreeScore = 50;
            } else {
              highestDegreeScore =
                ((highestDegreePercentage - graduationOneTwoTierLowerLimit) /
                  (graduationOneTwoTierUpperLimit -
                    graduationOneTwoTierLowerLimit)) *
                100;
              if (highestDegreeScore < 0) {
                highestDegreeScore = 0;
              } else if (highestDegreeScore > 100) {
                highestDegreeScore = 100;
              }
              //console.log("999999999999");
            }
          }
          rankingParameters.highestDegreeScore =
            highestDegreeScore && highestDegreeScore.toFixed(2);
          //score from avg. years with company
          if (
            masterResult[index] &&
            masterResult[index].configvalue1 == "Average years with company"
          ) {
            var experienceLowerLimit =
              masterResult[index] && masterResult[index].configvalue2;
            var experienceUpperLimit =
              masterResult[index] && masterResult[index].configvalue3;
            // //console.log("experienceLowerLimit",experienceLowerLimit,experienceUpperLimit);

            var yearsWithCompanyScore =
              ((avgExperience - experienceLowerLimit) /
                (experienceUpperLimit - experienceLowerLimit)) *
              100 || 50;
            if (yearsWithCompanyScore < 0) {
              yearsWithCompanyScore = 0;
            } else if (yearsWithCompanyScore > 100) {
              yearsWithCompanyScore = 100;
            }
          }
          rankingParameters.yearsWithCompanyScore =
            yearsWithCompanyScore && yearsWithCompanyScore.toFixed(2);
          // //console.log("yearsWithCompanyScoreeeee",yearsWithCompanyScore);
        }
      }

      // score from college tier
      var collegeTierScore;
      if (tierCode == tierOneCode) {
        collegeTierScore = 100;
      } else if (tierCode == tierTwoCode) {
        collegeTierScore = 75;
      } else {
        collegeTierScore = 40;
      }
      // //console.log("collegeTierScoreeeeeee",collegeTierScore);
      rankingParameters.collegeTierScore = collegeTierScore;

      // score of Experience
      var experienceScore;
      var j = requisitionResult[0] && requisitionResult[0].minexperience;
      var k = requisitionResult[0] && requisitionResult[0].maxexperience;

      // //console.log("eeeeeeeeeeeeeeeeee",experience,"j=",j,"k=",k);

      if (experience >= j && experience <= k) {
        experienceScore = 100;
      } else if (experience < j) {
        var roundDown = Math.floor(experience);
        var minBy = roundDown - j;
        //console.log("minBy", minBy);

        for (
          let index = 0;
          index < (masterResult && masterResult.length);
          index++
        ) {
          if (
            (masterResult[index] && masterResult[index].configcode) ==
            "experience"
          ) {
            if (
              minBy == masterResult[index] &&
              masterResult[index].configvalue1
            ) {
              experienceScore =
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 50;
              break;
            } else if (
              minBy > masterResult[index] &&
              minBy < (masterResult[index] && masterResult[index + 1])
            ) {
              experienceScore =
                parseFloat(
                  masterResult[index + 1] &&
                  masterResult[index + 1].configvalue2
                ) || 50;
              break;
            }
          }
        }
      } else if (experience > k) {
        var roundUp = Math.ceil(experience);
        var maxBy = roundUp - k;
        //console.log("maxBy", maxBy);

        for (
          let index = 0;
          index < (masterResult && masterResult.length);
          index++
        ) {
          if (
            (masterResult[index] && masterResult[index].configcode) ==
            "experience"
          ) {
            // //console.log("tttttttttttpppppppp",masterResult[index] && masterResult[index].configvalue1);

            if (
              maxBy == (masterResult[index] && masterResult[index].configvalue1)
            ) {
              experienceScore =
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 50;
              // //console.log("dkdfgjfb",experienceScore);

              break;
            } else if (
              maxBy > masterResult[index] &&
              maxBy < masterResult[index + 1]
            ) {
              experienceScore =
                parseFloat(
                  masterResult[index + 1] &&
                  masterResult[index + 1].configvalue2
                ) || 50;
              // //console.log("dfdgfgewer",experienceScore);

              break;
            }
          }
        }
      }
      rankingParameters.experienceScore =
        experienceScore && experienceScore.toFixed(2);

      // score of skills

      var requiredSkills =
        requisitionResult[0] && requisitionResult[0].skillsName;
      requiredSkills = requiredSkills && requiredSkills.split(",");
      var skills = skills && [...new Set(skills && skills.split(","))].join();
      skills = skills && skills.split(",");
      // //console.log("candidateskillllsssss",skills);
      // //console.log("requiredskilsssssss",requiredSkills);

      var count = 0;
      for (let i = 0; i < (skills && skills.length); i++) {
        for (
          let index = 0;
          index < (requiredSkills && requiredSkills.length);
          index++
        ) {
          if (
            (skills[i] && skills[i].toLowerCase()) ==
            (requiredSkills[index] && requiredSkills[index].toLowerCase())
          ) {
            count++;
            break;
          }
        }
      }
      // //console.log("counttttttntntntnt",count,"reewwqqwqwww",requiredSkills && requiredSkills.length);

      var skillsScore =
        (count / (requiredSkills && requiredSkills.length)) * 100;
      rankingParameters.skillsScore = skillsScore && skillsScore.toFixed(2);

      // ctc expectation score

      var ctcExpectationScore;
      var j = requisitionResult[0] && requisitionResult[0].minimumsalary;
      var k = requisitionResult[0] && requisitionResult[0].maximumsalary;

      if (ctcExpectations >= j && ctcExpectations <= k) {
        ctcExpectationScore = 100;
      } else if (ctcExpectations < j) {
        var roundDown = Math.floor(ctcExpectations);
        var minBy = roundDown - j;
        //console.log("minBy", minBy);
        for (
          let index = 0;
          index < (masterResult && masterResult.length);
          index++
        ) {
          if (
            (masterResult[index] && masterResult[index].configcode) ==
            "ctcExpectation"
          ) {
            if (
              minBy == (masterResult[index] && masterResult[index].configvalue1)
            ) {
              ctcExpectationScore =
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 50;
              break;
            } else if (
              minBy > (masterResult[index] && minBy < results[index + 1])
            ) {
              ctcExpectationScore =
                parseFloat(
                  masterResult[index + 1] &&
                  masterResult[index + 1].configvalue2
                ) || 50;
              break;
            }
          }
        }
      } else if (ctcExpectations > k) {
        var roundUp = Math.ceil(ctcExpectations);
        var maxBy = roundUp - k;
        //console.log("maxBy", maxBy);
        for (
          let index = 0;
          index < (masterResult && masterResult.length);
          index++
        ) {
          if (
            (masterResult[index] && masterResult[index].configcode) ==
            "ctcExpectation"
          ) {
            if (
              maxBy == (masterResult[index] && masterResult[index].configvalue1)
            ) {
              ctcExpectationScore =
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 50;
              break;
            } else if (
              maxBy > masterResult[index] &&
              maxBy < (masterResult[index] && masterResult[index + 1])
            ) {
              ctcExpectationScore =
                parseFloat(
                  masterResult[index + 1] &&
                  masterResult[index + 1].configvalue2
                ) || 50;
              break;
            }
          }
        }
      }
      if (!ctcExpectationScore) {
        ctcExpectationScore = 50;
      }
      rankingParameters.ctcExpectationScore =
        ctcExpectationScore && ctcExpectationScore.toFixed(2);

      // lateral final score
      var finalScore = [];
      var weightage = [];
      if (experience == 0) {
        for (
          let index = 0;
          index < (masterResult && masterResult.length);
          index++
        ) {
          //console.log("lllllllll", masterResult[index].configvalue1);

          if (
            masterResult[index] &&
            masterResult[index].configcode == "fresher"
          ) {
            //console.log("fresherRanking...");

            if (
              masterResult[index] &&
              masterResult[index].configvalue1 == "10th"
            ) {
              finalScore.push(
                tenthScore *
                parseFloat(
                  (masterResult[index] && masterResult[index].configvalue2) ||
                  0
                )
              );
              weightage.push(
                parseFloat(
                  (masterResult[index] && masterResult[index].configvalue2) || 0
                )
              );
              // rankingParameters.tenthScore = parseFloat(tenthScore * parseFloat(masterResult[index] && masterResult[index].configvalue2) || 0).toFixed(2) ;
              //console.log(
              //  "fffffffffscore1",
              //   tenthScore *
              //   parseFloat(
              //     masterResult[index] && masterResult[index].configvalue2
              //   ) || 0
              //  );
            }
            if (
              masterResult[index] &&
              masterResult[index].configvalue1 == "12th"
            ) {
              finalScore.push(
                twelfthScore *
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              weightage.push(
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              //console.log(
              // "fffffffffscore2",
              //   twelfthScore *
              //   parseFloat(
              //     masterResult[index] && masterResult[index].configvalue2
              //   ) || 0
              //  );
              // rankingParameters.twelfthScore = parseFloat(twelfthScore * parseFloat(masterResult[index] && masterResult[index].configvalue2) || 0).toFixed(2) ;
            }
            if (
              masterResult[index] &&
              masterResult[index].configvalue1 == "College Tier"
            ) {
              finalScore.push(
                collegeTierScore *
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              weightage.push(
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              //console.log(
              // "fffffffffscore3",
              //   collegeTierScore *
              //   parseFloat(
              //     masterResult[index] && masterResult[index].configvalue2
              //   ) || 0
              // );
              // rankingParameters.collegeTierScore = parseFloat(collegeTierScore * parseFloat(masterResult[index] && masterResult[index].configvalue2) || 0).toFixed(2) ;
            }
            if (
              masterResult[index] &&
              masterResult[index].configvalue1 == "Graduation Marks"
            ) {
              finalScore.push(
                highestDegreeScore *
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              weightage.push(
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              //console.log(
              // "fffffffffscore4",
              //   highestDegreeScore *
              //   parseFloat(
              //     masterResult[index] && masterResult[index].configvalue2
              //   ) || 0
              //  );
              // rankingParameters.highestDegreeScore = parseFloat(highestDegreeScore * parseFloat(masterResult[index] && masterResult[index].configvalue2) || 0).toFixed(2) ;
            }
            if (
              masterResult[index] &&
              masterResult[index].configvalue1 == "Avg. years with the company"
            ) {
              finalScore.push(
                yearsWithCompanyScore *
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              weightage.push(
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              //console.log(
              // "fffffffffscore5",
              //  yearsWithCompanyScore *
              //  parseFloat(
              //    masterResult[index] && masterResult[index].configvalue2
              //  ) || 0
              //);
              // rankingParameters.yearsWithCompanyScore = parseFloat(yearsWithCompanyScore * parseFloat(masterResult[index] && masterResult[index].configvalue2) || 0).toFixed(2) ;
            }
            if (
              masterResult[index] &&
              masterResult[index].configvalue1 == "Experience in years"
            ) {
              finalScore.push(
                experienceScore *
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              weightage.push(
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              //console.log(
              // "fffffffffscore6",
              //    experienceScore *
              //   parseFloat(
              //     masterResult[index] && masterResult[index].configvalue2
              //   ) || 0
              //  );
              // rankingParameters.experienceScore = parseFloat(experienceScore * parseFloat(masterResult[index] && masterResult[index].configvalue2) || 0).toFixed(2) ;
            }
            if (
              masterResult[index] &&
              masterResult[index].configvalue1 == "Skills"
            ) {
              finalScore.push(
                skillsScore *
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              weightage.push(
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              //console.log(
              //  "fffffffffscore7",
              //    skillsScore *
              //    parseFloat(
              //      masterResult[index] && masterResult[index].configvalue2
              //   ) || 0
              //  );
              // rankingParameters.skillsScore = parseFloat(skillsScore * parseFloat(masterResult[index] && masterResult[index].configvalue2) || 0).toFixed(2) ;
            }
            if (
              masterResult[index] &&
              masterResult[index].configvalue1 == "CTC Expectations"
            ) {
              finalScore.push(
                ctcExpectationScore *
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              weightage.push(
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              //console.log(
              //  "fffffffffscore8",
              //    ctcExpectationScore *
              //    parseFloat(
              //      masterResult[index] && masterResult[index].configvalue2
              //    ) || 0
              //  );
              // rankingParameters.ctcExpectationScore = parseFloat(ctcExpectationScore * parseFloat(masterResult[index] && masterResult[index].configvalue2) || 0).toFixed(2) ;
            }
          }
        }
      } else if (experience != 0) {
        for (
          let index = 0;
          index < (masterResult && masterResult.length);
          index++
        ) {
          //console.log(
          //  "masterresukttttttt",
          //    masterResult[index] && masterResult[index],
          //    masterResult[index] && masterResult[index].configcode
          //  );

          ////console.log("mmmmmmmmmmmmmmmmmmm", masterResult[index] && masterResult[index].configvalue1);

          if (
            masterResult[index] &&
            masterResult[index].configcode == "lateral"
          ) {
            if (
              masterResult[index] &&
              masterResult[index].configvalue1 == "10th"
            ) {
              finalScore.push(
                tenthScore *
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              weightage.push(
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              // rankingParameters.tenthScore = parseFloat(tenthScore * parseFloat(masterResult[index] && masterResult[index].configvalue2) || 0).toFixed(2);
              //console.log(
              //  "fffffffffscore1",
              //   tenthScore *
              //   parseFloat(
              //     masterResult[index] && masterResult[index].configvalue2
              //    ) || 0
              //  );
            }
            if (
              masterResult[index] &&
              masterResult[index].configvalue1 == "12th"
            ) {
              finalScore.push(
                twelfthScore *
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              weightage.push(
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              //console.log(
              //  "fffffffffscore2",
              //    twelfthScore *
              //    parseFloat(
              //      masterResult[index] && masterResult[index].configvalue2
              //    ) || 0
              //  );
              // rankingParameters.twelfthScore = parseFloat(twelfthScore * parseFloat(masterResult[index] && masterResult[index].configvalue2) || 0).toFixed(2);
            }
            if (
              masterResult[index] &&
              masterResult[index].configvalue1 == "College Tier"
            ) {
              finalScore.push(
                collegeTierScore *
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              weightage.push(
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              //console.log(
              // "fffffffffscore3",
              //   collegeTierScore *
              //   parseFloat(
              //     masterResult[index] && masterResult[index].configvalue2
              //   ) || 0
              // );
              // rankingParameters.collegeTierScore = parseFloat(collegeTierScore * parseFloat(masterResult[index] && masterResult[index].configvalue2) || 0).toFixed(2);
            }
            if (
              masterResult[index] &&
              masterResult[index].configvalue1 == "Graduation Marks"
            ) {
              finalScore.push(
                highestDegreeScore *
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              weightage.push(
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              //console.log(
              // "fffffffffscore4",
              //   highestDegreeScore *
              //   parseFloat(
              //     masterResult[index] && masterResult[index].configvalue2
              //    ) || 0
              //  );
              // rankingParameters.highestDegreeScore = parseFloat(highestDegreeScore * parseFloat(masterResult[index] && masterResult[index].configvalue2) || 0).toFixed(2);
            }
            if (
              masterResult[index] &&
              masterResult[index].configvalue1 == "Avg. years with the company"
            ) {
              finalScore.push(
                yearsWithCompanyScore *
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              weightage.push(
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              //console.log(
              // "fffffffffscore5",
              //   yearsWithCompanyScore *
              //   parseFloat(
              //     masterResult[index] && masterResult[index].configvalue2
              //   ) || 0
              // );
              // rankingParameters.yearsWithCompanyScore = parseFloat(yearsWithCompanyScore * parseFloat(masterResult[index] && masterResult[index].configvalue2) || 0).toFixed(2);
            }
            if (
              masterResult[index] &&
              masterResult[index].configvalue1 == "Experience in years"
            ) {
              finalScore.push(
                experienceScore *
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              weightage.push(
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              //console.log(
              //  "fffffffffscore6",
              //    experienceScore *
              //    parseFloat(
              //      masterResult[index] && masterResult[index].configvalue2
              //    ) || 0
              //  );
              // rankingParameters.experienceScore = parseFloat(experienceScore * parseFloat(masterResult[index] && masterResult[index].configvalue2) || 0).toFixed(2);
              // //console.log("rankingParameters.experienceScore",rankingParameters.experienceScore);
            }
            if (
              masterResult[index] &&
              masterResult[index].configvalue1 == "Skills"
            ) {
              finalScore.push(
                skillsScore *
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              weightage.push(
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              //console.log(
              // "fffffffffscore7",
              //   skillsScore *
              //   parseFloat(
              //     masterResult[index] && masterResult[index].configvalue2
              //   ) || 0
              // );
              // rankingParameters.skillsScore = parseFloat(skillsScore * parseFloat(masterResult[index] && masterResult[index].configvalue2) || 0).toFixed(2);
            }
            if (
              masterResult[index] &&
              masterResult[index].configvalue1 == "CTC Expectations"
            ) {
              finalScore.push(
                ctcExpectationScore *
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              weightage.push(
                parseFloat(
                  masterResult[index] && masterResult[index].configvalue2
                ) || 0
              );
              //console.log(
              // "fffffffffscore8",
              //   ctcExpectationScore *
              //   parseFloat(
              //     masterResult[index] && masterResult[index].configvalue2
              //   ) || 0
              // );
              // rankingParameters.ctcExpectationScore = parseFloat(ctcExpectationScore * parseFloat(masterResult[index] && masterResult[index].configvalue2) || 0).toFixed(2);
            }
          }
        }
      }
      //console.log("finalScore", finalScore);

      var score = finalScore.reduce(function (a, b) {
        return a + b;
      }, 0);
      var totalWeightage = weightage.reduce(function (a, b) {
        return a + b;
      }, 0);
      var netScore = score / totalWeightage;

      //console.log("tenthScore", tenthScore);
      //console.log("twelfthScore", twelfthScore);
      //console.log("highestDegreeScore", highestDegreeScore);
      //console.log("yearsWithCompanyScore", yearsWithCompanyScore);
      //console.log("collegeTierScore", collegeTierScore);
      //console.log("experienceScore", experienceScore);
      //console.log("skillsScore", skillsScore);
      //console.log("ctcExpectationScore", ctcExpectationScore);
      //console.log("score", score);
      //console.log("netScore", netScore);

      for (
        let index = 0;
        index < (masterResult && masterResult.length);
        index++
      ) {
        if (
          masterResult[index] &&
          masterResult[index].configcode == "ranking"
        ) {
          if (
            masterResult[index] &&
            masterResult[index].configvalue1 <= netScore &&
            masterResult[index] &&
            masterResult[index].configvalue2 > netScore
          ) {
            ranking = masterResult[index] && masterResult[index].configvalue3;
            break;
          }
        }
      }
      rankingParameters.ranking = ranking;
      return rankingParameters;
    }
  } else {
    return 0;
  }
}

function getDuplicateCandidate(req, res) {
  try {
    req.query.createdby = req.body.createdby;
    req.query.action = "duplicate_Record";
    let obj = JSON.stringify(req.query);
    //console.log(obj, "request----------");

    commonModel.mysqlModelService(
      "call usp_rms_resume_duplicacy(?)",
      [obj],
      function (err, results) {
        if (err) {
          return res.json({ state: -1, message: err, data: null });
        }
        //console.log(results, "results------------------------");
        return res.json({
          state: 1,
          message: "Success",
          data: results[0],
        });
      }
    );
  } catch (error) {
    throw error;
  }
}

async function uploadCandidateExcel(req, res) {
  try {
    if (!req.files) throw new Error("File Required!");

    const exl = req.files.file,
      dir = makeDir("uploads/Candidates"),
      uploadPath = path.join(dir, `${Date.now()}_${exl.name}`);
    await exl.mv(uploadPath);

    let workbook = xlsx.readFile(uploadPath, {
      cellDates: true,
      cellNF: false,
      cellText: false,
    });
    let sheet_name_list = workbook.SheetNames;
    let records = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

    if (records && records.length > 0) {
      records.forEach((element) => {
        element.filepath = "NA";
        element.filename = "NA";
        element.uploadstatus = "success";
        element.skillsText = element.skills;
        element.skilltext = element.skills;
        element.resumeContent = `${element.candidatename}  ${element.email}  ${element.phone}  ${element.headline}  ${element.summary}   ${element.skills}  ${element.institituteName}   ${element.qualification} Experience ${element.years} years ${element.months} months`;
        element.gender = element.gender && element.gender == "Male" ? "M" : "F";
        element.createdby = req.body.createdby || 1;
      });
    }
    //console.log("data", records);
    uploadModel.mysqlModelService(
      "call usp_rmstempcandidate_add_excel(?)",
      [JSON.stringify(records)],
      function (err, results) {
        //console.log(err, results);
        if (err || !results || results.length < 2) {
          return res.json({ message: "failure", state: -1 });
        }
        results.pop();
        let responseData = results.pop();
        for (let i = 0; i < results.length; i++) {
          rdb.setCandidate(
            "candidates",
            results[i][0].id,
            JSON.stringify(results[i][0])
          );
        }
        return res.json({
          message: "success",
          result: [responseData],
          state: 1,
        });
      }
    );
  } catch (e) {
    //console.log("error upload Candidate Excel", e);
    return res.json({ state: -1, message: "Something went wrong" });
  }
}
