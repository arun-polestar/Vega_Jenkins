"use strict";
var nodemailer = require("nodemailer");
var config = require("../config/config");
var commonModel = require("../routes/common/Model");
const query = commonModel.mysqlPromiseModelService;
var mysqlserv = require("./mysqlService");
const _ = require("underscore");
const fs = require("fs");
const appRoot = require("app-root-path");
const path = require("path");
const image2base64 = require("image-to-base64");
const cheerio = require("cheerio");
const aws = require("aws-sdk");
const { html } = require("cheerio");
var moment = require("moment-timezone");
moment.tz.setDefault("Asia/Kolkata");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
appRoot.originalPath = path.join(__dirname, "./../");
appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;

const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    config.GMAIL_CLIENT_ID, //process.env.CLIENT_ID,
    config.GMAIL_CLIENT_SECRET, //process.env.CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: config.GMAIL_REFRESH_TOKEN, //process.env.REFRESH_TOKEN
  });
  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        reject("Failed to create access token :(");
      }
      resolve(token);
    });
  });
  const transporter = nodemailer.createTransport({
    pool: true,
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    connectionTimeout: 300000,
    auth: {
      type: "OAuth2",
      user: config.mailconfig.user, // process.env.EMAIL,
      accessToken,
      clientId: config.GMAIL_CLIENT_ID,
      clientSecret: config.GMAIL_CLIENT_SECRET,
      refreshToken: config.GMAIL_REFRESH_TOKEN,
    },
    //tls: {
    //    rejectUnauthorized: false
    //}
  });
  return transporter;
};

let transporter;
if (config.webUrlLink.indexOf("soterius") != -1) {
  transporter = nodemailer.createTransport({
    // Credentials for user with SES access in AWS.
    SES: new aws.SES({
      accessKeyId: config.AWS_SES_ACCESS_KEY_ID,
      secretAccessKey: config.AWS_SES_SECRET_ACCESS_KEY,
      region: "us-east-1",
    }),
  });
} else if (
  config.webUrlLink.indexOf("falcon") != -1 ||
  config.webUrlLink.indexOf("statusneo") != -1
) {
  //console.log("falcon11");
  transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com", // hostname
    secureConnection: false, // TLS requires secureConnection to be false
    port: 587, // port for secure SMTP
    tls: {
      ciphers: "SSLv3",
    },
    auth: {
      user: config.mailconfig.user,
      pass: config.mailconfig.password,
    },
  });
} else if (config.webUrlLink.indexOf("statusneo") != -1) {
  //console.log("fstatusneo");
  transporter = nodemailer.createTransport({
    // host: "smtp-mail.outlook.com", // hostname
    pool: true,
    service: "Outlook365",
    host: "smtp.office365.com",
    port: 587,
    secureConnection: false,
    tls: {
      ciphers: "SSLv3",
    },
    auth: {
      user: config.mailconfig.user,
      pass: config.mailconfig.password,
    },
  });
} else {
  if ((config && config.env && config.env == "development") || (config.webUrlLink.indexOf("polestarllp") == -1)) {

    transporter = nodemailer.createTransport({
      pool: true,
      service: "gmail",
      connectionTimeout: 300000,
      auth: {
        type: "OAuth2",
        user: config.mailconfig.user, // process.env.EMAIL,
        //accessToken,
        clientId: config.GMAIL_CLIENT_ID,
        clientSecret: config.GMAIL_CLIENT_SECRET,
        refreshToken: config.GMAIL_REFRESH_TOKEN,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  else {
    transporter = nodemailer.createTransport({
      // Credentials for user with SES access in AWS.
      SES: new aws.SES({
        accessKeyId: config.DEFAULT_AWS_SES_ACCESS_KEY_ID,
        secretAccessKey: config.DEFAULT_AWS_SES_SECRET_ACCESS_KEY,
        apiVersion: "2010-12-01",
        region: "ap-northeast-1",
      }),
    });
  }


}

async function fetchMailConfigold() {
  try {
    const maildata = JSON.stringify({
      type: "view",
    });
    let [result] = await query("call usp_emailconfig_operations(?)", [
      maildata,
    ]);
    return result[0];
  } catch (err) {
    throw new Error(
      err.message || err || "Unable to fetch Email Configuration"
    );
  }
}

async function fetchMailConfig() {
  return new Promise(async (resolve, reject) => {
    const maildata = JSON.stringify({
      type: "view",
    });
    let [result] = await query("call usp_emailconfig_operations(?)", [
      maildata,
    ]);
    //console.log("rr", result[0].isserviceenable);
    if (
      result[0] &&
      result[0].isserviceenable &&
      result[0].isserviceenable == 1
    ) {
      resolve(result[0]);
    }

    reject("Service Disabled");
  });
}

async function errMailLogs(obj, options) {
  try {
    if (obj.status == 1) options = null;
    delete obj.html;
    delete obj.attachments;
    let reqdata = [];
    let mailData = {
      mailobj: obj,
      options: options,
      toemail:
        "to:{" +
        (obj.to || "") +
        "}, cc: {" +
        (obj.cc || "") +
        "}, bcc:{" +
        (obj.bcc || "") +
        "}",
      mailtype: obj.mailtype || obj.mailType || "Custom email",
      description: obj.err || "Mail Sent Successfully",
      status: obj.status,
    };
    let obj1 = {
      action: "insert",
    };
    reqdata.push(mailData);
    return await query("call usp_email_logs(?,?)", [
      JSON.stringify(obj1),
      JSON.stringify(reqdata),
    ]);
  } catch (err) {
    //console.log("error in Logging mail", err);
    return;
  }
}

// const transporter = nodemailer.createTransport({
//     pool:true,
//     service: config.mailconfig && config.mailconfig.service,
//     auth: {
//         user: config.mailconfig && config.mailconfig.user,
//         pass: config.mailconfig && config.mailconfig.password
//     }
// });
module.exports = {
  sendEmail,
  sendCalenderInvites,
  sendMailCustom,
  mail,
  send,
  sendOTP,
  fetchMailConfig,
  sendCustomEmail,
  send_dynamic_transporter,
};

async function mail(options, cb) {
  try {
    if (options.id) {
      var obj = JSON.stringify({
        id: options.id,
        attribute: "useremail,firstname,lastname,resettoken",
        createdby: options.createdby,
      });
      let [results] = await query("call usp_mstuser_view(?)", [obj]);
      var userInfo = results[0];
      options.fullname =
        userInfo.firstname + (userInfo.lastname ? " " + userInfo.lastname : "");
      options.email = userInfo.useremail;
      options.resettoken = userInfo.resettoken;
      if (options && options.moduleid) {
        send_dynamic(options, cb);
      } else {
        send(options, cb);
      }
    } else {
      if (options && options.moduleid) {
        send_dynamic(options, cb);
      } else {
        send(options, cb);
      }
    }
  } catch (err) {
    options.err = (err && err.response) || err;
    options.status = 0;
    errMailLogs(options, options);
    return cb({
      msg: "error fetching user info",
      reason: err,
    });
  }
}

function sendEmail(
  sender,
  receiver,
  mailsubject,
  mailmessage,
  attachments,
  callback
) {
  if (!sender && !receiver) {
    var error = new Error("Sender and Receiver field can not left blank");
    return callback(error, null);
  } else {
    send(options, cb);
  }
}
async function send(options, cb) {
  try {
    if (options.mailType) {
      let rese = await query(
        "Select profilepicpath from trx_admin_details where isactive = 1",
        []
      );
      let profilepathcl = rese && rese[0] && rese[0].profilepicpath;
      let clientlogo = path.join(
        appRoot.originalPath,
        "assets/img/client-logo.jpg"
      );
      if (profilepathcl) {
        let filepath = path.join(appRoot.path, "uploads" + profilepathcl);
        if (fs.existsSync(filepath)) {
          clientlogo = path.join(appRoot.path, "uploads" + profilepathcl);
        }
      }
      let mailInfonew = {};
      const linkUrl = options.linkUrl || config.webUrlLink;
      const buttonTitle = options.buttontitle || "Go to Vega HR";
      mailInfonew.subject = options.subjectVariables["subject"];
      if (options.subjectVariables) {
        const subjectArr = _.keys(options.subjectVariables);
        subjectArr.forEach((item) => {
          mailInfonew.subject =
            mailInfonew &&
            mailInfonew.subject &&
            mailInfonew.subject.replace(item, options.subjectVariables[item]);
        });
      }
      mailInfonew.heading =
        options &&
        options.headingVariables &&
        options.headingVariables["heading"];
      if (options.headingVariables) {
        const headingArr = _.keys(options.headingVariables);
        headingArr.forEach((item) => {
          mailInfonew.heading =
            mailInfonew &&
            mailInfonew.heading &&
            mailInfonew.heading.replace(item, options.headingVariables[item]);
        });
      }
      mailInfonew.type = options.mailType;
      const contentfilename = mailInfonew.type.concat(".html").toLowerCase();
      const contentfilepath = path.join(
        appRoot.originalPath,
        "assets/mailtemplate/contenttype",
        contentfilename
      );
      const contentread = fs.readFileSync(contentfilepath).toString();
      if (
        !fs.existsSync(contentfilepath) ||
        contentread.indexOf("Template Not Found") != -1
      ) {
        throw new Error("Template Not Found");
      }

      const contentreadFile = fs.readFileSync(contentfilepath).toString();
      mailInfonew.content = "";
      mailInfonew.html = contentreadFile;
      let appendattachments = [
        ...(await getLogoAttachments(clientlogo, mailInfonew.html)),
      ];

      console.log('mailOptions.attachments 351', appendattachments)

      let mailHtmlnew = await getReplacedHtml(
        mailInfonew.html,
        mailInfonew.heading,
        mailInfonew.content,
        linkUrl,
        buttonTitle
      );

      if (options.bodyVariables) {
        var paramArr = _.keys(options.bodyVariables);
        paramArr.forEach((item) => {
          var replacementvar = options.bodyVariables[item]
            ? options.bodyVariables[item]
            : "";
          mailInfonew.subject =
            mailInfonew &&
            mailInfonew.subject &&
            mailInfonew.subject.replace(item, replacementvar);
          var match = new RegExp(item, "g");
          mailHtmlnew = mailHtmlnew.replace(match, replacementvar);
        });
      }
      options.functionname = "send";
      if (options.resumelist && options.resumefilename) {
        var resume = options.resumelist;
        var filenames = options.resumefilename;
        var i = 0;

        resume.forEach((item) => {
          var fileresume = path.join(appRoot.path, "uploads" + item);
          if (fs.existsSync(fileresume)) {
            appendattachments.push({
              filename: filenames[i],
              path: path.join(appRoot.path, "uploads" + item),
            });
          }
          i++;
        });
      }
      let appendattachmentsn = [];
      if (options.attachments) {
        options.attachments.forEach((item) => {
          appendattachments.push(item);
        });
      }
      //    appendattachmentsn = appendattachments.concat(options.attachments)
      appendattachmentsn = appendattachments;
      // //console.log('AAAAAAAAAAAAAAAAA', appendattachmentsn);

      const emailsArray = options.email && options.email.split(",");

      const toArray =
        emailsArray && emailsArray.length > 1
          ? emailsArray.filter(function (elem, pos) {
              return emailsArray.indexOf(elem) == pos;
            })
          : options.email;
      const ccArray = options.cc && options.cc.split(",");

      const ccuniqueArray =
        ccArray && ccArray.length > 1
          ? ccArray.filter(function (elem, pos) {
              return ccArray.indexOf(elem) == pos;
            })
          : options.cc;
      const bccArray = options.bcc && options.bcc.split(",");

      const bccuniqueArray =
        bccArray && bccArray.length > 1
          ? bccArray.filter(function (elem, pos) {
              return bccArray.indexOf(elem) == pos;
            })
          : options.bcc;
      options.email = (toArray && toArray.toString()) || "";
      options.cc = (ccuniqueArray && ccuniqueArray.toString()) || "";
      options.bcc = (bccuniqueArray && bccuniqueArray.toString()) || "";

      var subjectid = getRandomNumber();
      let mailOptions = {
        subject: `${mailInfonew.subject} [SubjectID -${subjectid}]`,
        html: mailHtmlnew,
        bcc: options.bcc || "",
        to: options.email || "",
        cc: options.cc || "",
        replyTo: options.replyTo,
        mailtype: options.mailType,
        loop: options.loop,
      };
      if (options.mailType !== "documentUpload")
        mailOptions.attachments = appendattachmentsn;

      let mailconfig = await fetchMailConfig();
      let tempname = mailconfig.fromemail
        ? mailconfig.fromemail
        : mailconfig.user;
      mailOptions.from =
        (tempname || "Vega-HR Support") + " <" + mailconfig.user + ">";
      //let emailTransporter = await createTransporter();
      await transporter
        .sendMail(mailOptions)
        .then(() => {
          if (!mailOptions.loop || mailOptions.loop != 1) {
            mailOptions.status = 1;
            errMailLogs(mailOptions, options);
          }
          return cb();
        })
        .catch((err) => {
          if (!mailOptions.loop || mailOptions.loop != 1) {
            mailOptions.err = (err && err.response) || err;
            mailOptions.status = 0;
            errMailLogs(mailOptions, options);
          }
          return cb(err);
        });
    } else {
      throw new Error("Please send the required parameters: mailType");
    }
  } catch (err) {
    options.err = (err && err.response) || err;
    options.status = 0;
    errMailLogs(options, options);
    return cb(err);
  }
}

async function sendCalenderInvites(options, cb) {
  try {
    if (options.emailid) {
      var mailOptions = {
        to: options.emailid,
        subject: "Calendar Invitation",
        text: options.subject,
        mailtype: options.mailType,
      };
      let mailconfig = await fetchMailConfig();
      let tempname = mailconfig.fromemail
        ? mailconfig.fromemail
        : mailconfig.user;
      options.from =
        (tempname || "Vega-HR Support") + " <" + mailconfig.user + ">";
      if (
        options.mailType &&
        (options.mailType == "scheduledinterview" ||
          options.mailType == "rescheduledinterview")
      ) {
        var schOptions = {
          functionname: "sendCalenderInvites",
          email: options.emails,
          mailType: options.mailType,
          resumefilename: options.resumefilename,
          resumelist: options.resumelist,
          subjectVariables: {
            subject: options.subject,
          },
          headingVariables: {
            heading: options.title,
          },
          bodyVariables: {
            trxinterviewstate: options.trxinterviewstate, //technical,screening,hr
            trxinterviewdate: options.trxinterviewdate, //past date
            trxrescheduledate: options.trxrescheduledate, //New date
            trxcandidateinfo: options.trxcandidateinfo,
            trxreqjobtitle: options.trxreqjobtitle,
            trxreqjobopenings: options.trxreqjobopenings,
            trxreqskills: options.trxreqskills,
            trxreqexperience: options.trxreqexperience,
            trxreqexpiry: options.trxreqexpiry,
            trxreqdesignation: options.trxreqdesignation,
            trxreshceduleremark: options.trxreshceduleremark,
            trxcandidatename: options.trxcandidatename,
            trxcandidateskill: options.trxcandidateskill,
            trxcandidatequalification: options.trxcandidatequalification,
            trxrescheduledby: options.trxrescheduledby,
            trxcandidatelink: "",
            trxapplicantcode: "",
            trxscreeninglink: "",
            trxcandidatedob: "",
            trxcandidateemail: options.trxcandidateemail,
            trxcandidatephone: options.trxcandidatephone,
            trxcandidatelist: options.trxcandidatelist || "",
            trxinterviewer: options.trxinterviewer || "",
          },
        };
        if (options && options.moduleid) {
          send_dynamic(schOptions, cb);
        } else {
          send(schOptions, cb);
        }
      } else {
        //let emailTransporter = await createTransporter();
        await transporter
          .sendMail(mailOptions)
          .then(() => {
            if (!mailOptions.loop || mailOptions.loop != 1) {
              mailOptions.status = 1;
              errMailLogs(mailOptions, schOptions);
            }
            return cb();
          })
          .catch((err) => {
            if (!mailOptions.loop || mailOptions.loop != 1) {
              mailOptions.err = (err && err.response) || err;
              mailOptions.status = 0;
              errMailLogs(mailOptions, schOptions);
            }
            return cb(err);
          });
      }
    } else {
      throw new Error({
        msg: "error sending email because email ids are wrong",
      });
    }
  } catch (err) {
    options.err = (err && err.response) || err;
    options.status = 0;
    errMailLogs(options, options);
    return cb(err);
  }
}

function sendMailCustom(mailOptions) {
  return new Promise(function (resolve, reject) {
    mail(mailOptions, function (err, response) {
      if (err) {
        reject({
          response: "Mail not sent.",
          error: err,
        });
      }
      resolve({
        response: "Mail sent",
      });
    });
  });
}

async function sendCustomEmail(options, cb) {
  try {
    let mailconfig = await fetchMailConfig();
    var html1 = options.html; ////console.log(html1)
    var $ = cheerio.load(html1);
    var k = cheerio.load(html1);
    var obj = k("img");
    var arr = [];
    for (var i = 0; i < obj.length; i++) {
      arr.push(obj[`${i}`].attribs);
    }
    var arr1 = [];

    for (var i = 0; i < arr.length; i++) {
      var obj2 = {
        filename: arr[i].alt ? arr[i].alt : "altnotdefined" + i,
        path: arr[i].src ? arr[i].src : "",
        cid: arr[i].alt ? arr[i].alt.split(".")[0] : "cidnotdefined" + i,
      };
      arr1.push(obj2);
    }
    var html2 = html1;
    for (var i = 0; i < arr1.length; i++) {
      html2 = html2.replace(arr1[i].path, `cid:${arr1[i].cid}`);
    }
    var a = options.attachments;
    for (var i = 0; i < arr1.length; i++) {
      a.push(arr1[i]);
    }
    var tempname = mailconfig.fromemail
      ? mailconfig.fromemail
      : mailconfig.user;
    options.from =
      (tempname || "Vega-HR Support") + " <" + mailconfig.user + ">";
    // if (
    //   options.offerletter &&
    //   options.offerletter == 1 &&
    //   config.webUrlLink.indexOf("polestar") != -1
    // ) {
    //   options.from = " <" + mailconfig.user + ">";
    // }
    options.functionname = "sendCustomEmail";

    var subjectid = getRandomNumber();

    const mailOptions = {
      headers: options.headers,
      from: options.from, // sender address
      to: options.to, // list of receivers
      cc: options.cc,
      subject: `${options.subject} [SubjectID -${subjectid}]`, // Subject line
      html: html2, // plain text body,
      attachments: a,
    };
    // let emailTransporter = await createTransporter();
    await transporter
      .sendMail(mailOptions)
      .then(() => {
        if (!mailOptions.loop || mailOptions.loop != 1) {
          mailOptions.status = 1;
          errMailLogs(mailOptions, options);
        }
        return cb();
      })
      .catch((err) => {
        if (!mailOptions.loop || mailOptions.loop != 1) {
          mailOptions.err = (err && err.response) || err;
          mailOptions.status = 0;
          errMailLogs(mailOptions, options);
        }
        return cb(err);
      });
  } catch (err) {
    options.err = (err && err.response) || err;
    options.status = 0;
    errMailLogs(options, options);
    return cb(err);
  }
}

async function sendOTP(options, cb) {
  try {
    var subjectid = getRandomNumber();
    var mailOptions = {
      to: options.emailid,
      subject:
        `${options.subject} [SubjectID -${subjectid}]` ||
        `OTP For Login [SubjectID -${subjectid}]`,
      text: "<b>Your OTP is : " + options.OTP + "</b>",
    };
    var trxotp = options.OTP || "";
    mailOptions.subject =
      mailOptions &&
      mailOptions.subject &&
      mailOptions.subject.replace("trxotp", trxotp);

    let rese = await query(
      "Select profilepicpath from trx_admin_details where isactive=1"
    );
    let profilepathcl = rese && rese[0] && rese[0].profilepicpath;
    let clientlogo = path.join(
      appRoot.originalPath,
      "assets/img/client-logo.jpg"
    );
    if (profilepathcl) {
      var filepath = path.join(appRoot.path, "uploads" + profilepathcl);
      if (fs.existsSync(filepath)) {
        clientlogo = path.join(appRoot.path, "uploads" + profilepathcl);
      }
    }

    var mailInfo = {};

    options.functionname = "sendOTP";
    var linkUrl = options.linkUrl || config.webUrlLink;
    var buttonTitle = "Go to Vega HR";
    // var commonfilepath = path.join(appRoot.path, 'assets/mailtemplate/emailernew.html');
    var commonfilepath = path.join(
      appRoot.originalPath,
      "assets/mailtemplate/contenttype/otptemplate.html"
    );

    var commonreadFile = fs.readFileSync(commonfilepath).toString();
    mailInfo.html = commonreadFile;
    var match = new RegExp("trxotp", "g");
    mailInfo.html = mailInfo.html.replace(match, trxotp);
    var mailHtml = await getReplacedHtml(
      mailInfo.html,
      mailOptions.subject,
      mailOptions.text,
      linkUrl,
      buttonTitle
    );

    mailOptions.html = mailHtml;
    mailOptions.attachments = [
      ...(await getLogoAttachments(clientlogo, mailInfo.html)),
      options.attachments ? [options.attachments] : [],
    ];

    console.log('mailOptions.attachments 731', mailOptions.attachments)

    let mailconfig = await fetchMailConfig();
    let tempname = mailconfig.fromemail
      ? mailconfig.fromemail
      : mailconfig.user;
    mailOptions.from =
      (tempname || "Vega-HR Support") + " <" + mailconfig.user + ">";
    //let emailTransporter = await createTransporter();
    await transporter
      .sendMail(mailOptions)
      .then(() => {
        if (!mailOptions.loop || mailOptions.loop != 1) {
          mailOptions.status = 1;
          errMailLogs(mailOptions, options);
        }
        return cb();
      })
      .catch((err) => {
        if (!mailOptions.loop || mailOptions.loop != 1) {
          mailOptions.err = (err && err.response) || err;
          mailOptions.status = 0;
          errMailLogs(mailOptions, options);
        }
        return cb(err);
      });
  } catch (err) {
    options.err = (err && err.response) || err;
    options.status = 0;
    errMailLogs(options, options);
    return cb(err);
  }
}

/*
method to save default parameters and content,header,footer for mailtype
 // update_param_content('checkinrequestaction', '', '', 'insert', 'Check-in/Check-out is trxcheckinstatus by trxcheckinactionby', 'Check-in/Check-out Approve/Reject', 'userparams,attendanceparams')

*/
/*function update_param_content(file, subjectVariables, bodyVariables, action, subject, title, categories) {//options.mailType ->file
  var subvar = ''; var bodyvar = '';
  if (subjectVariables) {

    var subjectArr = _.keys(subjectVariables);
    subjectArr.forEach(function (item) {
      //mailInfonew.subject = options.subjectVariables[item]
      if (subvar) {
        subvar += ',' + item;
      } else {
        subvar = item;
      }
    });
  }
  ////console.log("subjectvar", subvar);
  if (bodyVariables) {

    var paramArr = _.keys(bodyVariables);
    paramArr.forEach(function (item) {
      if (bodyvar) {
        bodyvar += ',' + item;
      } else {
        bodyvar = item;
      }
    });
  }
  //console.log("subjectvar", subvar);
  //console.log("bodyvar", bodyvar)
  var contentdef = '', headerdef = '', footerdef = ''; var fullcontent = '';
  var contentfilename1 = (file).concat('.html').toLowerCase();
  var contentfilepath1 = path.join(appRoot.path, 'assets/mailtemplate/contenttype', contentfilename1);

  fs.readFile(contentfilepath1, function (err, data) {
    if (err) throw err;
    fullcontent = data.toString();
    fullcontent = fullcontent.replace(/\n|\t/g, ' ');
    //   fullcontent=   fullcontent.replace(/"/g, "'");
    // //console.log("mini",fullcontent)
    fullcontent = fullcontent.replace(/\n/g, "");

    // remove whitespace (space and tabs) before tags
    fullcontent = fullcontent.replace(/[\t ]+\</g, "<");

    // remove whitespace between tags
    fullcontent = fullcontent.replace(/\>[\t ]+\</g, "><");

    // remove whitespace after tags
    fullcontent = fullcontent.replace(/\>[\t ]+$/g, ">");
    headerdef = fullcontent.substring(0, fullcontent.indexOf("<!--Header End-->"))
    footerdef = fullcontent.substring(fullcontent.indexOf("<!--footer-->"))
    contentdef = fullcontent.substring(fullcontent.indexOf("<!--content-->"), fullcontent.indexOf("<!--footer-->"))
    contentdef = contentdef.replace(/'/g, "");// , defaulthtml='" + contentdef +
    ////console.log("content",contentdef)
    // mysqlserv.executeQuery("Update email_templates set subjectvar='" + subvar + "'  , bodyvar='" + bodyvar + "'  where type='" + file + "'", function (erre1, rese1) {
    //     if (erre1) {
    //         //console.log("err while update param")
    //     }
    // });
    if (action == 'insert') {
      //console.log("qry", "INSERT INTO `email_templates` (`type`, `subject`,`title`, `heading`,`subjectvar`, `bodyvar`, `createdby`, `createddate`, `lastmodifieddate`, `lastmodifiedby`, `isactive`, `defaulthtml`, `defaultheader`, `defaultfooter`, `deftemp`, `categories`, `iscronmail`) VALUES ('" + file + "','" + subject + "','" + title + "','', '', '', NULL, now(), now(), NULL, 0,'" + contentdef + "','" + headerdef + "','" + footerdef + "', '1','" + categories + "', '0');");
      mysqlserv.executeQuery("INSERT INTO `email_templates` (`type`, `subject`,`title`, `heading`,`subjectvar`, `bodyvar`, `createdby`, `createddate`, `lastmodifieddate`, `lastmodifiedby`, `isactive`, `defaulthtml`, `defaultheader`, `defaultfooter`, `deftemp`, `categories`, `iscronmail`) VALUES ('" + file + "','" + subject + "','" + title + "','', '', '', NULL, now(), now(), NULL, 0,'" + contentdef + "','" + headerdef + "','" + footerdef + "', '1','" + categories + "', '0')", function (erre1, rese1) {
        if (erre1) {
          //console.log("err while update param")
        }
      });
    } else if (action == 'update') {
      //console.log("qry", "Update email_templates set  defaulthtml = '" + contentdef + "', defaultheader = '" + headerdef + "', defaultfooter='" + footerdef + "', subject='" + subject + "', categories='" + categories + "', title='" + title + "' where type='" + file + "'")
      mysqlserv.executeQuery("Update email_templates set  defaulthtml = '" + contentdef + "', defaultheader = '" + headerdef + "', defaultfooter='" + footerdef + "', subject='" + subject + "', categories='" + categories + "', title='" + title + "' where type='" + file + "'", function (erre1, rese1) {
        if (erre1) {
          //console.log("err while update param")
        }
      });
    } else {
      //console.log("action missing")
    }
  });

}*/

async function send_dynamic(options, cb) {
  try {
    if (options.mailType) {
      var obj = JSON.stringify({
        type: options.mailType,
        userid: options.userid,
      });
      var paramobj = JSON.stringify({
        category: "userparams",
        createdby: "",
        userid: options.userid,
      });
      let userparamresult = await query("call usp_emailparam_data(?)", [
        paramobj,
      ]);
      let results = await query("call usp_mailtemplate_view(?)", [obj]);

      let mailInfonew = results && results[0] && results[0][0];
      let toemails = mailInfonew && mailInfonew.tomails;
      let ccemails = mailInfonew && mailInfonew.ccemail;
      let clientlogo = path.join(
        appRoot.originalPath,
        "assets/img/client-logo.jpg"
      );
      if (mailInfonew.logo) {
        var filepath = path.join(appRoot.path, "uploads" + mailInfonew.logo);
        if (fs.existsSync(filepath)) {
          clientlogo = path.join(appRoot.path, "uploads" + mailInfonew.logo);
        }
      }
      let linkUrl = options.linkUrl || config.webUrlLink;
      let buttonTitle = options.buttontitle || "Go to Vega HR";

      mailInfonew.subject = mailInfonew.subject
        ? mailInfonew.subject
        : options.subjectVariables["subject"];
      if (options.subjectVariables) {
        var subjectArr = _.keys(options.subjectVariables);
        subjectArr.forEach(function (item) {
          //mailInfonew.subject = options.subjectVariables[item]
          mailInfonew.subject =
            mailInfonew &&
            mailInfonew.subject &&
            mailInfonew.subject.replace(item, options.subjectVariables[item]);
        });
      }

      mailInfonew.heading =
        options &&
        options.headingVariables &&
        options.headingVariables["heading"];
      if (options.headingVariables) {
        var headingArr = _.keys(options.headingVariables);
        headingArr.forEach(function (item) {
          //mailInfonew.heading= options.headingVariables[item];

          mailInfonew.heading =
            mailInfonew &&
            mailInfonew.heading &&
            mailInfonew.heading.replace(item, options.headingVariables[item]);
        });
      }
      mailInfonew.type = options.mailType;
      var headerhtml = "",
        contenthtml = "",
        footerhtml = "";
      if (options.trxtestmail && options.trxtestmail == "test_mail") {
        toemails = "";
        ccemails = "";
        contenthtml = options.content ? options.content : "";
        mailInfonew.subject = options.subject ? options.subject : "";
      } else {
        contenthtml = mailInfonew.fullhtml ? mailInfonew.fullhtml : "";
      }
      var contentreadFile = contenthtml;
      if (
        mailInfonew.type &&
        mailInfonew.type.toLowerCase() != "documentupload"
      ) {
        mailInfonew.html = contentreadFile;
      } else {
        mailInfonew.html = contenthtml;
      }

      if (
        mailInfonew.html == "" ||
        mailInfonew.html.indexOf("Template Not Found") != -1 ||
        mailInfonew.html.indexOf("NULL") != -1
      ) {
        throw new Error("Template Not Found");
      }
      mailInfonew.content = "";
      let appendattachments = [
        ...(await getLogoAttachments(clientlogo, mailInfonew.html)),
      ];

      console.log('mailOptions.attachments 945', appendattachments)


      let mailHtmlnew = await getReplacedHtml(
        mailInfonew.html,
        mailInfonew.heading,
        mailInfonew.content,
        linkUrl,
        buttonTitle
      );

      let html1 = mailHtmlnew;
      let $ = cheerio.load(html1);
      let k = cheerio.load(html1);

      //   var objanchor = k("a.custom-link");
      var emailParamsList =
        (mailInfonew &&
          mailInfonew.parameterscode &&
          mailInfonew.parameterscode.split(",")) ||
        [];
      //  //console.log("arrem",emailParamsList)
      if (
        !options.trxtestmail &&
        options.trxtestmail != "test_mail" &&
        emailParamsList
      ) {
        emailParamsList.map(function (item) {
          // '<a style="color:red">Not Specified</a>'

          if (
            $("a.custom-link[emailtemplateparam=" + item + "]")
              .find("span")
              .attr("style") === undefined
          ) {
            $("a.custom-link[emailtemplateparam=" + item + "]").html(
              item || ""
            );
          } else {
            ////console.log("hhh", $('a.custom-link[emailtemplateparam=' + item + ']').find('span').attr('style'))
            $("a.custom-link[emailtemplateparam=" + item + "]")
              .find("span")
              .html(item || "");
          }
        });
        $("a.custom-link").each(function () {
          $(this).attr(
            "style",
            "color:black;text-decoration: none !important;cursor:none !important"
          );
          $(this).attr("href", "#");
        });
      }

      html1 = $.html();
      if (options.bodyVariables) {
        var paramArr = _.keys(options.bodyVariables);
        paramArr.forEach((item) => {
          var replacementvar = options.bodyVariables[item]
            ? options.bodyVariables[item]
            : "";

          mailInfonew.subject =
            mailInfonew &&
            mailInfonew.subject &&
            mailInfonew.subject.replace(item, replacementvar);
          var match = new RegExp(item, "g");
          html1 = html1 && html1.replace(match, replacementvar);
        });
      }
      if (userparamresult[0][0]) {
        var userparamArr = _.keys(userparamresult[0][0]);

        userparamArr.forEach((item) => {
          if (item == "trxempdob" || item == "trxempjoining") {
            userparamresult[0][0][item] = moment(
              userparamresult[0][0][item],
              "YYYY-MM-DD"
            ).format("DD-MM-YYYY");
          }
          var replacementvark = userparamresult[0][0][item]
            ? userparamresult[0][0][item]
            : "";

          mailInfonew.subject =
            mailInfonew &&
            mailInfonew.subject &&
            mailInfonew.subject.replace(item, replacementvark);
          var match = new RegExp(item, "g");
          html1 = html1 && html1.replace(match, replacementvark);
        });
      }

      emailParamsList.forEach((item) => {
        mailInfonew.subject =
          mailInfonew &&
          mailInfonew.subject &&
          mailInfonew.subject.replace(item, "");

        var match = new RegExp(item, "ig");
        html1 = html1 && html1.replace(match, "");
      });
      if (mailInfonew.subject == "" && mailInfonew.subject == "undefined") {
        mailInfonew.subject = "No subject";
      }

      var obj = k("img.e-rte-image");
      //console.log("imgeer", obj.length);
      var arr = [];
      for (var i = 0; i < obj.length; i++) {
        arr.push(obj[`${i}`].attribs);
      }
      var arr1 = [];

      // for (var i = 0; i < arr.length; i++) {
      //   var cidnospc = arr[i].alt && (arr[i].alt).replace(/\s/g, '')
      //   var obj2 = {
      //     filename: arr[i].alt,
      //     path: arr[i].src,
      //     cid: cidnospc
      //   }
      //   arr1.push(obj2);

      // }

      var html2 = html1;

      for (var i = 0; i < arr1.length; i++) {
        html2 = html2.replace(arr1[i].path, `cid:${arr1[i].cid}`);
      }
      if (options.resumelist && options.resumefilename) {
        var resume = options.resumelist;
        var filenames = options.resumefilename;
        var i = 0;

        resume.forEach(function (item) {
          var fileresume = path.join(appRoot.path, "uploads" + item);
          if (fs.existsSync(fileresume)) {
            appendattachments.push({
              filename: filenames[i],
              path: path.join(appRoot.path, "uploads" + item),
            });
          }
          i++;
        });
      }
      let appendattachmentsn = [];
      if (options.attachments) {
        options.attachments.forEach((item) => {
          appendattachments.push(item);
        });
      }
      //    appendattachmentsn = appendattachments.concat(options.attachments)
      appendattachmentsn = appendattachments;

      var finalAttachmentsn = appendattachmentsn;
      for (var i = 0; i < arr1.length; i++) {
        finalAttachmentsn.push(arr1[i]);
      }
      if (toemails) {
        options.email = options.email
          ? options.email.concat(",", toemails)
          : toemails;
      }
      if (ccemails) {
        options.cc = options.cc ? options.cc.concat(",", ccemails) : ccemails;
      }
      options.functionname = "send_dynamic";

      const emailsArray = options.email && options.email.split(",");

      const toArray =
        emailsArray && emailsArray.length > 1
          ? emailsArray.filter(function (elem, pos) {
              return emailsArray.indexOf(elem) == pos;
            })
          : options.email;
      const ccArray = options.cc && options.cc.split(",");

      const ccuniqueArray =
        ccArray && ccArray.length > 1
          ? ccArray.filter(function (elem, pos) {
              return ccArray.indexOf(elem) == pos;
            })
          : options.cc;
      const bccArray = options.bcc && options.bcc.split(",");

      const bccuniqueArray =
        bccArray && bccArray.length > 1
          ? bccArray.filter(function (elem, pos) {
              return bccArray.indexOf(elem) == pos;
            })
          : options.bcc;
      options.email = (toArray && toArray.toString()) || "";
      options.cc = (ccuniqueArray && ccuniqueArray.toString()) || "";
      options.bcc = (bccuniqueArray && bccuniqueArray.toString()) || "";

      var subjectid = getRandomNumber();
      var mailOptions = {
        subject: `${mailInfonew.subject} [SubjectID -${subjectid}]`,
        html: html2,
        bcc: options.bcc || "",
        to: options.email || "",
        cc: options.cc || "",
        replyTo: options.replyTo,
        mailtype: options.mailType,
        loop: options.loop,
      };
      if (options.mailType !== "documentUpload")
        mailOptions.attachments = finalAttachmentsn;
      let mailconfig = await fetchMailConfig();
      // //console.log("mmm", mailconfig);
      let tempname = mailconfig.fromemail
        ? mailconfig.fromemail
        : mailconfig.user;
      mailOptions.from =
        (tempname || "Vega-HR Support") + " <" + mailconfig.user + ">";
      // let emailTransporter = await createTransporter();
      await transporter
        .sendMail(mailOptions)
        .then(() => {
          if (!mailOptions.loop || mailOptions.loop != 1) {
            mailOptions.status = 1;
            errMailLogs(mailOptions, options);
          }
          return cb();
        })
        .catch((err) => {
          if (!mailOptions.loop || mailOptions.loop != 1) {
            mailOptions.err = (err && err.response) || err;
            mailOptions.status = 0;
            errMailLogs(mailOptions, options);
          }
          return cb(err);
        });
    } else {
      throw new Error("Please send the required parameters: mailType");
    }
  } catch (err) {
    options.err = (err && err.response) || err;
    options.status = 0;
    errMailLogs(options, options);
    return cb(err);
  }
}
async function getLogoAttachments(clientlogo, html) {
  //console.log("cl", clientlogo);
  let logo;
  logo = path.join(appRoot.originalPath, "assets/img/logo.png");
  if (!fs.existsSync(logo)) {
    logo = path.join(appRoot.originalPath, "assets/img/logo-login.png");
  }
  let logob64 = await image2base64(logo);
  let clientlogo64 = await image2base64(clientlogo);
  let fb64 = await image2base64(
    path.join(appRoot.originalPath, "assets/img/fbnew.png")
  );
  let twt64 = await image2base64(
    path.join(appRoot.originalPath, "assets/img/twtnew.png")
  );
  let lnkd64 = await image2base64(
    path.join(appRoot.originalPath, "assets/img/linkedin.png")
  );
  let android64 = await image2base64(
    path.join(appRoot.originalPath, "assets/img/androidf.png")
  );
  let ios64 = await image2base64(
    path.join(appRoot.originalPath, "assets/img/iosf.png")
  );
  let attachments = [];
  if (html.indexOf("trxtwt") != -1)
    attachments.push({
      filename: "twt",
      path: "data:image/png;base64," + twt64,
      cid: "twt",
    });
  if (html.indexOf("trxapplogo") != -1)
    attachments.push({
      filename: "logo",
      path: "data:image/png;base64," + logob64,
      cid: "logo",
    });
  if (html.indexOf("trxlnkd") != -1)
    attachments.push({
      filename: "lnkd",
      path: "data:image/png;base64," + lnkd64,
      cid: "lnkd",
    });
  if (html.indexOf("trxfb") != -1)
    attachments.push({
      filename: "fb",
      path: "data:image/png;base64," + fb64,
      cid: "fb",
    });
  if (html.indexOf("trxclientlogo") != -1)
    attachments.push({
      filename: "clientlogo",
      path: "data:image/png;base64," + clientlogo64,
      cid: "clientlogo",
    });
  if (html.indexOf("android") != -1)
    attachments.push({
      filename: "android",
      path: "data:image/png;base64," + android64,
      cid: "android",
    });
  if (html.indexOf("ios") != -1)
    attachments.push({
      filename: "ios",
      path: "data:image/png;base64," + ios64,
      cid: "ios",
    });

  return attachments;
}

async function getReplacedHtml(html, heading, content, linkUrl, buttonTitle) {
  const vegalinkUrl = config.webUrlLink;
  const fblinkUrl = "https://www.facebook.com/ProductVegaHR";
  const twtlinkUrl = "https://twitter.com/VegaHR4";
  const lkdnlinkUrl = "https://www.linkedin.com/company/vega-hr";
  const ioslinkUrl = "https://apps.apple.com/in/app/vega-hr/id1529096244";
  const androidlinkUrl =
    "https://play.google.com/store/apps/details?id=com.vega_hr";

  return (
    html &&
    html
      .replace("mailInfoHeading", heading)
      .replace("mailInfoContent", content)
      .replace("mailInfoUrlLink", linkUrl)
      .replace("mailInfoButtonTitle", buttonTitle)
      .replace("trxapplogo", "logo")
      .replace("trxappbanner", "banner")
      .replace("trxthanks", "thanks")
      .replace("mailInfovegaLink", vegalinkUrl)
      .replace("mailInfofbLink", fblinkUrl)
      .replace("mailInfotwitterLink", twtlinkUrl)
      .replace("mailInfolinkedinLink", lkdnlinkUrl)
      .replace("trxfb", "fb")
      .replace("trxtwt", "twt")
      .replace("trxlnkd", "lnkd")
      .replace(/mailInfoLogolink/g, vegalinkUrl)
      .replace("trxclientlogo", "clientlogo")
      .replace("mailInfodupvegaLink", vegalinkUrl)
      .replace("mailInfoandroidLink", androidlinkUrl)
      .replace("mailInfoiosLink", ioslinkUrl)
  );
}

function getRandomNumber() {
  var randVal = (Math.random() * Math.pow(10, 10)).toFixed(0);
  while (randVal.length != 10) randVal = "1" + randVal;
  return +randVal;
}
async function send_dynamic_transporter(options, multipleconfig, cb) {
  try {
    if (options.mailType) {
      var obj = JSON.stringify({
        type: options.mailType,
        userid: options.userid,
      });
      var paramobj = JSON.stringify({
        category: "userparams",
        createdby: "",
        userid: options.userid,
      });
      let dynamicTransporter = nodemailer.createTransport({
        pool: true,
        host: "smtp.gmail.com",
        service: "gmail",
        connectionTimeout: 300000,
        auth: {
          type: "OAuth2",
          user: multipleconfig.user,
          // pass: multipleconfig.password,
          clientId: multipleconfig.clientId,
          clientSecret: multipleconfig.clientSecret,
          refreshToken: multipleconfig.refreshToken,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      let userparamresult = await query("call usp_emailparam_data(?)", [
        paramobj,
      ]);
      let results = await query("call usp_mailtemplate_view(?)", [obj]);

      let mailInfonew = results && results[0] && results[0][0];
      let toemails = mailInfonew && mailInfonew.tomails;
      let ccemails = mailInfonew && mailInfonew.ccemail;
      let clientlogo = path.join(
        appRoot.originalPath,
        "assets/img/client-logo.jpg"
      );
      if (mailInfonew.logo) {
        var filepath = path.join(appRoot.path, "uploads" + mailInfonew.logo);
        if (fs.existsSync(filepath)) {
          clientlogo = path.join(appRoot.path, "uploads" + mailInfonew.logo);
        }
      }
      let linkUrl = options.linkUrl || config.webUrlLink;
      let buttonTitle = options.buttontitle || "Go to Vega HR";

      mailInfonew.subject = mailInfonew.subject
        ? mailInfonew.subject
        : options.subjectVariables["subject"];
      if (options.subjectVariables) {
        var subjectArr = _.keys(options.subjectVariables);
        subjectArr.forEach(function (item) {
          //mailInfonew.subject = options.subjectVariables[item]
          mailInfonew.subject =
            mailInfonew &&
            mailInfonew.subject &&
            mailInfonew.subject.replace(item, options.subjectVariables[item]);
        });
      }

      mailInfonew.heading =
        options &&
        options.headingVariables &&
        options.headingVariables["heading"];
      if (options.headingVariables) {
        var headingArr = _.keys(options.headingVariables);
        headingArr.forEach(function (item) {
          //mailInfonew.heading= options.headingVariables[item];

          mailInfonew.heading =
            mailInfonew &&
            mailInfonew.heading &&
            mailInfonew.heading.replace(item, options.headingVariables[item]);
        });
      }
      mailInfonew.type = options.mailType;
      var headerhtml = "",
        contenthtml = "",
        footerhtml = "";
      if (options.trxtestmail && options.trxtestmail == "test_mail") {
        toemails = "";
        ccemails = "";
        contenthtml = options.content ? options.content : "";
        mailInfonew.subject = options.subject ? options.subject : "";
      } else {
        contenthtml = mailInfonew.fullhtml ? mailInfonew.fullhtml : "";
      }
      var contentreadFile = contenthtml;
      if (
        mailInfonew.type &&
        mailInfonew.type.toLowerCase() != "documentupload"
      ) {
        mailInfonew.html = contentreadFile;
      } else {
        mailInfonew.html = contenthtml;
      }

      if (
        mailInfonew.html == "" ||
        mailInfonew.html.indexOf("Template Not Found") != -1 ||
        mailInfonew.html.indexOf("NULL") != -1
      ) {
        throw new Error("Template Not Found");
      }
      mailInfonew.content = "";
      let appendattachments = [
        ...(await getLogoAttachments(clientlogo, mailInfonew.html)),
      ];

      console.log('mailOptions.attachments 1411', mailOptions.attachments)


      let mailHtmlnew = await getReplacedHtml(
        mailInfonew.html,
        mailInfonew.heading,
        mailInfonew.content,
        linkUrl,
        buttonTitle
      );

      let html1 = mailHtmlnew;
      let $ = cheerio.load(html1);
      let k = cheerio.load(html1);

      //   var objanchor = k("a.custom-link");
      var emailParamsList =
        mailInfonew &&
        mailInfonew.parameterscode &&
        mailInfonew.parameterscode.split(",");
      //  //console.log("arrem",emailParamsList)
      if (
        !options.trxtestmail &&
        options.trxtestmail != "test_mail" &&
        emailParamsList
      ) {
        emailParamsList.map(function (item) {
          $("a.custom-link[emailtemplateparam=" + item + "]").html(
            item || '<a style="color:red">Not Specified</a>'
          );
        });
        $("a.custom-link").each(function () {
          $(this).attr(
            "style",
            "color:black;text-decoration: none !important;cursor:none"
          );
          $(this).attr("href", "#");
        });
      }

      html1 = $.html();
      if (options.bodyVariables) {
        var paramArr = _.keys(options.bodyVariables);
        paramArr.forEach((item) => {
          var replacementvar = options.bodyVariables[item]
            ? options.bodyVariables[item]
            : "";

          mailInfonew.subject =
            mailInfonew &&
            mailInfonew.subject &&
            mailInfonew.subject.replace(item, replacementvar);
          var match = new RegExp(item, "g");
          html1 = html1 && html1.replace(match, replacementvar);
        });
      }
      if (userparamresult[0][0]) {
        var userparamArr = _.keys(userparamresult[0][0]);

        userparamArr.forEach((item) => {
          if (item == "trxempdob" || item == "trxempjoining") {
            userparamresult[0][0][item] = moment(
              userparamresult[0][0][item],
              "YYYY-MM-DD"
            ).format("DD-MM-YYYY");
          }
          var replacementvark = userparamresult[0][0][item]
            ? userparamresult[0][0][item]
            : "";

          mailInfonew.subject =
            mailInfonew &&
            mailInfonew.subject &&
            mailInfonew.subject.replace(item, replacementvark);
          var match = new RegExp(item, "g");
          html1 = html1 && html1.replace(match, replacementvark);
        });
      }

      emailParamsList.forEach((item) => {
        mailInfonew.subject =
          mailInfonew &&
          mailInfonew.subject &&
          mailInfonew.subject.replace(item, "");

        var match = new RegExp(item, "ig");
        html1 = html1 && html1.replace(match, "");
      });
      if (mailInfonew.subject == "" && mailInfonew.subject == "undefined") {
        mailInfonew.subject = "No subject";
      }

      var obj = k("img.e-rte-image");
      //console.log("imgeer", obj.length);
      var arr = [];
      for (var i = 0; i < obj.length; i++) {
        arr.push(obj[`${i}`].attribs);
      }
      var arr1 = [];

      for (var i = 0; i < arr.length; i++) {
        var cidnospc = arr[i].alt.replace(/\s/g, "");
        var obj2 = {
          filename: arr[i].alt,
          path: arr[i].src,
          cid: cidnospc,
        };
        arr1.push(obj2);
      }

      var html2 = html1;

      for (var i = 0; i < arr1.length; i++) {
        html2 = html2.replace(arr1[i].path, `cid:${arr1[i].cid}`);
      }
      if (options.resumelist && options.resumefilename) {
        var resume = options.resumelist;
        var filenames = options.resumefilename;
        var i = 0;

        resume.forEach(function (item) {
          var fileresume = path.join(appRoot.path, "uploads" + item);
          if (fs.existsSync(fileresume)) {
            appendattachments.push({
              filename: filenames[i],
              path: path.join(appRoot.path, "uploads" + item),
            });
          }
          i++;
        });
      }
      let appendattachmentsn = [];
      if (options.attachments) {
        options.attachments.forEach((item) => {
          appendattachments.push(item);
        });
      }
      //    appendattachmentsn = appendattachments.concat(options.attachments)
      appendattachmentsn = appendattachments;

      var finalAttachmentsn = appendattachmentsn;
      for (var i = 0; i < arr1.length; i++) {
        finalAttachmentsn.push(arr1[i]);
      }
      if (toemails) {
        options.email = options.email
          ? options.email.concat(",", toemails)
          : toemails;
      }
      if (ccemails) {
        options.cc = options.cc ? options.cc.concat(",", ccemails) : ccemails;
      }
      options.functionname = "send_dynamic";

      const emailsArray = options.email && options.email.split(",");

      const toArray =
        emailsArray && emailsArray.length > 1
          ? emailsArray.filter(function (elem, pos) {
              return emailsArray.indexOf(elem) == pos;
            })
          : options.email;
      const ccArray = options.cc && options.cc.split(",");

      const ccuniqueArray =
        ccArray && ccArray.length > 1
          ? ccArray.filter(function (elem, pos) {
              return ccArray.indexOf(elem) == pos;
            })
          : options.cc;
      const bccArray = options.bcc && options.bcc.split(",");

      const bccuniqueArray =
        bccArray && bccArray.length > 1
          ? bccArray.filter(function (elem, pos) {
              return bccArray.indexOf(elem) == pos;
            })
          : options.bcc;
      options.email = (toArray && toArray.toString()) || "";
      options.cc = (ccuniqueArray && ccuniqueArray.toString()) || "";
      options.bcc = (bccuniqueArray && bccuniqueArray.toString()) || "";

      var subjectid = getRandomNumber();
      var mailOptions = {
        subject: `${mailInfonew.subject} [SubjectID -${subjectid}]`,
        html: html2,
        bcc: options.bcc || "",
        to: options.email || "",
        cc: options.cc || "",
        replyTo: options.replyTo,
        mailtype: options.mailType,
        loop: options.loop,
      };
      if (options.mailType !== "documentUpload")
        mailOptions.attachments = finalAttachmentsn;
      let mailconfig = await fetchMailConfig();
      let tempname = mailconfig.fromemail
        ? mailconfig.fromemail
        : multipleconfig.user;
      mailOptions.from =
        (tempname || "Vega-HR Support") + " <" + multipleconfig.user + ">";
      // let emailTransporter = await createTransporter();
      await dynamicTransporter
        .sendMail(mailOptions)
        .then(() => {
          if (!mailOptions.loop || mailOptions.loop != 1) {
            mailOptions.status = 1;
            errMailLogs(mailOptions, options);
          }
          return cb();
        })
        .catch((err) => {
          if (!mailOptions.loop || mailOptions.loop != 1) {
            mailOptions.err = (err && err.response) || err;
            mailOptions.status = 0;
            errMailLogs(mailOptions, options);
          }
          return cb(err);
        });
    } else {
      throw new Error("Please send the required parameters: mailType");
    }
  } catch (err) {
    options.err = (err && err.response) || err;
    options.status = 0;
    errMailLogs(options, options);
    return cb(err);
  }
}
