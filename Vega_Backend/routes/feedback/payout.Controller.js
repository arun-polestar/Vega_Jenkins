"use strict";

const proc = require("../common/procedureConfig");
const commonModel = require("../common/Model");
const commonCtrl = require("../common/Controller");
const _ = require("underscore");
const { resolve } = require("path");
const { omitBy } = require("lodash");

var today = new Date();
var lastMonth = today.getMonth();

module.exports = {
  feedbackPayoutMaster: feedbackPayoutMaster,
  feedbackPayoutDashboard: feedbackPayoutDashboard,
  feedbackDashboard: feedbackDashboard,
  drillDownFeedbackDashboard: drillDownFeedbackDashboard,
  internalDashboard: internalDashboard,
};

async function feedbackPayoutMaster(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.mstfeedbackpayout, [obj])
    .then((results) => {
      var dbresult = commonCtrl.lazyLoading(results[0], req.body);
      if (dbresult && "data" in dbresult && "count" in dbresult) {
        return res.json({
          state: 1,
          message: "success",
          data: dbresult.data,
          count: dbresult.count,
        });
      } else {
        return res.json({
          state: -1,
          message: "something went wrong",
          data: null,
        });
      }
    })
    .catch((err) => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}

async function feedbackPayoutDashboard(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.feedback_dashboard, [obj])
    .then(async (results) => {
      var payoutData = await payoutCount(results[0], results[1], results[2]);
      payoutData.totalFeedbackAmount =
        results[3] && results[3][0] && results[3][0].totalFeedbackAmount;
      for (let propertyName in payoutData) {
        if (typeof payoutData[propertyName] === "number") {
          payoutData[propertyName] = payoutData[propertyName].toFixed(2);
        }
      }
      return res.json({
        state: 1,
        message: "Success",
        data: payoutData,
      });
    })
    .catch((err) => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}

async function feedbackDashboard(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.feedback_dashboard, [obj])
    .then(async (results) => {
      var feedbackData = await feedbackCount(
        results[0],
        results[1],
        results[2],
        results[3]
      );
      for (let propertyName in feedbackData) {
        if (typeof feedbackData[propertyName] === "number") {
          feedbackData[propertyName] = feedbackData[propertyName].toFixed(2);
        }
      }
      return res.json({
        state: 1,
        message: "Success",
        data: feedbackData,
      });
    })
    .catch((err) => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}

async function drillDownFeedbackDashboard(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.feedback_dashboard, [obj])
    .then(async (results) => {
      let uniqueEmployeeObj = await uniqueEmployee(results[0]);
      let drilDownDataObj = await drilDownData(uniqueEmployeeObj.earner);
      let uniqueEmpByDeptDesigObj = await uniqueEmployeeByDeptDesig(
        uniqueEmployeeObj.earner
      );
      let withoutFeedbackDepartmentObj = await departmentFindDifferencewithkey(
        results[1],
        uniqueEmpByDeptDesigObj.departmentData
      );
      let withoutFeedbackDesignationObj =
        await designationFindDifferencewithkey(
          results[2],
          uniqueEmpByDeptDesigObj.designationData
        );
      let obj = {
        departmentDrillDown: drilDownDataObj.departmentDrillArr,
        designationDrillDown: drilDownDataObj.designationDrillArr,
        withFeedbackDepartmentData: uniqueEmpByDeptDesigObj.departmentData,
        withFeedbackDesignationData: uniqueEmpByDeptDesigObj.designationData,
        withoutFeedbackDepartmentData: withoutFeedbackDepartmentObj,
        withoutFeedbackDesignationData: withoutFeedbackDesignationObj,
      };
      return res.json({
        state: 1,
        message: "Success",
        data: obj,
      });
    })
    .catch((err) => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}

async function internalDashboard(req, res) {
  if (!req.body || !req.body.action) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.feedback_dashboard, [obj])
    .then(async (results) => {
      if (req.body.type == 1) {
        var resdata = await moodCount(results[0], results[1], results[2]);
        resdata.moodUserList.sort((a, b) => {
          return b.amount - a.amount;
        });
        let top10MoodUserList = resdata.moodUserList.slice(0, 10);
        resdata.top10MoodUserList = top10MoodUserList;
        delete resdata.moodUserList;
        for (let propertyName in resdata) {
          if (typeof resdata[propertyName] === "number") {
            resdata[propertyName] = resdata[propertyName].toFixed(2);
          }
        }
      } else if (req.body.type == 2) {
        var resdata = await interviewCount(results[0], results[1]);

        resdata.interviewerUserList.sort((a, b) => {
          return b.amount - a.amount;
        });
        let top10InterviewerUserList = resdata.interviewerUserList.slice(0, 10);
        let interviewerUserCount = resdata.interviewerUserList.length;
        let offeredCost =
          +resdata.totalAmountofInterview / (+resdata.offererdUserCount || 1);
        let joinedCost =
          +resdata.totalAmountofInterview / (+resdata.joinedUserCount || 1);

        resdata.top10InterviewerUserList = top10InterviewerUserList;
        resdata.interviewerUserCount = interviewerUserCount;
        resdata.offeredCost = offeredCost;
        resdata.joinedCost = joinedCost + offeredCost;

        delete resdata.joinedCandidateList;
        delete resdata.offeredCandidateList;
        delete resdata.interviewerUserList;

        for (let propertyName in resdata) {
          if (typeof resdata[propertyName] === "number") {
            resdata[propertyName] = resdata[propertyName].toFixed(2);
          }
        }
      } else if (req.body.type == 4) {
        var resdata = await learningCount(results[0], results[1]);
        resdata.learningTrainerUserList.sort((a, b) => {
          return b.amount - a.amount;
        });
        let top10LearningTrainerUserList =
          resdata.learningTrainerUserList.slice(0, 10);
        resdata.top10LearningTrainerUserList = top10LearningTrainerUserList;

        resdata.learningLearnerUserList.sort((a, b) => {
          return b.amount - a.amount;
        });
        let top10LearningLearnerUserList =
          resdata.learningLearnerUserList.slice(0, 10);
        resdata.top10LearningLearnerUserList = top10LearningLearnerUserList;

        delete resdata.learningTrainerUserList;
        delete resdata.learningLearnerUserList;
        for (let propertyName in resdata) {
          if (typeof resdata[propertyName] === "number") {
            resdata[propertyName] = resdata[propertyName].toFixed(2);
          }
        }
      } else {
        return res.json({
          state: -1,
          message: "Type is not Valid!",
          data: resdata,
        });
      }
      return res.json({
        state: 1,
        message: "Success",
        data: resdata,
      });
    })
    .catch((err) => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}

function interviewCount(obj, monthInterviewList = []) {
  return obj.reduce(
    (acc, curVal) => {
      /** Interviewer User list  */
      if (
        acc.interviewerUserList.some((val) => {
          return val["userId"] == curVal["userid"];
        })
      ) {
        acc.interviewerUserList.forEach((k) => {
          if (k["userId"] === curVal["userid"]) {
            k["count"]++;
            k["amount"] += +curVal["amount"];
          }
        });
      } else {
        let a = {};
        a["userId"] = curVal["userid"];
        a["userName"] = curVal["username"];
        a["amount"] = +curVal["amount"];
        a["profilePic"] = curVal["profilepic"];
        a["count"] = 1;
        acc.interviewerUserList.push(a);
      }

      /** ---------------------------------------------Month wise interviewee List  ---------------------------------------------------- */
      if (
        monthInterviewList.some((val) => {
          return val["monthId"] == curVal["monthId"];
        })
      ) {
        monthInterviewList.forEach((k) => {
          if (k["monthId"] === curVal["monthId"]) {
            k["count"]++;
            k["amount"] += +curVal["amount"];
          }
        });
      }
      acc.monthInterviewList = monthInterviewList;
      /**---------------------------------------------------Joined Candidate List------------------------------------- */

      if (curVal.current_status == "Joined") {
        if (
          acc.joinedCandidateList.some((val) => {
            return val["candidateId"] == curVal["candidateid"];
          })
        ) {
          acc.joinedCandidateList.forEach((k) => {
            if (k["candidateId"] === curVal["candidateid"]) {
              k["count"]++;
              k["amount"] += +curVal["amount"];
            }
          });
        } else {
          acc.joinedUserCount++;
          let a = {};
          a["candidateId"] = curVal["candidateid"];
          a["candidateName"] = curVal["candidatename"];
          a["amount"] = +curVal["amount"];
          a["count"] = 1;
          acc.joinedCandidateList.push(a);
        }
      }
      /**---------------------------------------------------Offered Candidate List------------------------------------- */
      if (curVal.current_status == "Offered") {
        if (
          acc.offeredCandidateList.some((val) => {
            return val["candidateId"] == curVal["candidateid"];
          })
        ) {
          acc.offeredCandidateList.forEach((k) => {
            if (k["candidateId"] === curVal["candidateid"]) {
              k["count"]++;
              k["amount"] += +curVal["amount"];
            }
          });
        } else {
          acc.offererdUserCount++;

          let a = {};
          a["candidateId"] = curVal["candidateid"];
          a["candidateName"] = curVal["candidatename"];
          a["amount"] = +curVal["amount"];
          a["count"] = 1;
          acc.offeredCandidateList.push(a);
        }
      }

      acc.totalAmountofInterview = acc.totalAmountofInterview + +curVal.amount;
      acc.totalPointofInterview = acc.totalPointofInterview + +curVal.amount;
      acc.totalCountofInterview = acc.totalCountofInterview + 1;

      return acc;
    },
    {
      interviewerUserList: [],
      joinedUserCount: 0,
      offererdUserCount: 0,
      // offeredCost: 0,
      // joinedCost: 0,
      totalAmountofInterview: 0,
      totalPointofInterview: 0,
      totalCountofInterview: 0,
      offeredCandidateList: [],
      joinedCandidateList: [],
    }
  );
}

function moodCount(obj, monthMoodList = [], orghappinessindex) {
  const yesterdaydate = moment().subtract(1, "days").format("YYYY-MM-DD");
  return obj.reduce(
    (acc, curVal) => {
      /** --------------------------------------------------Mood User list------------------------------------------  */
      if (
        acc.moodUserList.some((val) => {
          return val["userId"] == curVal["userid"];
        })
      ) {
        acc.moodUserList.forEach((k) => {
          if (k["userId"] === curVal["userid"]) {
            k["count"]++;
            k["amount"] += +curVal["amount"];
          }
        });
      } else {
        let a = {};
        a["userId"] = curVal["userid"];
        a["userName"] = curVal["username"];
        a["amount"] = +curVal["amount"];
        a["profilePic"] = curVal["profilepic"];
        a["count"] = 1;
        acc.moodUserList.push(a);
      }
      // acc.moodUserList = moodUserList;
      /** ---------------------------------------------Month wise Mood User List  ---------------------------------------------------- */
      if (
        monthMoodList.some((val) => {
          return val["monthId"] == curVal["monthId"];
        })
      ) {
        monthMoodList.forEach((k) => {
          if (k["monthId"] === curVal["monthId"]) {
            k["count"]++;
            k["amount"] = +curVal["amount"];
            k["point"] = +curVal["point"];
          }
        });
      }
      acc.monthMoodList = monthMoodList;

      /** ---------------------------------------------last day Mood Submition ---------------------------------------------------- */

      if (curVal.created_at == yesterdaydate) {
        acc.lastDayMoodAmount = acc.lastDayMoodAmount + +curVal.amount;
        acc.lastDayMoodCount = acc.lastDayMoodCount + 1;
        acc.lastDayMoodPoint = acc.lastDayMoodPoint + +curVal.point;
      }

      acc.totalAmountofMood = acc.totalAmountofMood + +curVal.amount;
      acc.totalPointofMood = acc.totalPointofMood + +curVal.point;
      acc.totalCountofMood = acc.totalCountofMood + 1;
      return acc;
    },
    {
      moodUserList: [],
      totalAmountofMood: 0,
      totalPointofMood: 0,
      totalCountofMood: 0,
      lastDayMoodAmount: 0,
      lastDayMoodCount: 0,
      lastDayMoodPoint: 0,
      orgHappinessIndex: orghappinessindex,
    }
  );
}

function learningCount(obj, monthLearningList) {
  return obj.reduce(
    (acc, curVal) => {
      /** Learning Trainer User list  */

      if (curVal.istrainer == 1) {
        if (
          acc.learningTrainerUserList.some((val) => {
            return val["userId"] == curVal["userid"];
          })
        ) {
          acc.learningTrainerUserList.forEach((k) => {
            if (k["userId"] === curVal["userid"]) {
              k["count"]++;
              k["amount"] += +curVal["amount"];
            }
          });
        } else {
          acc.trainerCount++;
          let a = {};
          a["userId"] = curVal["userid"];
          a["userName"] = curVal["username"];
          a["amount"] = +curVal["amount"];
          a["profilePic"] = curVal["profilepic"];
          a["count"] = 1;
          acc.learningTrainerUserList.push(a);
        }
      }
      /** Learning learner User list  */
      if (curVal.istrainer == 0) {
        if (
          acc.learningLearnerUserList.some((val) => {
            return val["userId"] == curVal["userid"];
          })
        ) {
          acc.learningLearnerUserList.forEach((k) => {
            if (k["userId"] === curVal["userid"]) {
              k["count"]++;
              k["amount"] += +curVal["amount"];
            }
          });
        } else {
          acc.learnerCount++;
          let a = {};
          a["userId"] = curVal["userid"];
          a["userName"] = curVal["username"];
          a["amount"] = +curVal["amount"];
          a["profilePic"] = curVal["profilepic"];
          a["count"] = 1;
          acc.learningLearnerUserList.push(a);
        }
      }
      /** ---------------------------------------------Month wise trainging List  ---------------------------------------------------- */
      if (
        monthLearningList.some((val) => {
          return val["monthId"] == curVal["monthId"];
        })
      ) {
        monthLearningList.forEach((k) => {
          if (k["monthId"] === curVal["monthId"]) {
            k["count"]++;
            k["amount"] += +curVal["amount"];
          }
        });
      }
      acc.monthLearningList = monthLearningList;

      acc.totalAmountofLearning = acc.totalAmountofLearning + +curVal.amount;
      acc.totalPointofLearning = acc.totalPointofLearning + +curVal.point;
      // acc.totalCountofMood = acc.totalCountofMood + 1;
      return acc;
    },
    {
      learningLearnerUserList: [],
      learningTrainerUserList: [],
      totalAmountofLearning: 0,
      totalPointofLearning: 0,
      trainerCount: 0,
      learnerCount: 0,
    }
  );
}

function payoutCount(obj, monthRedeemList = [], quaterRedeemList = []) {
  return obj.reduce(
    (acc, curVal) => {
      /** Find Gender of the Payout Employeeee */
      if (curVal.gender == "M") {
        acc.maleRedeemAmount = +acc.maleRedeemAmount + +curVal.amount;
        acc.maleRedeemCount = +acc.maleRedeemCount + 1;
      } else if (curVal.gender == "F") {
        acc.femaleRedeemAmount = +acc.femaleRedeemAmount + +curVal.amount;
        acc.femaleRedeemCount = +acc.femaleRedeemCount + 1;
      } else if (curVal.gender == "O") {
        acc.otherRedeemAmount = +acc.otherRedeemAmount + +curVal.amount;
        acc.otherRedeemCount = +acc.otherRedeemCount + 1;
      }

      /** for Last Month Redeem Amount, Count and Point */

      if (curVal.monthId == lastMonth) {
        acc.lastMonthRedeemAmount = acc.lastMonthRedeemAmount + +curVal.amount;
        acc.lastMonthRedeemCount = acc.lastMonthRedeemCount + 1;
      }

      /** for Designation  wise Amount, Count  */

      if (
        acc.designationRedeemData.some((val) => {
          return val["designationId"] == curVal["designationid"];
        })
      ) {
        //   // If yes! then increase the count by 1
        acc.designationRedeemData.forEach((k) => {
          if (k["designationId"] === curVal["designationid"]) {
            k["count"]++;
            k["y"]++;
            k["amount"] += +curVal["amount"];
          }
        });
      } else {
        //   // If not! Then create a new object
        let a = {};
        a["designationId"] = curVal["designationid"];
        a["designationName"] = curVal["designationname"];
        a["name"] = curVal["designationname"];
        a["drilldown"] = curVal["designationname"];
        a["amount"] = +curVal["amount"];
        a["count"] = 1;
        a["y"] = 1;
        acc.designationRedeemData.push(a);
      }

      /** for Department  wise Amount, Count  */
      if (
        acc.departmentRedeemData.some((val) => {
          return val["departmentId"] == curVal["departmentid"];
        })
      ) {
        acc.departmentRedeemData.forEach((k) => {
          if (k["departmentId"] === curVal["departmentid"]) {
            k["count"]++;
            k["y"]++;
            k["amount"] += +curVal["amount"];
          }
        });
      } else {
        let a = {};
        a["departmentId"] = curVal["departmentid"];
        a["departmentName"] = curVal["departmentname"];
        a["name"] = curVal["departmentname"];
        a["drilldown"] = curVal["departmentname"];
        a["amount"] = +curVal["amount"];
        a["count"] = 1;
        a["y"] = 1;
        acc.departmentRedeemData.push(a);
      }
      /** Redeem User list  */
      if (
        acc.userRedeemList.some((val) => {
          return val["userId"] == curVal["userid"];
        })
      ) {
        acc.userRedeemList.forEach((k) => {
          if (k["userId"] === curVal["userid"]) {
            k["count"]++;
            k["amount"] += +curVal["amount"];
          }
        });
      } else {
        let a = {};
        a["userId"] = curVal["userid"];
        a["userName"] = curVal["username"];
        a["designationId"] = curVal["designationid"];
        a["designationName"] = curVal["designationname"];
        a["departmentId"] = curVal["departmentid"];
        a["departmentName"] = curVal["departmentname"];
        a["amount"] = +curVal["amount"];
        a["profilePic"] = curVal["profilepic"];
        a["count"] = 1;
        acc.userRedeemList.push(a);
      }

      /** Coupon Redeem  list  */
      if (
        acc.couponRedeemList.some((val) => {
          return val["productId"] == curVal["productId"];
        })
      ) {
        acc.couponRedeemList.forEach((k) => {
          if (k["productId"] === curVal["productId"]) {
            k["count"]++;
            k["amount"] += +curVal["amount"];
          }
        });
      } else {
        let a = {};
        a["productId"] = curVal["productId"];
        a["couponName"] = curVal["couponName"];
        a["amount"] = +curVal["amount"];
        a["imageUrl"] = curVal["imageUrl"];
        a["count"] = 1;
        acc.couponRedeemList.push(a);
      }

      /** Month wise  Redeem  list  */
      if (
        monthRedeemList.some((val) => {
          return val["monthId"] == curVal["monthId"];
        })
      ) {
        monthRedeemList.forEach((k) => {
          if (k["monthId"] === curVal["monthId"]) {
            k["count"]++;
            k["amount"] += +curVal["amount"];
          }
        });
      } else {
        let a = {};
        a["monthId"] = curVal["monthId"];
        a["monthName"] = curVal["monthName"];
        a["amount"] = +curVal["amount"];
        a["count"] = 1;
      }
      acc.monthRedeemList = monthRedeemList;

      /** Quater wise  Redeem  list  */
      if (
        quaterRedeemList.some((val) => {
          return val["quaterId"] == curVal["quaterId"];
        })
      ) {
        quaterRedeemList.forEach((k) => {
          if (k["quaterId"] === curVal["quaterId"]) {
            k["count"]++;
            k["amount"] += +curVal["amount"];
          }
        });
      } else {
        let a = {};
        a["quaterId"] = curVal["quaterId"];
        a["quaterName"] = curVal["monthName"];
        a["amount"] = +curVal["amount"];
        a["count"] = 1;
      }
      acc.quaterRedeemList = quaterRedeemList;

      /** Find Total Redeem Amount */
      acc.totalRedeemAmount = acc.totalRedeemAmount + +curVal.amount;
      acc.totalRedeemCount = acc.totalRedeemCount + 1;
      return acc;
    },
    {
      maleRedeemAmount: 0,
      maleRedeemCount: 0,
      femaleRedeemAmount: 0,
      femaleRedeemCount: 0,
      otherRedeemAmount: 0,
      otherRedeemCount: 0,
      lastMonthRedeemAmount: 0,
      lastMonthRedeemCount: 0,
      designationRedeemData: [],
      departmentRedeemData: [],
      userRedeemList: [],
      couponRedeemList: [],
      couponAmount: 0,
      paytmAmount: 0,
      upiAmount: 0,
      accountAmount: 0,
      totalRedeemAmount: 0,
      totalRedeemCount: 0,
      // designationDrillArr,
      // departmentDrillArr,
    }
  );
}

function feedbackCount(
  obj,
  monthFeedbackList = [],
  quaterFeedbackList = [],
  hashtagFeedbackList = []
) {
  return obj.reduce(
    (acc, curVal) => {
      /** Find Gender of the Feedback Count , Amount and Point Employeeee */
      if (curVal.gender == "M") {
        acc.maleFeedbackPoint = Math.round(
          +acc.maleFeedbackPoint + +curVal.point,
          2
        );
        acc.maleFeedbackAmount = Math.round(
          +acc.maleFeedbackAmount + +curVal.amount,
          2
        );
        acc.maleFeedbackCount = +acc.maleFeedbackCount + 1;
      } else if (curVal.gender == "F") {
        acc.femaleFeedbackPoint = Math.round(
          +acc.femaleFeedbackPoint + +curVal.point,
          2
        );
        acc.femaleFeedbackAmount = Math.round(
          +acc.femaleFeedbackAmount + +curVal.amount,
          2
        );
        acc.femaleFeedbackCount = +acc.femaleFeedbackCount + 1;
      } else if (curVal.gender == "O") {
        acc.otherFeedbackPoint = Math.round(
          +acc.otherFeedbackPoint + +curVal.amount,
          2
        );
        acc.otherFeedbackAmount = Math.round(
          +acc.otherFeedbackAmount + +curVal.amount,
          2
        );
        acc.otherFeedbackCount = +acc.otherFeedbackCount + 1;
      }

      /** for Team or Indivdual Mode Feedback Amount, Count and Point */
      if (curVal.isteam == 1) {
        acc.teamAmount = Math.round(acc.teamAmount + +curVal.amount, 2);
        acc.teamPoint = acc.teamPoint + +curVal.point;
        acc.teamCount = acc.teamCount + 1;
      } else if (curVal.isteam == 0) {
        acc.individualAmount = Math.round(
          acc.individualAmount + +curVal.amount,
          2
        );
        acc.individualPoint = acc.individualPoint + +curVal.point;
        acc.individualCount = acc.individualCount + 1;
      }
      /** for Last Month Feedback Amount, Count and Point */

      if (curVal.monthId == lastMonth) {
        acc.lastMonthAmount = acc.lastMonthAmount + +curVal.amount;
        acc.lastMonthPoint = acc.lastMonthPoint + +curVal.point;
        acc.lastMonthCount = acc.lastMonthCount + 1;
      }

      /** for feedback Type Amount, Count and Point */
      if (
        acc.feedbackTypeData.some((val) => {
          return val["feedbackTypeId"] == curVal["feedbacktypeid"];
        })
      ) {
        // If yes! then increase the count by 1
        acc.feedbackTypeData.forEach((k) => {
          if (k["feedbackTypeId"] === curVal["feedbacktypeid"]) {
            k["count"]++;
            k["point"] += +curVal["point"];
            k["amount"] += +curVal["amount"];
          }
        });
      } else {
        // If not! Then create a new object
        let a = {};
        a["feedbackTypeId"] = curVal["feedbacktypeid"];
        a["feedbackTypeName"] = curVal["feedbacktypename"];
        a["point"] = +curVal["point"];
        a["amount"] = +curVal["amount"];
        a["count"] = 1;
        acc.feedbackTypeData.push(a);
      }

      /** for feedback Sub-Type (Reason) Amount, Count and Point */
      if (
        acc.feedbackSubTypeData.some((val) => {
          return val["feedbackReasonId"] == curVal["feedbackreasonid"];
        })
      ) {
        acc.feedbackSubTypeData.forEach((k) => {
          if (k["feedbackReasonId"] === curVal["feedbackreasonid"]) {
            k["count"]++;
            k["point"] += +curVal["point"];
            k["amount"] += +curVal["amount"];
          }
        });
      } else {
        let a = {};
        a["feedbackReasonId"] = curVal["feedbackreasonid"];
        a["feedbackReasonName"] = curVal["feedbackreasonname"];
        a["feedbackTypeId"] = curVal["feedbacktypeid"];
        a["feedbackTypeName"] = curVal["feedbacktypename"];
        a["point"] = +curVal["point"];
        a["amount"] = +curVal["amount"];
        a["count"] = 1;
        acc.feedbackSubTypeData.push(a);
      }

      /** for Designation Wise Amount, Count and Point */
      if (
        acc.designationData.some((val) => {
          return val["designationId"] == curVal["designationid"];
        })
      ) {
        acc.designationData.forEach((k) => {
          if (k["designationId"] === curVal["designationid"]) {
            k["count"]++;
            k["y"]++;
            k["point"] += +curVal["point"];
            k["amount"] += +curVal["amount"];
          }
        });
      } else {
        let a = {};
        a["designationId"] = curVal["designationid"];
        // a["designationName"] = curVal["designationname"];
        // a["name"] = curVal["designationname"];
        // a["drilldown"] = curVal["designationname"];
        a["point"] = +curVal["point"];
        a["amount"] = +curVal["amount"];
        // a["y"] = 1;
        a["count"] = 1;
        acc.designationData.push(a);
      }

      /** for Department  wise Amount, Count and Point */
      if (
        acc.departmentData.some((val) => {
          return val["departmentId"] == curVal["departmentid"];
        })
      ) {
        acc.departmentData.forEach((k) => {
          if (k["departmentId"] === curVal["departmentid"]) {
            k["count"]++;
            k["y"]++;
            k["point"] += +curVal["point"];
            k["amount"] += +curVal["amount"];
          }
        });
      } else {
        let a = {};
        a["departmentId"] = curVal["departmentid"];
        a["departmentName"] = curVal["departmentname"];
        // a["name"] = curVal["departmentname"];
        // a["drilldown"] = curVal["departmentname"];
        a["point"] = +curVal["point"];
        a["amount"] = +curVal["amount"];
        // a["y"] = 1;
        a["count"] = 1;
        acc.departmentData.push(a);
      }
      /** for feedback Earner Amount, Count and Point */
      if (
        acc.earner.some((val) => {
          return val["userId"] == curVal["userid"];
        })
      ) {
        acc.earner.forEach((k) => {
          if (k["userId"] === curVal["userid"]) {
            k["count"]++;
            k["point"] += +curVal["point"];
            k["amount"] += +curVal["amount"];
          }
        });
      } else {
        let a = {};
        a["userId"] = curVal["userid"];
        a["userName"] = curVal["username"];
        a["point"] = +curVal["point"];
        a["amount"] = +curVal["amount"];
        a["designationId"] = curVal["designationid"];
        a["designationName"] = curVal["designationname"];
        a["departmentId"] = curVal["departmentid"];
        a["departmentName"] = curVal["departmentname"];
        a["profilePic"] = curVal["profilepic"];
        a["count"] = 1;
        acc.earner.push(a);
      }

      /** for feedback Giver Amount, Count and Point */
      if (
        acc.giver.some((val) => {
          return val["raisedBy"] == curVal["raisedby"];
        })
      ) {
        acc.giver.forEach((k) => {
          if (k["raisedBy"] === curVal["raisedby"]) {
            k["count"]++;
            k["point"] += +curVal["point"];
            k["amount"] += +curVal["amount"];
          }
        });
      } else {
        let a = {};
        a["raisedBy"] = curVal["raisedby"];
        a["raisedByName"] = curVal["raisedbyname"];
        a["point"] = +curVal["point"];
        a["amount"] = +curVal["amount"];
        a["raiseByProfilePic"] = curVal["raisebyprofilepic"];
        a["count"] = 1;
        acc.giver.push(a);
      }

      /** Month wise  Feedback Amount , Point and Count  */
      if (
        monthFeedbackList.some((val) => {
          return val["monthId"] == curVal["monthId"];
        })
      ) {
        monthFeedbackList.forEach((k) => {
          if (k["monthId"] === curVal["monthId"]) {
            k["count"]++;
            k["amount"] += +curVal["amount"];
            k["point"] += +curVal["point"];
          }
        });
      }

      acc.monthFeedbackList = monthFeedbackList;

      /** Quater wise  Feedback amount , point , Count  list  */
      if (
        quaterFeedbackList.some((val) => {
          return val["quaterId"] == curVal["quaterId"];
        })
      ) {
        quaterFeedbackList.forEach((k) => {
          if (k["quaterId"] === curVal["quaterId"]) {
            k["count"]++;
            k["amount"] += +curVal["amount"];
            k["point"] += +curVal["point"];
          }
        });
      }

      acc.quaterFeedbackList = quaterFeedbackList;

      /** HashTag Wise  Feedback Amount , Point and Count  */
      if (
        hashtagFeedbackList.some((val) => {
          return curVal["hashid"] && curVal["hashid"].includes(val["id"]);
        })
      ) {
        hashtagFeedbackList.forEach((k) => {
          if (curVal["hashid"] && curVal["hashid"].includes(k["id"])) {
            k["count"]++;
            k["amount"] += +curVal["amount"];
            k["point"] += +curVal["point"];
          }
        });
      }

      acc.hashtagFeedbackList = hashtagFeedbackList;

      /** for total Feedback Amount */
      acc.totalAmount = acc.totalAmount + +curVal.amount;
      acc.totalPoint = acc.totalPoint + +curVal.point;
      acc.totalCount = acc.totalCount + +1;
      return acc;
    },
    {
      maleFeedbackAmount: 0,
      maleFeedbackPoint: 0,
      maleFeedbackCount: 0,
      femaleFeedbackAmount: 0,
      femaleFeedbackPoint: 0,
      femaleFeedbackCount: 0,
      otherFeedbackAmount: 0,
      otherFeedbackPoint: 0,
      otherFeedbackCount: 0,
      teamAmount: 0,
      teamPoint: 0,
      teamCount: 0,
      individualAmount: 0,
      individualPoint: 0,
      individualCount: 0,
      totalAmount: 0,
      totalPoint: 0,
      totalCount: 0,
      lastMonthAmount: 0,
      lastMonthPoint: 0,
      lastMonthCount: 0,
      earner: [],
      giver: [],
      feedbackTypeData: [],
      feedbackSubTypeData: [],
      departmentData: [],
      designationData: [],
    }
  );
}

function uniqueEmployeeByDeptDesig(obj) {
  return obj.reduce(
    (acc, curVal) => {
      /** for Designation Wise Amount, Count and Point */
      if (
        acc.designationData.some((val) => {
          return val["designationId"] == curVal["designationId"];
        })
      ) {
        acc.designationData.forEach((k) => {
          if (k["designationId"] === curVal["designationId"]) {
            k["count"]++;
            k["y"]++;
            k["point"] += +curVal["point"];
            k["amount"] += +curVal["amount"];
          }
        });
      } else {
        let a = {};
        a["designationId"] = curVal["designationId"];
        a["designationName"] = curVal["designationName"];
        a["name"] = curVal["designationName"];
        a["drilldown"] = curVal["designationName"];
        a["point"] = +curVal["point"];
        a["amount"] = +curVal["amount"];
        a["y"] = 1;
        a["count"] = 1;
        acc.designationData.push(a);
      }

      /** for Department  wise Amount, Count and Point */
      if (
        acc.departmentData.some((val) => {
          return val["departmentId"] == curVal["departmentId"];
        })
      ) {
        acc.departmentData.forEach((k) => {
          if (k["departmentId"] === curVal["departmentId"]) {
            k["count"]++;
            k["y"]++;
            k["point"] += +curVal["point"];
            k["amount"] += +curVal["amount"];
          }
        });
      } else {
        let a = {};
        a["departmentId"] = curVal["departmentId"];
        a["departmentName"] = curVal["departmentName"];
        a["name"] = curVal["departmentName"];
        a["drilldown"] = curVal["departmentName"];
        a["point"] = +curVal["point"];
        a["amount"] = +curVal["amount"];
        a["y"] = 1;
        a["count"] = 1;
        acc.departmentData.push(a);
      }
      return acc;
    },
    {
      departmentData: [],
      designationData: [],
    }
  );
}

function uniqueEmployee(obj) {
  return obj.reduce(
    (acc, curVal) => {
      /** for feedback Earner Amount, Count and Point */
      if (
        acc.earner.some((val) => {
          return val["userId"] == curVal["userid"];
        })
      ) {
        acc.earner.forEach((k) => {
          if (k["userId"] === curVal["userid"]) {
            k["count"]++;
            k["point"] += +curVal["point"];
            k["amount"] += +curVal["amount"];
          }
        });
      } else {
        let a = {};
        a["userId"] = curVal["userid"];
        a["userName"] = curVal["username"];
        a["point"] = +curVal["point"];
        a["amount"] = +curVal["amount"];
        a["designationId"] = curVal["designationid"];
        a["designationName"] = curVal["designationname"];
        a["departmentId"] = curVal["departmentid"];
        a["departmentName"] = curVal["departmentname"];
        a["count"] = 1;
        acc.earner.push(a);
      }
      return acc;
    },
    {
      earner: [],
    }
  );
}

function drilDownData(obj) {
  return new Promise((resolve, reject) => {
    let destignationGroupData = _.groupBy(obj, (item) => item.departmentName);
    let departmentGroupData = _.groupBy(obj, (item) => item.designationName);

    let designationArr = [];
    let designationDrillArr = [];
    for (const key in destignationGroupData) {
      designationArr = [];
      destignationGroupData[key].forEach((element) => {
        if (
          designationArr.some((val) => {
            return val["designationId"] == element["designationId"];
          })
        ) {
          // If yes! then increase the count by 1
          designationArr.forEach((k) => {
            if (k["designationId"] === element["designationId"]) {
              k["count"]++;
              // k["amount"]++;
              // k["point"]++;
              k["y"]++;
            }
          });
        } else {
          let a = {};
          a["designationId"] = element["designationId"];
          a["designationName"] = element["designationName"];
          a["name"] = element["designationName"];
          a["count"] = 1;
          // a["amount"] = 1;
          // a["point"] = 1;
          a["y"] = 1;
          designationArr.push(a);
        }
      });
      designationDrillArr.push({
        id: key,
        name: key,
        data: designationArr,
      });
    }

    let departmentDrillArr = [];
    let departmentArr = [];
    for (const key in departmentGroupData) {
      departmentArr = [];
      departmentGroupData[key].forEach((element) => {
        if (
          departmentArr.some((val) => {
            return val["departmentId"] == element["departmentId"];
          })
        ) {
          departmentArr.forEach((k) => {
            if (k["departmentId"] === element["departmentId"]) {
              k["count"]++;
              k["amount"]++;
              k["point"]++;
              k["y"]++;
            }
          });
        } else {
          let a = {};
          a["departmentId"] = element["departmentId"];
          a["departmentName"] = element["departmentName"];
          a["name"] = element["departmentName"];
          a["count"] = 1;
          // a["amount"] = element["amount"];
          // a["point"] = element["amounpointt"];
          a["y"] = 1;
          departmentArr.push(a);
        }
      });
      departmentDrillArr.push({ id: key, name: key, data: departmentArr });
    }
    resolve({
      departmentDrillArr,
      designationDrillArr,
    });
  });
}

function departmentFindDifferencewithkey(allData, feedbackData) {
  return new Promise((resolve, reject) => {
    let withoutFeedbackData = [];
    allData.forEach(function (item) {
      let findObj = feedbackData.find((o) => {
        return o.departmentId == item.departmentId;
      });
      let newobj = {};
      newobj.name = item.name;
      if (findObj) {
        newobj.y = item.y - findObj.y || 0;
      } else {
        newobj.y = item.y;
      }

      withoutFeedbackData.push(newobj);
    });
    resolve(withoutFeedbackData);
  });
}

function designationFindDifferencewithkey(allData, feedbackData) {
  return new Promise((resolve, reject) => {
    let withoutFeedbackData = [];
    allData.forEach(function (item) {
      let findObj = feedbackData.find((o) => {
        return o.designationId == item.designationId;
      });
      let newobj = {};
      newobj.name = item.name;
      if (findObj) {
        newobj.y = item.y - findObj.y || 0;
      } else {
        newobj.y = item.y;
      }

      withoutFeedbackData.push(newobj);
    });
    resolve(withoutFeedbackData);
  });
}
