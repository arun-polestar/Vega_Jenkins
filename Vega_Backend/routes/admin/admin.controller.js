const commonModel = require("../common/Model");
const query = require("../common/Model").mysqlPromiseModelService;
const xlsx = require("xlsx");
const path = require("path");
const appRoot = require("app-root-path");
const bcrypt = require("bcryptjs");

const { isValidPasswordRegex } = require("../common/utils");

const { makeDirectories, getFileLocation } = require("../common/utils");
const { off } = require("process");

module.exports = {
  saveDataAdmin: saveDataAdmin,
  uploadExpandedLogo,
  modulewiseUserCounts,
  modulewiseUsers,
  getEmployeeLoginLogs,
  getEmployeeLicenseCounts,
  getEmployeeLicenseData,
  moduleLicenseUpdate,
  updateCredential,
};

async function saveDataAdmin(req, res) {
  var obj = req.body;
  obj.createdby = req.body.tokenFetchedData.id;
  obj = { ...obj, ...(await getFileLocation(req.file || req.files)) };
  commonModel.mysqlModelService(
    "call usp_admindetails_operations(?)",
    [JSON.stringify(obj)],
    (err, result) => {
      if (err) {
        res.json({
          state: "-1",
          message: "Data Not Saved Pls Try again After some time",
          err: err,
        });
      } else {
        res.json({
          state: "1",
          message: result.message,
          result: result,
        });
      }
    }
  );
}

async function uploadExpandedLogo(req, res) {
  var obj = req.body;
  obj.createdby = req.body.tokenFetchedData.id;
  obj.reqtype = "upload_exp";
  const { filename, filepath } = await getFileLocation(req.file || req.files);
  obj.expfilename = filename;
  obj.expfilepath = filepath;
  commonModel.mysqlModelService(
    "call usp_admindetails_operations(?)",
    [JSON.stringify(obj)],
    (err, result) => {
      if (err) {
        return res.json({
          state: "-1",
          message: "Something went wrong",
          err: err,
        });
      } else {
        return res.json({
          state: "1",
          message: result.message,
          result: result,
        });
      }
    }
  );
}

async function modulewiseUserCounts(req, res) {
  try {
    const obj = JSON.stringify(req.body);
    const results = await query("call usp_admindetails_operations(?)", [obj]);
    const r = results && results[0];
    return res.json({
      state: 1,
      message: "success" || (r && r.message),
      data: r,
    });
  } catch (err) {
    //console.log(err);
    return res.json({ state: -1, message: err.message || err || "Failed!" });
  }
}

async function modulewiseUsers(req, res) {
  try {
    const obj = JSON.stringify(req.body);
    const results = await query("call usp_admindetails_operations(?)", [obj]);
    const r = results && results[0];
    return res.json({
      state: 1,
      message: "success" || (r && r.message),
      data: r,
    });
  } catch (err) {
    //console.log(err);
    return res.json({ state: -1, message: err.message || err || "Failed!" });
  }
}

async function getEmployeeLoginLogs(req, res) {
  try {
    const obj = req.body;
    obj.reqtype = "emp_info";
    let results = await query("call usp_admindetails_operations(?)", [
      JSON.stringify(obj),
    ]);
    return res.json({
      state: 1,
      message: "success" || (results && results[0] && results[0].message),
      data: results && results[0],
    });
  } catch (err) {
    //console.log(err);
    return res.json({ state: -1, message: err.message || err || "Failed!" });
  }
}

async function getEmployeeLicenseCounts(req, res) {
  try {
    const obj = req.body;
    obj.reqtype = "employee_license_counts";
    let results = await query("call usp_admindetails_operations(?)", [
      JSON.stringify(obj),
    ]);
    return res.json({
      state: 1,
      message: "success" || (results && results[0] && results[0].message),
      data: results && results[0],
    });
  } catch (err) {
    //console.log(err);
    return res.json({ state: -1, message: err.message || err || "Failed!" });
  }
}

async function getEmployeeLicenseData(req, res) {
  try {
    const obj = req.body;
    obj.reqtype = "employee_license_data";
    let results = await query("call usp_admindetails_operations(?)", [
      JSON.stringify(obj),
    ]);
    //var dbresult = commonCtrl.lazyLoading(results[0], req.body);
    ////console.log("dbresult", dbresult);
    return res.json({
      state: 1,
      message: "success" || (results && results[0] && results[0].message),
      data: results && results[0],
    });
  } catch (err) {
    //console.log(err);
    return res.json({ state: -1, message: err.message || err || "Failed!" });
  }
}

async function moduleLicenseUpdate(req, res) {
  try {
    const obj = req.body;
    obj.action = "update_module_license";
    obj.licenseData = req.body && req.body.licenseData;
    let results = await query("call usp_module_license(?)", [
      JSON.stringify(obj),
    ]);
    return res.json({
      state: 1,
      message: "success" || (results && results[0] && results[0].message),
      data: results && results[0],
    });
  } catch (err) {
    //console.log("eeeeeeeeeee", err);
    return res.json({ state: -1, message: err.message || err || "Failed!" });
  }
}

async function updateCredential(req, res) {
  try {
    const obj = req.body;
    obj.action = "updateCredential";
    let excelData = await getupdateCredentialExcelData(
      path.join(
        appRoot && appRoot.path,
        "uploads/",
        req.file && req.file.filepath
      )
    );
    for (let item of excelData) {
      item.passwordHash = await bcrypt.hash(item["Password"], 10);
      item.ecode = item.Ecode;
      item.password = item.Password;
      delete item.Password;
      delete item.Ecode;
    }
    obj.mappingData = excelData;
    let results = await query("call usp_mst_credential(?)", [
      JSON.stringify(obj),
    ]);
    if (results && results[1] && results[1][0] && results[1][0].state == 1) {
      return res.json({
        state: 1,
        message:
          results && results[1] && results[1][0] && results[1][0].message,
        errorData: results && results[0],
      });
    } else if (
      results &&
      results[1] &&
      results[1][0] &&
      results[1][0].state == -1
    ) {
      return res.json({
        state: results && results[1] && results[1][0] && results[1][0].state,
        message:
          results && results[1] && results[1][0] && results[1][0].message,
        errorData: results && results[0],
      });
    } else {
      return res.json({
        state: -1,
        message: (results && results.message) || "something went Wrong",
        errorData: results && results[0],
      });
    }
  } catch (err) {
    return res.json({
      state: -1,
      message: err || "Internal Server Error",
    });
  }
}

function getupdateCredentialExcelData(filepath) {
  return new Promise((resolve, reject) => {
    const errc1 = [],
      errc2 = [],
      wb = xlsx.readFile(filepath),
      sheet_name_list = wb.SheetNames,
      ws = wb.Sheets[sheet_name_list[0]],
      data = xlsx.utils.sheet_to_json(ws),
      c1 = ws["A1"] ? ws["A1"].v && ws["A1"].v : undefined,
      c2 = ws["B1"] ? ws["B1"].v && ws["B1"].v : undefined;

    if (
      !c1 ||
      c1.toString().trim() !== "Ecode" ||
      !c2 ||
      c2.toString().trim() !== "Password"
    ) {
      reject("Invalid  Template!");
    }
    if (!data.length) reject("Make sure template should not be empty!");

    _.each(data, async (item, index) => {
      if (!item.Ecode) {
        errc1.push(index + 2);
      }
      if (!isValidPasswordRegex(item["Password"])) {
        errc2.push(index + 2);
      }
    });
    let m1 = errc1.length
      ? `Row no. ${errc1.toString()} should have Ecode`
      : "";
    let m2 = errc2.length
      ? `Row no. ${errc2.toString()} should valid Have Password (Minimum Length 8 Characters, including at least one number and includes both lower and uppercase letters and special characters, for example #, ?, !)`
      : "";

    switch (true) {
      case Boolean(m1 && !m2):
        reject(m1);
      case Boolean(!m1 && m2):
        reject(m2);
      case Boolean(m1 && m2):
        reject(`${m1} and ${m2}`);
      default:
        resolve(data);
    }
  });
}
