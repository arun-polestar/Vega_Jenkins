const commonModel = require('../../common/Model');
const query = require('../../common/Model').mysqlPromiseModelService;
const commonCtrl = require('../../common/Controller');
const proc = require('../../common/procedureConfig');
const moment = require('moment');
const mailservice = require('../../../services/mailerService');
const errorservice = require('../../../services/errorService');
const path = require('path');
const appRoot = require('app-root-path');
const addeventService = require('../../../services/addeventService')
const htmlToPdf = require('html-to-pdf');
const crypto = require('crypto');
const fs = require('fs');
const _ = require('underscore');

const config = require("../../../config/config");
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;



module.exports = {

  getCandidateOnBoardForBGV: getCandidateOnBoardForBGV,
  filterOnboardDataData: filterOnboardDataData,
  updateJoiningDate: updateJoiningDate,
  resendLinkToCandidate: resendLinkToCandidate,
  // offerLetterPreview:offerLetterPreview,    
  fetchOfferLetter: fetchOfferLetter,
  sendLinkToCandidate: sendLinkToCandidate,
  filterOnboardMassFilterdData: filterOnboardMassFilterdData,
  getreschedulelist: getreschedulelist,
  rescheduleInterview: rescheduleInterview,
  updateStatusOfSelectedData: updateStatusOfSelectedData,
  filterOnboardDataData1: filterOnboardDataData1,
  // sendOfferLetter:sendOfferLetter,
  sendFiles: sendFiles,
  massUpdateJoiningDate
}

function getCandidateOnBoardForBGV(req, res) {

  if (!req.body.tokenFetchedData) {
    return res.json({ message: 'User authorization failed', state: 0, data: null });
  }
  var obj = req.body;
  obj.reqtype = 'view';
  query(proc.trxrequisition, [JSON.stringify(obj)])
    .then(results => {
      var lazydata = commonCtrl.lazyLoading(results[0], req.body);
      if (lazydata && "data" in lazydata && "count" in lazydata) {
        results[0] = lazydata.data;
        return res.json({ msg: 'success', data: results, totalcount: lazydata.count, state: 1 });
      } else {
        return res.json({ msg: "No Lazy Data", data: null, state: -1 })
      }
    })
    .catch(err => {
      return res.json({ msg: 'User Unauthorized!', data: null, state: -1 })
    })
}

async function filterOnboardDataData(req, res) {
  try {
    var reqData = req.body;
    const fy = reqData.pipelineFilter && reqData.pipelineFilter.financialyear;
    reqData['fy'] = fy && fy.toString() || '';
    const len = reqData.fyq && reqData.fyq.length;
    reqData['fyq'] = (len == 4 || len == 0 || reqData['fyq'] == 'null') ? '' :
      reqData.fyq && reqData.fyq.toString();
    delete reqData.pipelineFilter;
    reqData.reqtype = reqData.reqtype ? reqData.reqtype : 'view';
    reqData.action = reqData.action ? reqData.action : "On Board";
    const results = await query(proc.trxrequisition, [JSON.stringify(reqData)]);
    return res.json({ message: 'success', data: results, totalcount: null, state: 1 });
  } catch (err) {
    return res.json({ message: err.message, data: null, state: -1 })
  }
}

function updateJoiningDate(req, res) {

  var body = req.body;
  body.reqtype = "edit";
  var obj = JSON.stringify(body);
  commonModel.mysqlModelService('call usp_trxrequisition_edit(?)', [obj], function (err, results) {
    if (!err) {
      return res.json({ message: 'success', data: results, state: 1 });
    }
    return res.json({ message: err, data: null, state: -1 });
  });
}

function massUpdateJoiningDate(req, res) {
  let body = req.body.reqArr;
  ////console.log('objj',req.body.reqArr)
  let obj = JSON.stringify(body);
  commonModel.mysqlModelService('call usp_onboard_massupdate(?)', [obj], function (err, results) {
    if (!err) {
      return res.json({ message: 'success', data: results, state: 1 });
    }
    return res.json({ message: err, data: null, state: -1 });
  });
}

function resendLinkToCandidate(req, res) {

  //var url = req.body.host + "/firststep/" + req.body.url;
  var docpath = '/assets/joiningdoc/Document Checklist_Fresher.pdf';

  if (req.body.candidateType == 1) {
    docpath = '/assets/joiningdoc/Document Checklist_Lateral.pdf';
  }
  var obj = JSON.stringify({
    id: req.body.id,
    action: "resendlink",
    createdby: req.body.createdby,
    inductiondocs: req.body.inductiondocs,
    iflateral: req.body.candidateType,
    joiningdate: req.body.joiningday
  });
  query(proc.trxrequisitionEdit, [obj])
    .then(results => {
      var url = `${req.body.host}/firststep/${results[0] && results[0] && results[0][0].state}`;
      //console.log('link for candidate -->', url);
      //console.log('host for candidate -->', req.body.host);

      var emailObj = {
        email: req.body.email,//'shuchi.tayal@polestarllp.com',
        mailType: 'documentUpload',
        moduleid: req.body.moduleid ? req.body.moduleid : "rms",
        createdby: req.body.createdby,
        linkToUpload: url,
        otptoshare: (results[0] && results[0][0].otp) || req.body.otp,
        contactperson: req.body.contactperson,
        cc: req.body.cc || '',//'vibhor.malik@polestarllp.com',
        subjectVariables: {
          'COMPANYNAME': req.body.companyname,
          subject: "First Step Towards An Exciting Journey With our trxcompanyname Family !!!!"
        },
        headingVariables: { heading: "First Step Towards An Exciting Journey With our " + req.body.companyname + " Family !!!!" },
        // bcc:'anmol.bhardwaj@polestarllp.com',
        bodyVariables: {
          linkUrl: url,
          trxcandidatename: req.body.candidatename ? req.body.candidatename.charAt(0).toUpperCase() + req.body.candidatename.slice(1).toLowerCase() : 'N/A',
          docpath: docpath,
          trxcompanyname: req.body.companyname,
          trxcandidateotp: (results[0][0] && results[0][0].otp) || req.body.otp,
          trxcandidatejoining: req.body.joiningday && moment(req.body.joiningday, ['YYYY-MM-DD'], true).isValid() ? moment(req.body.joiningday, 'YYYY-MM-DD').format('DD-MM-YYYY') : '',
          trxcontactperson: req.body.contactperson

        },
      };

      mailservice.mail(emailObj, function (err, response) {
        if (err) {
          return res.json({ message: err, data: null, state: -1 });
        }
        return res.json({ message: 'success', data: null, state: 1 });
      });
    }).catch(err => {
      return res.json({ message: err, data: null, state: -1 });
    });

}


// function offerLetterPreview(req,res){
//     if(!req.body.offerLetter || !req.body.fullName){
//         return res.json({message:"Required Parameter is missing",data:null,state:-1});
//     }
//     var mastersObj=JSON.stringify({configcode:'offerLetterParams',createdby:req.body.createdby});
//     query(proc.mstconfigview,[mastersObj])
//     .then(results=>{
//         var offerLetterParamsList = results[0];
//         var offerLetterObj = JSON.stringify({id:req.body.offerLetter,createdby:req.body.createdby});
//         return  query(proc.getofferletter,[offerLetterObj])
//             .then(results=>{
//                     if(!results[0] || !results[0][0]){
//                        return res.json({message:"Offer letter Was not found",data:null,state:-1});
//                     }
//                     var html = results[0][0].description;
//                     const cheerio = require('cheerio')
//                     const $ = cheerio.load(html);
//                     if(req.body.joiningDate){
//                         req.body.joiningDate = moment(req.body.joiningDate).format('DD-MM-YYYY');
//                     }
//                     offerLetterParamsList.map(function(item){
//                       $('span.h-card[offerletterparam='+item.configvalue2+']').html(req.body[item.configvalue2] || '<span style="color:red">Not Specified</span>');
//                     });       
//                     return res.json({data:$.html(),state:1,message:"Success"});    
//             })
//     })
//     .catch(err=>{
//         return res.json({message:err,data:null,state:-1});
//     })


// }



function fetchOfferLetter(req, res) {
  var obj = JSON.stringify(req.body);
  //console.log(obj);

  query(proc.getofferletter, [obj])
    .then(results => {
      //   //console.log("reee",results)
      if (req.body && req.body.id) {
        results[0][0].toemail = results[0][0] && results[0][0].toemail && results[0][0].toemail.split(',');// && _.pluck(, 'name');
        results[0][0].ccemail = results[0][0] && results[0][0].ccemail && results[0][0].ccemail.split(',');
        results[0][0].others = results[0][0] && results[0][0].others && results[0][0].others.split(',');
        results[0][0].ccothers = results[0][0] && results[0][0].ccothers && results[0][0].ccothers.split(',');
        results[0][0].toemail = results[0][0] && results[0][0].toemail && (results[0][0].toemail).map(Number);
        results[0][0].ccemail = results[0][0] && results[0][0].ccemail && (results[0][0].ccemail).map(Number);
      }

      return res.json({ message: 'success', data: results, state: 1 });
    })
    .catch(err => {
      return res.json({ message: err, data: null, state: -1 });
    });

}

function sendLinkToCandidate(req, res) {
  const key = crypto.scryptSync('!mtrenctyption!@', 'salt', 24);
  const iv = Buffer.alloc(16, 0); // Initialization vector.
  var encrypt = crypto.createCipheriv('aes-192-cbc', key, iv);
  var candidateid;


  if (req && req.body && req.body.id) {
    //var mykey = crypto.createCipher('aes-128-cbc', '!mtrenctyption!@');
    // var candidateid = mykey.update(req.body && req.body.id && req.body.id.toString(), 'utf8', 'hex')
    // candidateid += mykey.final('hex');


    candidateid = encrypt.update(req.body && req.body.id && req.body.id.toString(), 'utf8', 'hex');
    candidateid += encrypt.final('hex');
  }

  var obj = JSON.stringify({
    id: req.body.id,
    action: "sendlink",
    createdby: req.body.createdby,
    inductiondocs: req.body.inductiondocs,
    iflateral: req.body.candidateType,
    joiningdate: req.body.joiningday
  }); ////console.log('yh2',candidateid);
  query(proc.trxrequisitionEdit, [obj])
    .then(results => {
      //console.log("proc", results)
      var docpath = path.join(appRoot.path, '/assets/joiningdoc/Document Checklist_Fresher.pdf');
      if (req.body.candidateType == 1) {
        docpath = path.join(appRoot.path, '/assets/joiningdoc/Document Checklist_Lateral.pdf');
      }
      var url = req.body.host + "/firststep/" + results[0][0].state;
      var feedbackurl = req.body.host + "/feedback?i=" + candidateid + "&reqid=" + req.body.requisitionid;

      // var url = 'http://'+req.get('host') + "/firststep/" + results[0][0].state;

      var emailObj = {
        moduleid: req.body.moduleid ? req.body.moduleid : "rms",
        email: req.body.email || '',
        mailType: 'documentUpload',
        createdby: req.body.createdby,
        linkToUpload: req.body.host + "/firststep/" + results[0][0].state,
        otptoshare: results[0][0].otp,
        cc: req.body.cc || '',
        bcc: '',
        subjectVariables: {
          'COMPANYNAME': req.body.companyname,
          subject: "First Step Towards An Exciting Journey With our trxcompanyname Family !!!!"
        },
        headingVariables: { heading: "First Step Towards An Exciting Journey With our " + req.body.companyname + " Family !!!!" },
        bodyVariables: {
          trxcompanyname: req.body.companyname,
          trxcandidatejoining: req.body.joiningday && moment(req.body.joiningday, ['YYYY-MM-DD'], true).isValid() ? moment(req.body.joiningday, 'YYYY-MM-DD').format('DD-MM-YYYY') : '',
          linkUrl: url,
          trxcandidateotp: results[0][0].otp,
          trxcontactperson: req.body.contactperson,
          trxcandidatename: req.body.candidatename ? req.body.candidatename.charAt(0).toUpperCase() + req.body.candidatename.slice(1).toLowerCase() : 'N/A',
          // trxcandidatename: req.body.candidatename,
          docpath: docpath,

        }
      };
      //sending mail
      //console.log('email-obj-------------->>>>>>', emailObj);

      mailservice.mail(emailObj, function (err, response) {
        if (err) {
          //console.log("mail", err)
          res.json({ message: err, data: null, state: -1 });

        } else if (candidateid && results && results[0] && results[0][0] && results[0][0].feedbackflag > 0) {
          var feedemailObj = {
            moduleid: req.body.moduleid ? req.body.moduleid : "rms",
            email: req.body.email,
            mailType: 'candidateFeedback',
            linkUrl: feedbackurl,
            logo: "logo.png",
            //   banner: "feedback.jpg",
            cc: '',
            bcc: '',
            subjectVariables: {
              subject: "Tell us about your interview experience!"
            },
            headingVariables: {
              heading: "Your Feedback Matters To Us"
            },
            bodyVariables: {
              trxcompanyname: req.body.companyname || 'Our',
              linkUrl: feedbackurl,
              trxcandidatename: req.body.candidatename ? req.body.candidatename.charAt(0).toUpperCase() + req.body.candidatename.slice(1).toLowerCase() : 'N/A'
            }
          };
          mailservice.mail(feedemailObj, function (err, response) {
            if (err) {
              //console.log('xxx------>>>>>>', err);
            }
            //console.log('xx--------->>>>>', response);
          });

          res.json({ message: 'success', data: results, state: 1 });
        }
      });
    })
    .catch(err => {
      //console.log("catch")
      return res.json({ message: err, data: null, state: -1 });
    });

}


function filterOnboardMassFilterdData(req, res) {
  // var reqData = req.body;
  // var filterObj = reqData.pipelineFilter;
  // if(!(req.body.status)||!(req.body.state)){
  // return res.badRequest();
  // } 
  // var obj= JSON.stringify(req.body);

  var body = req.body && req.body.massPipelineFilter;
  // body.stateid=req.body.massPipelineFilter.stateid;
  // body.statusid=req.body.massPipelineFilter.statusid;
  body.createdby = req.body && req.body.tokenFetchedData && req.body.tokenFetchedData.id;
  body.action = "OnFilter";
  body.reqtype = 'view';
  var obj = JSON.stringify(body);
  commonModel.mysqlModelService(proc.trxrequisition, [obj], function (err, results) {
    if (err) {
      return res.json({
        message: err,
        data: null,
        state: -1
      });
    }
    return res.json({
      message: "Success",
      data: results,
      state: 1
    });
  });
}
function getreschedulelist(req, res) {
  var obj = JSON.stringify({
    id: req.body.transactionid,
    action: req.body.action,
    createdby: req.body.createdby,
    reqtype: 'view'
  });
  commonModel.mysqlModelService(proc.trxrequisition, [obj], function (err, results) {
    if (err) {
      return res.json({ message: 'failure', state: -1, data: null });
    }
    return res.json({ message: 'success', data: results[0], state: 1 });
  });
}
function rescheduleInterview(req, res) {
  var body = req.body;


  body.interviewdate = body.interviewdate ? moment(body.interviewdate, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD HH:mm') : moment().format('YYYY-MM-DD HH:mm');
  body.interviewerid = body.interviewerid && body.interviewerid.toString();
  body.remark = body.remark;
  //body.status=body.statusid;
  body.state = body.stateid;
  body.action = 'Edit';
  body.reqtype = 'edit';
  var endDate = null;
  body.createdby = req.body.createdby;
  var dataarr = [];
  if (req.body && req.body.data) {
    dataarr = req.body.data;
  }
  var candidateInfo = ''; var listofcandidates = ''; var resumelist, resumefilename;
  if (dataarr && dataarr.length > 0) {
    resumefilename = _.pluck(dataarr, 'filename')
    resumelist = _.pluck(dataarr, 'filepath')
    var candidateN; var Cqualifiction; var Cskills;
    dataarr.forEach(function (item) {
      candidateN = item.candidatename ? item.candidatename.charAt(0).toUpperCase() + item.candidatename.slice(1).toLowerCase() : 'N/A'
      Cqualifiction = item.qualification ? item.qualification : 'N/A';
      Cskills = item.skills || item.skillText ? item.skills || item.skillText : 'N/A';
      candidateInfo += ` <h4 style="font-family:Georgia, 'Times New Roman', Times, serif;font-weight: normal;margin:0px;padding:15px 0px 8px;color:#333;font-size:16px;">
        <b style="
        padding: 6px 0px;
        display: inline-block;
    ">Candidate Name : </b> `+ candidateN + `<br>
    <b style="
    padding: 6px 0px;
    display: inline-block;
">Qualification : </b> `+ Cqualifiction + `<br>
<b style="
padding: 6px 0px;
display: inline-block;
">Skills : </b> `+ Cskills + `<br><br>
															     
															    </h4>`;

      listofcandidates += item.candidatename.charAt(0).toUpperCase() + item.candidatename.slice(1).toLowerCase() + ','
    });
  }
  listofcandidates = listofcandidates.slice(0, listofcandidates.length - 1);

  var obj = JSON.stringify(body);
  commonModel.mysqlModelService(proc.trxrequisition, [obj], function (err, results) {
    if (err) {
      return res.json({ message: err, state: -1, data: null });
    }

    //res.ok({msg: 'success', result: results});
    var startDate = req.body.interviewdate.replace(' ', 'T') + ':00';
    var convdate = moment(req.body.interviewdate).format("YYYY-MM-DD HH:mm");
    var dateFormat = commonCtrl.convertDateFormat(convdate, 10);

    endDate = moment(moment(req.body.interviewdate).add(30, 'm').toDate()).format("YYYY-MM-DD HH:mm");

    var resultData = results[0][0]; //console.log("resultdata", resultData)
    endDate = endDate.replace(' ', 'T') + ':00';
    if (resultData && (resultData.stateval == 'Screening' || resultData.stateval == 'Technical Interview' || resultData.stateval == 'HR Interview')) {

      var inviteData = [{
        moduleid: req.body.moduleid ? req.body.moduleid : "rms",
        trxcandidatelink: '',
        trxapplicantcode: '',
        trxscreeninglink: '',
        trxcandidatedob: '',
        trxcandidateemail: dataarr[0] && dataarr[0].email ? dataarr[0].email : '',
        trxcandidatephone: dataarr[0] && dataarr[0].phone ? dataarr[0].phone : '',
        trxinterviewer: dataarr[0] && dataarr[0].interviewer ? dataarr[0].interviewer : '',
        trxinterviewstate: resultData.stateval,//technical,screening,hr
        trxinterviewdate: dataarr[0] && dataarr[0].interviewdate ? dataarr[0].interviewdate : '',//past date
        trxrescheduledate: dateFormat,//New date
        trxcandidateinfo: candidateInfo,
        trxreqjobtitle: req.body.jobtitle,
        trxreqjobopenings: resultData.trxreqjobopenings,
        trxreqskills: resultData.trxreqskills,
        trxreqexperience: resultData.trxreqexperience,
        trxreqexpiry: commonCtrl.convertDateFormat(resultData.trxreqexpiry, 4),
        trxreqdesignation: resultData.trxreqdesignation,
        trxreshceduleremark: req.body.remark,
        trxcandidatename: dataarr[0] && dataarr[0].candidatename ? dataarr[0].candidatename.charAt(0).toUpperCase() + dataarr[0].candidatename.slice(1).toLowerCase() : 'N/A',
        trxcandidateskill: dataarr[0] && (dataarr[0].skills || dataarr[0].skillText) ? dataarr[0].skills || dataarr[0].skillText : 'N/A',
        trxcandidatequalification: dataarr[0] && dataarr[0].qualification ? dataarr[0].qualification : 'N/A',
        trxrescheduledby: resultData.reshcduledby,
        jobtitle: req.body.jobtitle,
        eventid: req.body.calendartoken,
        title: resultData.stateval + ' Updated for ' + resultData.candidatelist,
        agenda: req.body.remark || 'Interview Re-Scheduled',
        starttime: startDate,
        endtime: endDate,
        emails: resultData.emaillist,
        frequencyid: resultData.state,
        module: 'RMS',
        location: req.body.companyname || 'Polestar Solution & Services, India',
        mailType: 'rescheduledinterview',
        resumelist: resumelist,
        resumefilename: resumefilename,
        // messageInterview:resultData.stateval + ' is rescheduled.<br>',//replace
        //  candidateInfo:candidateInfo,
        // interviewMailDate:dateFormat //repalce
      }];
      // var maildata = [{
      //     emaillist: resultData.hremaillist,
      //     interviewMailDate:dateFormat,
      //     reshcduledby:resultData.reshcduledby,
      //     stateval:resultData.stateval,
      //     jobtitle : req.body.jobtitle,
      //     comments:req.body.remark ? req.body.remark : 'N/A'
      //    //oldDate:resultData.oldInterviewdate
      // }];
      //   //console.log(maildata,"maildata")
      //console.log(inviteData, "sdadasadsdasdadsadadas")
      addeventService.updateEvent(inviteData, function (error, data) {
        //console.log(error, data, "saddsdsaadsasasdadsdsadasdsadasads");
        if (error) { //console.log(error, "assssssssssssss")
        }
        else {
          //console.log(data, "asssssssssssssssss")
        }
      });

      //   sendReschedulemailtoHr(maildata)
    }

    return res.json({ message: 'success', data: results, state: 1 });
  });
}


// For test

function filterOnboardDataData1(req, res) {
  var reqData = req.body;
  var whereString = "1=1";

  reqData.whereString = whereString;
  delete reqData.pipelineFilter;
  if (reqData.startDate && reqData.endDate) {
    reqData.startDate = reqData.startDate + ' 00:00:00';
    reqData.endDate = reqData.endDate + ' 23:59:59';
  }
  reqData.startdate = reqData.startDate;
  reqData.enddate = reqData.endDate;
  reqData.reqtype = 'view';
  if (!reqData.startdate || !reqData.enddate) {
    if (moment().quarter() == 1) {
      reqData.startdate = moment().add('-1', 'year').month('April').startOf('month').format('YYYY-MM-DD');
    } else {
      reqData.startdate = moment().month('April').startOf('month').format('YYYY-MM-DD');
    };
    reqData.enddate = moment().format('YYYY-MM-DD');
  }
  reqData.action = "On Board"; // Need to verify:Will it come forom front-end?

  query('call usp_trxrequisition_operations1(?)', [JSON.stringify(reqData)])
    .then(results => {
      return res.json({ message: 'success', data: results, state: 1 });
    })
    .catch(err => {
      return res.json({ message: err, data: null, state: -1 });
    })
}

// function sendOfferLetter(req,res){
//     if(!req.body.id || !req.body.html){
//         return res.json({message:'Required Parameters missing.',state:-1,data:null})
//     }
//     if (!fs.existsSync(path.resolve(appRoot.path,'assets/offerletter','offer-letter.pdf'))){
//         return res.json({
//             state:-1,
//             message: 'offer letter not found',
//             data:null
//         });
//     }
//     htmlToPdf.convertHTMLString(req.body.html, path.resolve(appRoot.path,'assets/offerletter','offer-letter.pdf'),
//         function (error, success) {
//             if (error) {
//                 return res.json({meesage:error,state:-1,data:null});
//             } else {
//                 var mailOptions = {
//                     headers: { 'Content-Transfer-Encoding': 'quoted-printable'},
//                     from:'support@polestarllp.com',
//                     to:req.body.id,
//                     subject:'Offer Letter',
//                     html:req.body.html,
//                     attachments: [{
//                         filename: 'offer-letter.pdf',
//                         path: path.resolve(appRoot.path,'assets/offerletter','offer-letter.pdf')
//                     }]
//                 };
//                 mailservice.sendCustomEmail(mailOptions,function(err,response){
//                     if(err){
//                         return res.json({state:-1,message:err,data:null});
//                     }
//                     return res.json({state:1,message:'Success',data:null});
//                 });
//             }
//         }
//     );
// }


function updateStatusOfSelectedData(req, res) {
  var body = req.body.data;
  body && body.length && _.forEach(body, function (item) {
    item.createdby = req.body.tokenFetchedData.id;
  })

  //body.mids=req.body.id;
  var obj = JSON.stringify(body); //console.log('updatemassReq--------', obj)
  commonModel.mysqlModelService('call usp_massupdatestatus(?)', [obj], function (err, results) {
    if (err) {
      return res.json({ state: -1, message: err, data: null });
    }
    return res.json({ state: 1, message: 'Success', data: results[0] });
  });
}
async function sendFiles(req, res) {
  req.body.headerdetail.createdby = req.body.tokenFetchedData && req.body.tokenFetchedData.id;
  req.body.headerdetail.action = 'sendtovendor';
  var headerdetail = JSON.stringify(req.body.headerdetail);
  var detail = await commonCtrl.verifyNull(req.body.detail);
  let documentids = detail && detail.map(item => item.documentsid).toString();
  detail = JSON.stringify(detail);
  commonModel.mysqlModelService(proc.trxbgvadd, [headerdetail, detail, documentids], function (err, results) {
    if (err) {
      return res.json({
        state: -1,
        message: err.message || err,
        data: null
      });
    }
    else {
      /**
       * Send Email with Attachments
       */

      const [vendorDetail, attachmentArr] = results;
      const attachments = attachmentArr && attachmentArr.map(item => {
        let attachment = {
          file: item.filename,
          path: path.join(appRoot.path, 'uploads', item.path)
        }
        return attachment;
      })
      const mailOptions = {
        email: vendorDetail[0].trx_vendor_email,
        mailType: "sendfilebgv",
        subjectVariables: {
          subject: "New Documents are assigned for BGV"
        },
        bodyVariables: {
          trx_vendor_name: vendorDetail[0].trx_vendor_name
        },
        attachments: attachments,
      }
      //console.log('attachments', mailOptions)
      mailservice.mail(mailOptions, function (err, response) {
        if (err) {
          //console.log('error sednding bgv mail', err)
        } else {
          //console.log('email sent successfully');
        }
      })
      return res.json({ state: 1, data: results, message: 'success' });
    }
  });
}

function sendReschedulemailtoHr(mailOptions) {

  //{emaillist,jobtitle,interviewMailDate,reshcduledby,stateval}
  var mailOptions = mailOptions && mailOptions[0];
  ////console.log("mailOptions",mailOptions.reshcduledby)
  var emailObj = {
    email: mailOptions.emaillist,
    mailType: 'mailhronreschedule',
    cc: mailOptions.cc || '',
    subjectVariables: {
      subject: "Interview Rescheduled by " + mailOptions.reshcduledby
    },
    headingVariables: {
      heading: mailOptions.stateval + " is rescheduled by " + mailOptions.reshcduledby
    },

    bodyVariables: {
      jobtitle: mailOptions.jobtitle,
      interviewstate: mailOptions.stateval,
      reschduleDate: mailOptions.interviewMailDate,
      oldDate: mailOptions.oldDate,
      commentsbyuser: mailOptions.comments

    },
  };
  // //console.log("emailobj",emailObj)
  mailservice.mail(emailObj, function (err, response) {
    if (err) {
      //console.log('Error while sending mail.');
    }

  });
}