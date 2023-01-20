
const proc = require('../../common/procedureConfig')
const uploadController = require('../upload/Controller')
const commonModel = require('../../common/Model');
var _ = require('underscore');
const path = require('path');
const appRoot = require('app-root-path');
var fs = require('fs');
const { makeDirectories } = require('../../common/utils')


const config = require("../../../config/config");
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;



module.exports = {
  getParsedRefrralData: getParsedRefrralData,
  viewResumeHistory: viewResumeHistory,
  // parseDataReferral:parseDataReferral,
  rmsUploadReferral: rmsUploadReferral,
  addReferalMatrix: addReferalMatrix,
  requistionResumeUpload

}



function rmsUploadReferral(req, res) {
  let dirname;
  makeDirectories(path.join('uploads', 'Recruitment', 'Referral'))
  if (req.files) {
    if (req.files['file']) {
      let file = req.files.file;
      let filename = file.name.split('.');
      dirname = path.join(appRoot && appRoot.path, '/uploads/Recruitment/Referral', filename[0] + Date.now() + '.' + filename[1]);
      var uploadedData = {
        filename: file.name,
        uploadedpath: dirname
      }
      file.mv(dirname, function (err) {
        if (err) {
          return res.json({ state: -1, message: 'File not uploaded. Please Try again!', data: null });
        } else {
          uploadController.parseData(uploadedData, req.body.createdby, req.body.sourceId, req.body.referredby)
            .then(result => {
              return res.json({ state: 1, message: 'success', data: result.result });
            })
            .catch(e => {
              return res.json({ state: -1, message: e.message || JSON.stringify(e), data: null });
            });
        }
      });
    } else {
      res.json({ state: -1, msg: 'file is not valid', data: null });
    }
  } else {
    res.json({ state: -1, msg: 'please select a file!!!', data: null });
  }
}


// function parseDataReferral(uploadedData, currentUser, resumesource, referredby) {
//     return new Promise((resolve, reject) => {
//         var skillsIdfromdbSess = [],
//             skillsfromdbSess = [],
//             locationsess = [],
//             locationIdSess = [],
//             instititueIdfromdbSess = [],
//             institituefromdb = [],
//             institituefromdbSess = [],
//             skillsfromdb = [],
//             skillsIdfromdb = [],
//             institituefromdb = [],
//             instititueIdfromdb = [],
//             location = [],
//             locationId = [],
//             instititueNamefromdb = [],
//             nameExclusions = [],
//             nameArrForFile = [],
//             result = ['', '', '', '', '', ''],
//             extSupported = ['pdf', 'doc', 'docx', 'rtf'],
//             mineSupported = ['text/rtf', 'application/rtf', 'application/x-rtf', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
//             dataTrack = [],
//             qualificationFromDb = [],
//             qualificationIdFromDb = [];
//         var obj = JSON.stringify({
//             configcode: 'technology,location,rmsJobType,rmsInstitute,qualification',
//             createdby: currentUser
//         });
//         commonModel.mysqlModelService('call usp_mstconfig_view(?)', [obj], function (err, results) {
//             if (err) {
//                 reject({ msg: 'failure', reason: err });
//             }

//             for (var i = 0; i < results[0].length; i++) {
//                 if (results[0][i].configcode === 'technology') {
//                     skillsfromdb.push(results[0][i].configvalue1);
//                     skillsIdfromdb.push(results[0][i].id);
//                 }
//                 if (results[0][i].configcode === 'location') {
//                     location.push(results[0][i].configvalue1);
//                     locationId.push(results[0][i].id);
//                 }
//                 if (results[0][i].configcode === 'rmsInstitute') {
//                     institituefromdb.push(results[0][i].configvalue1);
//                     instititueIdfromdb.push(results[0][i].id);
//                 }
//                 if (results[0][i].configcode === 'qualification') {
//                     qualificationFromDb.push(results[0][i].configvalue1);
//                     qualificationIdFromDb.push(results[0][i].id);
//                 }
//             }
//             var totalVal = {
//                 skillsfromdb: skillsfromdb,
//                 skillsIdfromdb: skillsIdfromdb,
//                 location: location,
//                 locationId: locationId,
//                 institituefromdb: institituefromdb,
//                 instititueIdfromdb: instititueIdfromdb,
//                 qualificationFromDb: qualificationFromDb,
//                 qualificationIdFromDb: qualificationIdFromDb
//             };


//             //code to get college Tier code using institituefromdb and instititueIdfromdb

//             var tierThreeCode, tierTwoCode, tierOneCode;
//             for (let index = 0; index < (institituefromdb && institituefromdb.length); index++) {
//                 if (institituefromdb[index] == 'Tier 1') {
//                     tierOneCode = instititueIdfromdb[index];
//                 }
//                 if (institituefromdb[index] == 'Tier 2') {
//                     tierTwoCode = instititueIdfromdb[index];
//                 }
//                 if (institituefromdb[index] == 'Tier 3') {
//                     tierThreeCode = instititueIdfromdb[index];
//                 }
//             }

//             /*************part 2*/
//             var flag = true;
//             var now = Date.now();
//             if (uploadedData != undefined) {
//                 var name = '',
//                     emailId = '',
//                     phoneno = '',
//                     flag = true,
//                     skills = '',
//                     fname = uploadedData.filename,
//                     exet = fname.split('.'),
//                     exe = exet[exet.length - 1],
//                     ffname = exet[0] + "_" + now,
//                     newpath = uploadedData.uploadedpath;
//                 var splitpath = newpath.split('uploads');
//                 var sPath = splitpath[splitpath.length - 1];
//                 if (extSupported.indexOf(exe.toLowerCase()) > -1) {
//                     var result = mime.lookup(newpath);
//                     if (mineSupported.indexOf(result) > -1) {
//                         textract.fromFileWithPath(newpath, textractConfig, function (error, text) {
//                             if (error) {
//                                 reject({ msg: 'failure', reason: 'file cannot be parsed' });
//                             } else if (typeof text != undefined) {
//                                 regCheck(text, function (textarr, textLowerCase) {
//                                     var years = 0;
//                                     var months = 0;
//                                     var namearr = [];
//                                     var flag = true;
//                                     var emailregx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
//                                     var phonenoregx = /^\d{10}$/;
//                                     var numregx = /\d/;
//                                     var length = textarr.length > 10 ? 10 : textarr.length;
//                                     var checklen = 0;
//                                     console.log("lengthhhh", length);
//                                     console.log("findtextaarrrrr", textarr);

//                                     for (var index = 0; index < length; index++) {
//                                         checklen++;
//                                         if (textarr[index] != ' EOL') {

//                                             if ((textarr[index].toLowerCase().indexOf('resume') == -1 && textarr[index].toLowerCase().indexOf('c v') == -1 &&
//                                                 textarr[index].toLowerCase().indexOf('cv') == -1 && textarr[index].toLowerCase().indexOf('c.v') == -1 &&
//                                                 textarr[index].toLowerCase().indexOf('curriculum') == -1 && textarr[index].toLowerCase().indexOf('developer') == -1
//                                                 && textarr[index].toLowerCase().indexOf('tester') == -1 && textarr[index].toLowerCase().indexOf('analyst') == -1
//                                                 && textarr[index].toLowerCase().indexOf('eol') == -1)) {
//                                                 // console.log("textarriinnddexx",textarr[index]);
//                                                 var tempstr = textarr[index].split(" ");
//                                                 for (var innerindex = 0; innerindex < (tempstr && tempstr.length); innerindex++) {
//                                                     if (tempstr[innerindex].match(phonenoregx) || tempstr[innerindex].match(emailregx)) {

//                                                         flag = false;
//                                                         break;
//                                                     }
//                                                 }
//                                                 if (flag) {
//                                                     if (!textarr[index].match(numregx)) {
//                                                         namearr.push(textarr[index]);
//                                                         console.log("namearrpush", namearr);

//                                                     }
//                                                 }
//                                             }
//                                         }
//                                         if (!flag) {
//                                             break;
//                                         }
//                                     }
//                                     var name = null;
//                                     if (checklen == 10 || checklen == textarr.length || textarr.length == 0 || namearr.length == 0) {
//                                         // console.log("iiiinnntttooooiiiffff111",checklen,textarr.length,namearr.length);
//                                         if (namearr.length != 0) {
//                                             //logic
//                                             for (i = 0; i < namearr.length; i++) {
//                                                 // console.log("nameiitteemmm");
//                                                 if (namearr[i] && namearr[i].toLowerCase().includes("name")) {
//                                                     if (namearr[i] && namearr[i].toLowerCase().includes("father's name") || namearr[i] && namearr[i].toLowerCase().includes("mother's name")) {
//                                                         name = null;
//                                                     } else {
//                                                         var tempname = namearr[i] && namearr[i].toLowerCase().replace('name', '');
//                                                         name = tempname && tempname.replace(' eol', '').replace(/\\r|\\/g, "").trim();
//                                                         // console.log("naammeee11111",name);
//                                                         break;
//                                                     }

//                                                 } else {
//                                                     // name= null;
//                                                     // console.log("ttrriimmmm2",namearr[i].trim());
//                                                     if (namearr[i] && namearr[i].trim() == 'EOL' || namearr[i] && namearr[i].replace('" "', '').trim() == "EOL" || namearr[i] && namearr[i].toLowerCase().includes("corporate")
//                                                         || namearr[i] && namearr[i].toLowerCase().includes("service") || namearr[i] && namearr[i].toLowerCase().includes("pvt")
//                                                         || namearr[i] && namearr[i].toLowerCase().includes("private") || namearr[i] && namearr[i].toLowerCase().includes("salary") || namearr[i] && namearr[i].length > 28 || namearr[i] && namearr[i].toLowerCase().includes("interest")) {
//                                                         console.log("nameeeeeeeeerrrmmmmmmmmmrr1", name);
//                                                     }
//                                                     else {
//                                                         name = namearr[i] && namearr[i].replace(' EOL', '').replace(/\\r|\\/g, "").trim();
//                                                         // console.log("nameeeeeeeeerrrmmmmmmmmmrr3210",name);
//                                                         break;
//                                                     }
//                                                 }

//                                             }
//                                         } else {
//                                             name = null;
//                                         }
//                                         // console.log("naammeee",name);
//                                     } else {
//                                         // console.log("nameeffbbxcb", namearr, "zzeerrrroooo",namearr[0],"length",namearr.length);
//                                         for (i = 0; i < (namearr && namearr.length); i++) {
//                                             console.log(`namearr${i}`, namearr[i]);
//                                             console.log("ttrriimmmm11", namearr[i].trim());
//                                             if (namearr[i] && namearr[i].trim() == 'EOL' || namearr[i] && namearr[i].replace('" "', '').trim() == "EOL" || namearr[i] && namearr[i].toLowerCase().includes("corporate")
//                                                 || namearr[i] && namearr[i].toLowerCase().includes("service") || namearr[i] && namearr[i].toLowerCase().includes("pvt")
//                                                 || namearr[i] && namearr[i].toLowerCase().includes("private") || namearr[i] && namearr[i].toLowerCase().includes("salary")
//                                                 || namearr[i] && namearr[i].length > 28 || namearr[i] && namearr[i].toLowerCase().includes("interest")) {
//                                                 console.log("nameeeeeeeeerrrmmmmmmmmmrr1", name);
//                                             }
//                                             else {
//                                                 name = namearr[i] && namearr[i].replace(' EOL', '').replace(/\\r|\\/g, "").trim();
//                                                 // console.log("nameeeeeeeeerrrmmmmmmmmmrr321",name);
//                                                 break;
//                                             }
//                                         }
//                                         // console.log("nameeeeeeeeerrrrr",name);
//                                     }
//                                     //code to get experience from career objective
//                                     var careerExperience = experienceFromCareerObjective(textarr);
//                                     years = careerExperience && careerExperience.years;
//                                     months = careerExperience && careerExperience.months;
//                                     // console.log("yearseeeee",years,months);

//                                     if (years == 0 && months == 0) {
//                                         //code to get experience in years from tillnow + worked at
//                                         var obj = uploadCtrl.getExperienceFromWords(textarr);
//                                         years = obj && obj.years;
//                                         months = obj && obj.months;
//                                         // console.log("yearssss",years,"monthssss",months);
//                                     }
//                                     //  console.log("yearsss111s",years,"monthsss111s",months);
//                                     if ((years % 1) != 0) {
//                                         var x = years;
//                                         years = Math.floor(years);
//                                         months = Math.floor((x - years) * 100);
//                                     }

//                                     if (months >= 12) {
//                                         years += Math.floor(months / 12);
//                                         months = months % 12;
//                                     }

//                                     /* code to get no. of companies changed
//                                     * we are matching elements with keywords like private ltd. serive ltd etc..
//                                     * count is incremented if such keywords are found
//                                     */
//                                     var noOfCompaniesWorked = 0;
//                                     for (let index = 0; index < (textarr && textarr.length); index++) {
//                                         if ((textarr[index] && textarr[index].toLowerCase().search("industries") != -1) || (textarr[index] && textarr[index].toLowerCase().search("private limited") != -1) ||
//                                             (textarr[index] && textarr[index].toLowerCase().search("service limited") != -1) || (textarr[index] && textarr[index].toLowerCase().search("consultancy services") != -1)
//                                             || (textarr[index] && textarr[index].toLowerCase().search("pvt ltd") != -1 || (textarr[index] && textarr[index].toLowerCase().search("enterprises") != -1))) {
//                                             console.log("skskdfhfh", textarr[index]);

//                                             noOfCompaniesWorked++;
//                                         }
//                                     }
//                                     console.log("noOfCompaniesWorkedddddd", noOfCompaniesWorked);

//                                     //code to get college tier
//                                     var dirName = path.join(appRoot && appRoot.path, '/resumeJsonFiles/ResumeCompare/collegeTier.json');
//                                     var collegeData;
//                                     var tier = "Others";
//                                     var tierCode;
//                                     var collegeRegexp;
//                                     var k = 0;
//                                     collegeData = JSON.parse(fs.readFileSync(dirName));
//                                     var collegeName;
//                                     while (k < (textarr && textarr.length)) {
//                                         if ((textarr[k] && textarr[k].toLowerCase().search("achievement") != -1) || (textarr[k] && textarr[k].toLowerCase().search("projects") != -1) ||
//                                             (textarr[k] && textarr[k].toLowerCase().search("training") != -1) || (textarr[k] && textarr[k].toLowerCase().search("curricular") != -1)) {
//                                             console.log("textarrkkkk", textarr[k]);
//                                             k = k + 8;
//                                             console.log("kkkk", k);
//                                             console.log("textarrkkkkiii", textarr[k]);
//                                             if (k >= textarr && textarr.length) { break; }
//                                         }
//                                         for (j = 0; j < (collegeData && collegeData.length); j++) {
//                                             // console.log("collegedataaa")
//                                             collegeRegexp = new RegExp("[^a-z]" + collegeData[j] && collegeData[j].Name.toLowerCase() + "[^a-z]");
//                                             if (textarr[k] && (textarr[k].toLowerCase().search(collegeRegexp) != -1)) {
//                                                 console.log("ppppppppppppp", k);

//                                                 console.log("textttarr55555555555555555", textarr[k], "bjjjh", collegeData[j]);
//                                                 tier = collegeData[j] && collegeData[j].Tier;
//                                                 collegeName = collegeData[j] && collegeData[j].Name;
//                                                 if (tier == "Tier 1") {
//                                                     tierCode = tierOneCode;
//                                                     console.log("tier and college2", tier, collegeName);
//                                                     break;
//                                                 }
//                                                 else if (tier == "Tier 2") {
//                                                     tierCode = tierTwoCode;
//                                                     console.log("tier and college3", tier, collegeName);
//                                                     break;
//                                                 }
//                                             }
//                                         }
//                                         if (tier == "Tier 1") { break; }
//                                         k++;
//                                     }
//                                     if (tier == "Others") {
//                                         tierCode = tierThreeCode;
//                                     }
//                                     //code to get skills from c.v
//                                     var skillPath = path.join(appRoot && appRoot.path, '/resumeJsonFiles/ResumeCompare/skillSet.json');
//                                     var skillsSet = JSON.parse(fs.readFileSync(skillPath));
//                                     var skillsRegExp;
//                                     var skillsArray = [];
//                                     var skills;
//                                     for (i = 0; i < (textarr && textarr.length); i++) {
//                                         for (j = 0; j < (skillsSet && skillsSet.length); j++) {
//                                             skillsRegExp = new RegExp("[^a-z]" + skillsSet[j] && skillsSet[j].toLowerCase() + "[^a-z]");
//                                             if ((textarr[i] && textarr[i].toLowerCase().search(skillsRegExp) != -1)) {
//                                                 skillsArray.push(skillsSet[j]);
//                                             }
//                                         }
//                                     }

//                                     // console.log("skillsSettttt",skillsSet);
//                                     var uniq = [...new Set(skillsArray)]
//                                     skills = uniq.join();

//                                     //code to get 10th 12th and highest degree percentage
//                                     var percentPossibiliy = [];
//                                     var twelfthPercentage = 0;
//                                     var tenthPercentage = 0;
//                                     var highestDegreePercentage = 0;
//                                     for (var index = 0; index < (textarr && textarr.length); index++) {
//                                         if (textarr[index] && textarr[index].search("%") != -1 || textarr[index] && textarr[index].toLowerCase().search("cgpa") != -1) {
//                                             percentPossibiliy && percentPossibiliy.push(textarr[index]);
//                                         }
//                                     }
//                                     console.log("percentPossibiliyyyyyyyyyyyy", percentPossibiliy);

//                                     for (var i = 0; i < (percentPossibiliy && percentPossibiliy.length); i++) {
//                                         if ((percentPossibiliy[i] && percentPossibiliy[i].replace(/\./g, "").toLowerCase().search("btech") != -1) || percentPossibiliy[i] && percentPossibiliy[i].replace(/\./g, "").toLowerCase().search("bba") != -1 ||
//                                             percentPossibiliy[i] && percentPossibiliy[i].replace(/\./g, "").toLowerCase().search("bca") != -1 || percentPossibiliy[i] && percentPossibiliy[i].replace(/\./g, "").toLowerCase().search("bachelor of engineering") != -1) {
//                                             var gradArray = percentPossibiliy[i] && percentPossibiliy[i].split(' ');
//                                             for (j = 0; j < (gradArray && gradArray.length); j++) {
//                                                 if (gradArray[j] && gradArray[j].search("%") != -1) {
//                                                     if (/\d/.test(gradArray[j - 1] && gradArray[j - 1].replace(/\\r|\\/g, ""))) {
//                                                         highestDegreePercentage = gradArray[j - 1];
//                                                         break;
//                                                     } else {
//                                                         highestDegreePercentage = parseFloat(gradArray[j].replace("%", ''));
//                                                         break;
//                                                     }
//                                                 }
//                                                 if (gradArray[j] && gradArray[j].toLowerCase().search("cgpa") != -1) {
//                                                     console.log("tttttttttttthhhhhhhhhhh", gradArray[j], gradArray[j - 1], typeof (gradArray[j + 1].replace(/\\r|\\/g, "")), parseFloat(gradArray[j + 1] && gradArray[j + 1].replace(/\\r|\\/g, "").replace(/\(/g, "")));

//                                                     if (/\d/.test(gradArray[j - 1] && gradArray[j - 1].replace(/\\r|\\/g, ""))) {
//                                                         highestDegreePercentage = parseFloat(gradArray[j - 1] && gradArray[j - 1].replace(/\(/g, "").replace(/\\r|\\/g, "")) * 9.5;
//                                                     }
//                                                     if (/\d/.test(gradArray[j + 1] && gradArray[j + 1].replace(/\\r|\\/g, ""))) {
//                                                         highestDegreePercentage = parseFloat(gradArray[j + 1] && gradArray[j + 1].replace(/\(/g, "").replace(/\\r|\\/g, "")) * 9.5;
//                                                         console.log("eeettttttttttt", highestDegreePercentage);

//                                                     }
//                                                     console.log("highestDegreePercentageageeeeeee", highestDegreePercentage);
//                                                     break;

//                                                 }
//                                             }
//                                         }
//                                         if ((percentPossibiliy[i] && percentPossibiliy[i].replace(/\./g, "").toLowerCase().search("mtech") != -1) || percentPossibiliy[i] && percentPossibiliy[i].replace(/\./g, "").toLowerCase().search("mba") != -1 ||
//                                             percentPossibiliy[i] && percentPossibiliy[i].replace(/\./g, "").toLowerCase().search("mca") != -1 || percentPossibiliy[i] && percentPossibiliy[i].replace(/\./g, "").toLowerCase().search("pgdac") != -1) {
//                                             var gradArray = percentPossibiliy[i] && percentPossibiliy[i].split(' ');
//                                             for (j = 0; j < (gradArray && gradArray.length); j++) {
//                                                 if (gradArray[j] && gradArray[j].search("%") != -1) {
//                                                     if (/\d/.test(gradArray[j - 1] && gradArray[j - 1].replace(/\\r|\\/g, ""))) {
//                                                         highestDegreePercentage = gradArray[j - 1];
//                                                         break;
//                                                     } else {
//                                                         highestDegreePercentage = parseFloat(gradArray && gradArray[j].replace("%", ''));
//                                                         break;
//                                                     }
//                                                 }
//                                             }
//                                         }
//                                         if ((percentPossibiliy[i] && percentPossibiliy[i].toLowerCase().search("hsc") != -1) || percentPossibiliy[i] && percentPossibiliy[i].toLowerCase().search("12") != -1 ||
//                                             percentPossibiliy[i] && percentPossibiliy[i].toLowerCase().search("xii") != -1 || percentPossibiliy[i] && percentPossibiliy[i].toLowerCase().search("higher secondary") != -1) {
//                                             var twelfthArray = percentPossibiliy[i] && percentPossibiliy[i].split(' ');
//                                             for (j = 0; j < (twelfthArray && twelfthArray.length); j++) {
//                                                 if (twelfthArray[j] && twelfthArray[j].search("%") != -1) {
//                                                     if (/\d/.test(twelfthArray[j - 1] && twelfthArray[j - 1].replace(/\\r|\\/g, ""))) {
//                                                         twelfthPercentage = twelfthArray[j - 1];
//                                                         break;
//                                                     } else {
//                                                         twelfthPercentage = parseFloat(twelfthArray[j] && twelfthArray[j].replace('"', "").replace("%", ''));
//                                                         break;
//                                                     }
//                                                 }
//                                             }
//                                         }
//                                         if (percentPossibiliy[i] && percentPossibiliy[i].toLowerCase().search("ssc") != -1 || percentPossibiliy[i] && percentPossibiliy[i].toLowerCase().search("10th") != -1
//                                             || percentPossibiliy[i] && percentPossibiliy[i].toLowerCase().search(/xth[^a-z]/) != -1
//                                             || percentPossibiliy[i] && percentPossibiliy[i].toLowerCase().search(/[^a-z]x[^a-z]/) != -1 || percentPossibiliy[i] && percentPossibiliy[i].toLowerCase().search("senior secondary ") != -1) {
//                                             var tenthArray = percentPossibiliy[i] && percentPossibiliy[i].split(' ');

//                                             console.log("jjjjjjjjhhhhjkkjlk", tenthArray);

//                                             for (j = 0; j < (tenthArray && tenthArray.length); j++) {
//                                                 if (tenthArray[j] && tenthArray[j].search("%") != -1) {
//                                                     if (/\d/.test(tenthArray[j - 1] && tenthArray[j - 1].replace(/\\r|\\/g, ""))) {
//                                                         tenthPercentage = tenthArray[j - 1];
//                                                         break;
//                                                     } else {
//                                                         tenthPercentage = parseFloat(tenthArray[j] && tenthArray[j].replace('"', "").replace("%", ''));
//                                                         break;
//                                                     }
//                                                 }
//                                                 if (tenthArray[j] && tenthArray[j].toLowerCase().search("cgpa") != -1) {
//                                                     console.log("tttttttttttthhhhhhhhhhh", tenthArray[j], tenthArray[j - 1], typeof (tenthArray[j + 1].replace(/\\r|\\/g, "")), parseFloat(tenthArray[j + 1] && tenthArray[j + 1].replace(/\\r|\\/g, "")));

//                                                     if (/\d/.test(tenthArray[j - 1] && tenthArray[j - 1].replace(/\\r|\\/g, ""))) {
//                                                         tenthPercentage = parseFloat(tenthArray[j - 1] && tenthArray[j - 1].replace('"', "").replace(/\\r|\\/g, "")) * 9.5;
//                                                     }
//                                                     if (/\d/.test(tenthArray[j + 1] && tenthArray[j + 1].replace(/\\r|\\/g, ""))) {
//                                                         tenthPercentage = parseFloat(tenthArray[j + 1] && tenthArray[j + 1].replace('"', "").replace(/\\r|\\/g, "")) * 9.5;
//                                                         console.log("eeettttttttttt", tenthPercentage);

//                                                     }
//                                                     console.log("tenthPercentageeeeeee", tenthPercentage);

//                                                 }
//                                             }
//                                         }
//                                     }
//                                     console.log("rrrrrrrrrrrrrrr", twelfthPercentage, tenthPercentage);

//                                     for (let index = 0; index < (textarr && textarr.length); index++) {
//                                         if (!highestDegreePercentage) {

//                                             for (let k = 0; k < (percentPossibiliy && percentPossibiliy.length); k++) {
//                                                 //    console.log("eeeeeeeeeeeeeeeeeee",index,textarr[index],percentPossibiliy[k]);

//                                                 if (textarr[index] && textarr[index].replace(/[^A-Za-z0-9%]/g, '').search(percentPossibiliy[k].replace(/[^A-Za-z0-9%]/g, '')) != -1) {
//                                                     for (let m = 1; m < 6; m++) {
//                                                         if (textarr[index - m] && textarr[index - m].replace(/\./g, "").toLowerCase().search("btech") != -1 || textarr[index - m] && textarr[index - m].replace(/\./g, "").toLowerCase().search("bca") != -1 ||
//                                                             textarr[index - m] && textarr[index - m].replace(/\./g, "").toLowerCase().search("bba") != -1 || textarr[index - m] && textarr[index - m].replace(/\./g, "").toLowerCase().search("bachelor of engineering") != -1) {
//                                                             var gradArray = percentPossibiliy[k].split(' ');
//                                                             //  console.log("twelfthhhhhhhh",twelfthArray);

//                                                             for (var j = 0; j < (gradArray && gradArray.length); j++) {
//                                                                 if (gradArray[j] && gradArray[j].search("%") != -1) {
//                                                                     //console.log("jjjjjjjjjjjjj",twelfthArray[j]);
//                                                                     //console.log("ppasrseseseeseses",twelfthArray[j].replace("%",''));

//                                                                     highestDegreePercentage = parseFloat(gradArray[j] && gradArray[j].replace('"', '').replace("%", '').trim());
//                                                                     // console.log("twelfthPercentageeeee",twelfthPercentage);

//                                                                     break;
//                                                                 }

//                                                             }
//                                                             break;
//                                                         }
//                                                     }
//                                                 }
//                                             }
//                                             for (let k = 0; k < (percentPossibiliy && percentPossibiliy.length); k++) {
//                                                 //    console.log("eeeeeeeeeeeeeeeeeee",index,textarr[index],percentPossibiliy[k]);

//                                                 if (textarr[index] && textarr[index].replace(/[^A-Za-z0-9%]/g, '').search(percentPossibiliy[k].replace(/[^A-Za-z0-9%]/g, '')) != -1) {
//                                                     for (let m = 1; m < 6; m++) {
//                                                         if (textarr[index - m] && textarr[index - m].toLowerCase().replace(/\./g, "").search("mtech") != -1 || textarr[index - m] && textarr[index - m].toLowerCase().replace(/\./g, "").search("mca") != -1 ||
//                                                             textarr[index - m] && textarr[index - m].toLowerCase().replace(/\./g, "").search("mba") != -1) {
//                                                             var gradArray = percentPossibiliy[k].split(' ');
//                                                             //  console.log("twelfthhhhhhhh",twelfthArray);

//                                                             for (var j = 0; j < (gradArray && gradArray.lengt); j++) {
//                                                                 if (gradArray[j].search("%") != -1) {
//                                                                     //console.log("jjjjjjjjjjjjj",twelfthArray[j]);
//                                                                     //console.log("ppasrseseseeseses",twelfthArray[j].replace("%",''));

//                                                                     highestDegreePercentage = parseFloat(gradArray[j].replace('"', '').replace("%", '').trim());
//                                                                     // console.log("twelfthPercentageeeee",twelfthPercentage);

//                                                                     break;
//                                                                 }
//                                                             }
//                                                             break;
//                                                         }
//                                                     }
//                                                 }
//                                             }
//                                         }
//                                         if (!twelfthPercentage) {

//                                             for (let k = 0; k < (percentPossibiliy && percentPossibiliy.length); k++) {
//                                                 //    console.log("eeeeeeeeeeeeeeeeeee",index,textarr[index],percentPossibiliy[k]);

//                                                 if (textarr[index] && textarr[index].replace(/[^A-Za-z0-9%]/g, '').search(percentPossibiliy[k].replace(/[^A-Za-z0-9%]/g, '')) != -1) {
//                                                     for (let m = 1; m < 6; m++) {
//                                                         if (textarr[index - m] && textarr[index - m].toLowerCase().search("xii") != -1 || textarr[index - m] && textarr[index - m].toLowerCase().search("12th") != -1 ||
//                                                             textarr[index - m] && textarr[index - m].toLowerCase().search("intermediate") != -1 || textarr[index - m] && textarr[index - m].toLowerCase().search("senior secondary") != -1) {
//                                                             var twelfthArray = percentPossibiliy[k].split(' ');
//                                                             console.log("twelfthhhhhhhh", twelfthArray);

//                                                             for (var j = 0; j < (twelfthArray && twelfthArray.length); j++) {
//                                                                 if (twelfthArray[j].search("%") != -1) {
//                                                                     console.log("jjjjjjjjjjjjj", twelfthArray[j]);
//                                                                     console.log("ppasrseseseeseses", twelfthArray[j].replace("%", ''));

//                                                                     twelfthPercentage = parseFloat(twelfthArray[j].replace('"', '').replace("%", '').trim());
//                                                                     console.log("twelfthPercentageeeee", twelfthPercentage);

//                                                                     break;
//                                                                 }
//                                                             }
//                                                             break;
//                                                         }
//                                                     }
//                                                 }
//                                             }
//                                         }
//                                         if (!tenthPercentage) {

//                                             //  for (let k = 0; k < (percentPossibiliy && percentPossibiliy.length); k++) {
//                                             //       //console.log("percentPossibiliyyyyyyyy",textarr[index],percentPossibiliy[k]);

//                                             //      if(textarr[index] && textarr[index] && textarr[index].search(percentPossibiliy && percentPossibiliy[k]) != -1){
//                                             //          // console.log("tttttttttttttttttttttttttt",textarr[index]);

//                                             //          for (let m = 1; m < 6; m++) {
//                                             //               // console.log("textarrindexmmmm",index-m,textarr[index-m].toLowerCase(),textarr[index-m].toLowerCase().search(/x+$/) ,
//                                             //               // textarr[index-m].toLowerCase().search(/xth[^a-z]/)+1
//                                             //               // ,textarr[index-m].toLowerCase().search("10th") );

//                                             //              if(textarr[index-m]&&textarr[index-m].toLowerCase().search(/x[^a-z]/) != -1||(textarr[index-m]&&textarr[index-m].toLowerCase().search(/xth[^a-z]/)+1) != 0
//                                             //              ||textarr[index-m]&&textarr[index-m].toLowerCase().search("10th") != -1 || textarr[index-m]&&textarr[index-m].toLowerCase().search("high school") != -1
//                                             //              || textarr[index-m]&&textarr[index-m].toLowerCase().search("secondary") != -1){
//                                             //                   // console.log("textarrrmmmmm",textarr[index-m]);

//                                             //                  var tenthArray = percentPossibiliy[k].split(' ');
//                                             //                   // console.log("tentharraaaayyy",tenthArray);

//                                             //                  for(var j=0;j<(tenthArray && tenthArray.length);j++){
//                                             //                      if(tenthArray[j] && tenthArray[j].search("%") != -1){
//                                             //                          tenthPercentage =parseFloat(tenthArray[j]  && tenthArray[j].replace('"','').replace("%",''));
//                                             //                           // console.log("tenthPercentageee",tenthPercentage);

//                                             //                          break;
//                                             //                      }
//                                             //                  }
//                                             //                  break;
//                                             //              }
//                                             //          }

//                                             //      }
//                                             //  }
//                                         }
//                                     }
//                                     //    console.log("lllllllllllllllllllllll",twelfthPercentage,tenthPercentage);

//                                     if (!twelfthPercentage) {
//                                         console.log("aaaaaaaaaaaa=====>>>>>");
//                                         var obj = uploadCtrl.percentageFromWords(textarr);
//                                         twelfthPercentage = obj && obj.twelfthPercentage;
//                                     }
//                                     if (!tenthPercentage) {
//                                         console.log("aaaaaaaaaaaa=====>>>>>");
//                                         var obj = uploadCtrl.percentageFromWords(textarr);
//                                         tenthPercentage = obj && obj.tenthPercentage;
//                                     }
//                                     if (!highestDegreePercentage) {
//                                         console.log("aaaaaaaaaaaa=====>>>>>");
//                                         var obj = uploadCtrl.percentageFromWords(textarr);
//                                         highestDegreePercentage = obj && obj.highestDegreePercentage;
//                                     }
//                                     console.log("graduation percentage ", highestDegreePercentage);


//                                     parserService.parseAllHr(text, textLowerCase, textarr, 'uploads/' + fname, [], totalVal)
//                                         .then(result => {
//                                             console.log("check inside then");

//                                             dataTrack.push({
//                                                 filename: fname,
//                                                 filepath: sPath,
//                                                 uploadstatus: 'success',
//                                                 uploadreason: '',
//                                                 candidatename: name ? name : result.name,
//                                                 email: result.email,
//                                                 phone: result.phone,
//                                                 skills: result.skillarrId,
//                                                 // skillsText: result.skillarrText,
//                                                 skillText: skills ? skills : result.skillarrText,
//                                                 permanentaddress: result.permanentAddress,
//                                                 qualification: result.Qualification,
//                                                 location: result.currentlocation,
//                                                 // years: years?years:result.years,
//                                                 // months: months?months:result.months,
//                                                 years: years,
//                                                 months: months,
//                                                 institutes: tierCode ? tierCode : result.instititutes,
//                                                 // institituteName:result.institituteName,
//                                                 institituteName: collegeName ? collegeName : result.institituteName,
//                                                 highestDegreePercentage: highestDegreePercentage,
//                                                 twelfthPercentage: twelfthPercentage,
//                                                 tenthPercentage: tenthPercentage,
//                                                 noOfCompaniesWorked: noOfCompaniesWorked || 0,
//                                                 organization: "",
//                                                 createdby: currentUser || 0,
//                                                 resumesource: resumesource,
//                                                 referredby: referredby || undefined
//                                             });
//                                             var obj = dataTrack;
//                                             console.log(" dataTrackArray==-----", obj);

//                                             var filetext = text.replace(/,/g, " ");
//                                             var resumeobj = {
//                                                 filepath: obj[0].filepath,
//                                                 text: filetext,
//                                                 flag: true,
//                                                 comparepath: null
//                                             }
//                                             console.log("resumeObj-------", resumeobj);

//                                             var dir = path.join(appRoot && appRoot.path, '/uploads/ResumeCompare/latest.json');
//                                             fs.readFile(dir, function (err, data) {
//                                                 if (err) {
//                                                     console.log('ERROR READING LATEST.JSON: ', err);
//                                                 } else if (data) {
//                                                     var arr = JSON.parse(data);
//                                                     arr.push(resumeobj);
//                                                     console.log('data : ', arr);
//                                                     fs.writeFile(dir, JSON.stringify(arr), function (err) {
//                                                         if (err) {
//                                                             console.log('error', error);
//                                                         } else {
//                                                             console.log('Resume Sent');
//                                                         }
//                                                     });
//                                                 }
//                                             });

//                                             resolve({ msg: 'success', result: obj });
//                                         })
//                                         .catch(error => {
//                                             console.log("this the check-------------------",error);

//                                             reject({ msg: 'failure', reason: error });
//                                         });
//                                 });
//                             } else {
//                                 reject({ msg: 'failure', reason: 'file cannot be parsed' });
//                             }
//                         });
//                     } else {
//                         reject({ msg: 'failure', reason: 'file can\'t parse' });
//                     }
//                 } else {
//                     reject({ msg: 'failure', reason: 'file format not found' });
//                 }
//             }
//         });
//     });
// }


// function regCheck(text, cb) {
//     // console.log("initialtexttttt",text);
//     var textLowerCase = text.toLowerCase().replace(/,/g, ' ').replace(/-/g, ' ').replace(/:/g, ' ').replace(/\n/g, ' ').replace(/\./g, ' ');
//     textLowerCase = textLowerCase.replace(/ +/g, ' ').replace(/\+/g, '');
//     text = text.replace(/:/g, ' ').replace(/-/g, ' ').replace(/,/g, ' ').replace(/ +/g, ' ').replace(/\+/g, '');
//     // console.log("texttttt",text);
//     var textarr = text.split('\n');
//     // console.log("regtexttttt",textarr);
//     textarr.forEach(function(element, index) {
//         // if(element.includes('\r')){
//             // console.log("intoifff");
//             // element.replace('\r','');
//             // console.log("intoifff",element);
//             textarr[index] = element.concat(' EOL');
//             // console.log("ttttt",textarr[index]);
//         // }else{
//         //     textarr[index] = element.concat(' EOL');
//         // }
//     });
//     console.log("newtextarray",textarr);

//     cb(textarr, textLowerCase);
// }


// function experienceFromCareerObjective(textarr){
//     var demoMonths = [];
//     var demoYears = [];
//     var singleElement=[],
//         years=0,
//         months=0,
//         numberGrid = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen'];
//     textarr.map(function(eachElement) {
//         var array = eachElement && eachElement.split(' ');
//         array.map(function(element) {
//             element = element && element.replace(/ /g, '');
//             if (element != '') singleElement.push(element.trim());
//         });
//     });
//     console.log("singleElement",singleElement);
// //loop to get experience if present in career objective  words
//     for(var i=0;i<120;i++){
//         if ((/^year/i).test(singleElement[i]) || (/^yr/i).test(singleElement[i])  && !(/period/i).test(singleElement[i-2]) ) {
//             if ((/^\d+(\.\d{1,4})?$/i).test(singleElement[i - 1]) || numberGrid.indexOf(singleElement[i - 1].toLowerCase()) != -1) {
//                 demoYears.push( parseFloat(singleElement[i - 1]));
//                 console.log("yyyyyearssss",years);
//                 var j = i;
//                 while (singleElement[j].indexOf('EOL') != -1) {
//                     if ((/month/i).test(singleElement[j]) || (/mnth/i).test(singleElement[j])) {
//                         if ((/\d{1,2}/gi).test(singleElement[j - 1]) || numberGrid.indexOf(singleElement[j - 1].toLowerCase()) != -1) {
//                             demoMonths.push( parseFloat(singleElement[j - 1]));
//                             console.log("mommmmmnthssss11",months);
//                         }
//                     }
//                     j++;
//                 }
//             }
//         }
//         if (((/month/i).test(singleElement[i]) || (/mnth/i).test(singleElement[i])) && !(/period/i).test(singleElement[i-2])  ) {
//             // console.log("month",textarr[k],textarr[i-2]);
//             if ((/\d{1,2}/gi).test(singleElement[i - 1]) || numberGrid.indexOf(singleElement[i - 1].toLowerCase()) != -1) {
//                 demoMonths.push(parseFloat( singleElement[i - 1]));
//                 console.log("mmmmmmonthssss",months);
//             }
//         }
//     }

// //end of loop
// months = demoMonths.reduce(function(a, b) { return a + b; }, 0);
// years = demoYears.reduce(function(a, b) { return a + b; }, 0);

//     var object ={
//         years:years,
//         months:months
//     }
//     console.log("on=bjnsncjdd",object)
//     return object;
// }



function getParsedRefrralData(req, res) {
  if (!req.body || !req.body.createdby) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  var obj = JSON.stringify({
    createdby: req.body.createdby,
    populate: req.body.populate || 0,
    id: req.body.id,
    action: 'Referral',
    filter: req.body.filter,
    reqtype: 'view'
  }); console.log('getParsedRefrralData', obj)
  commonModel.mysqlPromiseModelService(proc.rmscandidate, [obj])
    .then(results => {
      res.json({ message: 'success', result: results[0], state: 1 });
    })
    .catch(err => {
      return res.json({ message: err, state: -1, data: null });
    })
}

// function editTemporaryRecord(req, res) {

//     var body = req && req.body;
//     console.log("bbbbbbbbooooooooddddddddddyyyyyyyyyy", body);
//     var obj = {
//         "type": "getExperienceMasterData",
//         "createdby": body.createdby,
//         "isactive": body.isactive,
//         "requisitionid": body && body.requisitionid
//     }
//     obj = JSON.stringify(obj);
//     commonModel.mysqlPromiseModelService(proc.mstconfigview, [obj])
//         .then(results => {

//             var experienceFromDb;
//             experienceFromDb = results;
//             var rankingParameters = getCandidateRanking(body, experienceFromDb);
//             body.skills = body.skills ? body.skills.toString() : '';
//             body.qualification = body.qualification ? body.qualification.toString() : '';
//             body.dmltype = req.body.id ? 'U' : undefined;
//             body.ranking = rankingParameters.ranking || 0;
//             body.tenthScore = rankingParameters.tenthScore || 0;
//             body.twelfthScore = rankingParameters.twelfthScore || 0;
//             body.highestDegreeScore = rankingParameters.highestDegreeScore || 0;
//             body.yearsWithCompanyScore = rankingParameters.yearsWithCompanyScore || 0;
//             body.collegeTierScore = rankingParameters.collegeTierScore || 0;
//             body.experienceScore = rankingParameters.experienceScore || 0;
//             body.skillsScore = rankingParameters.skillsScore || 0;
//             body.ctcExpectationScore = rankingParameters.ctcExpectationScore || 0;

//             var data = req.body.id ? body : [body];
//             var obj = JSON.stringify(data);
//             console.log(obj, 'ddddddddvcccccccccccccccccccccccccccc');
//             var call = req.body.id ? proc.rmstempcandidateedit : proc.rmstempcandidateadd;
//             commonModel.mysqlPromiseModelService(call, [obj])
//                 .then(results => {
//                     res.ok({ msg: 'success', result: results });

//                 })
//         })
//         .catch(err => {
//             return res.json({ message: err, state: -1, data: null });
//         })

// }


function viewResumeHistory(req, res) {
  var obj = {
    id: req.body.id
  }

  commonModel.mysqlPromiseModelService(proc.viewreferralsresume, [JSON.stringify(obj)])
    .then(results => {
      res.json({ message: 'success', result: results, state: 1 });
    })
    .catch(err => {
      return res.json({ message: err, state: -1, data: null });
    })

}


function addReferalMatrix(req, res) {
  if (!req.body || !req.body.createdby || !req.body.action) {
    return res.json({ message: "Required parameters are missing.", state: -1, data: null })
  }
  let procedure = 'usp_rmsrefferalmatrix_operations(?)';
  var data = [];
  var obj = req.body.arr;
  var obj1 = {
    id: req.body.id,
    headerid: req.body.headerid,
    createdby: req.body.createdby,
    title: req.body.title,
    action: req.body.action,// 'addMatrixData',getMatrixView,editMatrixData,
    location: req.body.location,
    country: req.body.country,
    workforce: req.body.workforce,
    businessunit: req.body.businessunit,
    function: req.body.function,
    amount: req.body.amount,
    currency: req.body.currency
  }; //console.log('addReferalMatrix', obj1[0].function)

  if (req.body.action == "addMatrixData" || req.body.action == "editMatrixData") {
    data = [JSON.stringify(obj), JSON.stringify(obj1)];
    procedure = "usp_rmsrefferalmatrix_add(?,?)";
  } else {
    data = [JSON.stringify(obj1)];
    procedure = "usp_rmsrefferalmatrix_operations(?)";//proc.rmsrefmatrix;
  }


  commonModel.mysqlModelService(`call ${procedure}`, data, (err, result) => {
    console.log(err, result, "rms matrix")
    if (err) {
      res.json({
        state: -1,
        message: err,
        err: 'Something Went Wrong', time: res.time
      })
    }
    else {

      res.json({
        state: 1,//result[0][0].state,
        message: 'success',//result[0][0].message,
        data: result[0], time: res.time
      })

    }
  })



}

function requistionResumeUpload(req, res) {
  let dirname;
  makeDirectories(path.join('uploads', 'Recruitment', 'Requistionresume'))
  if (req.files) {
    if (req.files['file']) {
      let file = req.files.file;
      let filename = file.name.split('.');
      dirname = path.join(appRoot && appRoot.path, '/uploads/Recruitment/Requistionresume', filename[0] + Date.now() + '.' + filename[1]);
      var uploadedData = {
        filename: file.name,
        uploadedpath: dirname
      }
      file.mv(dirname, function (err) {
        if (err) {
          return res.json({ state: -1, message: 'File not uploaded. Please Try again!', data: null });
        } else {
          uploadController.parseData(uploadedData, req.body.createdby, req.body.sourceId, '', 'RequistionTag')
            .then(result => {
              result.result[0].sourceId = req.body.sourceId;
              console.log("res", result.result[0])
              return res.json({ state: 1, message: 'success', data: result.result });
            })
            .catch(e => {
              return res.json({ state: -1, message: e.message || JSON.stringify(e), data: null });
            });
        }
      });
    } else {
      res.json({ state: -1, msg: 'file is not valid', data: null });
    }
  } else {
    res.json({ state: -1, msg: 'please select a file!!!', data: null });
  }
}