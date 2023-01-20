'use strict'
const { mysqlPromiseModelService: query } = require('../common/Model');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { makeDirectories: makeDir } = require("../../routes/common/utils");
const appRoot = require('app-root-path');
const config = require("../../config/config");
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;




/**
 * @description Send request to db and handle response for 
 * `usp_admindetails_operations` prcedure
 * @param {*} req 
 * @param {*} res 
 */
async function senddb(req, res) {
  try {
    const obj = JSON.stringify(req.body)
    const [dbres, dbres1] = await query('call usp_admindetails_operations(?)', [obj]);
    const r = dbres && dbres[0];
    const r1 = dbres1 && dbres1[0];
    if (r && r.state == 1 || r1 && r1.state == 1)
      return res.json({
        state: 1,
        message: r && r.message || r1 && r1.message || "success",
        data: dbres
      });
    throw new Error('Something Went Wrong')
  } catch (err) {
    console.error(err);
    return res.json({ state: -1, message: err.message || err || "Failed!" });
  }
}

module.exports = {
  addtrxDocuments: async (req, res) => {
    if (!req.body['title'])
      return res.json({ state: -1, message: 'Documents Title Required!' });
    if (req.files && req.files.documents) {
      let file = req.files.documents;
      if (!Array.isArray(file) && Object.keys(file).length) {
        file = [file]
      }
      const newFilesArr = []
      const dir = path.join('uploads', 'trxDocuments')
      makeDir(dir)
      for (let i = 0; i < file.length; i++) {
        const fileObj = {};
        const fileName = `${uuidv4()}${path.extname(file[i].name)}`;
        await file[i].mv(path.join(appRoot.path,dir, fileName))
        fileObj.path = path.join('trxDocuments', fileName)
        fileObj.name = file[i].name;
        newFilesArr.push(fileObj);
      }
      req.body['documents'] = newFilesArr;
    }
    if (req.body['olddocpath'] && req.body['documents']) {
      const arr = JSON.parse(req.body['olddocpath']);
      req.body['documents'] = req.body['documents'].concat(arr);
    }
    req.body['reqtype'] = req.body['reqtype'] ? req.body['reqtype'] : 'addtrxdoc';
    return senddb(req, res)
  },
  
  gettrxDocuments: async (req, res) => {
    req.body['reqtype'] = req.body['reqtype'] ? req.body['reqtype'] : 'gettrxdoc';
    return senddb(req, res)
  }
}
