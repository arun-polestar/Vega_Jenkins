const commonModel = require('../../common/Model');
const proc = require('../../common/procedureConfig');
const appRoot = require('app-root-path');
const path = require('path');
const mime = require('mime');
const fs = require('fs');
const Promise = require('bluebird');
const fsAsync = Promise.promisifyAll(fs);
const _ = require('underscore');
const commonCtrl = require('../../common/Controller');

const config = require("../../../config/config");
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;



module.exports = {

  downloadResume: downloadResume,
  getRecomendation: getRecomendation,
  saveAssisstantFeedback: saveAssisstantFeedback,
  viewFeedback: viewFeedback,
  BulkInterviewFeedback: BulkInterviewFeedback
  // satyamTest:satyamTest
}






/*---------------------------------------------------------------------------------------------------*
*                                       Download Resume                                              *
*----------------------------------------------------------------------------------------------------*/

function downloadResume(req, res) {

  var body = req.body;
  var file = path.join(appRoot.path, 'uploads', body.url);
  var filename = path.basename(file);
  var type = mime.lookup(file);
  return fsAsync.readFileAsync(file)
    .then(function (result) {
      res.json({ message: 'success', result: result, filename: filename, type: type, state: 1 });
    })
    .catch(function (err) {
      res.json({ message: 'failed', error: err.message || err, filename: filename, filetype: type, state: -1 });
    })

}

/*-------------------------------------End Download Resume------------------------------------------*/



/*---------------------------------------------------------------------------------------------------*
*                                       Action Screening                                             *
*----------------------------------------------------------------------------------------------------*/


/*-------------------------------------End Action Screening------------------------------------------*/


/*-------------------------------TEST-------------------------------*/


function satyamTest(req, res) {

  var body = JSON.stringify(req.body);
  commonModel.mysqlModelService('call test(?)', [body], function (err, result) {
    if (err) {
      return res.json({ err: err })
    }
    else {

      if (!result[0] || !result[1]) {
        return res.json({ err: "result not found" });
      }
      var rmsupload = result[0];
      var mstemp = result[1];
      var userid = [];
      //for(var i = 0;mstemp.length;i++) userid.push(mstemp[i]);
      for (var i = 0; i < rmsupload.length; i++) {
        //var a = Object.keys(result[0][i])
        var emp = [];
        var referredby = 65; rmsupload[i].referredbyid;
        //search into mstemployee table
        emp = _.where(mstemp, { userid: referredby });

        //search using binary search
        //_.sortedFindBy(array, value, function(x){x.timestamp});

        if (emp && rmsupload[i].isactive) {
          result[0][i].referredby = emp[0].firstname + ' ' + emp[0].lastname + '(' + emp[0].ecode + ')';
        }
      }
      // let arr3=[];
      //             result[0].forEach((itm, i) => {
      //                 arr3.push(Object.assign({}, itm, result[1][i]));
      //               });
      // let arr3=_.map(result[0],function(item){
      //     if(item.referredby){


      // var bbb=_.where(result[1],{userid:item.referredby});
      //     item.referredbyval=bbb && bbb[0] && (bbb[0].firstname+' '+ bbb[0].lastname);
      //     }
      //     return item;
      // })
      var individualFilter = {};
      var reqdata = req.body
      filterkeys = [];
      _.map(reqdata, function (val, key) {
        if (key.slice(0, 6) == 'search' && reqdata[`${key}`]) {
          individualFilter[`${key.replace('search', '')}`] = reqdata[`${key}`];
          filterkeys.push(key.replace('search', ''));
        }
      })
      //console.log('keysssss', individualFilter);
      var obj, r;

      //Searching...
      if (req.body.globalsearchkey) {
        obj = filteredWines(result[0], req.body.globalsearchkey, filterkeys);

      } else {
        obj = _.filter(result[0], individualFilter)
        //console.log('indiciudal search', obj);
      }

      //Sorting...
      if (req.body.sortorder == 'A') r = _.sortBy(obj, req.body.sortfield)
      else r = _.sortBy(obj, req.body.sortfield).reverse();

      //Applying Limit on record to be sent 
      r = obj.slice(req.body.startRecord, req.body.limit);
      // r=result[0];
      return res.json({ result: r });

    }
  })
}


/*-------------------------------------Get Recommendation----------------------------------------------*/
function getRecomendation(req, res) {
  if (!req.body) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  var obj = JSON.stringify(req.body);
  //console.log('dsdsdsd', obj)
  commonModel.mysqlPromiseModelService(proc.interviewquestion_view, [obj])
    .then(results => {
      return res.json({ state: 1, data: results[0], message: 'Success' });
    })
    .catch(err => {
      return res.json({ state: -1, data: null, message: err });
    });
}

/*--------------------------------End Get Recommendation-----------------------------------------------*/




function saveAssisstantFeedback(req, res) {
  var body = req.body.data;
  body.createdby = req.body.createdby;
  var obj = JSON.stringify(body);
  commonModel.mysqlPromiseModelService(proc.requisitionline, [obj])
    .then(results => {
      res.json({ message: 'success', result: results[0], state: 1 });
    })
    .catch(err => {
      return res.json({ message: err, state: -1, data: null });
    })
}


function viewFeedback(req, res) {
  var body = req.body;
  body.reqtype = 'view';
  var obj = JSON.stringify(body);
  commonModel.mysqlPromiseModelService(proc.trxrequisition, [obj])
    .then(results => {
      res.json({ message: 'success', result: results, state: 1 });
    })
    .catch(err => {
      return res.json({ message: err, state: -1, data: null });
    })

}
async function BulkInterviewFeedback(req, res) {
  if (!req.body.data) {
    return res.json({ state: -1, message: 'Required Parameters are missing' });
  }
  let obj = await commonCtrl.verifyNull(req.body.data);
  //let obj = req.body.data;
  let createdby = req.body.createdby;
  commonModel.mysqlPromiseModelService('call usp_interview_feedback_bulk(?,?)', [JSON.stringify(obj), createdby])
    .then(results => {
      if (results[1] && results[1][0].error_count && results[1][0].error_count > 0) {
        return res.json({
          state: 1, message: `${results[1][0].error_count} Candidates Feedback has already been provided by different interviewer`,
          result: results[0]
        })
      }
      else if (results[1] && results[1][0].error_count && results[1][0].transactioncount > 0) {
        return res.json({
          state: -1, message: `${results[1][0].transactioncount} Candidates have invalid Transaction IDs`,
          result: results[0]
        })
      }
      return res.json({ message: 'success', result: results[0], state: 1 });
    })
    .catch(err => {
      return res.json({ message: err, state: -1, data: null });
    })
}