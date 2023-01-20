const query = require("../../../routes/common/Model").mysqlPromiseModelService;
// const notificationCtrl = require('../../notification/Controller');
// const mailservice = require('../../../services/mailerService');
const _ = require("lodash");
const moment = require("moment");
const { NUMBER } = require("sequelize");
// const { validateReqBody } = require('../../common/utils');

const ACTION = {
  VIEWENGAGEMENTFORMRESPONSE: "view_engagement_form_response",
  GETENGAGEMENTFORMS: "get_engagement_forms",
  VIEWENGAGEMENTSUBMITTEDFORMSDETAILS:
    "view_engagement_submitted_forms_details",
  GETDASHBOARDDETAILS: "get_dashboard_details",
  GETDASHBOARDCHARTDETAILS: "get_dashboard_chart_details",
};

const getEmployeesList = async (req, res) => {
  try {
    const obj = req.body;
    let obj1 = {};
    const result = await query("call usp_engagement_dashboard(?,?)", [
      JSON.stringify(obj),
      JSON.stringify(obj1),
    ]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: "Success", state: 1, data: result[0] });
  } catch (error) {
    return res.json({ err: error, state: -1, data: null });
  }
};

const getFormsListByUserId = async (req, res) => {
  try {
    let obj = req.body;
    let obj1 = {};
    obj.action = obj.action ? obj.action : ACTION.GETENGAGEMENTFORMS;

    const result = await query("call usp_engagement_dashboard(?,?)", [
      JSON.stringify(obj),
      JSON.stringify(obj1),
    ]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    let items = result && result[0];
    items.map(async (data) => {
      const date = moment
        .parseZone(data.date_of_intraction)
        .utc(true)
        .format("YYYY-MM-DD");
      data.date_of_intraction = date.toString();
      return data;
    });

    return res.json({ message: "Success", state: 1, data: items });
  } catch (error) {
    //console.log(error);
    return res.json({ err: error, state: -1, data: null });
  }
};

const getDashboardDetails = async (req, res) => {
  try {
    let obj = req.body;
    let obj1 = {};
    obj.action = obj.action ? obj.action : ACTION.GETDASHBOARDDETAILS;

    const result = await query("call usp_engagement_dashboard(?,?)", [
      JSON.stringify(obj),
      JSON.stringify(obj1),
    ]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }
    let items = result && result[0];

    return res.json({ message: "Success", state: 1, data: items });
  } catch (error) {
    //console.log(error);
    return res.json({ err: error, state: -1, data: null });
  }
};

const getDashboardChartsDetails = async (req, res) => {
  try {
    let obj = req.body;
    let obj1 = {};
    obj.action = obj.action ? obj.action : ACTION.GETDASHBOARDCHARTDETAILS;
    let average_mood;

    let top_charts = [];
    // let happyIndex = {
    //   sad: 0,
    //   happy: 0,
    //   satisfied: 0,
    //   neutral: 0,
    //   disappointed: 0,
    // };
    let employeeCounter = {};

    let chartData = {}

    let responsePercentage = {};
    let responseWeightageSum = 0;

    const result = await query("call usp_engagement_dashboard(?,?)", [JSON.stringify(obj), JSON.stringify(obj1),
    ]);

    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }
    let total_submision = result && result[0].length;
    let dataForCarts = result && result[0];
    // console.log("dataForCharts", dataForCarts);

    let monthDistribution = result && result[1];
    let employee_lineChartData = result && result[2];
    let option_details = result && result[3];
    //console.log("details", option_details);

    let optionResponseCount = {};
    //let optionResponseCount = { '1': 1, '2': 3, '3': 2 }

    for (let i = 0; i < dataForCarts.length; i++) {
      let element = dataForCarts[i];

      if (optionResponseCount[element.response]) {
        optionResponseCount[element.response] = optionResponseCount[element.response] + 1;
      } else {
        optionResponseCount[element.response] = 1;
      }



      if (element.response) {

        // sentiment analysis
        if (element.is_impact_analysis) {
          let findWeightage = option_details.find(item => item.option_id == element.response)
          let weightage = findWeightage && findWeightage.option_weightage || 0;
          responseWeightageSum = responseWeightageSum + +weightage;
          if (responsePercentage[element.option_value]) {
            responsePercentage[element.option_value] = responsePercentage[element.option_value] + 1;
          } else {
            responsePercentage[element.option_value] = 1;
          }
        }


        ////////////////////for word cloud//////////

        if (employeeCounter[element.raisedBy]) {
          employeeCounter[element.raisedBy] += 1;
        } else {
          employeeCounter[element.raisedBy] = 1;
        }

        ///////////////////////////top 5 happiest n saddest employee

        let chart_index = top_charts.findIndex(
          (items) => items.raised_for == element.raised_for);
        if (chart_index > -1) {
          top_charts[chart_index].count += 1;
          top_charts[chart_index].response_sum += +element.response;
          top_charts[chart_index].average = ((top_charts[chart_index].response_sum / top_charts[chart_index].count) / 2).toFixed(2);
        } else {
          let obj = {
            raised_for: element.raised_for,
            raisedBy: element.raisedBy,
            raisedForName: element.raisedForName,
            response_sum: +element.response,
            count: 1,
            average: ((+element.response) / 2).toFixed(2),
          };
          top_charts.push(obj);
        }


        let month_index = monthDistribution.findIndex(
          (items) => items.month_name == element.month_name
        );

        monthDistribution[month_index].submissionCount = monthDistribution[month_index].submissionCount ? monthDistribution[month_index].submissionCount + 1 : 1;

      }
    }

    // for average mood

    let individualOptionAvg = {};

    option_details.map(item => {
      let current_option = item && item.option_id;
      let curr_option_weightage = item && item.option_weightage;
      let curr_option_count = optionResponseCount && optionResponseCount[`${current_option}`];

      individualOptionAvg[current_option] = Number(curr_option_count * curr_option_weightage) || 0;

    })

    // let values = Object.values(individualOptionAvg);

    // let valuesSum = values.reduce((accumulator, value) => {
    //   return accumulator + value;
    // }, 0);
    average_mood = Number((responseWeightageSum / (total_submision || 1)).toFixed(2));
    chartData["average_mood"] = average_mood;

    let moodValueObj = option_details.find(item => item.option_weightage == Math.round(average_mood));
    let moodValue = moodValueObj && moodValueObj.option_value || 'N/A';


    for (let key in responsePercentage) {
      responsePercentage[key] = Number(((responsePercentage[key] * 100) / total_submision).toFixed(2));
    }


    monthDistribution.forEach(element => {
      let employee_index = employee_lineChartData.findIndex(
        (items) => items.month == element.month_name)
      element.employeeCount = employee_lineChartData[employee_index].headcount ? employee_lineChartData[employee_index].headcount : 0;

    });

    // let moodAnalysis = getMoodPercentage(happyIndex, total_submision);
    let top_5employeeData = top_charts.sort((a, b) => b.average - a.average).slice(0, 5);

    let worst_5employeeData = top_charts.sort((a, b) => a.average - b.average).slice(0, 5);

    chartData["moodAnalysis"] = responsePercentage
    chartData["monthDistribution"] = monthDistribution
    chartData["top_5employeeData"] = top_5employeeData
    chartData["worst_5employeeData"] = worst_5employeeData
    chartData["employeeCounter"] = employeeCounter
    chartData["average_mood"] = chartData["average_mood"] ? chartData["average_mood"] : '0'
    chartData["moodValue"] = moodValue
    // chartData["employee_lineChartData"] = employee_lineChartData
    // //console.log("chartData 198",chartData);

    return res.json({
      message: "Success",
      state: 1,
      question_title: dataForCarts && dataForCarts[0] && dataForCarts[0].question_title,
      total_submision: total_submision,
      data: chartData,
    });
  } catch (error) {
    console.log(error);
    return res.json({ err: error, state: -1, data: null });
  }
};

// function getMoodPercentage(happyIndex, total_submision) {
//   for (const key in happyIndex) {
//     if (Object.hasOwnProperty.call(happyIndex, key)) {
//       const element = happyIndex[key] || 0;
//       happyIndex[key] = (((element) / (total_submision || 1)) * 100).toFixed(2)
//       // //console.log(" happyIndex[key]", happyIndex[key]);
//     }
//   }
//   return happyIndex;
// }

const getPeopleManagerMenteesDetail = async (req, res) => {
  try {
    const obj = req.body;
    obj.action = "people_manager_and_mentees_detail";
    let obj1 = {};
    const result = await query("call usp_engagement_dashboard(?,?)", [
      JSON.stringify(obj),
      JSON.stringify(obj1),
    ]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: "Success", state: 1, data: result });
  } catch (error) {
    return res.json({ err: error, state: -1, data: null });
  }
};


const getEngagementPivotData = async (req, res) => {
  try {
    let obj = req.body;
    obj.action = "pivot_data";
    let obj1 = {};
    let data = await query("call usp_engagement_dashboard(?,?)", [
      JSON.stringify(obj),
      JSON.stringify(obj1),
    ]);
    if (!data) {
      return res.json({ message: data.message, state: -1, data: null });
    }
    data = data && data[0];

    let form_response = []

    for (let i = 0; i < data.length; i++) {
      let item = data[i];
      //item.date_of_interaction = moment(item.date_of_interaction).utc().format('YYYY-MM-DD, h:mm:ss');
      let index = form_response.findIndex(response => {
        return response["Date Of Interaction"] == item.date_of_interaction
          && response.raised_by == item.raised_by
          && response.raised_for == item.raised_for
          && response.form_id == item.form_id
      })
      item.options = item.response_parse_required == 1 ? JSON.parse(item.options) : item.options;
      item.response_value = item.response_parse_required == 1 ? _.chain(item.options).filter(option => item.response.includes(option.Sno)).map(option => option.options).value().toString() : item.response;
      item.other_response = item.other_response == 'NULL' || item.other_response == null ? '' : item.other_response;

      if (index > -1) {

        form_response[index][item.title] = `${item.response_value}`
        if (item.is_descriptive) {
          form_response[index][`${item.title} ( Description )`] = `${item.other_response}`
        }
      } else {
        let obj = {
          "Date Of Interaction": item.date_of_interaction,
          "Raised by Name": item.raised_by_name,
          "Raised For Name": item.raised_for_name,
          raised_by: item.raised_by,
          form_id: item.form_id,
          "Raised By Email": item.raised_by_email,
          "Raised For Email": item.raised_for_email,
          "Form Name": item.form_name,
          raised_for: item.raised_for
        }
        obj[item.title] = `${item.response_value}`
        if (item.is_descriptive) {
          //form_response[index][`${item.title + ' ( Description ) '}`] = `${item.other_response}`
          obj[`${item.title + ' ( Description ) '}`] = `${item.other_response}`
        }
        form_response.push(obj);
      }
    }
    let formPivot = form_response.map(({ form_id, raised_by, raised_for, ...rest }) => ({ ...rest }));
    let allKeys = (formPivot && formPivot[0] && [... new Set(formPivot && formPivot[0] && Object.keys(formPivot[0]))]) || []

    return res.json({ message: "Success", state: 1, data: formPivot, allKeys });
  } catch (error) {
    console.log("errrrrr", error);
    return res.json({ err: error, state: -1, data: null });
  }
};


module.exports = {
  getEmployeesList,
  getFormsListByUserId,
  getDashboardChartsDetails,
  getDashboardDetails,
  getPeopleManagerMenteesDetail,
  getEngagementPivotData
};
