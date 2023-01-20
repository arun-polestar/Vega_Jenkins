const fs = require('fs')
const path = require('path')
const xlsx = require('xlsx')
const query = require('../../common/Model').mysqlPromiseModelService;
const verifyNull = require('../../common/utils').removeFalseyLike;
const makeDir = require("../../common/utils").makeDirectories;
// const readXlsxFile = require('read-excel-file/node')

const commonCtrl = require('../../common/Controller')
const lodash = require('lodash');

module.exports = {
  importCompetencyExcel: importCompetencyExcel,
  getCompetencyDetails: getCompetencyDetails,
  getCompetencyRole

};
const ACTION = {
  COMPETENCY_DROPDOWN: 'competency_role_dropdown'
}

function uploadCompetency(req, res) {
  return new Promise((resolve, reject) => {
    let sampleFile;
    let uploadPath;
    if (req.files && Object.keys(req.files).length == 0) {
      return res.json({
        "state": -1,
        "message": "Something Went Wrong in Uploading ",
        "data": null
      });
    }
    sampleFile = req.files.file;
    var fileformat = sampleFile.name.split('.')[1].toLowerCase();
    if (fileformat != 'xlsx') //|| fileformat != 'csv') 
    {
      return res.json({
        "state": -1,
        "message": "Unsupported File Format. Upload XLSX File Format",
        "data": null
      });
    }
    uploadPath = makeDir(path.join('uploads', 'Employee', 'Competency'));
    uploadPath = path.join(uploadPath, `${Date.now()}_${req.files.file.name}`);
    sampleFile.mv(uploadPath, (err) => {
      if (err) {
        // console.log('err', err)
        return res.json({
          "state": -1,
          "message": "Something Went Wrong in Uploading ",
          "data": null
        });
      } else {
        let wb = xlsx.readFile(uploadPath, {
          type: 'binary',
          cellDates: true,
          dateNF: 'yyyy/mm/dd;@'
        });
        let sheet_name_list = wb.SheetNames;
        let ws = wb.Sheets[sheet_name_list];
        let excelArr = xlsx.utils.sheet_to_json(ws, {
          raw: false
        });

        const columnsArray = xlsx.utils.sheet_to_json(ws, { header: 1 })[0];

        if (excelArr && excelArr.length == 0) {

          return res.json({
            "state": -1,
            "message": "File is Empty ",
            "data": null
          });
        }


        var headerkeys = columnsArray.sort();
        headerkeys = headerkeys && headerkeys.toString();
        //console.log('header keys in here ', headerkeys)
        if (headerkeys == "Employee Code,Financial Year,Primary Competency,Primary Skill,Quarter,Secondary Competency,Secondary Skill" ||
          -          headerkeys == "'Employee Code','Financial Year','Primary Competency','Primary Skill','Quarter','Secondary Competency','Secondary Skill'") {
          var filteredarry = lodash.reject(excelArr, (item) => {
            return item['Employee Code'] == '' &&
              item['Financial Year'] == '' &&
              item['Quarter'] == ''
          })
          if (filteredarry && filteredarry.length == 0) {
            reject("File is Empty");
          } else {
            // 
            _.map(filteredarry, (item) => {

              item.ecode = item['Employee Code'];
              item.primary_skill = item['Primary Skill']
              item.secondary_skill = item['Secondary Skill']
              item.primary_competency = item['Primary Competency'];
              item.secondary_competency = item['Secondary Competency']
              item.quarter = item['Quarter'];
              item.financial_year = item['Financial Year'];

            })
            resolve(filteredarry)

          }
        } else {
          reject("File Template is Not Valid  OR  File Column is Empty");
        }
      }
    });
  })
}

function importCompetencyExcel(req, res) {
  uploadCompetency(req, res).then(async (value) => {
    if (value) {
      let obj2 = JSON.stringify(value);
      let obj = JSON.stringify({
        action: "upload_competency",
        createdby: req.body.createdby
      })
      try {
        let results = await query("call usp_employee_competency(?,?)", [obj, obj2])
        //return res.json({ state: 1, message: 'Success', data: results });
        if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
          return res.json({
            state: results[1][0].state,
            message: results && results[1] && results[1][0] && results[1][0].message,
            data: results
          });
        } else if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == -1) {
          return res.json({
            state: results[1][0].state,
            message: results && results[1] && results[1][0] && results[1][0].message,
            data: results
          });
        } else {
          return res.json({
            state: -1,
            message: "Something Went Wrong",
            data: null
          });
        }
      } catch (err) {
        return res.json({ state: -1, message: "Something went wrong", err: err })
      }
    }
  }).catch(err => res.json({ state: -1, message: "Something went wrong", err: err }))
}

async function getCompetencyDetails(req, res) {
  try {
    let obj = req.body;
    obj.action = 'getcompetencydata'
    //await verifyNull(obj);
    let result = await query('call usp_employee_competency(?,?)', [JSON.stringify(obj), JSON.stringify({})]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }
    let dbresult = commonCtrl.lazyLoading(result[0], req.body);
    if (dbresult && "data" in dbresult && "count" in dbresult) {
      return res.json({
        state: 1,
        message: "success",
        data: dbresult.data,
        count: dbresult.count,
      });
    }
    //return res.json({ message: 'Success', state: 1, data: result })
  } catch (error) {
    //console.log(error);
    return res.json({ message: error, state: -1, data: null });
  }
}

async function getCompetencyRole(req, res) {
  try {
    let reqData = req.body;
    reqData.action = req.body.action ? req.body.action : ACTION.COMPETENCY_DROPDOWN;
    let [results] = await query('call usp_employee_competency(?,?)', [JSON.stringify(reqData), , JSON.stringify({})]);
    return res.json({ state: 1, message: 'Success', data: results });

  } catch (err) {
    return res.json({ state: 1, message: "Success", data: null })
  }
}
