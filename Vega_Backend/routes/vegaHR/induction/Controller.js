const commonModel = require('../../common/Model');
const proc = require('../../common/procedureConfig');
const mailservice = require('../../../services/mailerService');
const path = require('path');
const async = require('async');
const _ = require('underscore');
const crypto = require('crypto');
const { makeDirectories } = require('../../common/utils')




module.exports = {
  saveOnBoardCandidateInfo: saveOnBoardCandidateInfo,
  saveOnBoardCandidateDocs: saveOnBoardCandidateDocs,
  getCandidateDoc: getCandidateDoc,
  getMultipleMastersExt: getMultipleMastersExt,
  candidateFeedbackAdd: candidateFeedbackAdd,
  HRFeedbackAdd: HRFeedbackAdd,
  candidateFeedbackView: candidateFeedbackView,
  addmoredoc: addmoredoc

}

function saveOnBoardCandidateInfo(req, res) {
  var candidateInfo = req.body && req.body.candidateInfo;
  var candidateFamilyDetail = req.body && req.body.candidateFamilyDetail;

  candidateInfo.action = req.body.action;
  var details = req.body && req.body.details;

  candidateInfo = JSON.stringify(candidateInfo);
  candidateFamilyDetail = JSON.stringify(candidateFamilyDetail);
  details = JSON.stringify(details);
  commonModel.mysqlModelService(proc.onboardadd, [candidateInfo, candidateFamilyDetail, details], function (err, results) {
    if (err) {
      return res.json({ message: err.message || err, state: -1, data: null });
    }
    return res.json({ message: 'success', state: 1, data: results, candidateData: results });
  });
}

function saveOnBoardCandidateDocs(req, res) {
  try {
    var obj = JSON.stringify(req.body);
    var candidateInfo = {
      'action': req.body.action || '', token: req.body.token || ''
      , candidateid: req.body.candidateid || '', deletefile: req.body.deletefile || ''
    };
    candidateInfo = JSON.stringify(candidateInfo);
    var filekeys = req.body.keyList && req.body.keyList.split(',');
    var fkeys = req.body.fkeys && req.body.fkeys.split(',');
    var findex = req.body.index && req.body.index.split(',')

    var countfiles = (req.body.attachCount);
    countfiles = parseInt(countfiles);
    //console.log("countfilessssssss", countfiles, req.body.candidateid)
    if (countfiles && countfiles != 0) {

      let uploadPath = makeDirectories(path.join('uploads', 'RmsCandidateDocs', req.body.candidateid))
      var filesUploaded = [];
      async.times(countfiles, function (n, next) {
        var sampleFile = {};
        sampleFile = req.files['file[' + n + ']'];
        if (sampleFile) {
          let filepath = path.join(uploadPath, sampleFile.name)
          //console.log('sampleFile.name', sampleFile.name)
          sampleFile.mv(filepath, (err) => {
            //console.log('ERRRORRRRRRRRRRRRRRRR IN MOVING', err)
            if (!err) {
              filesUploaded.push({
                filename: sampleFile.name,
                doctype: filekeys[n],
                ftype: fkeys[n],
                index: findex && findex[n],
                filepath: path.join('RmsCandidateDocs', req.body.candidateid, sampleFile.name),
              });
            }
            next(null, 'success');
          })
        } else {
          next(null, 'success');
        }
      }
        , (err, users) => {
          if (filesUploaded.length) {
            var obj = JSON.stringify(filesUploaded);
            commonModel.mysqlModelService(proc.onboardadd, [candidateInfo, obj, ''], function (err, results) {
              if (err) {
                return res.json({ message: 'Some error occured.', data: err, state: -1 });
              }
              else {
                return res.json({ message: 'Success', state: 1, data: null });
              }
            });
          }
          else {
            return res.json({ message: 'No File Attach found.', data: null, state: -1 });
          }
        });
    } else {
      commonModel.mysqlModelService(proc.onboardadd, [candidateInfo, obj, ''], function (err, results) {
        if (err) {
          return res.json({ message: 'Some error occured.', data: err, state: -1 });
        }
        else {
          res.json({ message: 'Success', state: 1, data: null });
        }
      });
    }
  } catch (err) {
    //console.log('ERRRRRRRRRRRRRRRRRR', err)
    return res.json({ message: 'Something went wrong', data: null, state: -1 });
  }

}


function getCandidateDoc(req, res) {
  var body = req.body;
  body.reqtype = 'view';
  var obj = JSON.stringify(body);
  commonModel.mysqlPromiseModelService(proc.trxrequisition, [obj])
    .then(results => {
      return res.json({ state: 1, data: results, message: 'Success' });
    })
    .catch(err => {
      return res.json({ state: -1, data: null, message: 'Failure' });
    })
}
function getMultipleMastersExt(req, res) {
  req.body.isactive = 1;
  req.body.createdby = 1;
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService('call usp_mstconfig_view(?)', [obj], function (err, results) {
    if (err) {
      return res.json({
        state: -1,
        data: null,
        message: err.message || JSON.stringify(err)
      });
    }
    return res.json({ state: 1, data: results[0], message: "Success" });
  });
}

function candidateFeedbackAdd(req, res) {
  let obj = req.body && req.body.questiondata;
  //var mykey = crypto.createDecipher('aes-128-cbc', '!mtrenctyption!@');
  //var candidateid = mykey.update(req.body && req.body.id, 'hex', 'utf8')
  //candidateid += mykey.final('utf8');
  var candidateid;

  const key = crypto.scryptSync('!mtrenctyption!@', 'salt', 24);
  const iv = Buffer.alloc(16, 0); // Initialization vector.


  var decrypt = crypto.createDecipheriv('aes-192-cbc', key, iv);
  candidateid = decrypt.update(req.body && req.body.id, 'hex', 'utf8');
  candidateid += decrypt.final('utf8')
  //console.log("candidateFeedbackAdd", candidateid);


  req.body.candidateid = candidateid;
  let action = 'add';
  _.map(obj, function (item) {
    item.feedbacktype = 'Candidate';
    item.candidateid = req.body.candidateid;
  })
  obj = JSON.stringify(obj);
  commonModel.mysqlPromiseModelService('call usp_rmscandidatefeedback_operations(?,?)', [obj, action])
    .then(results => {
      return res.json({ state: 1, data: results[0], message: 'Success' });
    })
    .catch(err => {
      return res.json({ state: -1, data: err, message: 'Something went wrong' });
    })
}

function HRFeedbackAdd(req, res) {
  let obj = req.body && req.body.questiondata;
  let action = 'add';
  _.map(obj, function (item) {
    item.userid = req.body.createdby;
    item.feedbacktype = 'HR';
  });
  obj = JSON.stringify(obj);
  commonModel.mysqlPromiseModelService('call usp_rmscandidatefeedback_operations(?,?)', [obj, action])
    .then(results => {
      return res.json({ state: 1, data: results[0], message: 'Success' });
    })
    .catch(err => {
      return res.json({ state: -1, data: err, message: 'Something went wrong' });
    })
}

function candidateFeedbackView(req, res) {
  let obj = req.body;
  let action = 'viewfeedback';
  obj = JSON.stringify(obj);
  commonModel.mysqlPromiseModelService('call usp_rmscandidatefeedback_operations(?,?)', [obj, action])
    .then(results => {
      return res.json({ state: 1, data: results[0], message: 'Success' });
    })
    .catch(err => {
      return res.json({ state: -1, data: err, message: 'Something went wrong' });
    })
}



function addmoredoc(req, res) {
  if (!req.body.candidateid || !req.files || !req.body.action) {
    return res.json({ message: 'send required data', state: -1 })
  }
  let uploadPath = makeDirectories(path.join('uploads', 'RmsCandidateDocs', req.body.candidateid))

  req.body = _.mapObject(req.body, function (val, key) {
    if (val && val.constructor === Array) {
      val = val.toString();
    }
    return val;
  })
  var obj = {
    candidateid: req.body.candidateid,
    action: req.body.action,
    bgvtypeid: req.body && req.body.bgvtypeid
  };
  var sampleFile = req.files && req.files.file;
  //console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@', req)

  //console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@', sampleFile)
  var filepath = path.join(uploadPath, sampleFile.name)
  sampleFile.mv(filepath, (err) => {
    if (!err) {

      obj['filename'] = sampleFile.name;
      obj['filepath'] = path.join('RmsCandidateDocs', req.body.candidateid, sampleFile.name);
      obj = JSON.stringify(obj);

      commonModel.mysqlPromiseModelService(proc.requisition, [obj])
        .then(results => {
          if (results && results[0] && results[0][0] && results[0][0].state && results[0][0].state == 1) {
            return res.json({ state: results[0][0].state, message: results && results[0] && results[0][0] && results[0][0].message, data: results && results[0] });
          } else {
            return res.json({ state: -1, message: "Something went wrong", data: null });
          }
        })
        .catch(err => {
          return res.json({ state: -1, data: null, message: err.message || err });
        })
    } else {
      return res.json({ state: -1, message: "error in file", data: null });
    }
  });

}