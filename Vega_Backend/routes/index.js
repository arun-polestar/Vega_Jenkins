"use strict";
const auth = require("./handlers/authController");
const express = require("express");
const router = express.Router();
const Uploads = require("./common/Uploads");
const utils = require("./common/utils");

/*-------------------------------------------------------------------------*/
// Below all API Hit after corsheaders
router.use("/", require("./corsheaders").CrossOriginHeaders);
/*-------------------------------------------------------------------------*/

router.post(
  "/uploadAzureTest",
  new Uploads("azureTest").multipleFile,
  async (req, res) => {
    //console.log("req.files", req.files);
    return res.json({
      state: 1,
      message: "Success",
      data: await utils.getFileLocation(req.file || req.files),
    });
  }
);
router.use(require("./superAdmin"));
router.use(require("./company"));
router.use(require("./user"));
//router.use(require("./learning/index"));
router.use(require("./learning/assessment"));
router.use(require("./learning/classroom"));
router.use(require("./learning/dashboard"));
router.use(require("./learning/master"));
router.use(require("./learning/userfeedback"));
router.use(require("./learning/utilities"));
router.use(require("./learning/topic"));
router.use(require("./learning/training"));
router.use(require("./learning/batch"));
router.use(require("./employee"));
router.use(require("./subscribers"));
router.use(require("./vegaHR/requisition"));
router.use(require("./vegaHR/scheduling"));
router.use(require("./vegaHR/referrals"));
router.use(require("./vegaHR/interviewCalendar"));
router.use(require("./DSR"));
router.use(require("./requisition-share"));
router.use(require("./joiningPrediction"));
router.use(require("./candidateFeedback"));
router.use(require("./userLogin"));

router.use(require("./testmail"));
router.use(require("./common"));
router.use(require("./vegaHR/candidate"));
router.use(require("./vegaHR/pipeline"));
router.use(require("./vegaHR/upload"));
router.use(require("./vegaHR/driveMaster"));

//Lemonade router
router.use(require("./vegaHR/lemonade/dashboard"));
router.use(require("./vegaHR/lemonade/batches"));
router.use(require("./vegaHR/lemonade/batchcheck"));
router.use(require("./vegaHR/lemonade/testQuestions"));
router.use(require("./vegaHR/lemonade/batches/createbatch"));
router.use(require("./vegaHR/lemonade/studentdetails"));
router.use(require("./vegaHR/lemonade/instructionsForTest"));
router.use(require("./vegaHR/lemonade/upload"));
router.use(require("./vegaHR/lemonade/master"));

router.use(require("./vegaHR/induction"));
router.use(require("./vendor"));
router.use(require("./vegaHR/dashboard"));
router.use(require("./admin"));
router.use(require("./todos"));
router.use(require("./offerletter"));
router.use(require("./organisation"));

//routes for qlik
router.use(require("./qlik"));

//feedback
router.use(require("./feedback"));

//notes
router.use(require("./notes"));

// profile
router.use(require("./policy"));
router.use(require("./profile"));
router.use(require("./vegaHR/scheduler"));

//resignation
router.use(require("./resignation"));

//helpdesk
router.use(require("./helpdesk"));

//notification
router.use(require("./notification"));

router.use(require("./onlinescreening"));
router.use(require("./videoapi"));

// singlesignin
router.use(require("./singleSignIn"));

//leaves
router.use(require("./vegaHR/leave"));

//Expense
router.use(require("./expense/trip"));
router.use(require("./expense/report"));
router.use(require("./expense/master"));
router.use(require("./expense/upload"));
router.use(require("./expense/raiseExpense"));
router.use(require("./expense/budgetMaster"));
router.use(require("./expense/approval"));

// PMS
router.use(require("./pms"));

//Time Sheet
router.use(require("./timesheet"));
router.use(require("./shift"));

//Project Tree
router.use(require("./projectTree/project"));
router.use(require("./projectTree/client"));
router.use(require("./projectTree/program"));
router.use(require("./projectTree/WBS"));
router.use(require("./projectTree/PO"));
router.use(require("./projectTree/assignment"));

// Report
router.use(require("./adhoc-report"));

//Configuration Controller
router.use(require("./configuration"));

//Timeline Posts
router.use(require("./timeline"));

//Attendance
router.use(require("./attendance"));

//paytm

router.use(require("./paytm"));
router.use(require("./coupon"));

//ESOP
router.use(require("./ESOP"));

//Payroll
router.use(require("./payroll"));

//Email template
router.use(require("./emailtemplate"));

//url configration
router.use(require("./urlConfiguration"));

//chat routing
router.use(require("./chat"));
router.use(require("./esignature"));
router.use(require("./trxDocuments"));
router.use(require("./wfh"));
router.use(require("./mood"));
router.use(require("./clientsync"));

// People Engagement
router.use(require("./peopleEngagement/formQuestions"));
router.use(require("./peopleEngagement/homePage"));
router.use(require("./peopleEngagement/dashboard"));

// Resource Management

router.use(require("./resourceManagement/demandResource"));
router.use(require("./resourceManagement/productivity"));
router.use(require("./resourceManagement/masters"));
router.use(require("./resourceManagement/report"));

// Competency Development

router.use(require("./competencyDevelopment"));

router.get("/", function (req, res, next) {
  res.json({ status: "working fine", time: res.time });
});

// router.post("/v1/companylogin", auth.loginCompany, auth.generateToken);
// router.post("/v1/uselogin", auth.loginUser, auth.generateToken);
// router.post("/v1/validatetoken", auth.validateToken, auth.tokenStatus);
// router.post("/v1/logout", auth.validateToken, auth.logout);
// router.post(
//   "/v1/logoutfromalldevice",
//   auth.validateToken,
//   auth.logoutFromAllDevice
// );

module.exports = router;
