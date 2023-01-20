"use strict";

const proc = require("../common/procedureConfig");
const commonModel = require("../common/Model");
const commonCtrl = require("../common/Controller");
const makeDir = require("../../routes/common/utils").makeDirectories;


module.exports = {
  milestoneMaster: milestoneMaster,
  userMilestone: userMilestone,
  uploadUsersMilestone: uploadUsersMilestone,
  milestoneuserdata: milestoneuserdata
};

async function milestoneMaster(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstmilestone, [obj])
    .then((results) => {
        return res.json({
          state: 1,
          message: "success",
          data: results[0],
        });
    })
    .catch((err) => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}


function  userMilestone(req, res) {
  if(!req.body || !req.body.action){
    return res.json({
      state: -1,
      message: "Send Required data!"
    })
  }
  let obj = JSON.stringify(req.body); 
  commonModel.mysqlPromiseModelService(proc.usermilestone, [obj])
    .then((results) => {
        return res.json({
          state: 1,
          message: "success",
          data: results,
        });
    })
    .catch((err) => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
  
}

async function uploadUsersMilestone(req, res) {
  try {
    if (!req.files)
      throw new Error('File Required!');
    const exl = req.files.file;
    var fileformat = exl.name.split('.')[1].toLowerCase();
    if (fileformat != 'xlsx') //|| fileformat != 'csv') 
      throw new Error('Unsupported File Format. Upload XLSX File Format!');
    makeDir("uploads");
    let dir = makeDir("uploads/milestones");
    let uploadPath = path.join(dir, `${Date.now()}_${exl.name}`);
    await exl.mv(uploadPath);
    var exlarr = await getUsersMilestone(uploadPath);
    
    req.body['milestonedata'] = exlarr;
    req.body['action'] = 'uploadusersmilestone';
    const reqData = JSON.stringify(req.body);
    console.log('------------------------>',reqData)
    let results = await query(proc.mstmilestoneupload, [reqData]);
    const re = results && results[1] && results[1][0] && results[1][0];
    if (re && re.state == 1) {
      return res.json({
        state: 1,
        message: re && re.message || "Success",
        data: results[0]
      });
    } else {
      return res.json({
        state: -1,
        message: re && re.message || "something went Wrong",
        data: results
      });
    }
  } catch (err) {
    return res.json({
      state: -1,
      message: err && err.message || err
    });
  }
}


function getUsersMilestone(filepath) {

  return new Promise((resolve, reject) => {
    const errc1 = [],
      errc2 = [],
      errc3 = [],
      errc4 = [],
      wb = xlsx.readFile(filepath),
      sheet_name_list = wb.SheetNames,
      ws = wb.Sheets[sheet_name_list[0]],
      data = xlsx.utils.sheet_to_json(ws),
      c1 = ws["A1"] ? ws["A1"].v && ws["A1"].v : undefined,
      c2 = ws["B1"] ? ws["B1"].v && ws["B1"].v : undefined,
      c3 = ws["C1"] ? ws["C1"].v && ws["C1"].v : undefined
      // c4 = ws["D1"] ? ws["D1"].v && ws["D1"].v : undefined
    if (
      !c1 || c1.toString().trim() !== "Ecode" ||
      !c2 || c2.toString().trim() !== "Date(DD-MM-YYYY)" ||
      !c3 || c3.toString().trim() !== "Award_Value" 
      // !c4 || c4.toString().trim() !== "Award_Value"
    ) {
      reject("Invalid Template!");
    }
    if (!data.length)
      reject("Make sure template should not be empty!");

    _.each(data, (item, index) => {
      if (!item.Ecode) {
        errc1.push(index + 2)
      }
      if (!item["Date(DD-MM-YYYY)"]) {
        item["Date(DD-MM-YYYY)"] = '';
      } else if (item["Date(DD-MM-YYYY)"] == '' || item["Date(DD-MM-YYYY)"] == ' ') {
        item["Date(DD-MM-YYYY)"] = '';
      }
      else if (
        !(moment(item["Date(DD-MM-YYYY)"], "DD-MM-YYYY", true).isValid())
      ) {
        errc2.push(index + 2);
      }
      // if (item['Award_Range'].length>2500){
      //   errc3.push(index + 2);
      // }
      // if (item['Award_Value'].length>2500){
      //   errc4.push(index + 2);
      // }
      if(moment(item["Date(DD-MM-YYYY)"], "DD-MM-YYYY", true).isValid()) {
        item["Date(DD-MM-YYYY)"] = moment(
          new Date(moment(item["Date(DD-MM-YYYY)"], "DD-MM-YYYY"))
        ).format("YYYY-MM-DD");
      } else {
        item["Date(DD-MM-YYYY)"] = '';
      }
    });
    let m1 = errc1.length ? `Row no. ${errc1.toString()} should have Ecode` : '';
    let m2 = errc2.length ? `Row no. ${errc2.toString()} should have valid Date` : '';
    let m3 = errc1.length ? `Row no. ${errc1.toString()} should have Length less then 2000 charachtes` : '';
    // let m4 = errc2.length ? `Row no. ${errc2.toString()} should have Length less then 2000 charachtes` : '';

    switch (true) {
      case Boolean(m1 && !m2):
        reject(m1)
      case Boolean(!m1 && m2):
        reject(m2)
      case Boolean(m1 && m2):
        reject(`${m1} and ${m2}`)
        case Boolean(m3 ):  
        reject(`${m3} `)
      default:
        resolve(data)
    }
  })
}

function  milestoneuserdata(req, res) {
  if(!req.body || !req.body.action){
    return res.json({
      state: -1,
      message: "Send Required data!"
    })
  }
  let obj = JSON.stringify(req.body); 
  commonModel.mysqlPromiseModelService(proc.mstmilestoneuserdata, [obj])
    .then((results) => {
        return res.json({
          state: 1,
          message: "success",
          data: results,
        });
    })
    .catch((err) => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
  
}