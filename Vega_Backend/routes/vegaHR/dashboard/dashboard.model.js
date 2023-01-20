const dateDistribution = {
  next_7: 0,
  prev_7: 0,
  prev_15: 0,
  prev_30: 0,
  prev_45: 0,
  total: 0
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
  title: "Technical Scheduled",
  ...dateDistribution
},
{
  title: "Technical Rejected",
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
  title: "HR Accepted",
  ...dateDistribution
}];

const sourcesDistribution = {
  referral: 0,
  vendor: 0,
  others: 0,
  source_total: 0
}
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
  title: "Technical Scheduled",
  ...sourcesDistribution
},
{
  title: "Technical Rejected",
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
  title: "HR Accepted",
  ...sourcesDistribution
}];
let cardDataObj = [{
  interviewCount: 0,
  uniqueCandidates: 0,
  offered: 0,
  pendingOffered: 0,
  offeredExpSum: 0,
  joined: 0,
  notJoined: 0,
  joinedExpSum: 0,
  pendingScreening: 0,
  rejectedScreening: 0,
  screeningCount: 0,
  pendingTechnical: 0,
  rejectedTechnical: 0,
  rejectedTechnicalR1: 0,
  TechnicalR1: 0,
  rejectedTechnicalR2: 0,
  TechnicalR2: 0,
  rejectedTechnicalR3: 0,
  TechnicalR3: 0,
  rejectedTechnicalOther: 0,
  TechnicalOther: 0,
  technicalCount: 0,
  pendingHR: 0,
  rejectedHR: 0,
  hrCount: 0
}]


module.exports = {
  cardDataObj,
  interviewSourceData,
  interviewsummaryData,

}