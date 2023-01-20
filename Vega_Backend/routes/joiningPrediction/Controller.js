'use strict'
const commonModel = require('../common/Model');
const proc = require('../common/procedureConfig');
const option = require('../../config/config').superadmin;
var _ = require('underscore');
const commonHttpReq = require('../../routes/superAdmin/Controller')

module.exports = {
  getPrediction: getPrediction
}

async function getPrediction() {
  var options = {
    method: 'POST',
  }
  var alldata = [];
  var obj = { cronjob: 1 };
  obj.configcode = "HR feedback,notice,JP weightage,CTC var,DOC submit,survey score,mail";
  var errmessage = "Failed"
  obj = JSON.stringify(obj);

  var data = JSON.stringify(
    {
      configcode: "HR feedback,notice,JP weightage,CTC var,DOC submit,survey score,mail",
      iscronjob: 1
    }
  )
  options.data = data
  options.path = '/getmastersforcron';
  let headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
  options.headers = headers;
  var masterdata = []
  var data = await commonHttpReq.commonfunc(options).then(result => result).catch(err => {
    errmessage = err;
    return null
  })
  var masterdata = [data && data.data]
  // var masterdata = await commonModel.mysqlPromiseModelService(proc.fetchmaster, [obj]).then(result=> result).catch(err=>{
  //     errmessage=err;
  //     return null
  // })
  var candidatedata = await commonModel.mysqlPromiseModelService('call usp_trxjoining_prediction(?,?)', [obj, 'getprediction']).then(result => result).catch(err => {
    errmessage = err;
    return null
  })
  // //console.log('---------->>>>>>>', masterdata,candidatedata)

  if (masterdata && masterdata[0] && candidatedata && candidatedata[0] && candidatedata[0]) {
    _.each(candidatedata[0], cd => {
      // var cd = candidatedata[0][0];
      var mstnotice = _.where(masterdata[0], {
        configcode: "notice"
      });
      var mstctc = _.where(masterdata[0], {
        configcode: "CTC var"
      });
      var mstsurvey = _.where(masterdata[0], {
        configcode: "survey score"
      });
      var mstw = _.where(masterdata[0], {
        configcode: "JP weightage"
      });

      const maxnoticeday = _.max(mstnotice, item => item.configvalue2).configvalue2 || 90;
      const maxnoticeper = _.max(mstnotice, item => item.configvalue1).configvalue1 || 100;
      const minnoticeper = _.min(mstnotice, item => item.configvalue1).configvalue1 || 10;

      if (!cd.expectedsalary) {
        var ctc_var = 100;
      } else {
        var ctc_var = ((cd.offeredctc - cd.expectedsalary) / cd.expectedsalary) * 100;
      }
      let noticeperiod = maxnoticeday ? (maxnoticeper - (maxnoticeper - minnoticeper) * (cd.noticeperiod ? cd.noticeperiod : 0) / maxnoticeday) : (100 - ((cd.noticeperiod ? cd.noticeperiod : 0) / 90) * 100);

      var mailopen = cd.mailopencount ? 100 : 50

      let x = _.filter(mstctc, item => item.configvalue2 < ctc_var && ctc_var <= item.configvalue3);
      var ctccalc = x && x.length ? x[0] && x[0].configvalue1 : 0;
      let y = _.filter(mstsurvey, item => item.configvalue2 < cd.survey && cd.survey <= item.configvalue3);
      var surveycalc = y && y.length ? y[0] && y[0].configvalue1 : 0;
      let a = _.where(mstw, {
        "configvalue2": "CTC"
      });
      let ctcw = a && a.length ? a[0] && a[0].configvalue1 : 23;
      let b = _.where(mstw, {
        "configvalue2": "notice"
      });
      let noticew = b && b.length ? b[0] && b[0].configvalue1 : 20;
      let c = _.where(mstw, {
        "configvalue2": "DOC upload"
      });
      let docw = c && c.length ? c[0] && c[0].configvalue1 : 20;
      let d = _.where(mstw, {
        "configvalue2": "mail open"
      });
      let mailw = d && d.length ? d[0] && d[0].configvalue1 : 2;
      let e = _.where(mstw, {
        "configvalue2": "survey"
      });
      let surveyw = e && e.length ? e[0] && e[0].configvalue1 : 10;
      let f = _.where(mstw, {
        "configvalue2": "HR"
      });
      let hrfeedw = f && f.length ? f[0] && f[0].configvalue1 : 25;
      let g = _.where(masterdata[0], {
        configcode: "HR feedback",
        configvalue2: `${cd.hrfeedbackscore}`
      });

      let hr_feedback = g && g.length ? g[0] && g[0].configvalue1 : 50;

      let h = _.where(masterdata[0], {
        configcode: "DOC submit",
        configvalue2: `${cd.docsubmited}`
      });
      let docsubmited = h && h.length ? h[0] && h[0].configvalue1 : 50;

      let joining_prediciton = ((ctccalc * ctcw) + (noticeperiod * noticew) + (docsubmited * docw) + (mailopen * mailw) + (hr_feedback * hrfeedw) + (surveycalc * surveyw)) / 100;
      let calcultaion = {
        "candidateid": cd.id,
        // "docsubmited": docsubmited,
        // "hr_feedback": hr_feedback,
        // "ctccalc": ctccalc,
        // "surveycalc": surveycalc,
        // "noticeperiod": noticeperiod,
        // "mailopen": mailopen,
        "joiningprediction": joining_prediciton > 100 ? 100 : joining_prediciton
      }
      alldata.push(calcultaion)
    });
    alldata.push()
    // res.json({ message: "success", state : 1, data : alldata  });    
    commonModel.mysqlPromiseModelService('call usp_trxjoining_prediction(?,?)', [JSON.stringify(alldata), "updateprediction"]).then(result => {
      //console.log('-----Joining Prediction Updated------');   
    }).catch(err => {
      //console.log('error in updating joining prediction---->>',err);
      return null
    });
    // res.json({ message: 'success', data : alldata , state : 1 });
  } else {
    // res.json({ message: errmessage, data : null , state : -1 });
    //console.log('error in updating joining prediction---->>',errmessage);
  }
}