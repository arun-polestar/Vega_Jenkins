const moment = require('moment');
const _ = require('lodash');

module.exports = {
  interviewSourceDataFormatter,
  interviewStageConditions,
  interviewSummaryDataFormatter,
  cardDataFormatter,
  getTopInterviewerData
}

const today = moment().format("YYYY-MM-DD");
const next_7 = moment().add(7, "days").format("YYYY-MM-DD");
const prev_7 = moment().subtract(7, "days").format("YYYY-MM-DD");
const prev_15 = moment().subtract(15, "days").format("YYYY-MM-DD");
const prev_30 = moment().subtract(30, "days").format("YYYY-MM-DD");
const prev_45 = moment().subtract(45, "days").format("YYYY-MM-DD");

function offeredCondition(item) {
  if ((item.state == "HR Interview" && (item.status == "Offered" || item.status == "Accepted"))
    || (item.state == "Join" && (item.status == "Joined" || item.status == "Not Joined" || item.status == "Offer accepted" || item.status == "Offer rejected"))) {
    return true;
  }
  else false;
}

function interviewSourceDataFormatter(acc, cur, index) {
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

function interviewStageConditions(acc, cur, func) {
  if (cur.state == "HR Interview" || cur.state == "Technical Interview") {
    let index = acc.findIndex(item => item.title == "Interview")
    func(acc, cur, index)
  }
  if (cur.status == "Joined") {
    let index = acc.findIndex(item => item.title == "Joined");
    func(acc, cur, index)
  }
  if (offeredCondition(cur)) {
    let index = acc.findIndex(item => item.title == "Offered");
    func(acc, cur, index)
  }
  if (cur.state == "Tagged") {
    let index = acc.findIndex(item => item.title == "Tagged");
    func(acc, cur, index)
  }
  if (cur.state == "Pre Screening") {
    let index = acc.findIndex(item => item.title == "Pre Screening");
    func(acc, cur, index)
  }
  if (cur.state == "Screening" && cur.status == "Rejected") {
    let index = acc.findIndex(item => item.title == "Screening Rejected");
    func(acc, cur, index)
  }
  if (cur.state == "Screening" && cur.status == "Accepted") {
    let index = acc.findIndex(item => item.title == "Screening Accepted");
    func(acc, cur, index)
  }
  if (cur.state == "Technical Interview") {
    let index = acc.findIndex(item => item.title == "Technical Scheduled");
    func(acc, cur, index)
    if (cur.status == "Rejected") {
      let index = acc.findIndex(item => item.title == "Technical Rejected");
      func(acc, cur, index)
    } else if (cur.status == "Accepted") {
      let index = acc.findIndex(item => item.title == "Technical Accepted");
      func(acc, cur, index)
    }
  }
  if (cur.state == "HR Interview") {
    let index = acc.findIndex(item => item.title == "HR Scheduled");
    func(acc, cur, index)
    if (cur.status == "Rejected") {
      let index = acc.findIndex(item => item.title == "HR Rejected");
      func(acc, cur, index)
    } else if (cur.status == "Accepted") {
      let index = acc.findIndex(item => item.title == "HR Accepted");
      func(acc, cur, index)
    }
  }
}

function interviewSummaryDataFormatter(acc, cur, index) {
  if (cur.interviewdate <= next_7 && cur.interviewdate > today) {
    acc[index]["next_7"] = acc[index]["next_7"] ? acc[index]["next_7"] + 1 : 1
    acc[index]["total"] = acc[index]["total"] ? acc[index]["total"] + 1 : 1
  }
  else if (cur.interviewdate <= today && cur.interviewdate >= prev_7) {
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

  }
  return acc;
}
function technicalInterviewData(cardData, c, index) {
  cardData[index].technicalCount += 1;
  if (c.round == 1) {
    cardData[index].TechnicalR1 += 1;
    if (c.status == "Pending") {
      cardData[index].pendingTechnical += 1;
    } else if (c.status == "Rejected") {
      cardData[index].rejectedTechnical += 1;
      cardData[index].rejectedTechnicalR1 += 1;
    }
  } else if (c.round == 2) {
    cardData[index].TechnicalR2 += 1;
    if (c.status == "Pending") {
      cardData[index].pendingTechnical += 1;
    } else if (c.status == "Rejected") {
      cardData[index].rejectedTechnical += 1;
      cardData[index].rejectedTechnicalR2 += 1;
    }

  } else if (c.round == 3) {
    cardData[index].TechnicalR3 += 1;
    if (c.status == "Pending") {
      cardData[index].pendingTechnical += 1;
    } else if (c.status == "Rejected") {
      cardData[index].rejectedTechnical += 1;
      cardData[index].rejectedTechnicalR3 += 1;
    }
  } else {
    cardData[index].TechnicalOther += 1;
    if (c.status == "Pending") {
      cardData[index].pendingTechnical += 1;
    } else if (c.status == "Rejected") {
      cardData[index].rejectedTechnical += 1;
      cardData[index].rejectedTechnicalOther += 1;
    }
  }
}

function hrInterviewData(cardData, c, index) {
  cardData[index].hrCount += 1;
  if (c.status == "Rejected") {
    cardData[index].rejectedHR += 1;
  } else if (c.status == "Pending") {
    cardData[index].pendingHR += 1;
  } else if (c.status == "Accepted") {
    cardData[index].pendingOffered += 1;
  }
}

function screeningInterviewData(cardData, c, index) {
  cardData[index].screeningCount += 1;
  if (c.status == "Pending") {
    cardData[index].pendingScreening += 1;
  } else if (c.status == "Rejected") {
    cardData[index].rejectedScreening += 1;
  }
}

function joinedInterviewData(cardData, c, index) {
  if (c.status == "Joined") {
    cardData[index].joined += 1;
    cardData[index].joinedExpSum += c.experience_months
  } else if (c.status == "Not Joined") {
    cardData[index].notJoined += 1;
  }
}
function cardDataFormatter(cardData, c, index) {
  if (c.state == "Technical Interview" || c.state == "HR Interview") {
    cardData[index].interviewCount += 1;
    if (c.state == "Technical Interview") {
      technicalInterviewData(cardData, c, index);
    } else if (c.state == "HR Interview") {
      hrInterviewData(cardData, c, index);
    }
  } else if (c.state == "Screening") {
    screeningInterviewData(cardData, c, index);
  } else if (c.state == "Join") {
    joinedInterviewData(cardData, c, index);
  }
  if (offeredCondition(c)) {
    cardData[index].offered += 1;
    cardData[index].offeredExpSum += c.experience_months
  }
  return cardData;
}
/*function getTopInterviewerData(data, topN) {
  let groupedData = _
    .chain(data)
    .filter(filter_by => ((filter_by.state == 'Technical Interview' || filter_by.state == "HR Interview")
      && (filter_by.status == 'Accepted' || filter_by.status == 'Rejected')))
    .groupBy(interview => interview.status + '#' + interview.interviewer)
    .map((value, key) => ({
      interviewStatus: key.split('#')[0],
      interviewer: key.split('#')[1], count: value.length,
      profilepic: value[0] && value[0].profilepic,
      department: value[0] && value[0].department
    }))
    .reduce((acc, curr) => {
      if (curr.interviewStatus == 'Rejected') {
        acc.rejectedInterviewer.push(JSON.parse(JSON.stringify(curr)))
      } else if (curr.interviewStatus == 'Accepted') {
        acc.acceptedInterviewer.push(JSON.parse(JSON.stringify(curr)))
      }
      let index = acc.totalInterviewer.findIndex(item => {
        return item.interviewer == curr.interviewer
      })
      if (index > -1) {
        acc.totalInterviewer[index].count = acc.totalInterviewer[index].count + curr.count
      }
      else {
        acc.totalInterviewer.push(JSON.parse(JSON.stringify(curr)));
      }
      return acc;
    },
      { rejectedInterviewer: [], acceptedInterviewer: [], totalInterviewer: [] }
    )
    .value();


  let rejectedInterviewer = groupedData.rejectedInterviewer.sort((a, b) => b.count - a.count).slice(0, topN);
  let acceptedInterviewer = groupedData.acceptedInterviewer.sort((a, b) => b.count - a.count).slice(0, topN);
  let totalInterviewer = groupedData.totalInterviewer.sort((a, b) => b.count - a.count).slice(0, topN);

  return {
    rejectedInterviewer,
    acceptedInterviewer,
    totalInterviewer
  }
}
*/
function getTopInterviewerData(interviewTakenData, topN) {
  let rejectedInterviewer = JSON.parse(JSON.stringify(interviewTakenData)).sort((a, b) => b["interview_rejected"] - a["interview_rejected"])
    .map(item => {
      item.count = item.interview_rejected
      return item
    }
    )
    .slice(0, topN)

  let acceptedInterviewer = JSON.parse(JSON.stringify(interviewTakenData)).sort((a, b) => b["interview_accepted"] - a["interview_accepted"])
    .map(item => {
      item.count = item.interview_accepted
      return item
    }
    )
    .slice(0, topN)


  let totalInterviewer = JSON.parse(JSON.stringify(interviewTakenData)).sort((a, b) => b["interview_taken"] - a["interview_taken"])
    .map(item => {
      item.count = item.interview_taken
      return item
    }
    )
    .slice(0, topN)

  return {
    acceptedInterviewer,
    rejectedInterviewer,
    totalInterviewer
  }
}