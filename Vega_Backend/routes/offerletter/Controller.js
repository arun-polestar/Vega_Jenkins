var path = require('path');
var moment = require('moment-timezone');
moment.tz.setDefault("Asia/Kolkata");
var _ = require('underscore');

// var htmlToPdf = require('html-to-pdf');

var appRoot = require('app-root-path');
const config = require('../../config/config')
var proc = require('../../routes/common/procedureConfig')
var htmlpdf = require('html-pdf')
const commonModel = require('../../routes/common/Model');
const fs = require('fs');
var mailservice = require('./../../services/mailerService')
appRoot.originalPath = appRoot.path
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;


module.exports = {
  // uploadOfferLetterFile:uploadOfferLetterFile,
  fetchOfferLetter: fetchOfferLetter,
  deleteOfferLetter: deleteOfferLetter,
  saveOfferLetter: saveOfferLetter,
  updateStatus: updateStatus,
  sendOfferLetter: sendOfferLetter,
  offerLetterPreview: offerLetterPreview,
  fetchOfferLetterRequiredFields: fetchOfferLetterRequiredFields,
};

function saveOfferLetter(req, res) {
  if (!req.body.title || !req.body.html) {
    return res.json({
      "state": -1,
      "message": "Required Parameters missing.",
      "data": null
    })
  }
  var html = req.body.html;
  var mailbody = req.body.mailcontent;
  delete req.body.html;
  delete req.body.mailcontent;
  // req.body.fullhtml = defcontent;
  req.body.toemail = req.body.toemail && req.body.toemail.toString(); // && _.pluck(, 'name');
  req.body.ccemail = req.body.ccemail && req.body.ccemail.toString();
  ////console.log("reqbodycc", req.body.ccemail)
  // //console.log("reqbodyoth", req.body.others)

  req.body.others = req.body.others && req.body.others.toString();
  req.body.ccothers = req.body.ccothers && req.body.ccothers.toString();

  ////console.log("req.body", req.body)
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService('call usp_offerletter_operations(?,?,?)', [obj, html, mailbody], function (err, results) {
    if (err) {
      return res.json({
        "state": -1,
        "message": err,
        "data": null
      })
    }
    return res.json({
      "state": 1,
      "message": "Data Successfully Send",
      "data": results
    })
  });
}

function fetchOfferLetter(req, res) {
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService('call usp_get_offerletter(?)', [obj], function (err, results) {
    if (err) {
      return res.json({
        "state": -1,
        "message": err,
        "data": null
      })
    }
    return res.json({
      "state": 1,
      "message": "Data Successfully Send",
      "data": results
    })
  });
}

function deleteOfferLetter(req, res) {
  if (!req.body.id) {
    return res.json({
      "state": -1,
      "message": "id Not Found",
      "data": null
    })
  }
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService('call usp_offerletter_operations(?,?,?)', [obj, null, null], function (err, results) {
    if (err) {
      return res.json({
        "state": -1,
        "message": err,
        "data": null
      })
    }
    return res.json({
      "state": 1,
      "message": "Data Successfully Send",
      "data": results
    })
  });
}


function updateStatus(req, res) {
  if (!req.body.id) {
    return res.json({
      "state": -1,
      "message": "id Not Found",
      "data": null
    })
  }
  var obj = JSON.stringify(req.body);
  //console.log(obj);
  commonModel.mysqlModelService('call usp_offerletter_operations(?,?,?)', [obj, null, null], function (err, results) {
    if (err) {
      return res.json({
        "state": -1,
        "message": err,
        "data": null
      })
    }
    return res.json({
      "state": 1,
      "message": "Data Successfully Send",
      "data": results
    })
  });
}


function fetchOfferLetterRequiredFields(req, res) {
  if (!req.body.id) {
    return res.json({
      "state": -1,
      "message": "Required Parameters missing.",
      "data": null
    })
  }
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService('call usp_get_offerletter(?)', [obj], function (err, results) {
    if (err) {
      return res.json({
        "state": -1,
        "message": err,
        "data": null
      })
    }

    var description = results[0][0].description;
    var mailcontent = results[0][0].mailcontent;
    var html = description + ' ' + mailcontent
    const cheerio = require('cheerio')
    const $ = cheerio.load(html);
    var requiredFields = [];
    $('a').map(function (i, el) {
      if ($(this).attr('offerletterparam')) {
        requiredFields.push($(this).attr('offerletterparam'));
      }
      //   requiredFields[$(this).attr('offerletterparam')] = true;
    });
    return res.json({
      "state": 1,
      "message": "success",
      "data": requiredFields
    })
  });
}



function sendOfferLetter(req, res) {

  if (!req.body.id || !req.body.html) {
    return res.json({
      "state": -1,
      "message": "Required Parameters missing.",
      "data": null
    })
    // return res.json({message:'Required Parameters missing.',state:-1,data:null})
  }
  // //console.log("body",req.body)
  var offerletterhtml = req.body.html;
  var mailcontent = req.body.mailcontent;

  mailcontent = mailcontent.replace(/(<a _ngcontent([^>]+)>)/gi, "");
  // //console.log("mailcontent", mailcontent)
  var obj = req.body;
  obj.userid = req.body.createdby;
  obj.action = 'sendofferletter';
  delete obj.html
  delete obj.mailcontent
  obj = JSON.stringify(obj)
  //   //console.log("obj",obj)
  if (!fs.existsSync(path.resolve(appRoot.originalPath, 'assets/offerletter', 'offer-letter.pdf'))) {
    return res.json({
      state: -1,
      message: 'offer letter not found',
      data: null
    });
  }
  if (!fs.existsSync(path.join(appRoot.path, 'uploads/offerletter'))) {
    fs.mkdirSync(path.join(appRoot.path, 'uploads/offerletter'))
  }
  let htmloptions = {
    format: 'A4',
    header: {
      "height": "15mm"
    },
    footer: {
      "height": "15mm"
    },
    border: {
      top: '15mm',
      bottom: '15mm',
      left: '12mm',
      right: '12mm'
    },
    // margin: { right: '10mm', left: '10mm', top: '10mm', bottom: '10mm' }
  };


  htmlpdf.create(offerletterhtml, htmloptions).toFile(path.resolve(appRoot.path, 'uploads/offerletter', 'offer-letter.pdf'),
    function (err, response) {
      if (err) {
        return res.json({
          meesage: err,
          state: -1,
          data: null
        });
      } else {
        commonModel.mysqlModelService('call usp_offerletter_mailtemplate(?)', [obj], function (err, templateresults) {
          if (err) {
            //console.log("Error fetching offer letter template", err)
          }
          ////console.log("templateresults", templateresults[0][0])
          var alltomails;
          var ccallmails;
          if (templateresults && templateresults[0][0] && templateresults[0][0].alltomails) {
            alltomails = (templateresults[0][0].alltomails) ? (templateresults[0][0].alltomails).concat(',', req.body.id) : req.body.id
          }
          if (templateresults && templateresults[0][0] && templateresults[0][0].ccallmails) {
            ccallmails = templateresults[0][0].ccallmails;

          }
          var mailOptions = {
            headers: {
              'Content-Transfer-Encoding': 'quoted-printable'
            },
            // from:'support@polestarllp.com',
            to: alltomails || req.body.id,
            cc: ccallmails || '',
            subject: templateresults && templateresults[0][0] && templateresults[0][0].subject || 'Offer Letter - ' + req.body.candidatename,
            //  html: offerletterhtml,
            html: mailcontent,
            offerletter: 1,
            attachments: [{
              filename: 'offer-letter.pdf',
              path: path.join(appRoot.path, 'uploads/offerletter', 'offer-letter.pdf')
            }]
          };
          mailservice.sendCustomEmail(mailOptions, function (err, response) {
            if (err) {
              return res.json({
                state: -1,
                message: err.message || JSON.stringify(err),
                data: null
              });
            }
            let objstatus = {
              candidateid: req.body.offeredCandidateId,
              action: 'offerlettersentupdate',
              createdby: req.body.createdby
            }

            commonModel.mysqlPromiseModelService('call usp_trxrequisition_edit(?)', [JSON.stringify(objstatus)])
              .catch(err => {
                //console.log('Error in update offered status--------->>>', err);
              })
            res.json({
              state: 1,
              message: 'Success',
              data: null
            });
          });
        });
        if (req.body && req.body.offeredCandidateId && req.body.createdby) {
          let obj = {
            offeredCandidateId: req.body.offeredCandidateId,
            ctcOffered: req.body.ctcOffered,
            createdby: req.body.createdby
          }
          commonModel.mysqlPromiseModelService('call usp_trxjoining_prediction(?,?)', [JSON.stringify(obj), "offeredctc"])
            .catch(err => {
              //console.log('Error Offer Latter--------->>>', err);
            })
        }
      }
    })
};
// htmlToPdf.convertHTMLString(req.body.html, path.resolve(appRoot.path,'assets/offerletter','offer-letter.pdf'),
//     function (error, success) {



function offerLetterPreview(req, res) {
  if (!req.body.offerLetter) {
    return res.json({
      message: "Required Parameter is missing",
      data: null,
      state: -1
    });
  }
  var mastersObj = JSON.stringify({
    configcode: 'offerLetterParams',
    createdby: req.body.createdby
  });
  commonModel.mysqlPromiseModelService(proc.mstconfigview, [mastersObj])
    .then(results => {
      // //console.log("ofp", results)
      var offerLetterParamsList = results[0];
      var offerLetterObj = JSON.stringify({
        id: req.body.offerLetter,
        createdby: req.body.createdby
      });
      return commonModel.mysqlPromiseModelService(proc.getofferletter, [offerLetterObj])
        .then(results => {
          // //console.log("offerLetterObj", results[0])
          if (!results[0] || !results[0][0]) {
            return res.json({
              message: "Offer letter Was not found",
              data: null,
              state: -1
            });
          }
          var html = results[0][0].description;
          var mailcontent = results[0][0].mailcontent;
          const cheerio = require('cheerio')
          const $ = cheerio.load(html);
          const $1 = cheerio.load(mailcontent);
          if (req.body.joiningDate) {
            req.body.joiningDate = moment(req.body.joiningDate, 'DD/MM/YYYY').format('DD-MM-YYYY')
          }
          offerLetterParamsList.map(function (item) {
            $('a.custom-link[offerletterparam=' + item.configvalue2 + ']').html('<span style="font-size:12px !important;color:#333 !important;text-decoration: none !important;cursor:none !important">' + req.body[item.configvalue2] + '</span>' || '<a style="color:red">Not Specified</a>');
            $1('a.custom-link[offerletterparam=' + item.configvalue2 + ']').html('<span style="font-size:12px !important;color:#333 !important;text-decoration: none !important;cursor:none !important">' + req.body[item.configvalue2] + '</span>' || '<a style="color:red">Not Specified</a>');
            // $1('a.custom-link[offerletterparam=' + item.configvalue2 + ']').html(req.body[item.configvalue2] || '<a style="color:red">Not Specified</a>');

          });

          $('body').attr("style", "margin-left:22px !important;");
          //$1('body a').attr("style", "font-size:10px !important;color:#333 !important;text-decoration: none !important;cursor:none !important");

          return res.json({
            data: $.html(),
            mailcontent: $1.html(),
            state: 1,
            message: "Success"
          });
        })
    })
    .catch(err => {
      //console.log('EEEEEEEEEEEEEEEEEE', err);
      return res.json({
        message: err.message || err,
        data: null,
        state: -1
      });
    })


}