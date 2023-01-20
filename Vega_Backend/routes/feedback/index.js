"use strict";

const feedback = require("./Controller");
const milestone = require("./milestone.Controller");

const linkedinctrl = require("./linkedin.Controller");
const payoutCtrl = require("./payout.Controller");

const sessionAuth = require("../../services/sessionAuth");
const logger = require("../../services/logger");
const express = require("express");
const app = express.Router();

app.post("/addfeedbackmaster", sessionAuth, feedback.addfeedbackmaster);
app.post("/viewfeedbackmaster", sessionAuth, feedback.viewfeedbackmaster);
app.post("/mstfeedbacktag", sessionAuth, feedback.mstfeedbacktag);
app.post("/feedbacksubtype", sessionAuth, feedback.feedbacksubtype);

// app.post("/raisefeedback", sessionAuth, feedback.raisefeedback);
app.post("/teamfeedback", sessionAuth, feedback.teamfeedback);
app.post("/draftFeedback", sessionAuth, feedback.draftFeedback);
app.post("/feedbackview", sessionAuth, feedback.feedbackview);
app.post("/addfeedbackdetail", sessionAuth, feedback.addfeedbackdetail);
app.post("/userbydesignation", sessionAuth, feedback.userbydesignation);
// app.post('/userhierarcy',sessionAuth,feedback.userhierarcy);
app.post("/feedbackreport", sessionAuth, feedback.feedbackreport);
app.post("/indirectreportee", sessionAuth, feedback.indirectreportee);
app.post("/viewfeedbackreport", sessionAuth, feedback.viewfeedbackreport);
app.post("/viewallfeedback", sessionAuth, feedback.viewallfeedback);
app.post("/viewfeedbackstory", sessionAuth, feedback.viewfeedbackstory);
app.post("/viewpendingdata", sessionAuth, feedback.viewpendingdata);
app.post("/feedbacklikedetails", sessionAuth, feedback.feedbacklikedetails);
app.post("/feedbackdetails", sessionAuth, feedback.feedbackdetails);
app.post("/feedbackpost", sessionAuth, feedback.feedbackpost);
app.post("/allowfeedback", sessionAuth, feedback.allowfeedback);
app.post("/viewHtmlCer", sessionAuth, feedback.viewHtmlCer);
app.post("/viewinternalreward", sessionAuth, feedback.viewinternalreward);
app.post("/uploadsignature", sessionAuth, feedback.uploadsignature);
app.post("/createtownhall", sessionAuth, feedback.createtownhall);
app.post("/viewsignature", sessionAuth, feedback.viewsignature);
app.post("/addsignature", sessionAuth, feedback.addsignature);
app.post("/changefeedbackstatus", sessionAuth, feedback.changefeedbackstatus);
app.post("/addsuperadminbanalce", feedback.addsuperadminbanalce);
app.post(
  "/viewtransactioneonsuperadmin",
  feedback.viewtransactioneonsuperadmin
);
app.post(
  "/approvemultiplefeedback",
  sessionAuth,
  feedback.approvemultiplefeedback
);
app.post("/createteam", sessionAuth, feedback.createteam);
app.post("/feedbackforraise", sessionAuth, feedback.feedbackforraise);
app.post("/feedbackuserlist", sessionAuth, feedback.feedbackuserlist);
app.post("/feedbacksuggestion", sessionAuth, feedback.feedbacksuggestion);

app.post("/feedbackPayoutMaster", sessionAuth, payoutCtrl.feedbackPayoutMaster);
app.post(
  "/feedbackPayoutDashboard",
  sessionAuth,
  payoutCtrl.feedbackPayoutDashboard
);
app.post("/internalDashboard", sessionAuth, payoutCtrl.internalDashboard);

app.post("/feedbackDashboard", sessionAuth, payoutCtrl.feedbackDashboard);
app.post(
  "/feedbackDashboardReport",
  sessionAuth,
  feedback.feedbackDashboardReport
);
app.post("/feedbackDashboard", sessionAuth, payoutCtrl.feedbackDashboard);
app.post(
  "/drillDownFeedbackDashboard",
  sessionAuth,
  payoutCtrl.drillDownFeedbackDashboard
);

app.post("/feedbackKRA", sessionAuth, feedback.feedbackKRA);

app.get("/viewSelfFeedback", sessionAuth, feedback.viewSelfFeedback);
app.get("/homeFeedback", sessionAuth, feedback.homeFeedback);
app.post("/viewOfflineAward", sessionAuth, feedback.viewOfflineAward);

app.post("/milestoneMaster", sessionAuth, milestone.milestoneMaster);
app.post("/userMilestone", sessionAuth, milestone.userMilestone);
app.post("/uploadUsersMilestone", sessionAuth, milestone.uploadUsersMilestone);
app.post("/milestoneUserData", sessionAuth, milestone.milestoneuserdata);




// _____________
// app.post('/postcertificate', linkedinctrl.postcertificate);

// app.get('/linkedintoken', linkedinctrl.linkedintoken);
// app.post('/getUrl', linkedinctrl.getAuthorizationUrl);
// app.get('/getaccesstoken', sessionAuth, async (req, res) => {
//      if (!req.query && req.query.code) {
//           return res.json({ state: -1, message: "Send Required Data" });
//      }
//      try {
//           const data = await linkedinctrl.getAccessToken(req);
//           req.session.authorized = true;
//           return res.json({ state: 1, message: "Success", data: data })
//      } catch (err) {
//           return res.json({ state: -1, message: err.message || err, data: null });
//      }
// });
// app.post('/linkedinId', async (req, res) => {
//      if (!req && req.body && req.body.authKey){
//           return  res.json({ state: -1, message: "Send Required Data" });
//      }
//      try {
//           const id = await linkedinctrl.getLinkedinId(req);
//           res.json({ state: 1, message: "success", data: id });
//      } catch (err) {
//           res.json({ state: -1, message: err.message || err });
//      }
// });

// app.post('/publishpost', sessionAuth, async (req, res) => {
//      const { title, text, url, thumb, id, token } = req.body;
//      if (!title || !text || !thumb || !id || !token) {
//           return res.json({ state: -1, message: "Required data missing!" });
//      } else {
//           const content = {
//                title: title,
//                text: text,
//                shareUrl: url,
//                shareThumbnailUrl: thumb
//           };
//           try {
//                const response = await linkedinctrl.publishContent(req, id, content, token);
//                res.json({ state: 1, message: 'Post published successfully.' });
//           } catch (err) {
//                res.json({ state: -1, message: err.message || err || 'Unable to publish your post.' });
//           }
//      }
// });

module.exports = app;
