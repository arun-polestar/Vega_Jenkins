const commonModel = require('../../common/Model');
const mailservice = require('../../../services/mailerService');
const query = require('../../../routes/common/Model').mysqlPromiseModelService;
const upload = require('../../../services/uploadService');
const notificationCtrl = require('../../notification/Controller');
const config = require('../../../config/config')
var appRoot = require('app-root-path');
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;


var path = require('path');

var fs = require('fs');
var _ = require('underscore');
var pdftoimage = require('pdftoimage');
var docxConverter = require('docx-pdf');
var toPdf = require("office-to-pdf");
var lodash = require('lodash');



module.exports = {
  saveTrainingData: saveTrainingData,
  getTrainingData: getTrainingData,
  deleteTrainingData: deleteTrainingData,
  getUserData: getUserData,
  uploadFile: uploadFile,
  rejectedTrainings: rejectedTrainings,
  learningModulestoRegister: learningModulestoRegister,
  getTrainingByMapid: getTrainingByMapid,
  classroomtraining: classroomtraining,
  classroomview: classroomview,
  searchTrainingData: searchTrainingData,
  getTestStatusCounts: getTestStatusCounts,
  getTotalPointsAndAmounts: getTotalPointsAndAmounts
}

function saveTrainingData(req, res) {
  var obj = req.body;
  if (req.body && !(req.body.title && req.body.functionid)) {
    return res.json({
      "state": -1,
      "message": "please provide complete details !"
    })
  }
  if (req.body && !req.body.id) {
    obj.action = 'add';
    if (obj.testrequired == 0) {
      obj.no_of_question = 0;
      obj.qualifying_marks = 0;
    }
    obj.timelimit = obj.timelimit ? parseInt(obj.timelimit) : 0;
    var modulename = obj.title;
    if (!(req.files && req.files.file)) {
      commonModel.mysqlModelService('call usp_learning_TrainingOperations(?)', JSON.stringify(obj), function (err, result) {
        if (err) {
          return res.json({
            "state": -1,
            "message": err,
            err: "Something went wrong"
          });
        } else {
          if (result && result[0]) {
            if (result[0][0]) {
              if (result[0][0].state > 0) {
                // let mapobj = {
                //     countryid: req.body.country,
                //     workforceid: req.body.workforce,
                //     locationid: req.body.location,
                //     businessunitid: req.body.businessunit,
                //     departmentid: req.body.department,
                //     createdby: req.body.createdby,
                //     configcode: 'Online'
                // }
                // mapobj.id = result[0] && result[0][0].state
                // mapobj.mapaction = 'add';
                // //console.log('mapobjjj', mapobj, 'id->', req.body.id, "ressdssdaadda", result[0][0].state);
                // commonModel.mysqlModelService('call usp_learning_mapping_operations(?)', [JSON.stringify(mapobj)], (err1, results) => {
                //     //console.log(err1, results, "asdddddddddddddsadsasd");
                //     if (err1) {
                //         return res.json({
                //             "state": -1,
                //             "message": results[0][0].message
                //         });
                //     }
                //     else {
                var obj = JSON.stringify({ type: 'learninguser' });
                commonModel.mysqlModelService('call usp_mail_notifications(?)', [obj], function (err, results) {
                  if (err) {
                    recordMailStatus({ mailType: 'learningReminder', attribute2: 'First', status: 'failure', failedReason: 'db error 1' });
                  }
                  else {
                    var emailList = _.pluck(results[0], 'useremail');
                    var emailObj = { bcc: emailList, mailType: 'learningReminder', subjectVariables: { learningremindercount: 'First', modulename: modulename } };
                  }
                });
                return res.json({
                  "state": 1,
                  "message": "Training Module added successfully."
                });
                //   }
                //  })

              } else {
                return res.json({
                  "state": -1,
                  "message": result[0][0].message
                });
              }
            } else {
              return res.json({
                "state": -1,
                "message": result[0][0].message
              });
            }
          } else {
            return res.json({
              "state": -1,
              "message": "User details provided are  wrong"
            });
          }
        }
      });
    } else {
      return res.json({
        "state": -1,
        "message": "Pls remove req.file"
      });
    }
  }
  else {
    obj.action = 'edit';
    commonModel.mysqlModelService('call usp_learning_TrainingOperations(?)', JSON.stringify(obj), function (err, result) {
      if (err) {
        return res.json({
          "state": -1,
          "message": err
        });
      } else {
        if (result && result[0]) {
          if (result[0][0]) {
            if (result[0][0].state > 0) {
              // let mapobj = {
              //     countryid: req.body.country,
              //     workforceid: req.body.workforce,
              //     locationid: req.body.location,
              //     businessunitid: req.body.businessunit,
              //     departmentid: req.body.department.toString(),
              //     createdby: req.body.createdby,
              //     configcode: 'Online'
              // }
              // mapobj.id = result[0] && result[0][0].state
              // mapobj.mapaction = 'edit';
              // //console.log('mapobjjj', mapobj, 'id->', req.body.id);
              // commonModel.mysqlModelService('call usp_learning_mapping_operations(?)', [JSON.stringify(mapobj)], (err1, results) => {
              //     if (err) {
              //         return res.json({
              //             "state": -1,
              //             "message": results[0][0].message
              //         });
              //     }
              //     else {
              return res.json({
                "state": 1,
                "message": "Training Module updated successfully."
              });
              //   }
              // })
            } else {
              return res.json({
                "state": -1,
                "message": result[0][0].message
              });
            }
          } else {
            return res.json({
              "state": -1,
              "message": result[0][0].message
            });
          }
        } else {
          return res.json({
            "state": -1,
            "message": result[0][0].message
          });
        }
      }
    });
  }

}


function getTrainingData(req, res) {
  var obj = req.body;
  obj.createdby = req.body && req.body.createdby;
  commonModel.mysqlModelService('call usp_learning_trxtrainingmodule_view(?)', JSON.stringify(obj), function (err, result) {
    if (err) {
      return res.json({
        "state": -1,
        "message": err
      });
    }
    else {
      if (result && result[0]) {
        if (result[0][0] && result[0][0].state == -1) {
          return res.json({
            "state": -1,
            "message": result[0][0].message
          });
        }
        global.learningCronData = result[0];
        return res.json({
          "state": 1,
          "message": "success",
          data: result,
        });
      }
    }

  });
}

function deleteTrainingData(req, res) {
  if (req.body && !req.body.id) {
    return res.json({
      "state": -1,
      "message": "Required Parameters missing."
    })
  }
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService('call usp_learning_TrainingOperations(?)', [obj], function (err, results) {
    if (err) {
      return res.json({
        "state": -1,
        "message": err
      })
    }
    if (req.body.action && req.body.action == 'delete') {
      let emailObj = {
        id: req.body.userid, mailType: 'rejectedTraining',
        subjectVariables: {
          subject: "Training Rejected"
        },
        headingVariables: {
          heading: "Your Training Module has been Rejected"
        },
        bodyVariables: {
          rejectReason: req.body.comments || '',
          trainingType: 'Online Training',
          trainingModule: req.body.title
        },
        createdby: req.body.createdby,
        guid: req.body.tokenFetchedData.guid
      };
      mailservice.mail(emailObj, function (err, response) {
        if (err) {
        }
      });
    }
    return res.json({
      "state": results[0][0].state,
      "message": results[0][0].message,
      data: results
    })

  });
}


function getUserData(req, res) {
  var obj = JSON.stringify(req.body);
  commonModel.mysqlModelService('call usp_learning_mstlearninguser_view(?)', [obj], function (err, result) {
    if (err) {
      return res.json({
        "state": -1,
        err: err,
        "message": "Database Error"
      });
    }
    if (result && result[0] && result[0][0]) {
      if (result[0][0].state == -1)
        return res.json({ "state": -1, "message": result[0][0].message });
      return res.json({ "state": 1, "message": "success", data: result[0] });
    }
    return res.json({ "state": 1, "message": "success", data: result[0] });

  });
}

function rejectedTrainings(req, res) {
  var obj = req.body;
  obj.createdby = req.body && req.body.createdby;
  obj.reqtype = 'rejectedtraining'
  commonModel.mysqlModelService('call usp_learning_trxtrainingmodule_view(?)', JSON.stringify(obj), function (err, result) {
    if (err) {
      return res.json({
        "state": -1,
        "message": err
      });
    }
    else {
      if (result && result[0]) {
        if (result[0][0] && result[0][0].state == -1) {
          return res.json({
            "state": -1,
            "message": result[0][0].message
          });
        }
        return res.json({
          "state": 1,
          "message": "success",
          data: result[0],
        });
      }
    }

  });
}

function learningModulestoRegister(req, res) {
  var obj = req.body;
  obj.createdby = req.body && req.body.createdby;
  obj.reqtype = 'modulestoregister'
  commonModel.mysqlModelService('call usp_learning_trxtrainingmodule_view(?)', JSON.stringify(obj), function (err, result) {
    if (err) {
      return res.json({
        "state": -1,
        "message": err
      });
    }
    else {
      if (result && result[0]) {
        if (result[0][0] && result[0][0].state == -1) {
          return res.json({
            "state": -1,
            "message": result[0][0].message
          });
        }
        return res.json({
          "state": 1,
          "message": "success",
          data: result[0],
        });
      }
    }

  });
}

function getTrainingByMapid(req, res) {
  if (!req.body.mapid || !req.body.title) {
    return res.json({ state: -1, message: 'Required Parameters are missing' })
  }
  var obj = req.body;
  let obj1 = [];
  obj.action = 'viewbymapid';
  commonModel.mysqlModelService('call usp_learning_classroom(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)], (err, result) => {
    if (err) {
      res.json({
        state: -1,
        message: err,
        err: "error occured in DB"
      })
    }
    else {
      if (result[0] && result[0].length) {
        let maparr = []
        // newresult = JSON.parse(JSON.stringify(result[0]));
        // //console.log('reee',result[0])
        lodash.each(result[0], function (item) {
          maparr.push({
            department: item.department,
            departmentname: item.departmentname,
            mapid: item.mapid,
            assigneduser: item.assigneduser,
            assignedusername: item.assignedusername,
            assigntoall: item.assigntoall
          })
        })
        ////console.log('maparr',maparr)
        result[0][0].mappingdata = maparr
        delete result[0][0].mapid
        delete result[0][0].department
        delete result[0][0].assigneduser
        delete result[0][0].departmentname
        delete result[0][0].assignedusername
        delete result[0][0].assigntoall
        ////console.log('arrrrrrrrr',result[0])
        return res.json({ state: 1, message: 'Success', data: result[0][0] })

      }
      else {
        return res.json({ state: 1, message: 'Success', data: result[0] })

      }
    }
  })
}



function uploadFile(req, res) {
  var partialFilename = req.body && req.body.tokenFetchedData && req.body.tokenFetchedData.id + '_' + new Date().getTime();
  //console.log('req.body.title', req.body.title);
  if (!fs.existsSync(path.join(appRoot.path, 'uploads'))) {
    fs.mkdirSync(path.join(appRoot.path, 'uploads'))
  }
  if (!fs.existsSync(path.join(appRoot.path, 'uploads', 'learning'))) {
    fs.mkdirSync(path.join(appRoot.path, 'uploads', 'learning'));
  }
  if (!fs.existsSync(path.join(appRoot.path, 'uploads', 'learning', 'studymaterial'))) {
    fs.mkdirSync(path.join(appRoot.path, 'uploads', 'learning', 'studymaterial'));
  }
  if (!fs.existsSync(path.join(appRoot.path, 'uploads', 'learning', 'images'))) {
    fs.mkdirSync(path.join(appRoot.path, 'uploads', 'learning', 'images'));
  }
  if (!fs.existsSync(path.join(appRoot.path, 'uploads', 'learning', 'images', req.body.title))) {
    fs.mkdirSync(path.join(appRoot.path, 'uploads', 'learning', 'images', req.body.title));
  }
  if (!fs.existsSync(path.join(appRoot.path, 'uploads', 'learning', 'studymaterial', req.body.title))) {
    fs.mkdirSync(path.join(appRoot.path, 'uploads', 'learning', 'studymaterial', req.body.title));
  }
  var tmpfilename = path.join('uploads', 'learning', 'studymaterial', req.body.title);
  // + '/';
  upload.uploadmultipledoc(req, tmpfilename).then(data => {
    if (data != undefined) {
      var uploadedData = {
        filename: data[0].filename,
        uploadedpath: data[0].filepath
      }
      var ext = uploadedData && uploadedData.filename && uploadedData.filename.substr(uploadedData.filename.lastIndexOf('.') + 1);
      if (!(ext.toLowerCase() == 'pdf' || ext.toLowerCase() == 'docx' || ext.toLowerCase() == 'ppt' || ext.toLowerCase() == 'pptx')) {
        return res.json({
          "state": -1,
          "message": 'File is not valid'
        })
      }
      req.body.originalfile = data[0].filepath;
      if (ext.toLowerCase() == 'pdf') {
        var outputdir = path.join('uploads', 'learning', 'images', req.body.title);
        var outdir = path.join(appRoot.path, outputdir);
        data.originalfile = tmpfilename + uploadedData.filename;
        pdftoimage(uploadedData.uploadedpath, {
          format: 'png',
          prefix: partialFilename,
          outdir: outdir
        })
          .then(function (result) {
            var namesarr = [];
            fs.readdir(outdir, function (err, names) {
              if (err) {
                return res.json({
                  "state": -1,
                  "message": "Unable to read uploaded file.",
                  err: err
                })
              } else {
                for (var index = 0; index < names.length; index++) {
                  if (names[index].indexOf(partialFilename) > -1) {
                    var strpath = outputdir + '/' + names[index];
                    strpath = strpath.replace('uploads/', '');
                    namesarr.push(strpath);
                  }
                }
                req.body.documentpath = namesarr.toString();
                req.body.filetype = 'pdf';

                delete req.files;
                module.exports.saveTrainingData(req, res);
              }
            });
          })
          .catch(function (err) {
            return res.json({
              "state": -1,
              "message": 'Unable to read uploaded file.'
            })
          });

      }
      else if (ext.toLowerCase() == 'docx') {
        var outputdir = path.join('uploads', 'learning', 'images', req.body.title);
        var outdir = path.join(appRoot.path, outputdir);
        data.originalfile = uploadedData.uploadedpath;

        var newfilepath = uploadedData['uploadedpath'].replace(uploadedData.filename, '');
        docxConverter(data.originalfile, path.join(newfilepath, 'temp.pdf'), function (err, result) {
          if (err) {
          }
          pdftoimage(path.join(newfilepath, 'temp.pdf'), {
            format: 'png',
            prefix: partialFilename,
            outdir: outdir //'uploads/learning/images/' + req.body.title + '/'
          })
            .then(function (result) {
              var namesarr = [];
              fs.readdir(outdir, function (err, names) {
                if (err) {
                  return res.json({
                    "state": -1,
                    "message": "Unable to read uploaded file.",
                    "err": err
                  })
                } else {
                  for (var index = 0; index < names.length; index++) {
                    if (names[index].indexOf(partialFilename) > -1) {
                      var strpath = outputdir + '/' + names[index];
                      strpath = strpath.replace('uploads/', '');
                      namesarr.push(strpath);
                    }
                  }
                  data.documentpath = namesarr.toString();
                  req.body.documentpath = namesarr.toString();
                  req.body.filetype = 'doc';
                  delete req.files;
                  module.exports.saveTrainingData(req, res);
                }
              });

            })
            .catch(function (err) {
              return res.json({
                "state": -1,
                "message": "Something went wrong",
                "err": err
              })
            });
        });

      }
      else if (ext.toLowerCase() == 'ppt' || ext.toLowerCase() == 'pptx') {
        //console.log('Inside PPT');

        if (!fs.existsSync(path.join(appRoot.path, 'uploads', 'learning', 'studymaterial', req.body.title))) {
          fs.mkdirSync(path.join(appRoot.path, 'uploads', 'learning', 'studymaterial', req.body.title));
        }
        if (!fs.existsSync(path.join(appRoot.path, 'uploads', 'learning', 'images', req.body.title))) {
          fs.mkdirSync(path.join(appRoot.path, 'uploads', 'learning', 'images', req.body.title));
        }
        var outputdir = path.join('uploads', 'learning', 'images', req.body.title);
        var outdir = path.join(appRoot.path, outputdir);
        //console.log('outputdir', outputdir);
        data.originalfile = uploadedData.uploadedpath;
        var wordBuffer = fs.readFileSync(data.originalfile)
        toPdf(wordBuffer).then(
          function (pdfBuffer) {
            var tosave = path.join(appRoot.path, 'uploads/learning/studymaterial', req.body.title, '1.pdf');
            //console.log('to savee', tosave);
            fs.writeFileSync(tosave, pdfBuffer);
            pdftoimage(tosave, {
              format: 'png',
              prefix: partialFilename,
              outdir: outdir
              //'uploads/learning/images/' + req.body.title + '/'
            })
              .then(function (result) {
                var namesarr = [];

                fs.readdir(outdir, function (err, names) {

                  if (err) {
                    return res.json({
                      "state": -1,
                      "message": "Unable to read uploaded file.",
                      "err": err
                    })
                  } else {
                    for (var index = 0; index < names.length; index++) {
                      if (names[index].indexOf(partialFilename) > -1) {
                        var strpath = outputdir + '/' + names[index];
                        strpath = strpath.replace('uploads/', '');
                        namesarr.push(strpath);
                      }
                    }
                    req.body.documentpath = namesarr.toString();
                    req.body.filetype = 'ppt';
                    delete req.files;
                    module.exports.saveTrainingData(req, res);
                  }
                });

              })
              .catch(function (err) {
                if (!fs.existsSync(path.join(appRoot.path, 'uploads', 'learning', 'studymaterial', req.body.title))) {
                  fs.unlinkSync(path.join(appRoot.path, 'uploads', 'learning', 'studymaterial', req.body.title));
                }
                if (!fs.existsSync(path.join(appRoot.path, 'uploads', 'learning', 'images', req.body.title))) {
                  fs.unlinkSync(path.join(appRoot.path, 'uploads', 'learning', 'images', req.body.title));
                }

                return res.json({
                  "state": -1,
                  "message": "Something went wrong",
                  "err": err
                })
              });


          }, function (err) {
            return res.json({
              "state": -1,
              "message": "Something went wrong",
              "err": err
            })
          })
      }
      else {
        return res.json({
          state: -1,
          message: "Unsupported File Format. Required File Format(pdf/docx/ppt/pptx)"
        })
      }
    }
  })
    .catch(err => {
      return res.json({
        "state": -1,
        "message": "Something went wrong",
        err: err
      })
    })
}


function classroomtraining(req, res) {
  let obj = req.body;
  let obj1 = [];
  let assignedUserArray = req.body.assigneduser && req.body.assigneduser.split(',');
  if (req.body && req.body.mappingdata) {
    let mapdata = req.body.mappingdata;
    _.each(mapdata, (item) => {
      item = _.mapObject(item, function (val, key) {
        if (val && val.constructor === Array) {
          val = val.toString();
        }
        return val;
      });
      obj1.push(item)
    });
  }
  if (obj.action && (obj.action.toLowerCase() == 'edit' || obj.action.toLowerCase() == 'add')) {
    obj.reqtype = 'insert';
  }

  if ((assignedUserArray && assignedUserArray.length) > req.body.seats) {
    return res.json({
      state: -1,
      message: "Number of participants cannot be more than available seats!"
    });
  }
  commonModel.mysqlModelService('call usp_learning_classroom(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)], (err, result) => {
    if (err) {
      return res.json({
        state: -1,
        message: err,
        err: "error occured in DB"
      })
    }
    else {

      if (req.body.action && req.body.action == 'reject') {
        let emailObj = {
          id: req.body.userid, mailType: 'rejectedRegisteration',
          subjectVariables: {
            subject: "Training Request Rejected"
          },
          headingVariables: {
            heading: "Your Request for Training Registeration has been Rejected"
          },
          bodyVariables: {
            rejectReason: req.body.comments || '',
            trainingName: req.body.title,
          },
          createdby: req.body.createdby,
          guid: req.body.tokenFetchedData.guid
        };
        mailservice.mail(emailObj, function (err, response) {
          if (err) { }
          return res.json({
            state: result[0][0].state,
            message: "Training Reject successfully"
          })
        });
      }
      else if (req.body.action && req.body.action == 'classstatus') {
        let emailObj = {
          id: req.body.userid, mailType: 'rejectedTraining',
          subjectVariables: {
            subject: "Training Rejected"
          },
          headingVariables: {
            heading: "Your Training Module has been Rejected"
          },
          bodyVariables: {
            rejectReason: req.body.comments || '',
            trainingType: 'Classroom Training',
            trainingModule: req.body.title
          },
          createdby: req.body.createdby,
          guid: req.body.tokenFetchedData.guid
        };
        mailservice.mail(emailObj, function (err, response) {
          if (err) { }
          return res.json({
            state: result[0][0].state,
            message: "Action Performed successfully"
          })
        });
      }
      else if (req.body.action && req.body.action == 'add') {
        // let mapobj = {
        //     countryid: req.body.country,
        //     workforceid: req.body.workforce,
        //     locationid: req.body.location,
        //     businessunitid: req.body.businessunit,
        //     departmentid: req.body.department,
        //     createdby: req.body.createdby,
        //     configcode: 'Classroom'
        // }
        //mapobj.id = result[0] && result[0][0].state
        //mapobj.mapaction = 'add';
        ////console.log('mapobjjj', mapobj, 'id->', req.body.id, "ressdssdaadda", result[0][0].state);
        //commonModel.mysqlModelService('call usp_learning_mapping_operations(?)', [JSON.stringify(mapobj)], (err1, results) => {
        //   //console.log(err1, results, "asdddddddddddddsadsasd");
        //   if (err1) {
        //       return res.json({
        //         "state": -1,
        //         "message": results[0][0].message
        //     });
        // }
        // else {

        //console.log("ressss", result);
        if (result[0][0].state == 1) {
          var msgbody = `A new batch titled as ${req.body.title} is created for training ${result[0][0].trainingName}.`

          var keysdata = {
            createdby: req.body.createdby, touser: result[0][0].tousers,
            description: msgbody, module: 'Learning', action: 'add'
          };
          //console.log("keysdata", keysdata);

          notificationCtrl.saveUserNotificationDirect(keysdata);
        }
        return res.json({
          state: 1,
          message: "Training Added successfully",
          batchId: result[0][0].batchId
        })
        // }
        //})
      }
      else if (req.body.action && req.body.action == 'edit') {
        // let mapobj = {
        //     countryid: req.body.country,
        //     workforceid: req.body.workforce,
        //     locationid: req.body.location,
        //     businessunitid: req.body.businessunit,
        //     departmentid: req.body.department,
        //     createdby: req.body.createdby,
        //     configcode: 'Classroom'
        // }
        // mapobj.id = req.body.id;
        // mapobj.mapaction = 'edit';
        // //console.log('mapobjjj', mapobj, 'id->', req.body.id, "ressdssdaadda", result[0][0].state);
        // commonModel.mysqlModelService('call usp_learning_mapping_operations(?)', [JSON.stringify(mapobj)], (err1, results) => {
        //     //console.log(err1, results, "asdddddddddddddsadsasd");
        //     if (err1) {
        //         return res.json({
        //             "state": -1,
        //             "message": results[0][0].message
        //         });
        //     }
        //     else {
        return res.json({
          state: 1,
          message: "Training Updated successfully"
        })
        //    }
        // })
      }
      else {
        return res.json({
          state: 1,
          message: result[0][0].message,
          data: result
        })
      }
    }
  })
}

function classroomview(req, res) {
  var obj = req.body;
  let obj1 = [];
  //console.log('reqqssssssssss classroom', req.body)
  commonModel.mysqlModelService('call usp_learning_classroom(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)], (err, result) => {
    if (err) {
      res.json({
        state: -1,
        message: err,
        err: "error occured in DB"
      })
    }
    else {
      //console.log('ressss', result)
      res.json({
        state: result[1][0].state,
        message: result[1][0].message,
        data: result
      })
    }
  })
}


async function searchTrainingData(req, res) {
  try {
    var obj = req.body;
    obj.reqtype = "search_training";
    var obj1 = {};
    var result = await query('call usp_learning_classroom(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function getTestStatusCounts(req, res) {
  try {
    var obj = req.body;
    obj.reqtype = "count_of_teststatus";
    var obj1 = {};
    var result = await query('call usp_learning_classroom(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function getTotalPointsAndAmounts(req, res) {
  try {
    var obj = req.body;
    obj.reqtype = "total_points_and_amounts";
    var obj1 = {};
    var result = await query('call usp_learning_classroom(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}