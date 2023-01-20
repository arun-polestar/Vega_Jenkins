const proc = require("../common/procedureConfig");
const config = require("../../config/config");
const commonModel = require("../common/Model");
const mailservice = require("../../services/mailerService");
const makeDir = require("../../routes/common/utils").makeDirectories;
const commonCtrl = require("../common/Controller");

const appRoot = require("app-root-path"),
  xlsx = require("xlsx"),
  _ = require("lodash"),
  query = require("../common/Model").mysqlPromiseModelService,
  path = require("path");
moment = require("moment");
fs = require("fs");
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;

module.exports = {
  esopMaster: esopMaster,
  esopPolicy: esopPolicy,
  grantesop: grantesop,
  uploadesopuser: uploadesopuser,
  employeeesop: employeeesop,
  esopexpense: esopexpense,
  esopvesting: esopvesting,
  esopreport: esopreport,
  esopopertaion: esopopertaion,
  updateexercise: updateexercise,
  updatesurrender: updatesurrender,
  esopdashboard: esopdashboard,
  esopanalytics: esopanalytics,
  addusersignature: addusersignature,
  viewusersignature: viewusersignature,
  addnominee: addnominee,
  viewnominee: viewnominee,
  usersettings: usersettings,
  updateintrinsicvalue: updateintrinsicvalue,
  uploadintrinsicvalue: uploadintrinsicvalue,
  esopcaptable: esopcaptable,
  sendesopreminder,
  grantesopreminder,
  viewesopopertaion,
  viewesopdata,
  employeeexerciserequest,
  allowemployeeexercise, // not user now will use in next release  for mail
  esoprefreshdata,
  esopcheckerapprove,
  esopcheckerview,
  mstexerciseapprove,
  uploadLetter,
  esopGrantReport,
  // createGrantLetter,
};

function esopMaster(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      state: -1,
      message: "Send required data",
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstesop, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
      });
    })
    .catch((err) => {
      return res.json({
        state: -1,
        message: err.message || err,
      });
    });
}

function esopreport(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      state: -1,
      message: "Send required data",
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstesopreport, [obj])
    .then((results) => {
      var dbresult = commonCtrl.lazyLoading(results[0], req.body);
      if (dbresult && "data" in dbresult && "count" in dbresult) {
        return res.json({
          state: 1,
          message: "success",
          data: dbresult.data,
          otherdata: results && results[1],
          count: dbresult.count,
        });
      }
    })
    .catch((err) => {
      return res.json({
        state: -1,
        message: err.message || err,
      });
    });
}

async function esopGrantReport(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      state: -1,
      message: "Send required data",
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstesopreport, [obj])
    .then(async (results) => {
      let grantObj = results[0];
      let vesttingObj = results[1];
      let resResults = [];
      let obj = {};
      let dynamicColumnArray = [];
      // grantObj.forEach((item) => {
      for (item of grantObj) {
        const vestingData = vesttingObj.filter((i) => {
          return i.grantid == item.id;
        });
        obj = { ...item };
        // Loop to insert key & value in this object one by one
        let count = 0;
        for (item1 of vestingData) {
          count = count + 1;
          let columnName = commonCtrl.ordinalSuffixOf(count);
          let vestingQntColumnnName = `${columnName}" Vesting Options`;
          let vestingDateColumnnName = `${columnName}" Vesting Date`;
          let vestingfrequencyColumnnName = `${columnName}" Vesting Frequency`;

          dynamicColumnArray.indexOf(vestingDateColumnnName) === -1
            ? dynamicColumnArray.push(vestingDateColumnnName)
            : "";
          dynamicColumnArray.indexOf(vestingQntColumnnName) === -1
            ? dynamicColumnArray.push(vestingQntColumnnName)
            : "";
          dynamicColumnArray.indexOf(vestingfrequencyColumnnName) === -1
            ? dynamicColumnArray.push(vestingfrequencyColumnnName)
            : "";
          obj = {
            ...obj,
            [`${vestingDateColumnnName}`]: item1.vesting_Date || "",
            [`${vestingQntColumnnName}`]: item1.vested_Stock || "",
            [`${vestingfrequencyColumnnName}`]: item1.vested_Frequency || "",
          };
        }
        resResults.push(obj);
      }

      return res.json({
        state: 1,
        message: "success",
        data: resResults,
        dynamicColumnArray: dynamicColumnArray,
      });
      // }
    })
    .catch((err) => {
      return res.json({
        state: -1,
        message: err.message || err,
      });
    });
}

async function esopPolicy(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      state: -1,
      message: "Send required data",
    });
  }
  try {
    let checkEventDir = path.join("uploads", "esop");
    let fileObj = {};
    let fileObj1 = {};
    let newFilesArr = [];
    let attachmentsArr = [];
    if (req.files) {
      makeDir(checkEventDir);
      let file = req.files.file;
      if (req.body.attachCount == 1) {
        file = [file];
      }
      for (let i = 0; i < file.length; i++) {
        fileObj = {};
        fileObj1 = {};
        let newFileName = `${Date.now()}_${file[i].name}`;
        let checkEventDir = path.join("uploads", "esop");
        await file[i].mv(
          path.join(appRoot && appRoot.path, checkEventDir, newFileName)
        );
        fileObj.path = `esop/${newFileName}`;
        fileObj.name = file[i].name;
        newFilesArr.push(fileObj);
        fileObj1.filename = file[i].name;
        fileObj1.path = path.join(appRoot.path, `uploads/esop/${newFileName}`);
        attachmentsArr.push(fileObj1);
      }
      req.body.file = newFilesArr;
    }

    let oldfile = req.body && req.body.oldfile && JSON.parse(req.body.oldfile);
    let obj = req.body;
    obj.oldfile = oldfile;
    obj = JSON.stringify(obj);

    commonModel
      .mysqlPromiseModelService(proc.mstesop, [obj])
      .then((results) => {
        return res.json({
          state: 1,
          message: "Success",
          data: results,
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
      state: 1,
      message: e.message || e,
      data: results,
    });
  }
}

function grantesop(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      state: -1,
      message: "Send required data",
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstesopgrant, [obj])
    .then((results) => {
      res.json({
        state: 1,
        message: "Success",
        data: results[1],
      });
      var counter = 1;
      var list = results[0];
      setTimeout(() => {
        list.forEach(function (item) {
          let typemail = "esopgrant",
            subjecttype = "<Congratulations ESOPs are Granted to You.>",
            headingtype = "Congratulations ESOPs are Granted to You.";
          let emailObj = {
            email: (item && item.useremail) || "",
            mailType: typemail,

            moduleid: req.body.moduleid ? req.body.moduleid : "ESOP",
            userid: req.body.userid ? req.body.userid : req.body.createdby,
            subjectVariables: {
              subject: subjecttype,
            },
            headingVariables: {
              heading: headingtype,
            },

            bodyVariables: {
              trxesopnumber: (req.body && req.body.stock) || "",
              trxempname: (item && item.username) || "",
              trxgrantdate: (item && item.trxgrantdate) || "",
              trxempdob: (item && item.trxempdob) || "",
              trxempdob: (item && item.trxempdob) || "",
              trxempsupervisor: (item && item.trxempsupervisor) || "",
              trxempemail: (item && item.trxempemail) || "",
              userid:
                (req.body && req.body.userid) ||
                (req.body && req.body.createdby),
            },
          };
          counter = counter + 1;
          mailservice.mail(emailObj, function (err) {
            if (err) {
              //console.log("MAILLLLLLLLLLL", err);
            }
          });
        });
      }, counter * 3000);
    })
    .catch((err) => {
      return res.json({
        state: -1,
        message: err.message || err,
      });
    });
}

function employeeesop(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      state: -1,
      message: "Send required data",
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.esop, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
      });
    })
    .catch((err) => {
      return res.json({
        state: -1,
        message: err.message || err,
      });
    });
}

function esopexpense(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      state: -1,
      message: "Send required data",
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstesop, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
      });
    })
    .catch((err) => {
      return res.json({
        state: -1,
        message: err.message || err,
      });
    });
}

function esopvesting() {
  let obj = JSON.stringify({
    action: "esopvesting",
  });
  commonModel
    .mysqlPromiseModelService(proc.esop, [obj])
    .then((results) => {
      //console.log("Success");
    })
    .catch((err) => {
      //console.log("Error", err);
    });
}

async function uploadesopuser(req, res) {
  try {
    if (!req.files) throw new Error("File Required!");
    const exl = req.files.file;
    var fileformat = exl.name.split(".")[1].toLowerCase();
    if (fileformat != "xlsx")
      //|| fileformat != 'csv')
      throw new Error("Unsupported File Format. Upload XLSX File Format!");
    makeDir("uploads");
    let dir = makeDir("uploads/esopupload");
    let uploadPath = path.join(dir, `${Date.now()}_${exl.name}`);
    await exl.mv(uploadPath);
    let exlarr = await getbudgetExcelData(uploadPath);

    let checkDupsValue = function (array) {
      return array
        .map(function (value) {
          return value.suit + value.rank;
        })
        .some(function (value, index, array) {
          return array.indexOf(value) !== array.lastIndexOf(value);
        });
    };
    const hasDuplicates = checkDupsValue(exlarr);
    if (hasDuplicates) {
      return res.json({
        state: -1,
        message: "Duplicate Ecode and Grant Date are not allowed!",
        data: null,
      });
    }

    req.body["mappingData"] = exlarr;
    req.body["action"] = "uploadesopuser";
    const reqData = JSON.stringify(req.body);
    let results = await query(proc.mstesopgrant, [reqData]);
    const re = results && results[2] && results[2][0] && results[2][0];
    if (re && re.state == 1) {
      res.json({
        state: 1,
        message: (re && re.message) || "Success",
        data: results && results[0],
      });
      var counter = 1;
      var list = results && results[1];
      setTimeout(() => {
        list.forEach(function (item) {
          let typemail = "esopgrant",
            subjecttype = "<Congratulations ESOPs are Granted to You.>",
            headingtype = "Congratulations ESOPs are Granted to You.";
          let emailObj = {
            email: (item && item.useremail) || "",
            mailType: typemail,

            moduleid: req.body.moduleid ? req.body.moduleid : "ESOP",
            userid: req.body.userid ? req.body.userid : req.body.createdby,
            subjectVariables: {
              subject: subjecttype,
            },
            headingVariables: {
              heading: headingtype,
            },

            bodyVariables: {
              trxesopnumber: (item && item.stock) || "",
              trxempname: (item && item.username) || "",
              trxgrantdate: (item && item.trxgrantdate) || "",
              trxempdob: (item && item.trxempdob) || "",
              trxempdob: (item && item.trxempdob) || "",
              trxempsupervisor: (item && item.trxempsupervisor) || "",
              trxempemail: (item && item.trxempemail) || "",
              userid:
                (req.body && req.body.userid) ||
                (req.body && req.body.createdby),
            },
          };
          counter = counter + 1;
          mailservice.mail(emailObj, function (err) {
            if (err) {
              //console.log("MAILLLLLLLLLLL", err);
            }
          });
        });
      }, counter * 3000);
      // })
    } else {
      return res.json({
        state: -1,
        message: (re && re.message) || "something went Wrong",
        data: results,
      });
    }
  } catch (err) {
    return res.json({
      state: -1,
      message: (err && err.message) || err,
    });
  }
}

function getbudgetExcelData(filepath) {
  return new Promise((resolve, reject) => {
    const errc1 = [],
      errc2 = [],
      errc3 = [],
      errc4 = [],
      errc5 = [],
      errc6 = [],
      errc7 = [],
      wb = xlsx.readFile(filepath),
      // if (!(wb && wb.Sheets && wb.Sheets["data"])) {
      //   reject('Sheet name should be data!');
      // }
      sheet_name_list = wb.SheetNames,
      ws = wb.Sheets[sheet_name_list[0]],
      data = xlsx.utils.sheet_to_json(ws),
      //  ws = wb.Sheets["data"],
      //   data = xlsx.utils.sheet_to_json(ws),
      c1 = ws["A1"] ? ws["A1"].v && ws["A1"].v : undefined,
      c2 = ws["B1"] ? ws["B1"].v && ws["B1"].v : undefined,
      c3 = ws["C1"] ? ws["C1"].v && ws["C1"].v : undefined,
      c4 = ws["D1"] ? ws["D1"].v && ws["D1"].v : undefined,
      c5 = ws["E1"] ? ws["E1"].v && ws["E1"].v : undefined,
      c6 = ws["F1"] ? ws["F1"].v && ws["F1"].v : undefined;

    if (
      !c1 ||
      c1.toString().trim() !== "Ecode" ||
      !c2 ||
      c2.toString().trim() !== "Options" ||
      !c3 ||
      c3.toString().trim() !== "Policy_Code" ||
      !c4 ||
      c4.toString().trim() !== "Vesting_Code" ||
      !c5 ||
      c5.toString().trim() !== "Grant_Date(DD-MM-YYYY)" ||
      !c6 ||
      c6.toString().trim() !== "Excercise_Price"
    ) {
      reject("Invalid ESOP Template!");
    }
    if (!data.length) reject("Make sure template should not be empty!");

    _.each(data, (item, index) => {
      if (!item.Ecode) {
        errc1.push(index + 2);
      } // (typeof item['Amount_Per_Employee']) !== "number"
      if (
        isNaN(item["Options"]) ||
        item["Options"] <= 0 ||
        item["Options"] > Number.MAX_SAFE_INTEGER
      )
        errc2.push(index + 2);
      if (!item["Policy_Code"]) errc3.push(index + 2);
      if (!item["Vesting_Code"]) errc4.push(index + 2);
      // if (!(moment(item['Grant_Date(DD-MM-YYYY)'], 'DD-MM-YYYY').isValid())) {
      //   errc5.push(index + 2);
      // }
      if (
        !moment(item["Grant_Date(DD-MM-YYYY)"], "DD-MM-YYYY", true).isValid()
      ) {
        errc5.push(index + 2);
      }
      if (
        isNaN(item["Excercise_Price"]) ||
        item["Excercise_Price"] < 0 ||
        item["Excercise_Price"] > Number.MAX_SAFE_INTEGER
      )
        errc6.push(index + 2);
      item["Grant_Date(DD-MM-YYYY)"] = moment(
        new Date(moment(item["Grant_Date(DD-MM-YYYY)"], "DD-MM-YYYY"))
      ).format("YYYY-MM-DD");
    });
    let m1 = errc1.length
      ? `Row no. ${errc1.toString()} should have Ecode`
      : "";
    let m2 = errc2.length
      ? `Row no. ${errc2.toString()} should have valid Options`
      : "";
    let m3 = errc3.length
      ? `Row no. ${errc3.toString()} should  have Policy_Code`
      : "";
    let m4 = errc4.length
      ? `Row no. ${errc4.toString()} should have  Vesting_Code`
      : "";
    let m5 = errc5.length
      ? `Row no. ${errc5.toString()} should have valid Grant_Date in (DD-MM-YYYY) format`
      : "";
    let m6 = errc6.length
      ? `Row no. ${errc6.toString()} should have  valid Excercise_Price`
      : "";
    // let m7 = errc7.length ? `Row no. ${errc7.toString()} should have  valid Intrinsic_Value` : '';
    switch (true) {
      case Boolean(m1 && !m2 && !m3 && !m4 && !m5 && !m6):
        reject(m1);
      case Boolean(!m1 && m2 && !m3 && !m4 && !m5 && !m6):
        reject(m2);
      case Boolean(!m1 && !m2 && m3 && !m4 && !m5 && !m6):
        reject(m3);
      case Boolean(!m1 && !m2 && !m3 && m4 && !m5 && !m6):
        reject(m4);
      case Boolean(!m1 && !m2 && !m3 && !m4 && m5 && !m6):
        reject(m5);
      case Boolean(!m1 && !m2 && !m3 && !m4 && !m5 && m6):
        reject(m6);
      case Boolean(m1 && m2 && !m3 && !m4 && !m5 && !m6):
        reject(`${m1} and ${m2}`);
      case Boolean(!m1 && m2 && m3 && !m4 && !m5 && !m6):
        reject(`${m2} and ${m3}`);
      case Boolean(!m1 && !m2 && m3 && m4 && !m5 && !m6):
        reject(`${m3} and ${m4}`);
      case Boolean(!m1 && !m2 && !m3 && m4 && m5 && !m6):
        reject(`${m4} and ${m5}`);
      case Boolean(!m1 && !m2 && !m3 && !m4 && m5 && m6):
        reject(`${m5} and ${m6}`);
      case Boolean(m1 && !m2 && m3 && m4):
        reject(`${m1} and ${m3}`);
      case Boolean(m1 && !m2 && !m3 && m4):
        reject(`${m1} and ${m4}`);
      case Boolean(!m1 && m2 && !m3 && m4):
        reject(`${m2} and ${m4}`);
      case Boolean(
        (m1 && m2 && m3) ||
          (m2 && m3 && m4) ||
          (m1 && m3 && m4) ||
          (m1 && m2 && m4)
      ):
        reject(
          `Please correct data at row no.  ${_.uniq(
            _.concat(errc1, errc2, errc3, errc4, errc5, errc6)
          ).toString()}`
        );
      case Boolean(m1):
        reject(m1);
      case Boolean(m2):
        reject(m2);
      case Boolean(m3):
        reject(m3);
      case Boolean(m4):
        reject(m4);
      case Boolean(m5):
        reject(m5);
      case Boolean(m6):
        reject(m6);
      default:
        resolve(data);
    }
  });
}

function esopopertaion(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      state: -1,
      message: "Send required data",
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstesopdetails, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
      });
    })
    .catch((err) => {
      return res.json({
        state: -1,
        message: err.message || err,
      });
    });
}

async function updateexercise(req, res) {
  try {
    if (!req.files) throw new Error("File Required!");
    const exl = req.files.file;
    var fileformat = exl.name.split(".")[1].toLowerCase();
    if (fileformat != "xlsx")
      //|| fileformat != 'csv')
      throw new Error("Unsupported File Format. Upload XLSX File Format!");
    makeDir("uploads");
    let dir = makeDir("uploads/esopupload");
    let uploadPath = path.join(dir, `${Date.now()}_${exl.name}`);
    await exl.mv(uploadPath);
    var exlarr = await getexercisedata(uploadPath);
    let hasDuplicates =
      exlarr.map((v) => v.Ecode).length >
      new Set(exlarr.map((v) => v.Ecode)).size
        ? true
        : false;
    if (hasDuplicates) {
      return res.json({
        state: -1,
        message: "Duplicate Ecode are not allowed!",
        data: null,
      });
    }
    req.body["mappingData"] = exlarr;
    req.body["action"] = "updateexercise";
    const reqData = JSON.stringify(req.body);
    let results = await query(proc.mstupload, [reqData]);
    const re = results && results[1] && results[1][0] && results[1][0];
    if (re && re.state == 1) {
      return res.json({
        state: 1,
        message: (re && re.message) || "Success",
        data: results,
      });
    } else {
      return res.json({
        state: -1,
        message: (re && re.message) || "something went Wrong",
        data: results,
      });
    }
  } catch (err) {
    return res.json({
      state: -1,
      message: (err && err.message) || err,
    });
  }
}

async function updatesurrender(req, res) {
  try {
    if (!req.files) throw new Error("File Required!");
    const exl = req.files.file;
    var fileformat = exl.name.split(".")[1].toLowerCase();
    if (fileformat != "xlsx")
      //|| fileformat != 'csv')
      throw new Error("Unsupported File Format. Upload XLSX File Format!");
    makeDir("uploads");
    let dir = makeDir("uploads/esopupload");
    let uploadPath = path.join(dir, `${Date.now()}_${exl.name}`);
    await exl.mv(uploadPath);
    var exlarr = await getexercisedata(uploadPath);
    let hasDuplicates =
      exlarr.map((v) => v.Ecode).length >
      new Set(exlarr.map((v) => v.Ecode)).size
        ? true
        : false;
    if (hasDuplicates) {
      return res.json({
        state: -1,
        message: "Duplicate Ecode are not allowed!",
        data: null,
      });
    }
    req.body["mappingData"] = exlarr;
    req.body["action"] = "updatesurrender";
    const reqData = JSON.stringify(req.body);
    let results = await query(proc.mstupload, [reqData]);
    const re = results && results[1] && results[1][0] && results[1][0];
    if (re && re.state == 1) {
      return res.json({
        state: 1,
        message: (re && re.message) || "Success",
        data: results,
      });
    } else {
      return res.json({
        state: -1,
        message: (re && re.message) || "something went Wrong",
        data: results,
      });
    }
  } catch (err) {
    return res.json({
      state: -1,
      message: (err && err.message) || err,
    });
  }
}

function getexercisedata(filepath) {
  return new Promise((resolve, reject) => {
    const errc1 = [],
      errc2 = [],
      errc3 = [],
      wb = xlsx.readFile(filepath),
      sheet_name_list = wb.SheetNames,
      ws = wb.Sheets[sheet_name_list[0]],
      data = xlsx.utils.sheet_to_json(ws),
      // ws = wb.Sheets["data"],
      // data = xlsx.utils.sheet_to_json(ws),
      c1 = ws["A1"] ? ws["A1"].v && ws["A1"].v : undefined,
      c2 = ws["B1"] ? ws["B1"].v && ws["B1"].v : undefined;
    c3 = ws["C1"] ? ws["C1"].v && ws["C1"].v : undefined;
    if (
      !c1 ||
      c1.toString().trim() !== "Ecode" ||
      !c2 ||
      c2.toString().trim() !== "Options" ||
      !c3 ||
      c3.toString().trim() !== "Action(Approve/Reject)"
    ) {
      reject("Invalid Template!");
    }
    if (!data.length) reject("Make sure template should not be empty!");

    _.each(data, (item, index) => {
      if (!item.Ecode) {
        errc1.push(index + 2);
      }
      if (
        isNaN(item["Options"]) ||
        item["Options"] <= 0 ||
        item["Options"] > Number.MAX_SAFE_INTEGER
      ) {
        errc2.push(index + 2);
      }
      if (!item["Action(Approve/Reject)"]) {
        errc3.push(index + 2);
      }
    });
    let m1 = errc1.length
      ? `Row no. ${errc1.toString()} should have Ecode`
      : "";
    let m2 = errc2.length
      ? `Row no. ${errc2.toString()} should have valid Options`
      : "";
    let m3 = errc2.length
      ? `Row no. ${errc2.toString()} should have valid Action`
      : "";
    switch (true) {
      case Boolean(m1 && !m2):
        reject(m1);
      case Boolean(!m1 && m2):
        reject(m2);
      case Boolean(m3):
        reject(m3);
      case Boolean(m1 && m2):
        reject(`${m1} and ${m2}`);
      default:
        resolve(data);
    }
  });
}

function esopdashboard(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      state: -1,
      message: "Send required data",
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstdashboard, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
      });
    })
    .catch((err) => {
      return res.json({
        state: -1,
        message: err.message || err,
      });
    });
}

function esopanalytics(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      state: -1,
      message: "Send required data",
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstdashboard, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
      });
    })
    .catch((err) => {
      return res.json({
        state: -1,
        message: err.message || err,
      });
    });
}

async function addusersignature(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let checkPostsDir = path.join("veSignature");
  makeDir(checkPostsDir);
  let checkPostsDir1 = path.join("veSignature/user");
  makeDir(checkPostsDir1);
  let createdby = req.body.createdby.toString();
  let checkPostsDir2 = path.join("veSignature/user", createdby);
  makeDir(checkPostsDir2);

  if (req.body && req.body.imgblob) {
    // for (let i = 0; i < req.body.imgblob.length; i++) {
    let base64Data = req.body.imgblob.replace(/^data:image\/png;base64,/, "");
    let newFileName1 = `usersign_${Date.now()}.png`;
    await fs.writeFile(
      path.join(appRoot && appRoot.path, checkPostsDir2, newFileName1),
      base64Data,
      "base64",
      function (err) {}
    );
    req.body.filename = newFileName1;
    req.body.filepath = path.join(checkPostsDir2, newFileName1);
    // }
  } else if (req.files && req.files.file) {
    let sampleFile = req.files && req.files.file;
    sampleFile.name =
      sampleFile && sampleFile.name == "blob" ? ".png" : sampleFile.name;
    let sampleFile_name = `${Date.now()}_${sampleFile.name}`;
    await sampleFile.mv(
      path.join(appRoot && appRoot.path, checkPostsDir2, sampleFile_name)
    );
    req.body.filename = sampleFile_name;
    req.body.filepath = path.join(checkPostsDir2, sampleFile_name);
  }
  var obj = req.body;
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService(proc.useroperation, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
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
async function viewusersignature(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  var obj = req.body;
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService(proc.useroperation, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
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

async function addnominee(req, res) {
  if (!req.body || !req.body.action || !req.body.nomineedata) {
    return res.json({
      message: "Success",
      state: 1,
    });
  }
  req.body = await commonCtrl.verifyNull(req.body);
  var nomineedata = JSON.parse(req.body && req.body.nomineedata);
  let checkPostsDir = path.join("uploads", "ESOP");
  makeDir(checkPostsDir);
  let checkdir = path.join("uploads", "ESOP", "nominee");
  makeDir(checkdir);
  let createdby = req.body && req.body.createdby.toString();
  let checkdir1 = path.join("uploads", "ESOP", "nominee", createdby);
  makeDir(checkdir1);
  var fileObj = {};
  var newFilesArr = [];
  if (req.files && req.files.images) {
    let file = req.files && req.files.images;
    // let filecount = req.files.images && req.files.images.length;
    // console.log('filecount', filecount)
    if (req.body.attachCount == 1) {
      file = [file];
      // console.log("single -file scenario ")
    }
    // console.log('file', file)
    for (let i = 0; i < nomineedata.length || 0; i++) {
      // let newFileName = `${Date.now()}_${file[i].name}`;
      fileObj = {};
      if (file[i]) {
        let datetime = Date.now();
        await file[i].mv(
          path.join(
            appRoot && appRoot.path,
            checkdir1,
            `${datetime}_${file[i].name}`
          )
        );
        fileObj.filepath = `/ESOP/nominee/${createdby}/${`${datetime}_${file[i].name}`}`;
        fileObj.filename = file[i].name;
        newFilesArr.push({ ...fileObj });
      } else {
        fileObj.filepath = "NA";
        fileObj.filename = "NA";
        newFilesArr.push({ ...{} });
      }
    }
  }
  var newarr = [];
  for (let i = 0; i < nomineedata.length; i++) {
    for (let j = i; j <= i; j++) {
      let obj1 = { ...newFilesArr[j] };
      newarr.push({
        ...nomineedata[i],
        ...{ filepath: obj1.filepath, filename: obj1.filename },
      });
    }
  }
  var obj = req.body;
  obj.nomineedata = newarr;
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService(proc.useroperation, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
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

async function viewnominee(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  var obj = req.body;
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService(proc.useroperation, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
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

async function usersettings(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  var obj = req.body;
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService(proc.useroperation, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
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

async function updateintrinsicvalue(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  var obj = req.body;
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService("call usp_mst_esop_intrinsicvalue(?)", [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
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

async function uploadintrinsicvalue(req, res) {
  try {
    if (!req.files) throw new Error("File Required!");
    const exl = req.files.file;
    var fileformat = exl.name.split(".")[1].toLowerCase();
    if (fileformat != "xlsx")
      //|| fileformat != 'csv')
      throw new Error("Unsupported File Format. Upload XLSX File Format!");
    makeDir("uploads");
    let dir = makeDir("uploads/esopupload");
    let uploadPath = path.join(dir, `${Date.now()}_${exl.name}`);
    await exl.mv(uploadPath);
    const exlarr = await getintrinsicdata(uploadPath);
    req.body["mappingData"] = exlarr;
    req.body["action"] = "updateintrinsicvalue";
    const reqData = JSON.stringify(req.body);
    let results = await query("call usp_mst_esop_intrinsicvalue(?)", [reqData]);
    const re = results && results[1] && results[1][0] && results[1][0];
    if (re && re.state == 1) {
      return res.json({
        state: 1,
        message: (re && re.message) || "Success",
        data: results,
      });
    } else {
      return res.json({
        state: -1,
        message: (re && re.message) || "something went Wrong",
        data: results,
      });
    }
  } catch (err) {
    return res.json({
      state: -1,
      message: (err && err.message) || err,
    });
  }
}

function getintrinsicdata(filepath) {
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
      c1.toString().trim() !== "Vesting_Date(DD-MM-YYYY)" ||
      !c2 ||
      c2.toString().trim() !== "Intrinsic_Value"
    ) {
      reject("Invalid Template!");
    }
    if (!data.length) reject("Make sure template should not be empty!");

    _.each(data, (item, index) => {
      if (
        !moment(item["Vesting_Date(DD-MM-YYYY)"], "DD-MM-YYYY", true).isValid()
      ) {
        errc1.push(index + 2);
      }
      if (
        isNaN(item["Intrinsic_Value"]) ||
        item["Intrinsic_Value"] <= 0 ||
        item["Intrinsic_Value"] > Number.MAX_SAFE_INTEGER
      )
        errc2.push(index + 2);
      item["Vesting_Date(DD-MM-YYYY)"] = moment(
        new Date(moment(item["Vesting_Date(DD-MM-YYYY)"], "DD-MM-YYYY"))
      ).format("YYYY-MM-DD");
    });
    let m1 = errc1.length
      ? `Row no. ${errc1.toString()} should have valid Vesting_Date(DD-MM-YYYY)`
      : "";
    let m2 = errc2.length
      ? `Row no. ${errc2.toString()} should have valid Intrinsic_Value`
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
async function sendesopreminder(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = req.body;
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService(proc.mstesopdetails, [obj])
    .then((results) => {
      if (
        results &&
        results[1] &&
        results[1][0] &&
        results[1][0].state &&
        results[1][0].state == 1
      ) {
        res.json({
          state: 1,
          message: "Success",
          data: null,
        });
        subjecttype = "<Approve Grant ESOP>";
        headingtype = "Approve Grant ESOP";
        let userlist = results && results[0];
        // async.eachSeries(Object.keys(userlist), function (item, cb) {
        var counter = 1;
        userlist.forEach(
          function (item) {
            var emailObj = {
              email: (item && item.useremail) || "",
              mailType: "esopgrantapprovereminder",
              moduleid: "ESOP",

              subjectVariables: {
                subject: subjecttype,
              },

              headingVariables: {
                heading: headingtype,
              },

              bodyVariables: {
                trxempname: (item && item.username) || "",
                trxesopnumber: (item && item.stock) || "",
                trxgrantdate: (item && item.trxgrantdate) || "",
                trxempdob: (item && item.trxempdob) || "",
                trxempsupervisor: (item && item.trxempsupervisor) || "",
                trxempemail: (item && item.trxempemail) || "",
                // userid: req.body && req.body.userid
              },
            };
            counter = counter + 1;
            setTimeout(() => {
              mailservice.mail(
                emailObj,
                function (err, response) {
                  // cb();
                  if (err) {
                    console.log("error while sending eamil.", err);
                  }
                },
                counter * 3000
              );
            });
          },
          function (err) {
            if (err) {
              console.log("error while sending eamil.", err);
            }
          }
        );
      } else {
        return res.json({
          state: -1,
          message: "something went Wrong",
          data: null,
        });
      }
    })
    .catch((err) => {
      return res.json({
        state: -1,
        message: (err && err.message) || "something went Wrong",
        data: null,
      });
    });
}

async function grantesopreminder() {
  var obj = {
    action: "grantesopreminder",
  };
  obj = JSON.stringify(obj);
  commonModel
    .mysqlPromiseModelService(proc.esop, [obj])
    .then((results) => {
      if (
        results &&
        results[1] &&
        results[1][0] &&
        results[1][0].state &&
        results[1][0].state == 1
      ) {
        subjecttype = "<Approve Grant ESOP>";
        headingtype = "Approve Grant ESOP";
        let userlist = results && results[0];
        // async.eachSeries(Object.keys(userlist), function (item, cb) {
        var counter = 1;
        userlist.forEach(
          function (item) {
            var emailObj = {
              email: (item && item.useremail) || "",
              mailType: "esopgrantapprovereminder",
              moduleid: "ESOP",

              subjectVariables: {
                subject: subjecttype,
              },

              headingVariables: {
                heading: headingtype,
              },

              bodyVariables: {
                trxempname: (item && item.username) || "",
                trxesopnumber: (item && item.stock) || "",
                trxgrantdate: (item && item.trxgrantdate) || "",
                trxempdob: (item && item.trxempdob) || "",
                trxempsupervisor: (item && item.trxempsupervisor) || "",
                trxempemail: (item && item.trxempemail) || "",
                // userid: req.body && req.body.userid
              },
            };
            counter = counter + 1;
            setTimeout(() => {
              mailservice.mail(
                emailObj,
                function (err, response) {
                  // cb();
                  if (err) {
                    console.log("error while sending eamil.", err);
                  }
                },
                counter * 3000
              );
            });
          },
          function (err) {
            if (err) {
              console.log("error while sending eamil.", err);
            }
          }
        );
      }
    })
    .catch((err) => {
      console.log("Error form Grant esop approve reminder", err);
    });
}

async function esopcaptable(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      state: -1,
      message: "Send required data",
    });
  }
  let checkEventDir = path.join("uploads", "captable");
  let fileObj = {};
  let fileObj1 = {};
  let newFilesArr = [];
  let attachmentsArr = [];
  if (req.files) {
    makeDir(checkEventDir);
    let file = req.files.file;
    if (req.body.attachCount == 1) {
      file = [file];
    }
    for (let i = 0; i < file.length; i++) {
      fileObj = {};
      fileObj1 = {};
      let newFileName = `${Date.now()}_${file[i].name}`;
      let checkEventDir = path.join("uploads", "captable");
      await file[i].mv(
        path.join(appRoot && appRoot.path, checkEventDir, newFileName)
      );
      fileObj.path = `captable/${newFileName}`;
      fileObj.name = file[i].name;
      newFilesArr.push(fileObj);
      fileObj1.filename = file[i].name;
      fileObj1.path = path.join(
        appRoot.path,
        `uploads/captable/${newFileName}`
      );
      attachmentsArr.push(fileObj1);
    }
    req.body.file = newFilesArr;
  }

  let oldfile = req.body && req.body.oldfile && JSON.parse(req.body.oldfile);
  let obj = req.body;
  obj.oldfile = oldfile;
  obj = JSON.stringify(obj);

  commonModel
    .mysqlPromiseModelService(proc.mstcaptable, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
      });
    })
    .catch((err) => {
      return res.json({
        state: -1,
        message: err.message || err,
      });
    });
}

async function viewesopopertaion(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      state: -1,
      message: "Send required data",
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstesopdetails, [obj])
    .then((results) => {
      var dbresult = commonCtrl.lazyLoading(results[0], req.body);
      if (dbresult && "data" in dbresult && "count" in dbresult) {
        return res.json({
          state: 1,
          message: "success",
          data: dbresult.data,
          count: dbresult.count,
        });
      }
    })
    .catch((err) => {
      return res.json({
        state: -1,
        message: err.message || err,
      });
    });
}

function viewesopdata(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      state: -1,
      message: "Send required data",
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstesop, [obj])
    .then((results) => {
      var dbresult = commonCtrl.lazyLoading(results[0], req.body);
      if (dbresult && "data" in dbresult && "count" in dbresult) {
        return res.json({
          state: 1,
          message: "success",
          data: dbresult.data,
          count: dbresult.count,
        });
      }
    })
    .catch((err) => {
      return res.json({
        state: -1,
        message: err.message || err,
      });
    });
}

function employeeexerciserequest(req, res) {
  try {
    if (!req.body || !req.body.action) {
      return res.json({
        state: -1,
        message: "Send required data",
      });
    }
    let obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.esop, [obj])
      .then((results) => {
        let typeofmail = "esopemployeeexerciserequest";
        sendesopmail(req.body, typeofmail, results[0]);
        res.json({
          state: 1,
          message: "Success",
          data: results,
        });
      })
      .catch((err) => {
        return res.json({
          state: -1,
          message: err.message || err,
        });
      });
  } catch (e) {
    console.log("Errror ,,,,,,", e);
    return res.json({
      state: -1,
      message: "Inernal Server Error",
    });
  }
}

function allowemployeeexercise(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      state: -1,
      message: "Send required data",
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstesop, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
      });
    })
    .catch((err) => {
      return res.json({
        state: -1,
        message: err.message || err,
      });
    });
}

function esoprefreshdata(req, res) {
  if (!req.body) {
    return res.json({
      state: -1,
      message: "Send required data",
    });
  }
  let obj = req.body;
  obj.action = "esopvesting";
  obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.esop, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
      });
    })
    .catch((err) => {
      return res.json({
        state: -1,
        message: err.message || err,
      });
    });
}

function esopcheckerapprove(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      state: -1,
      message: "Send required data",
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.esopcheckerapprove, [obj])
    .then((results) => {
      let typeofmail = "";
      let reqtype = (req.body && req.body.reqtype) || "";
      let isapproved = (req.body && req.body.isapproved) || "";

      if (reqtype == "OptionExercise" && isapproved == 1) {
        typeofmail = "esopexerciseapproved";
      } else if (reqtype == "OptionSurrender" && isapproved == 1) {
        typeofmail = "esopexerciserejected";
      } else if (reqtype == "GrantOption" && isapproved == 1) {
        typeofmail = "esopgrant";
      }
      sendesopmail(req.body, typeofmail, results[0]);
      return res.json({
        state: 1,
        message: "Success",
        data: results,
      });
    })
    .catch((err) => {
      return res.json({
        state: -1,
        message: err.message || err,
      });
    });
}

function esopcheckerview(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      state: -1,
      message: "Send required data",
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.esopcheckerview, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "Success",
        data: results,
      });
    })
    .catch((err) => {
      return res.json({
        state: -1,
        message: err.message || err,
      });
    });
}

function mstexerciseapprove(req, res) {
  try {
    if (!req.body || !req.body.action) {
      return res.json({
        state: -1,
        message: "Send required data",
      });
    }
    let obj = JSON.stringify(req.body);
    commonModel
      .mysqlPromiseModelService(proc.mstesopexercise, [obj])
      .then((results) => {
        let typeofmail =
          (req.body && req.body.isapproved) == 1
            ? "esopexerciseapproved"
            : "esopexerciserejected";
        sendesopmail(req.body, typeofmail, results[0]);
        res.json({
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
    console.log("Errror", e);
    return res.json({
      state: -1,
      message: "Inernal Server Error",
    });
  }
}

function sendesopmail(reqdata, reqtypemail, results) {
  let counter = 1;
  let list = results;
  let subjecttype;
  let headingtype;
  if (reqtypemail == "esopemployeeexerciserequest") {
    subjecttype = "<Employee has Requested for Exercise ESOPs>";
    headingtype == "Employee has Requested for Exercise ESOPs.";
  } else if (reqtypemail == "esopexerciseapproved") {
    subjecttype = "<Your ESOPs exercise Request has been Approved>";
    headingtype = "Your ESOPs exercise Request has been Approved";
  } else if (reqtypemail == "esopexerciserejected") {
    subjecttype = "<Your ESOPs exercise Request has been Rejected";
    headingtype = "Your ESOPs exercise Request has been Rejected";
  } else if (reqtypemail == "esopgrant") {
    subjecttype = "<Congratulations ESOPs are Granted to You.>";
    headingtype = "Congratulations ESOPs are Granted to You.";
  }
  setTimeout(() => {
    // console.log('reqtypemail', reqtypemail)
    list.forEach(function (item) {
      let emailObj = {
        email: (item && item.useremail) || "",
        // cc: 'anuj.kumar@polestarllp.com,faiyaz.ahmad@polestarllp.com',
        mailType: reqtypemail,

        // moduleid: reqdata && reqdata.moduleid ? reqdata && reqdata.moduleid : 'ESOP',
        userid: reqdata.userid ? reqdata.userid : reqdata.createdby,
        subjectVariables: {
          subject: subjecttype,
        },
        headingVariables: {
          heading: headingtype,
        },
        bodyVariables: {
          trxesopexerciserequestnumber:
            (item && item.trxesopexerciserequestnumber) || "",
          trxempname: (item && item.username) || "",
          trxesopexerciseapprovednumber:
            (item && item.trxesopexerciseapprovednumber) || "",
          trxempdob: (item && item.trxempdob) || "",
          trxempsupervisor: (item && item.trxempsupervisor) || "",
          trxempemail: (item && item.trxempemail) || "",

          trxesopnumber: (reqdata && reqdata.stock) || "",
          trxgrantdate: (item && item.trxgrantdate) || "",
          userid: (reqdata && reqdata.userid) || (reqdata && reqdata.createdby),
          trxesopexerciserejectreason: (reqdata && reqdata.rejectreason) || "",
        },
      };
      counter = counter + 1;
      mailservice.mail(emailObj, function (err) {
        if (err) {
          console.log("MAILLLLLLLLLLL", err);
        }
      });
    });
  }, counter * 3000);
}

async function uploadLetter(req, res) {
  try {
    if (!req.body || !req.body.action || !req.body.id || !req.body.type) {
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
    let type = (req.body && req.body.type) || "-";
    var lettertype;
    if (type == 1) {
      lettertype = "Grant";
    } else if (type == 2) {
      lettertype = "Exercise";
    } else if (type == 3) {
      lettertype = "Surrender";
    } else {
      lettertype = "@";
    }
    let checkEventDir1 = path.join("uploads");
    makeDir(checkEventDir1);
    let checkEventDir2 = path.join("uploads", "grantletter");
    makeDir(checkEventDir2);
    let file = req.files.file;
    let newFileName = `${Date.now()}_${lettertype}_${file.name}`;
    await file.mv(
      path.join(appRoot && appRoot.path, checkEventDir2, newFileName)
    );
    let filepath = `grantletter/${newFileName}`;
    req.body.filepath = filepath;
    let obj = req.body;
    obj = JSON.stringify(obj);
    commonModel
      .mysqlPromiseModelService(proc.mstesopdetails, [obj])
      .then((results) => {
        return res.json({
          state: 1,
          message: "Success",
          data: results,
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
      state: 1,
      message: e.message || e,
      data: null,
    });
  }
}
