const proc = require("../common/procedureConfig");
const query = require("../common/Model").mysqlPromiseModelService;
const { validationResult } = require("express-validator");
const utils = require("../common/utils");
const _ = require('lodash');

module.exports = {
  getCaseStudy: getCaseStudy,
  saveCaseStudy: saveCaseStudy,
  isactiveCaseStudy: isactiveCaseStudy,
  getHeader: getHeader,
  saveHeader: saveHeader,
  isactiveHeader: isactiveHeader,
  getStation: getStation,
  saveStation: saveStation,
  isactiveStation: isactiveStation,
  getAssignment: getAssignment,
  saveAssignment: saveAssignment,
  isactiveAssignment: isactiveAssignment,
  getReviewData: getReviewData,
  userSubmit: userSubmit,
  reviewerSubmit: reviewerSubmit,
  getCategory: getCategory,
  getCompetencyLevel: getCompetencyLevel,
  competencyStatusDropdown: competencyStatusDropdown,
  competencyHome: competencyHome,
  viewDetail: viewDetail,
  countStatus: countStatus,
  stationViewDetailsAdmin: stationViewDetailsAdmin,
  userMarkInProgress: userMarkInProgress,
  userViewDetail: userViewDetail,
  afterCompleteStatus: afterCompleteStatus,
};

async function getCaseStudy(req, res) { 
  try {
    let rq = { ...req.body, reqtype: "getCaseStudy" };
    await utils.removeFalseyLike(rq);
    let results = await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Case Study Fetched Successfully", data: results?.[0] });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function saveCaseStudy(req, res) {
  let filename, filepath, filechecker;
  try {
    if (!req.body.title || !req.body.category_id) {
      return res.json({
        state: -1,
        message: "mandatory fields required!"
      })
    }
    filechecker = Object.keys(req.files[0]).length;
    // if (!filechecker && !req.body.oldfilename && !req.body.oldfilepath) {
    //   return res.json({
    //     state: -1,
    //     message: "files required"
    //   })
    // }
    let variable = (await utils.getFileLocation(req.files));
    if (!filechecker && req.body.oldfilename && req.body.oldfilepath) {
      filename = req.body.oldfilename;
      filepath = req.body.oldfilepath;
    }
    if (filechecker && req.body.oldfilename && req.body.oldfilepath) {
      let fname = variable.filename;
      let fpath = variable.filepath;
      filename = req.body.oldfilename+","+fname;
      filepath = req.body.oldfilepath+","+fpath;
    }
    if (filechecker && !req.body.oldfilename && !req.body.oldfilepath) {
      filename = variable.filename;
      filepath = variable.filepath;
    }
    let rq = { ...req.body, filename, filepath, reqtype: "addCaseStudy" };
    await utils.removeFalseyLike(rq);
      await query(proc.competencydevelopmentoperations, [
        JSON.stringify(rq),
      ]);
      return res.json({ state: 1, message: "Operation executed successfully!" });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function isactiveCaseStudy(req, res) { 
  try {
    let rq = { ...req.body, reqtype: "deleteCaseStudy" };
    await utils.removeFalseyLike(rq);
    let results = await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Operation executed Successfully!" });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function getHeader(req, res) {
  try {
    let rq = { ...req.body, reqtype: "getHeader" };
    await utils.removeFalseyLike(rq);
    let results = await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Header Fetched Successfully", data: results?.[0] });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function saveHeader(req, res) { 
  try {
    let rq = { ...req.body, reqtype: "addHeader" };
    await utils.removeFalseyLike(rq);
    await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Operation executed Successfully!" });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function isactiveHeader(req, res) { 
  try {
    let rq = { ...req.body, reqtype: "deleteHeader" };
    await utils.removeFalseyLike(rq);
    let results = await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Operation executed Successfully!" });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function getStation(req, res) {
  try {
    let rq = { ...req.body, reqtype: "getStation" };
    await utils.removeFalseyLike(rq);
    let results = await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Station Fetched Successfully", data: results?.[0] });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function saveStation(req, res) { 
  try {
    let rq = { ...req.body, reqtype: "addStation" };
    await utils.removeFalseyLike(rq);
    await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Operation executed Successfully!" });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function isactiveStation(req, res) { 
  try {
    let rq = { ...req.body, reqtype: "deleteStation" };
    await utils.removeFalseyLike(rq);
    let results = await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Operation executed Successfully!" });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function getAssignment(req, res) {
  try {
    let rq = { ...req.body, reqtype: "getAssignment" };
    await utils.removeFalseyLike(rq);
    let results = await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Fetched Successfully", data: results?.[0] });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function saveAssignment(req, res) { 
  try {
    let rq = { ...req.body, reqtype: "addAssignment" };
    await utils.removeFalseyLike(rq);
    await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Operation executed Successfully!" });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function isactiveAssignment(req, res) { 
  try {
    let rq = { ...req.body, reqtype: "deleteAssignment" };
    await utils.removeFalseyLike(rq);
    let results = await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Operation executed Successfully!" });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function getReviewData(req, res) { 
  try {
    let rq = { ...req.body, reqtype: "getReviewData" };
    await utils.removeFalseyLike(rq);
    const results = await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Operation executed Successfully!", data: results?.[0] });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function userSubmit(req, res) { 
  try {
    let variable = (await utils.getFileLocation(req.files));
    let rq = { ...req.body, filename: variable.filename, filepath: variable.filepath, reqtype: "userSubmit" };
    await utils.removeFalseyLike(rq);
    await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Your submission have been sent for the review!" });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function reviewerSubmit(req, res) { 
  try {
    let rq = { ...req.body, reqtype: "reviewerSubmit" };
    await utils.removeFalseyLike(rq);
    await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Operation executed Successfully!" });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function getCategory(req, res) { 
  try {
    let rq = { ...req.body, reqtype: "getCategory" };
    await utils.removeFalseyLike(rq);
    let results = await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Fetched Successfully!", data: results?.[0] });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function getCompetencyLevel(req, res) { 
  try {
    let rq = { ...req.body, reqtype: "getCompetencyLevel" };
    await utils.removeFalseyLike(rq);
    let results = await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Fetched Successfully!", data: results?.[0] });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function competencyStatusDropdown(req, res) { 
  try {
    let rq = { ...req.body, reqtype: "statusDropdown" };
    await utils.removeFalseyLike(rq);
    let results = await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Fetched Successfully!", data: results?.[0] });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function competencyHome(req, res) { 
  try {
    let rq = { ...req.body, ...req.query, reqtype: "competencyHome" };
    await utils.removeFalseyLike(rq);
    let [r1, r2] = await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);

    const filterData = _.map(r1, item => {
      item['status_count'] = _.find(r2, item1 => +item.station_id === +item1.station_id)
      return item;
    });
    const headerArr = [];
    const data = _.groupBy(filterData, (item) => {
    return item.header_name
    });
    for (let key in data) {
      headerArr.push({
        module: data[key],
        header_name: key,
        header_id: data[key] && data[key][0] && data[key][0].header_id,
        color_code: data[key] && data[key][0] && data[key][0].color_code,
      })
  }
    return res.json({ state: 1, message: "Fetched Successfully!", data:headerArr});
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function viewDetail(req, res) { 
  try {
    let rq = { ...req.body, reqtype: "getViewDetails" };
    await utils.removeFalseyLike(rq);
    let results = await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Fetched Successfully!", data: results?.[0] });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function userViewDetail(req, res) { 
  try {
    let rq = { ...req.body, reqtype: "getUserViewDetails" };
    await utils.removeFalseyLike(rq);
    let results = await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Fetched Successfully!", data: results?.[0] });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function countStatus(req, res) { 
  try {
    let rq = { ...req.body, reqtype: "getCountStatus" };
    await utils.removeFalseyLike(rq);
    let results = await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Fetched Successfully!", data: results?.[0] });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function stationViewDetailsAdmin(req, res) { 
  try {
    let rq = { ...req.body, reqtype: "getAdminStationViewDetail" };
    await utils.removeFalseyLike(rq);
    let results = await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Fetched Successfully!", data: results?.[0] });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function userMarkInProgress(req, res) { 
  try {
    let rq = { ...req.body, reqtype: "userMarkInProgress" };
    await utils.removeFalseyLike(rq);
    await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Success!" });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};

async function afterCompleteStatus(req, res) { 
  try {
    let rq = { ...req.body, reqtype: "afterCompleteStatus" };
    await utils.removeFalseyLike(rq);
    await query(proc.competencydevelopmentoperations, [
      JSON.stringify(rq),
    ]);
    return res.json({ state: 1, message: "Success!" });
  } catch (err) {
    return res.json({ state: -1, message: err || "Something went wrong" });
  }
};