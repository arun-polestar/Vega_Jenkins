const query = require('../../../routes/common/Model').mysqlPromiseModelService;
// const notificationCtrl = require('../../notification/Controller');
// const mailservice = require('../../../services/mailerService');
const _ = require('lodash');
const moment = require("moment");
// const { validateReqBody } = require('../../common/utils');

const ACTION = {
  VIEWENGAGEMENTFORMRESPONSE: 'view_engagement_form_response',
  PREVIEWENGAGEMENTFORMDETIALS: 'preview_engagement_form_details',
  VIEWSUBMITTEDFORMSUSERDETAILS: 'view_submitted_forms_user_details',
  GETSUBMITTEDFORMDETIALS: 'get_submitted_form_details'
}

const getEngagementHomepageMaster = async (req, res) => {
  try {
    const obj = req.body;
    let obj1 = {};
    const result = await query('call usp_engagement_homepage(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
};

const createEngagementFormResponse = async (req, res) => {
  try {
    if (!req.body.date_of_intraction) {
      return res.json({ message: 'Please Fill The Date Field Before Submitting the feedback', state: -1 });
    }
    const obj = req.body;
    let obj1 = req.body.response;
    const result = await query('call usp_engagement_homepage(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result && result[0] })

  } catch (error) {
    return res.json({ 'message': error, state: -1, data: null });
  }
};

const getEngagementFormResponse = async (req, res) => {
  try {
    let obj = req.body;
    var obj1 = {};
    obj.action = obj.action ? obj.action : ACTION.VIEWENGAGEMENTFORMRESPONSE;
    var result = await query('call usp_engagement_homepage(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }
    let items = result && result[0];
    //console.log(items);
    let newItems = [];
    for (let i = 0; i < items.length; i++) {
      let data = items[i];
      if (items[i].ques_typeid != 1 && items[i].ques_typeid != 14) {
        data = _.omit(items[i], ["options", "objective_type_name", "objective_type"]);
      }
      if (items[i].options !== null) {
        items[i].options = JSON.parse(items[i].options);
      }
      newItems.push(data);
    }
    return res.json({ message: 'Success', state: 1, data: newItems })

  } catch (error) {
    //console.log("error", error);
    return res.json({ 'err': error, state: -1, data: null });
  }
};

const getEngagementFormDetails = async (req, res) => {
  try {
    let obj = req.body;
    let obj1 = {};
    obj.action = obj.action ? obj.action : ACTION.PREVIEWENGAGEMENTFORMDETIALS;

    const result = await query('call usp_engagement_homepage(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }
    let items = result && result[0];
    let newItems = [];
    let newObj = {
      raisedBy_userid: items && items[0] && items[0].raisedBy_id ? items[0].raisedBy_id : '',
      raisedBy_ecode: items && items[0] && items[0].raisedBy_ecode ? items[0].raisedBy_ecode : '',
      raisedBy_username: items && items[0] && items[0].raisedBy_name ? items[0].raisedBy_name : '',
      raisedBy_useremail: items && items[0] && items[0].raisedBy_email ? items[0].raisedBy_email : '',
      raisedFor_userid: items && items[0] && items[0].raisedFor_id ? items[0].raisedFor_id : '',
      raisedFor_ecode: items && items[0] && items[0].raisedFor_ecode ? items[0].raisedFor_ecode : '',
      raisedFor_username: items && items[0] && items[0].raisedFor_name ? items[0].raisedFor_name : '',
      raisedFor_useremail: items && items[0] && items[0].raisedFor_email ? items[0].raisedFor_email : '',
      raisedFor_department: items && items[0] && items[0].raisedFor_user_department ? items[0].raisedFor_user_department : '',
      raisedFor_designation: items && items[0] && items[0].raisedFor_user_designation ? items[0].raisedFor_user_designation : '',
      form_name: items && items[0] && items[0].form_name ? items[0].form_name : '',
      form_id: items && items[0] && items[0].form_id ? items[0].form_id : '',
    }
    newItems.push(newObj);
    for (let i = 0; i < items.length; i++) {
      items[i] = _.omit(items[i], ["raisedBy_id", "raisedBy_name", "raisedBy_email", "raisedFor_id",
        "raisedFor_name", "raisedFor_email", "form_name", "form_id", "raisedFor_user_department",
        "raisedFor_user_designation", "raisedBy_ecode", "raisedFor_ecode"]);
      if (items[i].options !== null) {
        items[i].options = JSON.parse(items[i].options);
      }
    }
    return res.json({ message: 'Success', state: 1, userFormData: newItems, questionData: items })

  } catch (error) {
    //console.log(error)
    return res.json({ 'err': error, state: -1, data: null });
  }
};

const getSubmittedFormsUserDetails = async (req, res) => {
  try {
    const obj = req.body;
    let obj1 = {};
    obj.action = obj.action ? obj.action : ACTION.VIEWSUBMITTEDFORMSUSERDETAILS;
    const result = await query('call usp_engagement_homepage(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }
    let items = result && result[0];
    //console.log("item", items);
    items = items.filter(ele => ele.impact_rating != null);
    items.map(async (data) => {
      const date = moment.parseZone(data.date_of_intraction).utc(true).format('YYYY-MM-DD');
      data.date_of_intraction = date.toString();
      // data.ques_options = JSON.parse(data.ques_options);
      // if (data && data.ques_options && data.ques_options != null) {
      //   for (let i = 0; i < data.ques_options.length; i++){
      //     if (data.impact_rating == data.ques_options[i]["Sno"]) {
      //       data.eNPS = data.ques_options[i]["options"];
      //       }
      //   }
      // }
      // const rating = data.ques_options && typeof data.ques_options !== null && typeof data.ques_options !== undefined ?
      //   JSON.parse(data.ques_options.substring(data.ques_options.indexOf('['), data.ques_options.indexOf(']') + 1))
      //   : data.impact_rating;
      // const selectedRating = Array.isArray(rating) ? rating.find(el => el.Sno === data.impact_rating) : rating;
      // data.rating = selectedRating && selectedRating.options && typeof selectedRating.options !== undefined &&
      //   typeof selectedRating.options !== null ? selectedRating.options : typeof selectedRating !== null &&
      //     typeof selectedRating !== undefined ? rating : 'No rating';
      //delete data.ques_options;
      return data;
    });
    const mentorResp = items.filter(data =>
      data.is_mentor == 1
    );
    const menteesResp = items.filter(data =>
      data.is_mentor == 0
    );
    return res.json({ message: 'Success', state: 1, mentorData: mentorResp, menteesData: menteesResp })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
};

const getSubmittedFormDetails = async (req, res) => {
  try {
    let obj = req.body;
    let obj1 = {};
    obj.action = obj.action ? obj.action : ACTION.GETSUBMITTEDFORMDETIALS;

    const result = await query('call usp_engagement_homepage(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }
    let items = result && result[0];
    let userItems = [];
    let userObj = {
      raisedBy_userid: items && items[0] && items[0].raisedBy_id ? items[0].raisedBy_id : '',
      raisedBy_ecode: items && items[0] && items[0].raisedBy_ecode ? items[0].raisedBy_ecode : '',
      raisedBy_username: items && items[0] && items[0].raisedBy_name ? items[0].raisedBy_name : '',
      raisedBy_useremail: items && items[0] && items[0].raisedBy_email ? items[0].raisedBy_email : '',
      raisedFor_userid: items && items[0] && items[0].raisedFor_id ? items[0].raisedFor_id : '',
      raisedFor_ecode: items && items[0] && items[0].raisedFor_ecode ? items[0].raisedFor_ecode : '',
      raisedFor_username: items && items[0] && items[0].raisedFor_name ? items[0].raisedFor_name : '',
      raisedFor_useremail: items && items[0] && items[0].raisedFor_email ? items[0].raisedFor_email : '',
      raisedFor_department: items && items[0] && items[0].raisedFor_user_department ? items[0].raisedFor_user_department : '',
      raisedFor_designation: items && items[0] && items[0].raisedFor_user_designation ? items[0].raisedFor_user_designation : '',
      form_name: items && items[0] && items[0].form_name ? items[0].form_name : '',
      form_id: items && items[0] && items[0].form_id ? items[0].form_id : '',
      date_of_intraction: moment.parseZone(items[0].date_of_intraction).utc(true).format('YYYY-MM-DD'),
    }
    userItems.push(userObj);
    for (let i = 0; i < items.length; i++) {
      items[i] = _.omit(items[i], ["raisedBy_id", "raisedBy_name", "raisedBy_email", "raisedFor_id",
        "raisedFor_name", "raisedFor_email", "form_name", "form_id", "raisedFor_user_department",
        "raisedFor_user_designation", "date_of_intraction", "raisedBy_ecode", "raisedFor_ecode"]);
      if (items[i].options !== null) {
        items[i].options = JSON.parse(items[i].options);
      }
    }
    return res.json({ message: 'Success', state: 1, userData: userItems, formData: items });

  } catch (error) {
    //console.log(error)
    return res.json({ 'err': error, state: -1, data: null });
  }
};

module.exports = {
  getEngagementHomepageMaster,
  createEngagementFormResponse,
  getEngagementFormResponse,
  getEngagementFormDetails,
  getSubmittedFormsUserDetails,
  getSubmittedFormDetails,
};
