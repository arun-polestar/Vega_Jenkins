const proc = require('../common/procedureConfig');
const commonModel = require('../common/Model');
const makeDir = require("../../routes/common/utils").makeDirectories;
  path = require('path'),
  xlsx = require("xlsx"),
  _ = require('lodash'),
  query = require("../common/Model").mysqlPromiseModelService,
  moment = require('moment'),
  fs = require('fs');




module.exports = {
  addpayrollaction,
  viewpayrollaction,
  viewwallet,
  userwallet,
  payoutdetails,
  uploadwalletamount
}

async function addpayrollaction(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1
    })
  }
  var obj = req.body;
  obj = JSON.stringify(obj);
  commonModel.mysqlPromiseModelService(proc.mstpayroll, [obj])
    .then(results => {
      return res.json({
        state: 1,
        message: "success",
        data: results
      });
    })
    .catch(err => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err
      });
    })
}


async function viewpayrollaction(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1
    })
  }
  var obj = req.body;
  obj = JSON.stringify(obj);
  commonModel.mysqlPromiseModelService(proc.mstpayroll, [obj])
    .then(results => {
      return res.json({
        state: 1,
        message: "success",
        data: results
      });
    })
    .catch(err => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err
      });
    })
}

async function viewwallet(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1
    })
  }
  var obj = req.body;
  obj = JSON.stringify(obj);
  commonModel.mysqlPromiseModelService(proc.mstpayroll, [obj])
    .then(results => {
      return res.json({
        state: 1,
        message: "success",
        data: results
      });
    })
    .catch(err => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err
      });
    })
}
async function userwallet(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1
    })
  }
  var obj = req.body;
  obj = JSON.stringify(obj);
  commonModel.mysqlPromiseModelService(proc.payroll, [obj])
    .then(results => {
      return res.json({
        state: 1,
        message: "success",
        data: results
      });
    })
    .catch(err => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err
      });
    })
}


function payoutdetails(req, res) {
  try {
    let obj = JSON.stringify(req.body);
    commonModel.mysqlModelService(proc.payroll, [obj], function (err, results) {
      if (err) {
        return res.json({
          state: -1,
          message: err,
          data: null
        });
      }
      return res.json({
        state: 1,
        message: "Success",
        data: results[0],
        pendingcount: results[1] && results[1][0] && results[1][0].pendingcount
      });
    });
  } catch (error) {
    return res.json({
      state: -1,
      message: 'Something went wrong'
    })
  }
}

async function uploadwalletamount(req, res) {
  try {
    if (!req.files)
      throw new Error('File Required!');
    const exl = req.files.file;
    var fileformat = exl.name.split('.')[1].toLowerCase();
    if (fileformat != 'xlsx') //|| fileformat != 'csv') 
      throw new Error('Unsupported File Format. Upload XLSX File Format!');
    makeDir("uploads");
    let dir = makeDir("uploads/esopupload");
    let uploadPath = path.join(dir, `${Date.now()}_${exl.name}`);
    await exl.mv(uploadPath);
    var exlarr = await getwalletdata(uploadPath);
    let hasDuplicates = exlarr.map(v => v.Ecode).length > new Set(exlarr.map(v => v.Ecode)).size ? true : false;
    if (hasDuplicates) {
      return res.json({
        state: -1,
        message: "Duplicate Ecode are not allowed!",
        data: null
      });
    }
    req.body['payroll'] = exlarr;
    req.body['action'] = 'uploadwalletamount';
    const reqData = JSON.stringify(req.body);
    let results = await query(proc.mstpayroll, [reqData]);
    const re = results && results[1] && results[1][0] && results[1][0];
    if (re && re.state == 1) {
      return res.json({
        state: 1,
        message: re && re.message || "Success",
        data: results
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


function getwalletdata(filepath) {

  return new Promise((resolve, reject) => {
    const errc1 = [],
      errc2 = [],
      wb = xlsx.readFile(filepath),
      sheet_name_list = wb.SheetNames,
      ws = wb.Sheets[sheet_name_list[0]],
      data = xlsx.utils.sheet_to_json(ws),
      c1 = ws["A1"] ? ws["A1"].v && ws["A1"].v : undefined,
      c2 = ws["B1"] ? ws["B1"].v && ws["B1"].v : undefined
    if (
      !c1 || c1.toString().trim() !== "Ecode" ||
      !c2 || c2.toString().trim() !== "Allowance_Amount"
    ) {
      reject("Invalid Template!");
    }
    if (!data.length)
      reject("Make sure template should not be empty!");

    _.each(data, (item, index) => {
      if (!item.Ecode) {
        errc1.push(index + 2)
      }
      if (isNaN(item['Allowance_Amount']) || item['Allowance_Amount'] <= 0 || item['Allowance_Amount'] > Number.MAX_SAFE_INTEGER) {
        errc2.push(index + 2);
      }
    });
    let m1 = errc1.length ? `Row no. ${errc1.toString()} should have Ecode` : '';
    let m2 = errc2.length ? `Row no. ${errc2.toString()} should have valid Allowance_Amount` : '';

    switch (true) {
      case Boolean(m1 && !m2):
        reject(m1)
      case Boolean(!m1 && m2):
        reject(m2)
      case Boolean(m1 && m2):
        reject(`${m1} and ${m2}`)
      default:
        resolve(data)
    }
  })
}