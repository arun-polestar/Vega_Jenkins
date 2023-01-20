const proc = require('../../../common/procedureConfig')
const _ = require('underscore');
const makeDirectories = require('../../../common/utils').makeDirectories;
const fs = require('fs')
var path = require('path');
var parseDataCtrl = require('../../../vegaHR/upload/Controller')
var parserService = require('../../../../services/parserService')
const uploadController = require('../../upload/Controller');
const appRoot = require('app-root-path');

const config = require("../../../../config/config");
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;



var textractConfig = {
  preserveLineBreaks: true,
  tesseract: {
    lang: "eng"
  }
}
module.exports = {
  candidateResumeUpload: candidateResumeUpload,
}

function candidateResumeUpload(req, res) {
  makeDirectories('upload')
  makeDirectories('/uploads/lemonade')

  let popupflag = req.body.popupflag
  if (req && req.files) {
    if (req.files['file']) {
      let file = req.files.file;
      filename = file.name.split('.');
      dirname = path.join(appRoot && appRoot.path, '/uploads/lemonade/' + filename[0] + Date.now() + '.' + filename[1]);
      var uploadedData = {
        filename: file.name,
        // uploadedpath: '/lemonade/'+ filename[0] + Date.now() + '.' + filename[1],
        uploadedpath: dirname,
        popupflag: popupflag
      }
      // //console.log('zzzzzzzzzzzzzzzzz',uploadedData.uploadedpath);

      file.mv(dirname, function (err) {
        if (err) {
          return res.json({
            state: -1,
            message: err.reason || 'Error in uploading File',
            data: null
          });
        } else if (popupflag == 'true') {
          uploadController.parseData(uploadedData, '1', 'campus-placement', req.body.referredby)
            .then(result => {
              return res.json({
                state: 1,
                message: 'success',
                data: result
              });

            })
            .catch(e => {
              uploadedData.uploadedpath = '/lemonade/' + filename[0] + Date.now() + '.' + filename[1];
              //console.log('error in Parsing----->>>',e);
              return res.json({
                state: -1,
                message: "Resume parsing failed! please try another resume.",
                data: uploadedData
              });
            });
        }
        else {
          uploadedData.uploadedpath = '/lemonade/' + filename[0] + Date.now() + '.' + filename[1];
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
