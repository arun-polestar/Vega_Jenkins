const proc = require('../../common/procedureConfig');
const commonModel = require('../../common/Model');
const moment = require('moment');
const query = require('../../common/Model').mysqlPromiseModelService
//const { interviewSourceData, interviewsummaryData, cardDataObj } = require('./dashboard.model');
//const { cardDataFormatter, interviewStageConditions, interviewSummaryDataFormatter, interviewSourceDataFormatter, getTopInterviewerData } = require('./dashboard.policy')
const { getTopInterviewerData } = require('./dashboard.policy')

const _ = require('lodash');
const rdb = require('../../../redisconnect');


const today = moment().format("YYYY-MM-DD");
const next_7 = moment().add(7, "days").format("YYYY-MM-DD");
const prev_7 = moment().subtract(7, "days").format("YYYY-MM-DD");
const prev_15 = moment().subtract(15, "days").format("YYYY-MM-DD");
const prev_30 = moment().subtract(30, "days").format("YYYY-MM-DD");
const prev_45 = moment().subtract(45, "days").format("YYYY-MM-DD");
const curWeekStart = moment().startOf('isoWeek').format("YYYY-MM-DD");
const curWeekEnd = moment().endOf('isoWeek').format("YYYY-MM-DD");
const nextWeekStart = moment().add(1, 'weeks').startOf('isoWeek').format("YYYY-MM-DD");
const nextWeekEnd = moment().add(1, 'weeks').endOf('isoWeek').format("YYYY-MM-DD");
console.log(curWeekStart, curWeekEnd, nextWeekStart, nextWeekEnd)

module.exports = {
  getRmsDashboardInfo: getRmsDashboardInfo,
  getDashboardCount: getDashboardCount,
  getDashboardDataemp: getDashboardDataemp,
  getRMSDashboardData: getRMSDashboardData,
  getRMSDashboardRequisition: getRMSDashboardRequisition,
}


function getRmsDashboardInfo(req, res) {
  req.body.startdate = moment(req.body.startdate, 'DD-MM-YYYY').format('YYYY-MM-DD');
  req.body.enddate = moment(req.body.enddate, 'DD-MM-YYYY').format('YYYY-MM-DD');
  var obj = JSON.stringify(req.body);
  commonModel.mysqlPromiseModelService(proc.mstreportview, obj)
    .then(results => {
      res.json({ msg: 'success', data: results, state: 1 })
    })
    .catch(err => {
      res.json({ msg: 'Failure', data: err, state: -1 })
    });
}

function getDashboardCount(req, res) {
  var obj = req.body;
  obj = JSON.stringify(obj);
  commonModel.mysqlPromiseModelService('call usp_employee_dashboard(?)', [obj])
    .then(results => {
      res.json({ msg: 'success', data: results, state: 1 })
    })
    .catch(err => {
      res.json({ message: err.message || err, data: null, state: -1 })
    })
}


function getDashboardDataemp(req, res) {
  var obj = req.body;
  obj = JSON.stringify(obj);
  commonModel.mysqlPromiseModelService('call usp_employee_dashborad_data(?)', [obj])
    .then(results => {
      res.json({ msg: 'success', data: results, state: 1 })
    })
    .catch(err => {
      res.json({ msg: 'Failure', data: err, state: -1 })
    })
}

async function getRMSDashboardRequisition(req, res) {
  try {
    let reqData = req.body
    reqData.action = "rms_requisition_data"
    let [results] = await query('call usp_rms_dashboard(?)', [JSON.stringify(reqData)])
    return res.json({ state: 1, message: "Success", data: results })
  } catch (err) {
    return res.json({ state: -1, message: "Something went wrong", err: err })
  }
}

function dateFormatter(acc, cur, index) {

  if (cur.interviewdate <= today && cur.interviewdate >= prev_7) {
    acc[index]["prev_7"] = acc[index]["prev_7"] ? acc[index]["prev_7"] + 1 : 1
    acc[index]["total"] = acc[index]["total"] ? acc[index]["total"] + 1 : 1

  }
  else if (cur.interviewdate < prev_7 && cur.interviewdate >= prev_15) {
    acc[index]["prev_15"] = acc[index]["prev_15"] ? acc[index]["prev_15"] + 1 : 1
    acc[index]["total"] = acc[index]["total"] ? acc[index]["total"] + 1 : 1

  }
  else if (cur.interviewdate < prev_15 && cur.interviewdate >= prev_30) {
    acc[index]["prev_30"] = acc[index]["prev_30"] ? acc[index]["prev_30"] + 1 : 1
    acc[index]["total"] = acc[index]["total"] ? acc[index]["total"] + 1 : 1

  }
  else if (cur.interviewdate < prev_30 && cur.interviewdate >= prev_45) {
    acc[index]["prev_45"] = acc[index]["prev_45"] ? acc[index]["prev_45"] + 1 : 1
    acc[index]["total"] = acc[index]["total"] ? acc[index]["total"] + 1 : 1

  } else {
    acc[index]["total"] = acc[index]["total"] ? acc[index]["total"] + 1 : 1
  }
  return acc;
}

function sourceFormatter(acc, cur, index) {
  acc[index]["source_total"] = acc[index]["source_total"] ? acc[index]["source_total"] + 1 : 1
  if (cur.resumesource == "Employee Referral") {
    acc[index]["referral"] = acc[index]["referral"] ? acc[index]["referral"] + 1 : 1
  }
  else if (cur.isvendor == "1") {
    acc[index]["vendor"] = acc[index]["vendor"] ? acc[index]["vendor"] + 1 : 1
  }
  else {
    acc[index]["others"] = acc[index]["others"] ? acc[index]["others"] + 1 : 1
  }
  return acc;
}

function offeredCondition(item) {
  if (
    (item.state == "HR Interview" &&
      (item.status == "Offered" ||
        item.status == "Offer accepted" ||
        item.status == "Offer rejected")
    )
    ||
    (item.state == "Join" &&
      (item.status == "Joined" ||
        item.status == "Not Joined" ||
        item.status == "Offer accepted" ||
        item.status == "Offer rejected")
    )
  ) {
    return true;
  }
  else false;
}

function overallData(data, interviewsummaryData, interviewSourceData, rejectionCount, interviews) {
  for (let i = 0; i < data.length; i++) {
    let cur = data[i]
    cur.interviewdate = JSON.parse(JSON.stringify(moment(cur.interviewdate).format("YYYY-MM-DD")))

    if ((cur.state == "Technical Interview" || cur.state == "HR Interview")
      && !(cur.status == "Pending" || cur.status == "NA"
        || cur.status == "No Show" || cur.status == "Not Interested"
        || cur.status == "Not Relevant" || cur.status == "Position Closed")
      //&& cur.is_interview == 1
    ) {
      let index = interviewsummaryData.findIndex(item => item.title == "Interview")
      dateFormatter(interviewsummaryData, cur, index)

      let index2 = interviewSourceData.findIndex(item => item.title == "Interview")
      sourceFormatter(interviewSourceData, cur, index2)

      ++interviews.Total
      interviews.Duration = interviews.Duration + +cur.interviewduration;
    }
    if ((cur.state == "Technical Interview" || cur.state == "HR Interview") && cur.status == "Pending"
      && cur.interviewdate <= next_7 && cur.interviewdate > today) {
      let index = interviewsummaryData.findIndex(item => item.title == "Interview")
      interviewsummaryData[index]["next_7"] = interviewsummaryData[index]["next_7"] ? interviewsummaryData[index]["next_7"] + 1 : 1
    }
    if (cur.status == "Joined") {
      let index = interviewsummaryData.findIndex(item => item.title == "Joined");
      dateFormatter(interviewsummaryData, cur, index)

      let index2 = interviewSourceData.findIndex(item => item.title == "Joined");
      sourceFormatter(interviewSourceData, cur, index2)
    }
    if (offeredCondition(cur)) {
      let index = interviewsummaryData.findIndex(item => item.title == "Offered");
      dateFormatter(interviewsummaryData, cur, index)

      let index2 = interviewSourceData.findIndex(item => item.title == "Offered");
      sourceFormatter(interviewSourceData, cur, index2)

    }
    if (cur.state == "Tagged") {
      let index = interviewsummaryData.findIndex(item => item.title == "Tagged");
      dateFormatter(interviewsummaryData, cur, index)

      let index2 = interviewSourceData.findIndex(item => item.title == "Tagged");
      sourceFormatter(interviewSourceData, cur, index2)

    }
    if (cur.state == "Pre Screening") {
      let index = interviewsummaryData.findIndex(item => item.title == "Pre Screening");
      dateFormatter(interviewsummaryData, cur, index)

      let index2 = interviewSourceData.findIndex(item => item.title == "Pre Screening");
      sourceFormatter(interviewSourceData, cur, index2)

    }
    if (cur.state == "Screening" && cur.status == "Rejected") {
      let index = interviewsummaryData.findIndex(item => item.title == "Screening Rejected");
      dateFormatter(interviewsummaryData, cur, index)

      let index2 = interviewSourceData.findIndex(item => item.title == "Screening Rejected");
      sourceFormatter(interviewSourceData, cur, index2)

      ++rejectionCount.Screening

    }
    if (cur.state == "Screening" && cur.status == "Accepted") {
      let index = interviewsummaryData.findIndex(item => item.title == "Screening Accepted");
      dateFormatter(interviewsummaryData, cur, index)

      let index2 = interviewSourceData.findIndex(item => item.title == "Screening Accepted");
      sourceFormatter(interviewSourceData, cur, index2)
    }
    if (cur.state == "Technical Interview") {
      let index = interviewsummaryData.findIndex(item => item.title == "Technical Scheduled");
      dateFormatter(interviewsummaryData, cur, index)

      let index2 = interviewSourceData.findIndex(item => item.title == "Technical Scheduled");
      sourceFormatter(interviewSourceData, cur, index2)

      if (cur.status == "Rejected") {
        let index = interviewsummaryData.findIndex(item => item.title == "Technical Rejected");
        dateFormatter(interviewsummaryData, cur, index)

        let index2 = interviewSourceData.findIndex(item => item.title == "Technical Rejected");
        sourceFormatter(interviewSourceData, cur, index2)

        if (cur.round == 1) {
          ++rejectionCount["Technical_1"]
        } else if (cur.round == 2) {
          ++rejectionCount["Technical_2"]
        } else if (cur.round == 3) {
          ++rejectionCount["Technical_3"]
        } else if (cur.round == 4) {
          ++rejectionCount["Technical_4"]
        } else {
          ++rejectionCount["Technical_Other"]
        }

      } else if (cur.status == "Accepted") {
        let index = interviewsummaryData.findIndex(item => item.title == "Technical Accepted");
        dateFormatter(interviewsummaryData, cur, index)

        let index2 = interviewSourceData.findIndex(item => item.title == "Technical Accepted");
        sourceFormatter(interviewSourceData, cur, index2)

      } else if (cur.status == "Pending") {
        let index = interviewsummaryData.findIndex(item => item.title == "Technical Pending");
        dateFormatter(interviewsummaryData, cur, index)

        let index2 = interviewSourceData.findIndex(item => item.title == "Technical Pending");
        sourceFormatter(interviewSourceData, cur, index2)
      }
    }
    if (cur.state == "HR Interview") {
      let index = interviewsummaryData.findIndex(item => item.title == "HR Scheduled");
      dateFormatter(interviewsummaryData, cur, index)

      let index2 = interviewSourceData.findIndex(item => item.title == "HR Scheduled");
      sourceFormatter(interviewSourceData, cur, index2)

      if (cur.status == "Rejected") {
        let index = interviewsummaryData.findIndex(item => item.title == "HR Rejected");
        dateFormatter(interviewsummaryData, cur, index)

        let index2 = interviewSourceData.findIndex(item => item.title == "HR Rejected");
        sourceFormatter(interviewSourceData, cur, index2)

        ++rejectionCount.HR

      } else if (cur.status == "Accepted" ||
        cur.status == "Offered" ||
        cur.status == "Offer accepted" ||
        cur.status == "Offer rejected"
      ) {
        let index = interviewsummaryData.findIndex(item => item.title == "HR Accepted");
        dateFormatter(interviewsummaryData, cur, index)

        let index2 = interviewSourceData.findIndex(item => item.title == "HR Accepted");
        sourceFormatter(interviewSourceData, cur, index2)
      } else if (cur.status == "Pending") {
        let index = interviewsummaryData.findIndex(item => item.title == "HR Pending");
        dateFormatter(interviewsummaryData, cur, index)

        let index2 = interviewSourceData.findIndex(item => item.title == "HR Pending");
        sourceFormatter(interviewSourceData, cur, index2)
      }
    }
  }
}

function currentData(currentInterviewData, referralData, referrals, currentinterviewsummaryData,
  currentinterviewSourceData, interviewPending, unique, Joined, offered,
  uniqueVendors, uniqueRequisitions, currentrejectionCount, feedbackPending,
  interviews, pendingData) {

  for (let i = 0; i < currentInterviewData.length; i++) {
    let cur = currentInterviewData[i]
    cur.interviewdate = JSON.parse(JSON.stringify(moment(cur.interviewdate).format("YYYY-MM-DD")))

    if ((cur.state == "Technical Interview" || cur.state == "HR Interview")
      && !(cur.status == "Pending" || cur.status == "NA"
        || cur.status == "No Show" || cur.status == "Not Interested"
        || cur.status == "Not Relevant" || cur.status == "Position Closed")
      //&& cur.is_interview == 1
    ) {
      let index = currentinterviewsummaryData.findIndex(item => item.title == "Interview")
      dateFormatter(currentinterviewsummaryData, cur, index)

      let index2 = currentinterviewSourceData.findIndex(item => item.title == "Interview")
      sourceFormatter(currentinterviewSourceData, cur, index2)

      ++unique.InterviewCount

    }
    if ((cur.state == "Technical Interview" || cur.state == "HR Interview") && cur.status == "Pending") {

      if (cur.interviewdate <= next_7 && cur.interviewdate > today) {
        let index = currentinterviewsummaryData.findIndex(item => item.title == "Interview")
        currentinterviewsummaryData[index]["next_7"] = currentinterviewsummaryData[index]["next_7"] ? currentinterviewsummaryData[index]["next_7"] + 1 : 1
      }
      if (curWeekStart <= cur.interviewdate && cur.interviewdate <= curWeekEnd) {
        ++interviewPending.ThisWeek
      }
      if (nextWeekStart <= cur.interviewdate && cur.interviewdate <= nextWeekEnd) {
        ++interviewPending.NextWeek
      }
      if (moment(cur.interviewdate).month() == moment().month() && moment(cur.interviewdate).year() == moment().year()) {
        ++interviewPending.ThisMonth
      }
    }
    if (cur.status == "Joined") {
      let index = currentinterviewsummaryData.findIndex(item => item.title == "Joined");
      dateFormatter(currentinterviewsummaryData, cur, index)

      let index2 = currentinterviewSourceData.findIndex(item => item.title == "Joined");
      sourceFormatter(currentinterviewSourceData, cur, index2)

      ++unique.Joined
      ++Joined.Joined

      unique.JoinedExpSum = unique.JoinedExpSum + cur.experience_months

      let vendorIndex = uniqueVendors.findIndex(item => item.resumesourceid == cur.resumesourceid)
      if (vendorIndex > -1) {
        ++uniqueVendors[vendorIndex].joined
      }

      let requisitionIndex = uniqueRequisitions.findIndex(item => item.jobid == cur.jobid);
      if (requisitionIndex > -1) {
        ++uniqueRequisitions[requisitionIndex].Joined
      }
    }
    if (cur.status == "Not Joined") {
      ++Joined["NotJoined"]
    }
    if (cur.state == "Join") {
      ++Joined.Total
    }
    if (offeredCondition(cur)) {
      let index = currentinterviewsummaryData.findIndex(item => item.title == "Offered");
      dateFormatter(currentinterviewsummaryData, cur, index)

      let index2 = currentinterviewSourceData.findIndex(item => item.title == "Offered");
      sourceFormatter(currentinterviewSourceData, cur, index2)

      let vendorIndex = uniqueVendors.findIndex(item => item.resumesourceid == cur.resumesourceid)
      if (vendorIndex > -1) {
        ++uniqueVendors[vendorIndex].offered
      }

      let requisitionIndex = uniqueRequisitions.findIndex(item => item.jobid == cur.jobid);
      if (requisitionIndex > -1) {
        ++uniqueRequisitions[requisitionIndex].Offered
      }


      ++offered.Total
      ++unique.Offered
      unique.OfferedExpSum = unique.OfferedExpSum + cur.experience_months


    }
    if (cur.state == "Tagged") {
      let index = currentinterviewsummaryData.findIndex(item => item.title == "Tagged");
      dateFormatter(currentinterviewsummaryData, cur, index)

      let index2 = currentinterviewSourceData.findIndex(item => item.title == "Tagged");
      sourceFormatter(currentinterviewSourceData, cur, index2)


    }
    if (cur.state == "Pre Screening") {
      let index = currentinterviewsummaryData.findIndex(item => item.title == "Pre Screening");
      dateFormatter(currentinterviewsummaryData, cur, index)

      let index2 = currentinterviewSourceData.findIndex(item => item.title == "Pre Screening");
      sourceFormatter(currentinterviewSourceData, cur, index2)

    }
    if (cur.state == "Screening" && cur.status == "Rejected") {
      let index = currentinterviewsummaryData.findIndex(item => item.title == "Screening Rejected");
      dateFormatter(currentinterviewsummaryData, cur, index)

      let index2 = currentinterviewSourceData.findIndex(item => item.title == "Screening Rejected");
      sourceFormatter(currentinterviewSourceData, cur, index2)

      ++currentrejectionCount.Screening
    }
    if (cur.state == "Screening" && cur.status == "Accepted") {
      let index = currentinterviewsummaryData.findIndex(item => item.title == "Screening Accepted");
      dateFormatter(currentinterviewsummaryData, cur, index)

      let index2 = currentinterviewSourceData.findIndex(item => item.title == "Screening Accepted");
      sourceFormatter(currentinterviewSourceData, cur, index2)
    }
    if (cur.state == "Screening" && cur.status == "Pending") {
      let index = currentinterviewsummaryData.findIndex(item => item.title == "Screening Pending");
      dateFormatter(currentinterviewsummaryData, cur, index)

      let index2 = currentinterviewSourceData.findIndex(item => item.title == "Screening Pending");
      sourceFormatter(currentinterviewSourceData, cur, index2)

      if (cur.interviewdate < today) {
        ++feedbackPending.Screening
      }

      ++pendingData.Screening
      ++interviewPending.Screening
    }

    if (cur.state == "Technical Interview") {
      let index = currentinterviewsummaryData.findIndex(item => item.title == "Technical Scheduled");
      dateFormatter(currentinterviewsummaryData, cur, index)

      let index2 = currentinterviewSourceData.findIndex(item => item.title == "Technical Scheduled");
      sourceFormatter(currentinterviewSourceData, cur, index2)

      if (cur.status == "Rejected") {
        let index = currentinterviewsummaryData.findIndex(item => item.title == "Technical Rejected");
        dateFormatter(currentinterviewsummaryData, cur, index)

        let index2 = currentinterviewSourceData.findIndex(item => item.title == "Technical Rejected");
        sourceFormatter(currentinterviewSourceData, cur, index2)

        if (cur.round == 1) {
          ++currentrejectionCount["Technical_1"]
        } else if (cur.round == 2) {
          ++currentrejectionCount["Technical_2"]
        } else if (cur.round == 3) {
          ++currentrejectionCount["Technical_3"]
        } else if (cur.round == 4) {
          ++currentrejectionCount["Technical_4"]
        } else {
          ++currentrejectionCount["Technical_Other"]
        }

      } else if (cur.status == "Accepted") {
        let index = currentinterviewsummaryData.findIndex(item => item.title == "Technical Accepted");
        dateFormatter(currentinterviewsummaryData, cur, index)

        let index2 = currentinterviewSourceData.findIndex(item => item.title == "Technical Accepted");
        sourceFormatter(currentinterviewSourceData, cur, index2)

      } else if (cur.status == "Pending") {
        let index = currentinterviewsummaryData.findIndex(item => item.title == "Technical Pending");
        dateFormatter(currentinterviewsummaryData, cur, index)

        let index2 = currentinterviewSourceData.findIndex(item => item.title == "Technical Pending");
        sourceFormatter(currentinterviewSourceData, cur, index2)

        if (cur.interviewdate < today) {
          ++feedbackPending.Technical
        }

        ++pendingData.Technical
      } else if (cur.status == "No Show") {
        ++interviews['NoShow']
      } else if (cur.status == "On Hold") {
        ++interviews['OnHold']
      }
    }
    if (cur.state == "HR Interview") {
      let index = currentinterviewsummaryData.findIndex(item => item.title == "HR Scheduled");
      dateFormatter(currentinterviewsummaryData, cur, index)

      let index2 = currentinterviewSourceData.findIndex(item => item.title == "HR Scheduled");
      sourceFormatter(currentinterviewSourceData, cur, index2)

      if (cur.status == "Rejected") {
        let index = currentinterviewsummaryData.findIndex(item => item.title == "HR Rejected");
        dateFormatter(currentinterviewsummaryData, cur, index)

        let index2 = currentinterviewSourceData.findIndex(item => item.title == "HR Rejected");
        sourceFormatter(currentinterviewSourceData, cur, index2)

        ++currentrejectionCount.HR


      } else if (cur.status == "Accepted" ||
        cur.status == "Offered" ||
        cur.status == "Offer accepted" ||
        cur.status == "Offer rejected"
      ) {
        let index = currentinterviewsummaryData.findIndex(item => item.title == "HR Accepted");
        dateFormatter(currentinterviewsummaryData, cur, index)

        let index2 = currentinterviewSourceData.findIndex(item => item.title == "HR Accepted");
        sourceFormatter(currentinterviewSourceData, cur, index2)
      } else if (cur.status == "Pending") {
        let index = currentinterviewsummaryData.findIndex(item => item.title == "HR Pending");
        dateFormatter(currentinterviewsummaryData, cur, index)

        let index2 = currentinterviewSourceData.findIndex(item => item.title == "HR Pending");
        sourceFormatter(currentinterviewSourceData, cur, index2)

        if (cur.interviewdate < today) {
          ++feedbackPending.HR
        }

        ++pendingData.HR
      } else if (cur.status == "No Show") {
        ++interviews['NoShow']
      } else if (cur.status == "On Hold") {
        ++interviews['OnHold']
      }
    }
    if (cur.state == "HR Interview" && cur.status == "Offered rejected") {
      ++offered.Rejected
    }
    if (cur.state == "HR Interview" && cur.status == "Accepted") {
      ++pendingData.Offered
    }
  }
}

async function getRMSDashboardData(req, res) {
  try {
    let reqData = req.body
    reqData.action = "rms_interview_requisiton_data_new";
    let results = await query('call usp_rms_dashboard(?)', [JSON.stringify(reqData)]);
    let [data, referralData, interviewTakenData] = results

    let currentInterviewData = data.filter(item => item.current_record && item.current_record == 1)

    const vendorData = data.filter(item => item.isvendor).map(({ resumesource, resumesourceid }) => ({ resumesource, resumesourceid }));
    let uniqueVendors = _.uniqBy(vendorData, 'resumesourceid');
    uniqueVendors = uniqueVendors.map(item => {
      item.joined = 0
      item.offered = 0
      item.offerToJoin = 0
      return item;
    }
    )

    const requisitionData = data.map(({ jobid, jobtitle, requisition_createdby, requisition_positions, requisition_designation }) => ({ jobid, jobtitle, requisition_createdby, requisition_positions, requisition_designation }))
    let uniqueRequisitions = _.uniqBy(requisitionData, 'jobid');
    uniqueRequisitions = uniqueRequisitions.map(item => {
      item.Joined = 0
      item.Offered = 0
      return item
    })


    const referrals = {
      Total: referralData.length || 0,
      Pending: 0,
      Offered: 0,
      Rejected: 0,
      Tagged: 0,
    }

    for (let i = 0; i < referralData.length; i++) {
      let cur = referralData[i];
      if (cur.state == "NA" || (cur.state == "Tagged" && cur.status == "Accepted")) {
        ++referrals.Pending
      }
      if (offeredCondition(cur)) {
        ++referrals.Offered
      }
      if (cur.status == "Rejected") {
        ++referrals.Rejected
      }
    }

    const interviewPending = {
      Screening: 0,
      ThisWeek: 0,
      NextWeek: 0,
      ThisMonth: 0
    }

    const unique = {
      Candidates: currentInterviewData.length,
      UniqueCandidates: [...new Set(currentInterviewData.map(item => item.candidateid))].length,
      Offered: 0,
      Joined: 0,
      OfferedExpSum: 0,
      JoinedExpSum: 0,
      InterviewCount: 0
    }

    const interviews = {
      Total: 0,
      "NoShow": 0,
      "OnHold": 0,
      Duration: 0
    }

    const offered = {
      Total: 0,
      Accepted: 0,
      Rejected: 0
    }

    const Joined = {
      Total: 0,
      Joined: 0,
      NotJoined: 0
    }

    const feedbackPending = {
      Screening: 0,
      Technical: 0,
      HR: 0
    }
    const pendingData = {
      Screening: 0,
      Technical: 0,
      HR: 0,
      Offered: 0
    }


    const rejectionCount = {
      Screening: 0,
      'Technical_1': 0,
      'Technical_2': 0,
      'Technical_3': 0,
      'Technical_4': 0,
      'Technical_Other': 0,
      HR: 0
    }


    const currentrejectionCount = {
      Screening: 0,
      'Technical_1': 0,
      'Technical_2': 0,
      'Technical_3': 0,
      'Technical_4': 0,
      'Technical_Other': 0,
      HR: 0
    }


    const dateDistribution = {
      next_7: 0,
      prev_7: 0,
      prev_15: 0,
      prev_30: 0,
      prev_45: 0,
      total: 0
    }

    const sourcesDistribution = {
      referral: 0,
      vendor: 0,
      others: 0,
      source_total: 0
    }

    const interviewsummaryData = [{
      title: "Interview",
      ...dateDistribution
    }, {
      title: "Offered",
      ...dateDistribution
    }, {
      title: "Joined",
      ...dateDistribution
    }, {
      title: "Tagged",
      ...dateDistribution
    },
    {
      title: "Pre Screening",
      ...dateDistribution
    },
    {
      title: "Screening Rejected",
      ...dateDistribution
    },
    {
      title: "Screening Accepted",
      ...dateDistribution
    },
    {
      title: "Screening Pending",
      ...dateDistribution
    },
    {
      title: "Technical Scheduled",
      ...dateDistribution
    },
    {
      title: "Technical Rejected",
      ...dateDistribution
    },
    {
      title: "Technical Pending",
      ...dateDistribution
    },
    {
      title: "Technical Accepted",
      ...dateDistribution
    },
    {
      title: "HR Scheduled",
      ...dateDistribution
    },
    {
      title: "HR Rejected",
      ...dateDistribution
    },
    {
      title: "HR Pending",
      ...dateDistribution
    },
    {
      title: "HR Accepted",
      ...dateDistribution
    }];

    const interviewSourceData = [{
      title: "Interview",
      ...sourcesDistribution
    }, {
      title: "Offered",
      ...sourcesDistribution
    }, {
      title: "Joined",
      ...sourcesDistribution
    },
    {
      title: "Tagged",
      ...sourcesDistribution
    },
    {
      title: "Pre Screening",
      ...sourcesDistribution
    },
    {
      title: "Screening Rejected",
      ...sourcesDistribution
    },
    {
      title: "Screening Accepted",
      ...sourcesDistribution
    },
    {
      title: "Screening Pending",
      ...sourcesDistribution
    },
    {
      title: "Technical Scheduled",
      ...sourcesDistribution
    },
    {
      title: "Technical Rejected",
      ...sourcesDistribution
    },
    {
      title: "Technical Pending",
      ...sourcesDistribution
    },
    {
      title: "Technical Accepted",
      ...sourcesDistribution
    },
    {
      title: "HR Scheduled",
      ...sourcesDistribution
    },
    {
      title: "HR Rejected",
      ...sourcesDistribution
    },
    {
      title: "HR Pending",
      ...sourcesDistribution
    },
    {
      title: "HR Accepted",
      ...sourcesDistribution
    }
    ];

    const currentinterviewsummaryData = JSON.parse(JSON.stringify(interviewsummaryData));
    const currentinterviewSourceData = JSON.parse(JSON.stringify(interviewSourceData));

    overallData(data, interviewsummaryData, interviewSourceData, rejectionCount, interviews)
    currentData(currentInterviewData, referralData, referrals, currentinterviewsummaryData,
      currentinterviewSourceData, interviewPending, unique, Joined, offered,
      uniqueVendors, uniqueRequisitions, currentrejectionCount, feedbackPending,
      interviews, pendingData)

    offered.Accepted = offered.Total - offered.Rejected;
    unique["OfferedExp"] = ((unique.OfferedExpSum / unique.Offered) / 12).toFixed(2);
    unique["JoinedExp"] = ((unique.JoinedExpSum / unique.Joined) / 12).toFixed(2);

    interviews.Duration = `${Math.floor(interviews.Duration / 60)}h:${interviews.Duration % 60}m`

    const vendorDistribution = uniqueVendors.map(item => {
      item.offerToJoin = (item.joined / (item.offered || 1) * 100).toFixed(2)
      return item;
    })
    const experienceData = {
      offered: isNaN(unique["OfferedExp"]) ? 0 : unique["OfferedExp"],
      joined: isNaN(unique["JoinedExp"]) ? 0 : unique["JoinedExp"]
    }
    const ratios = {
      candidateToOffer: ((unique.Offered / unique.Candidates) * 100).toFixed(3),
      candidateToJoin: ((unique.Joined / unique.Candidates) * 100).toFixed(3),
      interviewToOffer: ((unique.Offered / interviews.Total) * 100).toFixed(3),
      interviewtoJoin: ((unique.Joined / interviews.Total) * 100).toFixed(3),
      offerToJoin: ((unique.Joined / (unique.Offered || 1)) * 100).toFixed(3)
    }
    const interviewOfferedJoined = {
      interview: unique.InterviewCount,
      joined: unique.Joined,
      offered: unique.Offered
    }
    pendingData["pendingTechnical"] = pendingData.Technical
    pendingData["pendingScreening"] = pendingData.Screening
    pendingData["pendingHR"] = pendingData.HR
    pendingData["pendingOffered"] = pendingData.Offered

    const stages = ["Tagged", "Pre Screening", "Screening Rejected", "Screening Accepted", "Technical Scheduled", "Technical Rejected", "Technical Accepted", "HR Scheduled", "HR Rejected", "HR Accepted"]
    const candidateDateDistributionData = currentinterviewsummaryData.filter(item => ['Interview', 'Joined', 'Offered'].includes(item.title));
    const candidateSourceDistributionData = currentinterviewSourceData.filter(item => ['Interview', 'Joined', 'Offered'].includes(item.title));
    const candidateDateDistributionData_All = interviewsummaryData.filter(item => ['Interview', 'Joined', 'Offered'].includes(item.title));
    const candidateSourceDistributionData_All = interviewSourceData.filter(item => ['Interview', 'Joined', 'Offered'].includes(item.title))
    const stageDateDistributionData = interviewsummaryData.filter(item => stages.includes(item.title))
    const stageSourceDistributionData = interviewSourceData.filter(item => stages.includes(item.title))

    let topN = 10;
    const topNInterviewer = getTopInterviewerData(interviewTakenData, topN);

    return res.json({
      state: 1, message: "Success", data: {
        candidateDateDistributionData,
        candidateSourceDistributionData,
        stageDateDistributionData,
        stageSourceDistributionData,
        ratios,
        pendingData,
        experienceData,
        vendorDistribution: vendorDistribution,
        topNInterviewer: topNInterviewer ? topNInterviewer : [],
        interviewOfferedJoined,
        //New Keys
        candidateDateDistributionData_All,
        candidateSourceDistributionData_All,
        currentrejectionCount,
        rejectionCount,
        feedbackPending,
        Joined,
        offered,
        interviews,
        unique,
        referrals,
        interviewPending
      }
    })



  } catch (err) {
    console.log(err);
    return res.json({ msg: 'Something went wrong', data: err, state: -1 })
  }
}


// async function getRMSDashboardData(req, res) {
//   try {
//     let reqData = req.body;
//     reqData.action = "rms_interview_requisiton_data";
//     /**
//    * Calling Database data = All the Interview Data based of FY
//    * requisitonData is returned when requistion is selected from frontend
//    */
//     let data;
//     let rangeData;
//     let results = await query('call usp_rms_dashboard(?)', [JSON.stringify(reqData)]);
//     [data, rangeData] = results

//     /**
//      * represents the stage wise [Tagged,Screening,Technical etc] data
//      *  distribution based on dates day_7,day_15,day_30,day_45
//      */
//     let stageDateDistributionData = rangeData.reduce((acc, cur) => {
//       interviewStageConditions(acc, cur, interviewSummaryDataFormatter)
//       return acc;
//     }, JSON.parse(JSON.stringify(interviewsummaryData)))

//     /**
//      * represents stage wise resume source data [refferal,vendor etc]
//      */
//     let stageSourceDistributionData = data.reduce((acc, cur) => {
//       interviewStageConditions(acc, cur, interviewSourceDataFormatter)
//       return acc;
//     }, JSON.parse(JSON.stringify(interviewSourceData)))

//     /**
//      * represents candidate date distribution
//      */
//     const candidateDateDistributionData = stageDateDistributionData.filter(item => ['Interview', 'Joined', 'Offered'].includes(item.title));

//     /**
//      * represents candidate source distribution
//      */
//     const candidateSourceDistributionData = stageSourceDistributionData.filter(item => ['Interview', 'Joined', 'Offered'].includes(item.title));

//     /**
//      * this represents Overall ratios, offers, experience,pending data, rejection data
//      */

//     let overallCardDataObj = data.reduce((cardData, c) => {
//       return cardDataFormatter(cardData, c, 0);
//     }, JSON.parse(JSON.stringify(cardDataObj)))

//     overallCardDataObj[0].uniqueCandidates = [...new Set(data
//       .filter(item => item.state == "HR Interview" || item.state == "Technical Interview")
//       .map(item => item.candidateid))].length;

//     const ratios = {
//       candidateToOffer: ((overallCardDataObj[0].offered / overallCardDataObj[0].uniqueCandidates) * 100).toFixed(3),
//       candidateToJoin: ((overallCardDataObj[0].joined / overallCardDataObj[0].uniqueCandidates) * 100).toFixed(3),
//       interviewToOffer: ((overallCardDataObj[0].offered / overallCardDataObj[0].interviewCount) * 100).toFixed(3),
//       interviewtoJoin: ((overallCardDataObj[0].joined / overallCardDataObj[0].interviewCount) * 100).toFixed(3),
//       offerToJoin: ((overallCardDataObj[0].joined / (overallCardDataObj[0].offered || 1)) * 100).toFixed(3)
//     }

//     const interviewOfferedJoined = {
//       interview: overallCardDataObj[0].interviewCount,
//       joined: overallCardDataObj[0].joined,
//       offered: overallCardDataObj[0].offered
//     }

//     const pendingData = {
//       pendingTechnical: overallCardDataObj[0].pendingTechnical,
//       pendingScreening: overallCardDataObj[0].pendingScreening,
//       pendingHR: overallCardDataObj[0].pendingHR,
//       pendingOffered: overallCardDataObj[0].pendingOffered
//     }

//     const rejectedData = {
//       'Screening': ((overallCardDataObj[0].rejectedScreening / (overallCardDataObj[0].screeningCount || 1)) * 100).toFixed(2),
//       'Technical R-1': ((overallCardDataObj[0].rejectedTechnicalR1 / (overallCardDataObj[0].TechnicalR1 || 1)) * 100).toFixed(2),
//       'Technical R-2': ((overallCardDataObj[0].rejectedrejectedTechnicalR2 / (overallCardDataObj[0].TechnicalR2 || 1)) * 100).toFixed(2),
//       'Technical R-3': ((overallCardDataObj[0].rejectedTechnicalR3 / (overallCardDataObj[0].TechnicalR3 || 1)) * 100).toFixed(2),
//       'Technical Other': ((overallCardDataObj[0].rejectedTechnicalOther / (overallCardDataObj[0].TechnicalOther || 1)) * 100).toFixed(2),
//       'HR': ((overallCardDataObj[0].rejectedHR / (overallCardDataObj[0].hrCount || 1)) * 100).toFixed(2),

//     }

//     const experienceData = {
//       offered: ((overallCardDataObj[0].offeredExpSum / (overallCardDataObj[0].offered || 1)) / 12).toFixed(2),
//       joined: ((overallCardDataObj[0].joinedExpSum / (overallCardDataObj[0].joined || 1)) / 12).toFixed(2),
//     }

//     /**
//      * Vendor wise ratio distribution
//      */
//     const vendorData = data.filter(item => item.isvendor).map(({ resumesource, resumesourceid }) => ({ resumesource, resumesourceid }));
//     let uniqueVendors = _.uniqBy(vendorData, 'resumesourceid');
//     uniqueVendors = uniqueVendors.map(item => ({ ...item, ...cardDataObj[0] }))

//     let vendorDistribution = data.reduce((cardData, c) => {
//       let index = uniqueVendors.findIndex(item => item.resumesourceid == c.resumesourceid)
//       if (index > -1) {
//         return cardDataFormatter(cardData, c, index);
//       } else {
//         return cardData
//       }
//     }, uniqueVendors)


//     vendorDistribution = vendorDistribution.map(vendor => {
//       vendor.uniqueCandidates = [...new Set(data
//         .filter(item => (item.state == "HR Interview" || item.state == "Technical Interview") && item.resumesourceid == vendor.resumesourceid)
//         .map(item => item.candidateid))].length;

//       vendor.candidateToOffer = (vendor.offered / (vendor.uniqueCandidates || 1)).toFixed(2) * 100,
//         vendor.candidateToJoin = (vendor.joined / (vendor.uniqueCandidates || 1)).toFixed(2) * 100,
//         vendor.interviewToOffer = (vendor.offered / (vendor.interviewCount || 1)).toFixed(2) * 100,
//         vendor.interviewtoJoin = (vendor.joined / (vendor.interviewCount || 1)).toFixed(2) * 100,
//         vendor.offerToJoin = (vendor.joined / (vendor.offered || 1)).toFixed(2) * 100
//       return vendor;
//     }
//     )

//     /**
//      * Top 5 Interviewers Data including total , accepted , rejected Interviews
//      */

//     let topN = 10;
//     const topNInterviewer = getTopInterviewerData(data, topN);

//     return res.json({
//       state: 1, message: "Success", data: {
//         candidateDateDistributionData,
//         candidateSourceDistributionData,
//         stageDateDistributionData,
//         stageSourceDistributionData,
//         ratios,
//         pendingData,
//         rejectedData,
//         experienceData,
//         vendorDistribution: vendorDistribution,
//         topNInterviewer: topNInterviewer ? topNInterviewer : [],
//         interviewOfferedJoined,
//         overallCardDataObj: overallCardDataObj[0]
//       }
//     })


//   } catch (err) {
//     //console.log(err);
//     return res.json({ msg: 'Something went wrong', data: err, state: -1 })
//   }

// }