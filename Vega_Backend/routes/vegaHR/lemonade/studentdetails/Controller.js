const proc = require("../../../common/procedureConfig");
const commonModel = require("../../../common/Model");
const stringSimilarity = require("string-similarity");
const utils = require("./../../../common/utils");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const mime = require("mime");
const path = require("path");

const query = commonModel.mysqlPromiseModelService;
const errMsg = "You already taken this test!";

module.exports = {
  saveStudentDetails: saveStudentDetails,
  getBatcheMaster: getBatcheMaster,
  getMatchingCandidatedata,
  verifyForSectionWiseTimer,
};

async function saveStudentDetails(req, res) {
  try {
    let newReq = { ...req.body };
    newReq.college = newReq.institute;
    newReq.course = newReq.course && newReq.course.toString();
    newReq.browser_name = req.get("User-Agent");
    newReq.ip_address =
      req.ip ||
      req.ips ||
      req.header("x-forwarded-for") ||
      req.socket.remoteAddress;

    const isAlreadyTestGiven = await checkAlreadyGivenTest({ ...newReq });
    delete newReq.newAction;
    if (+isAlreadyTestGiven === 0) {
      if (newReq.fileblob) {
        const decodeddata = utils.decodeBase64File(newReq.fileblob),
          extension = mime.extension(decodeddata.type),
          mediaName = `${uuidv4()}_${
            newReq.filename ? newReq.filename : "." + extension
          }`,
          dest = utils.makeDirectories("/uploads/lemonade");
        fs.writeFileSync(path.join(dest, mediaName), decodeddata.data);
        newReq.filename = mediaName;
        newReq.filepath = path.join("/lemonade", mediaName);
      }

      newReq = JSON.stringify(newReq);

      const [results] = await query(proc.bachcheckproc, [newReq]);

      if (results && results[0] && results[0].state < 0)
        throw new Error(errMsg);

      return res.json({
        state: 1,
        message: "success",
        data: results,
      });
    } else {
      throw new Error(errMsg);
    }
  } catch (err) {
    const msg = (err && err.message) || err;
    return res.json({
      state: msg === errMsg ? -2 : -1,
      message: msg || "Invalid Request",
      data: null,
    });
  }
}

function getBatcheMaster(req, res) {
  if (req && req.body) {
    var reqData = req.body;
    reqData = JSON.stringify(reqData);
    commonModel.mysqlModelService(
      proc.dashboardproc,
      [reqData],
      function (err, results) {
        if (err) {
          return res.json({
            state: -1,
            message: err,
            data: null,
          });
        } else if (
          results &&
          results[1] &&
          results[1][0] &&
          results[1][0].state == 1
        ) {
          if (JSON.parse(reqData).searchstatus == "1") {
            return res.json({
              state: 11,
              message: "success",
              data: _.where(results[0], { currentstatus: "Active" }),
            });
          } else if (JSON.parse(reqData).searchstatus == "0") {
            return res.json({
              state: 11,
              message: "success",
              data: _.where(results[0], { currentstatus: "Expired" }),
            });
          } else {
            return res.json({
              state: 1,
              message: "success",
              data: results && results[0],
            });
          }
        } else {
          return res.json({
            state: -1,
            message: "Failed",
            data: null,
          });
        }
      }
    );
  } else {
    return res.json({
      state: -1,
      message: "Invalid Request",
      data: null,
    });
  }
}

function getMatchingCandidatedata(req, res) {
  try {
    req.query.createdby = req.body.createdby;
    req.query.action = "find_matching_candidate_data";
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

async function verifyForSectionWiseTimer(req, res) {
  try {
    const newReq = {
      action: "verifyForSectionWiseTimer",
      ...req.body,
      ...req.query,
    };
    await utils.removeFalseyLike(newReq);
    if (!newReq.batchid) throw new Error("Assessment batch is required!");
    const [results] = await query(proc.bachcheckproc, [JSON.stringify(newReq)]);

    if (results && results.state == -1)
      throw new Error((results && results.message) || results);
    else
      return res.json({
        state: 1,
        message: "success",
        data: results,
      });
  } catch (error) {
    return res.json({
      state: -1,
      message: (error && error.message) || error,
      data: null,
    });
  }
}

async function checkAlreadyGivenTest(reqD) {
  try {
    let reqData = { ...reqD };
    delete reqData.fileblob;
    let oldText = reqData.Resume;
    let bestMatch = 0.9;
    reqData.newAction = "find_matching_records";

    reqData = JSON.stringify(reqData);
    const [res, match] = await query(proc.bachcheckproc, [reqData]);
    const already_exists = res && res[0] && res[0].already_exists;
    if (+already_exists === 0) {
      if (match && match.length > 0 && oldText) {
        for (let index = 0, n = match.length; index < n; index++) {
          let data = match[index];
          let compareResult = stringSimilarity.compareTwoStrings(
            oldText,
            data.parsed_resume_json || ""
          );
          if (compareResult > bestMatch) {
            throw new Error(errMsg);
          }
        }
      }
      return already_exists;
    } else {
      throw new Error(errMsg);
    }
  } catch (err) {
    throw new Error((err && err.message) || err);
  }
}
