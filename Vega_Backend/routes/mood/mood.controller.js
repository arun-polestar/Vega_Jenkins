'use strict';
const query = require('../common/Model').mysqlPromiseModelService;
let _ = require('lodash');
const feedbackController = require("../feedback/Controller");
const moment = require("moment");

const { saveBellNotification } = require('../notification/Controller');
const { sendBellIconNotification } = require('../notification/socket.io');

const mailservice = require("../../services/mailerService");
const notificationCtrl = require("../notification/Controller");

module.exports = {
  saveMoodTypeMaster,
  viewMoodTypeMaster,
  editMoodTypeMaster,
  deactivateMoodTypeMaster,
  moodDashboardCounts,
  getPastTenDaysUserMoodCount,
  getPastTenDaysUserMoodDetails,
  moodSubmissionSummary,
  getGraphMoodCounts,
  getOverallAverageMoodScore,
  getPieChartData,
  getUserFeedbackDetails,
  saveMoodTickets,
  viewMoodTickets,
  roleArrayForMoodChatBot,
  getMoodBotQuestions,
  saveBotResponse,
  fetchPreviousBotChats,
  moodTicketActions,
  moodticketHistory
}

/*  ----------------------- mood tickets api -------------------------- */

  async function roleArrayForMoodChatBot(req, res) {
  try {
    var obj = req.body;
    obj.action = "role_dropdown";
    var result = await query('call usp_mood_ticket_operation(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.err, state: -1, data: null });
    }
    
    return res.json({ message: 'Success', state: 1, data: result && result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

  async function saveMoodTickets(req, res) {
  try {
    var obj = req.body;
    obj.action = "save_mood_ticket";
    
    var result = await query('call usp_mood_ticket_operation(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.err, state: -1, data: null });
    }
    console.log("result", result);

    let bellNotificationData = {
        "assignedtouserid": result && result[0] && result[0][0] && result[0][0].assignedtouserid,
        "assignedfromuserid": result && result[0] && result[0][0] && result[0][0].assignedfromuserid,
        "notificationdesc": `Mood Ticket raised by ${result && result[0] && result[0][0].ticket_raised_by_name}`,
        "attribute1": "",
        "attribute2": "",
        "attribute3": "",
        "attribute4": "",
        "isvendor": "",
        "web_route": '',
        "app_route": "app/route",
        "fortnight_date": "",
        "module_name": "Mood",
        "createddate": moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        "datevalue": new Date().valueOf()
      }
    sendBellIconNotification(bellNotificationData);
    saveBellNotification(bellNotificationData);

      
    var emailObj = {
                email: result[0][0].assignedtouser_email || "",
                //email: "avinash.kumar@polestarllp.com",
                mailType: "moodTicketRaise",
                moduleid: req.body.moduleid ? req.body.moduleid : "Mood",
                userid: req.body.createdby,
      bodyVariables: {
                  trxticketraisedbyname: result[0][0].ticket_raised_by_name,
                  trxreactiontype: result[0][0].reactiontype,
                  trxqueryraised: result[0][0].queryraised
                },
                subjectVariables: {
                  ticketraisedby: result[0][0].ticket_raised_by_name || "",
                  subject: `${result[0][0].ticket_raised_by_name} has raised mood ticket.}`,
                },
                headingVariables: {
                  heading: "New mood ticket raised",
                },
              };
            mailservice.mail(emailObj, function (err, response) {
            if (err) {
              console.log("Mail Not Sent!")
              return { response: 'Mail not sent.', error: err };
            }
            else {
              console.log("Mail Sent!");
              return { response: 'Mail sent' };
            }
          });

              // let message = {
              //   notification: {
              //     title: "Mood",
              //     body: `${result[0][0].ticket_raised_by_name} has raised mood ticket.`,
              //   },
              //   data: {
              //     route: "/mood",
              //     type: "mood",
              //   },
              // };
              // notificationCtrl.sendNotificationToMobileDevices(
              //   result[0][0].assignedtouserid,
              //   message
              // );

              // var msgbody = `${result[0][0].ticket_raised_by_name} has raised mood ticket.`;
              // var keysdata = {
              //   createdby: req.body.createdby,
              //   touser: result[0][0].assignedtouserid,
              //   description: msgbody,
              //   module: "Mood",
              //   action: "add",
              // };

              // notificationCtrl.saveUserNotificationDirect(keysdata);
    
    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    console.log("errrr", error);
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function viewMoodTickets(req, res) {
  try {
    var obj = req.body;
    obj.action = "view_mood_tickets";
    var result = await query('call usp_mood_ticket_operation(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.err, state: -1, data: null });
    }
    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function getMoodBotQuestions(req, res) {
  try {
    var obj = req.body;
    obj.action = "moodbot_questions";
    var result = await query('call usp_mood_ticket_operation(?)', [JSON.stringify(obj)]);
    //console.log("results", result);
    
    result && result[0].map(item => {
      let optionArr = [];
      let option_value = item.options && item.options.split(",");
      let option_id = item.option_number && item.option_number.split(",");
      let n = option_value && option_value.length;
      for (let i = 0; i < n; i++){
        optionArr.push({
          "option_id": option_id && option_id[i],
          "option_value": option_value && option_value[i]
        });
      }
      item.optionArr = optionArr;
      optionArr = [];
      delete item.options;
      delete item.option_number;
    })
    // let questionData = result && result[0];
    // let optionData = result && result[1];

    // questionData.map(item => {
    //   let optionArr = [];
    //   let option_value = item.options && item.options.split(",");
    //   let current_option = optionData.find(ele => ele.question_id == item.question_id);
    //   let option_id = current_option.option_number;
    //   option_id = option_id && option_id.split(",");
    //   let n = option_value && option_value.length;
    //   for (let i = 0; i < n; i++){
    //     optionArr.push({
    //       "option_id": option_id && option_id[i],
    //       "option_value": option_value && option_value[i]
    //     });
    //   }
    //   item.optionArr = optionArr;
    //   optionArr = [];
    //   delete item.options;
    //   delete item.question_id;
    // })
    
    if (!result) {
      return res.json({ message: result.err, state: -1, data: null });
    }
    return res.json({ message: 'Success', state: 1, data: result[0] })
    //return res.json({ message: 'Success', state: 1, data: questionData })
  } catch (error) {
    //console.log("errrr", error);
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function saveBotResponse(req, res) {
  try {
    var obj = req.body;
    obj.action = "save_response";
    let botResponse = req.body.botResponse;
    var result = await query('call usp_mood_ticket_operation(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.err, state: -1, data: null });
    }
    for (let i = 0; i < botResponse.length; i++){
      if (botResponse[i].notification_required == 1) {
        let bellNotificationData = {
        "assignedtouserid": result && result[0] && result[0][0] && result[0][0].assignedtouserid,
        "assignedfromuserid": result && result[0] && result[0][0] && result[0][0].assignedfromuserid,
        "notificationdesc": `Reminder: Please resolve mood ticket raised by ${result && result[0] && result[0][0].ticket_raised_by_name}`,
        "attribute1": "",
        "attribute2": "",
        "attribute3": "",
        "attribute4": "",
        "isvendor": "",
        "web_route": '',
        "app_route": "app/route",
        "fortnight_date": "",
        "module_name": "Mood",
        "createddate": moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        "datevalue": new Date().valueOf()
      }
    sendBellIconNotification(bellNotificationData);
    saveBellNotification(bellNotificationData);
      }
    }
    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    //console.log("error", error);
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function fetchPreviousBotChats(req, res) {
  try {
    var obj = req.body;
    obj.action = "previous_chats";
    var result = await query('call usp_mood_ticket_operation(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.err, state: -1, data: null });
    }

    result && result[0].map(item => {
      item.date_with_time = item.date_with_time && moment().format('DD/MM/YYYY HH:MM A');
    })
  
    let uniqueDates = [... new Set(result && result[0].map(item => item.date))];
    let requiredData = [];
    for (let i = 0; i < uniqueDates.length; i++){
      let data = result && result[0].filter(item => item.date == uniqueDates[i]);
      requiredData.push(data);
    }
    return res.json({ message: 'Success', state: 1, data: requiredData })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function moodTicketActions(req, res) {
  try {
    var obj = req.body;
    obj.action = obj.action ? obj.action : "mood_ticket_actions";
    var result = await query('call usp_mood_ticket_operation(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.err, state: -1, data: null });
    }
    if (obj.reqtype == "forward") {
      let bellNotificationData = {
        "assignedtouserid": result && result[0] && result[0][0] && result[0][0].assignedtouserid,
        "assignedfromuserid": result && result[0] && result[0][0] && result[0][0].assignedfromuserid,
        "notificationdesc": `${result && result[0] && result[0][0] && result[0][0].ticket_forwarded_by_name} has forwarded mood ticket raised by ${result && result[0] && result[0][0].ticket_raised_by_name} to you.`,
        "attribute1": "",
        "attribute2": "",
        "attribute3": "",
        "attribute4": "",
        "isvendor": "",
        "web_route": '',
        "app_route": "app/route",
        "fortnight_date": "",
        "module_name": "Mood",
        "createddate": moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        "datevalue": new Date().valueOf()
      }
      sendBellIconNotification(bellNotificationData);
      saveBellNotification(bellNotificationData);
      
    } else if (obj.reqtype == "resolve") {
      let bellNotificationData = {
        "assignedtouserid": result && result[0] && result[0][0] && result[0][0].assignedtouserid,
        "assignedfromuserid": result && result[0] && result[0][0] && result[0][0].assignedfromuserid,
        "notificationdesc": `${result && result[0] && result[0][0] && result[0][0].resolved_by_name} has resolved your mood ticket.`,
        "attribute1": "",
        "attribute2": "",
        "attribute3": "",
        "attribute4": "",
        "isvendor": "",
        "web_route": '',
        "app_route": "app/route",
        "fortnight_date": "",
        "module_name": "Mood",
        "createddate": moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        "datevalue": new Date().valueOf()
      }
    sendBellIconNotification(bellNotificationData);
    saveBellNotification(bellNotificationData);
    }
    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

/* --------------------- end of mood tickets api ----------------------------*/

async function saveMoodTypeMaster(req, res) {
  try {
    var obj = req.body;
    var result = await query('call usp_mood_analytics_operations(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.err, state: -1, data: null });
    }
    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function viewMoodTypeMaster(req, res) {
  try {
    var obj = req.body;
    var result = await query('call usp_mood_analytics_operations(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.err, state: -1, data: null });
    }
    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function editMoodTypeMaster(req, res) {
  try {
    var obj = req.body;
    var result = await query('call usp_mood_analytics_operations(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.err, state: -1, data: null });
    }
    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function deactivateMoodTypeMaster(req, res) {
  try {
    var obj = req.body;
    var result = await query('call usp_mood_analytics_operations(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.err, state: -1, data: null });
    }
    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function moodDashboardCounts(req, res) {
  try {
    let allreportees = await feedbackController.userhierarcy(req, res);
    ////console.log("allreportees", allreportees);
    let obj = { ...req.body, allreportees };
    var result = await query('call usp_mood_analytics_operations(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.err, state: -1, data: null });
    }
    //console.log("result", result);
    return res.json({ message: 'Success', state: 1, data: result })
  } catch (error) {
    ////console.log("err", error);
    return res.json({ 'err': error, state: -1, data: null });
  }
}

// async function typeAndSubtype(req, res) {
//   try {
//     var obj = req.body;
//     var result = await query('call usp_mood_analytics_operations(?)', [JSON.stringify(obj)]);
//     if (!result) {
//       return res.json({ message: result.err, state: -1, data: null });
//     }
//     //console.log("result", result);
//     return res.json({ message: 'Success', state: 1, data: result })
//   } catch (error) {
//     return res.json({ 'err': error, state: -1, data: null });
//   }
// }

async function getPastTenDaysUserMoodCount(req, res) {
  try {
    let allreportees = await feedbackController.userhierarcy(req, res);
    ////console.log("allreportees", allreportees);
    let obj = { ...req.body, allreportees };
    var result = await query('call usp_mood_analytics_operations(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.err, state: -1, data: null });
    }
    ////console.log("result", result);
    let mood_data = result[0];
    let user_data = result[1];
    let moodtype_counts = result[2][0].moodtype_counts || 5;
    ////console.log(mood_data, user_data, moodtype_counts);

    user_data.forEach(item => {
      ////console.log('items', item)
      for (let i = 1; i <= moodtype_counts; i++) {
        let mood_type = mood_data && mood_data.find(ele => ele.mood_type == i && ele.user_id == item.userid)
        item[`${i}`] = mood_type && mood_type.reaction_count || 0
      }
      return item;
    })
    return res.json({ message: 'Success', state: 1, data: user_data })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function getPastTenDaysUserMoodDetails(req, res) {
  try {
    var obj = req.body;
    var result = await query('call usp_mood_analytics_operations(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.err, state: -1, data: null });
    }
    //console.log("result", result);
    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function moodSubmissionSummary(req, res) {
  try {
    //var obj = req.body;
    let allreportees = await feedbackController.userhierarcy(req, res);
    ////console.log("allreportees", allreportees);
    let obj = { ...req.body, allreportees };
    var result = await query('call usp_mood_analytics_operations(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.err, state: -1, data: null });
    }
    ////console.log("result", result);
    let reaction_data = result[0];
    let feedback_data = result[1];
    //console.log(reaction_data, feedback_data);
    let data = []
    //let isamountapplicable = result[2] && result[2][0].isamountapplicable;
    let useridMap = new Map();
    reaction_data.forEach(item => {
      let feedback = feedback_data.find(ele => ele.days == item.days && ele.userid == item.userid);
      if (useridMap.has(item.userid)) {
        let userIndex = useridMap.get(item.userid);
        data[userIndex][item.days] = `${item.averagescore} / ${item.submissions}`;
        data[userIndex][`${item.days}_average_score`] = item.averagescore || 0
        data[userIndex][`${item.days}_submissions`] = item.submissions || 0
        data[userIndex][`${item.days}_postive_feedback`] = feedback && feedback.positive_feedback || 0;
        data[userIndex][`${item.days}_negative_feedback`] = feedback && feedback.negative_feedback || 0;
        data[userIndex][`${item.days}_total_feedback`] = feedback && feedback.total_feedback || 0;

      } else {
        useridMap.set(item.userid, data.length)
        let object = _.omit(item, ["days", "averagescore", "submissions"])
        object[item.days] = `${item.averagescore} / ${item.submissions}`
        object[`${item.days}_average_score`] = item.averagescore || 0
        object[`${item.days}_submissions`] = item.submissions || 0
        object[`${item.days}_postive_feedback`] = feedback && feedback.positive_feedback || 0;
        object[`${item.days}_negative_feedback`] = feedback && feedback.negative_feedback || 0;
        object[`${item.days}_total_feedback`] = feedback && feedback.total_feedback || 0;
        data.push(object);
      }
    })
    let dayDistribution = ['day_7', 'day_15', 'day_30', 'day_90', 'day_180']

    data.map(item => {

      dayDistribution.forEach(ele => {

        if (!(ele in item)) {
          let feedback = feedback_data.find(item2 => item2.days == ele && item2.userid == item.userid);
          item[`${ele}_postive_feedback`] = feedback && feedback.positive_feedback || 0;
          item[`${ele}_negative_feedback`] = feedback && feedback.negative_feedback || 0;
          item[`${ele}_total_feedback`] = feedback && feedback.total_feedback || 0;
          item[ele] = `0 / 0 `
          item[`${ele}_average_score`] = 0
          item[`${ele}_submissions`] = 0
        }
      })
      return item
    });
    return res.json({ message: 'Success', state: 1, data: data })
  } catch (error) {
    ////console.log(error);
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function getGraphMoodCounts(req, res) {
  try {
    //var obj = req.body;
    let allreportees = await feedbackController.userhierarcy(req, res);
    ////console.log("allreportees", allreportees);
    let obj = { allreportees, ...req.body, action: "graph_moodcounts" };
    var result = await query('call usp_mood_analytics_operations(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.err, state: -1, data: null });
    }
    let happy_satisfied_data = _.map(result[0], "reaction_count");
    let sad_disappoint_data = _.map(result[1], "reaction_count");
    return res.json({ message: 'Success', state: 1, data: { happy_satisfied_data, sad_disappoint_data } })
  } catch (error) {
    ////console.log("err", error);
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function getOverallAverageMoodScore(req, res) {
  try {
    let allreportees = await feedbackController.userhierarcy(req, res);
    ////console.log("allreportees", allreportees);
    let obj = { allreportees, ...req.body, action: "overall_average_reaction" };
    var result = await query('call usp_mood_analytics_operations(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.err, state: -1, data: null });
    }
    return res.json({ message: 'Success', state: 1, data: result[0] && result[0][0] && result[0][0].average })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function getPieChartData(req, res) {
  try {
    let allreportees = await feedbackController.userhierarcy(req, res);
    let obj = { ...req.body, allreportees };

    var result = await query('call usp_mood_analytics_operations(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.err, state: -1, data: null });
    }
    let moodtype_data = result[1];
    let moodsubtype_data = result[0];
    ////console.log("type", moodtype_data);
    ////console.log("subtype", moodsubtype_data);

    // _.map(moodtype_data, item => {
    //   if (!item.subtype) item["subtype"] = []
    //   return item;
    // })

    // _.each(moodsubtype_data, item => {
    //   //console.log('items', item)
    //   let typeIndex = _.findIndex(moodtype_data, ele => ele.id == item.typeid);
    //   if (moodtype_data[typeIndex] && moodtype_data[typeIndex]["subtype"]) {
    //     moodtype_data[typeIndex]["subtype"].push(item)
    //   } else {
    //     moodtype_data[typeIndex]["subtype"] = [item]
    //   }
    // })

    let map = new Map();
    _.each(moodsubtype_data, item => {
      let typeIndex = _.findIndex(moodtype_data, ele => ele.id == item.typeid);
      let subtype_sum = 0

      if (map.has(item.typeid)) {
        subtype_sum = map.get(item.typeid);
      } else {
        subtype_sum = moodsubtype_data.reduce((accumulator, current) => {

          if (current.typeid == item.typeid) {
            accumulator += current.reaction_submission_count;
          }
          return accumulator;
        }, 0)

        map.set(item.typeid, subtype_sum);

      }

      item.percentage = ((item.reaction_submission_count / subtype_sum) * 100).toFixed(2) || 0
      if (isNaN(item.percentage)) {
        item.percentage = 0;
      }
      if (moodtype_data[typeIndex] && moodtype_data[typeIndex]["subtype"]) {
        moodtype_data[typeIndex]["subtype"].push(item)
      } else {
        moodtype_data[typeIndex]["subtype"] = [item]
      }
    })

    let type_sum = moodtype_data.reduce((accumulator, current) => {
      accumulator += current.reaction_submission_count;
      return accumulator
    }, 0)

    _.map(moodtype_data, item => {
      item.percentage = ((item.reaction_submission_count / type_sum) * 100).toFixed(2) || 0;
      if (isNaN(item.percentage)) {
        item.percentage = 0;
      }
      if (!item.subtype) {
        item["subtype"] = [];
      }
      return item;
    })
    return res.json({ message: 'Success', state: 1, data: moodtype_data })
  } catch (error) {
    //console.log(error);
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function getUserFeedbackDetails(req, res) {
  try {
    let obj = req.body;
    var result = await query('call usp_mood_analytics_operations(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.err, state: -1, data: null });
    }
    return res.json({ message: 'Success', state: 1, data: result && result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}
async function moodticketHistory(req, res) {
  try {
    if (!req.body.ticketid) {
      throw new Error('Required parameter(s) are missing');
    }
    let reqData = req.body;
    reqData.action = 'history';
    let [results] = await query('call usp_mood_ticket_operation(?)', [JSON.stringify(reqData)]);
    return res.json({ state: 1, message: 'Success', data: results });
  } catch (err) {
    return res.json({ state: -1, message: err.message || err })
  }

}