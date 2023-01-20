'use strict'
const config = require('../../../config/config')
const fs = require('fs')
var path = require('path');
const appRoot = require('app-root-path');

appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;


module.exports = {
  expenseAttachments: expenseAttachments,
}

function expenseAttachments(req, res) {
  var checkdirroot = path.join(appRoot && appRoot.path, '/uploads')
  if (!fs.existsSync(checkdirroot)) {
    fs.mkdirSync(checkdirroot)
  }
  var checkdir = path.join(appRoot && appRoot.path, '/uploads/expense')
  if (!fs.existsSync(checkdir)) {
    fs.mkdirSync(checkdir)
  }
  //console.log('xxxxxxxxxxxxxxxxxxxxx',req.files);

  let popupflag = req.body.popupflag
  if (req && req.files) {
    if (req.files['file']) {
      let file = req.files.file;
      let filename = file.name.split('.');
      let dirname = path.join(appRoot && appRoot.path, '/uploads/expense/' + filename[0] + Date.now() + '.' + filename[1]);
      var uploadedData = {
        filename: file.name,
        uploadedpath: '/expense/' + filename[0] + Date.now() + '.' + filename[1],
        popupflag: popupflag
      }
      file.mv(dirname, function (err) {
        if (err) {
          return res.json({
            state: -1,
            message: err.reason || 'Error in uploading File',
            data: null
          });
        } else {
          return res.json({
            state: 1,
            message: 'success',
            data: uploadedData
          });
        }
      });
    } else {
      res.json({
        state: -1,
        msg: 'file is not valid',
        data: null
      });
    }
  } else {

    res.json({
      state: -1,
      msg: 'please select a file!!!',
      data: null
    });
  }
}