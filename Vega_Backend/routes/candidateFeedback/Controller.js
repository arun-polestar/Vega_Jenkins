'use strict'
const commonModel = require('../common/Model');
const proc = require('../common/procedureConfig');
var _ = require('underscore');
const crypto = require('crypto');
const prediction = require("../joiningPrediction/Controller")



module.exports = {
  saveFeedback: saveFeedback,
  saveHrFeedback: saveHrFeedback,
  getFeedbackQuestions: getFeedbackQuestions
}

function saveFeedback(req, res) {
  if (req && req.body) {
    var reqData = req.body;
    //encrypted in pipeline api function-> sendlinktocandidate
    try {
      //var mykey = crypto.createDecipher('aes-128-cbc', '!mtrenctyption!@');
      var candidateid; //= mykey.update(reqData && reqData.id, 'hex', 'utf8')            
      //candidateid += mykey.final('utf8');
      const key = crypto.scryptSync('!mtrenctyption!@', 'salt', 24);
      const iv = Buffer.alloc(16, 0); // Initialization vector.


      var decrypt = crypto.createDecipheriv('aes-192-cbc', key, iv);
      candidateid = decrypt.update(reqData && reqData.id, 'hex', 'utf8');
      candidateid += decrypt.final('utf8')


      //console.log("saveFeedback", candidateid);

      reqData.id = candidateid
      reqData = JSON.stringify(reqData);

      commonModel.mysqlPromiseModelService(proc.savefeedback, [reqData])
        .then(results => {
          res.json({
            message: 'Thank you for your valueable feedback',
            data: results,
            state: 1
          });
        }).catch(err => {
          res.json({
            message: err,
            data: null,
            state: -1
          })
        })
    } catch (err) {
      res.json({
        message: "You are not a valid candidate",
        data: null,
        state: -1
      })
    }
  }

}

function saveHrFeedback(req, res) {
  if (!req.body.createdby) {
    res.json({
      message: "Not a valid user",
      data: null,
      state: -1
    })
  } else {
    try {
      var obj = req.body;
      obj = JSON.stringify(obj);
      // //console.log('mtr------>>>>>>>>>>>>>>', obj);
      commonModel.mysqlPromiseModelService(proc.savefeedback, [obj])
        .then(results => {
          prediction.getPrediction()
          res.json({
            message: 'Thank you for your valueable feedback',
            data: results,
            state: 1
          });
        }).catch(err => {
          res.json({
            message: err,
            data: null,
            state: -1
          })
        })
    } catch (err) {
      res.json({
        message: err,
        data: null,
        state: -1
      })
    }
  }
}

function getFeedbackQuestions(req, res) {
  if (req && req.body) {
    var reqData = req.body;
    //encrypted in pipeline api function-> sendlinktocandidate
    try {
      // var mykey = crypto.createDecipher('aes-128-cbc', '!mtrenctyption!@');
      var candidateid //= mykey.update(reqData && reqData.id, 'hex', 'utf8')            
      //candidateid += mykey.final('utf8');
      const key = crypto.scryptSync('!mtrenctyption!@', 'salt', 24);
      const iv = Buffer.alloc(16, 0); // Initialization vector.


      var decrypt = crypto.createDecipheriv('aes-192-cbc', key, iv);
      candidateid = decrypt.update(reqData && reqData.id, 'hex', 'utf8');
      candidateid += decrypt.final('utf8')
      //console.log("getFeedbackQuestions", candidateid);

      reqData.id = candidateid
      reqData = JSON.stringify(reqData);

      commonModel.mysqlPromiseModelService(proc.savefeedback, [reqData])
        .then(results => {
          res.json({
            message: 'Success',
            data: results[0],
            state: 1
          });
        }).catch(err => {
          res.json({
            message: err,
            data: null,
            state: -1
          })
        })
    } catch (err) {
      res.json({
        message: "You are not a valid candidate",
        data: null,
        state: -1
      })
    }
  }
}