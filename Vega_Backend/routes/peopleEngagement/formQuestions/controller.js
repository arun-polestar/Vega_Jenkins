const query = require('../../../routes/common/Model').mysqlPromiseModelService;
// const notificationCtrl = require('../../notification/Controller');
// const mailservice = require('../../../services/mailerService');
const _ = require('lodash');
// const moment = require("moment");
const { validateReqBody } = require('../../common/utils');

const ACTION = {
  FORMFREQUENCY: 'frequency_type',
  VIEWENGAGEMENTQUESTIONS: 'view_engagement_questions',
  DEACTIVATEENGAGEMENTQUESTIONS: 'deactivate_engagement_question',
  VIEWENGAGEMENTFORMS: 'view_engagement_form',
  DEACTIVATEENGAGEMENTFORM: 'deactivate_engagement_form',

}

const getEngagementQuestionTypeMaster = async (req, res) => {
  try {
    const obj = req.body;
    let obj1 = {};
    const result = await query('call usp_engagement_dynamicquestion(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
};

const createEngagementQuestions = async (req, res) => {
  try {
    //validateReqBody(req.body);
    const obj = req.body;
    let obj1 = {};
    const result = await query('call usp_engagement_dynamicquestion(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result && result[0] })

  } catch (error) {
    console.log('er', error)
    return res.json({ 'err': error, state: -1, data: null });
  }
};

const getEngagementQuestions = async (req, res) => {
  try {
    let obj = req.body;
    var obj1 = {};
    obj.action = ACTION.VIEWENGAGEMENTQUESTIONS;
    var result = await query('call usp_engagement_dynamicquestion(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }
    let items = result && result[0];
    let newItems = [];
    for (let i = 0; i < items.length; i++) {
      let data = items[i];
      if (items[i].ques_type != "Dropdown"
        && items[i].ques_type != "Rating"
        && items[i].ques_type != "Objective") {
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

const deactivateEngagementQuestions = async (req, res) => {
  try {
    let obj = req.body;
    let obj1 = {};
    obj.action = ACTION.DEACTIVATEENGAGEMENTQUESTIONS;
    const result = await query('call usp_engagement_dynamicquestion(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result && result[0] })

  } catch (error) {
    return res.json({ 'message': error, state: -1, data: null });
  }
};

const getEngagementFormFrequencyType = async (req, res) => {
  try {
    const obj = req.body;
    let obj1 = {};
    obj.action = obj.action ? obj.action : ACTION.FORMFREQUENCY;
    const result = await query('call usp_engagement_dynamicquestion(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

const createEngagementForm = async (req, res) => {
  try {
    let obj = req.body;
    const obj1 = req.body.selectedQuestionData;
    obj.action = obj.action ? obj.action : 'create_engagement_form';

    obj.questionid = await obj1.map(element => element.question_id).toString();

    const result = await query('call usp_engagement_dynamicquestion(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result && result[0] })

  } catch (error) {
    //console.log("error", error);
    return res.json({ 'err': error, state: -1, data: null });
  }
};

const saveEngagementForm = async (req, res) => {
  try {
    let obj = req.body;
    let obj1 = {};

    const result = await query('call usp_engagement_dynamicquestion(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result && result[0] })

  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
};

const viewEngagementForm = async (req, res) => {
  try {
    let obj = req.body;
    let obj1 = {};
    obj.action = ACTION.VIEWENGAGEMENTFORMS;

    const result = await query('call usp_engagement_dynamicquestion(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }
    let dbResult = result && result[0];
    let questionData = result && result[1];
    let optionWeightage = result && result[2];
    let newResult = [];
    dbResult.map(item => {
      let questionIdArr = item && item.question_id && item.question_id.split(',');
      let questionArr = questionData.filter(data => {
        return questionIdArr.find(el => el == data.id);
      });
      let questionTypeArray = item && item.ques_type && item.ques_type.split(',');
      let sequenceIdArray = item && item.sequence_id && item.sequence_id.split(',');
      let mandatoryKeyArray = item && item.is_mandatory && item.is_mandatory.split(',');
      let descriptiveKeyArray = item && item.is_descriptive && item.is_descriptive.split(',');
      let isImpactAnalysis = item && item.is_impact_analysis && item.is_impact_analysis.split(',');
      let newItem = _.omit(item, ["ques_type", "ques_typeid", "sequence_id", "is_mandatory", "is_descriptive",
        "is_impact_analysis"]);
      let newQuesArray = [];
      let obj_count = 0, sub_count = 0, rating_count = 0, dropdown_count = 0, slider_count = 0;
      for (let i = 0; i < questionArr.length; i++) {
        let data = {};
        data.options = optionWeightage.filter((weightage) => {
          return item.id == weightage.engagement_form_id && questionIdArr[i] == weightage.question_id
        })
        data.question_id = questionIdArr[i];
        data.ques_title = questionArr[i].title;
        data.ques_type = questionTypeArray[i];
        data.sequence_id = sequenceIdArray && sequenceIdArray.length && typeof sequenceIdArray[i] !== null ?
          sequenceIdArray[i] : i + 1;
        data.is_mandatory = mandatoryKeyArray[i];
        data.is_descriptive = descriptiveKeyArray[i];
        data.is_impact_analysis = isImpactAnalysis && isImpactAnalysis.length &&
          typeof isImpactAnalysis[i] !== null ? isImpactAnalysis[i] : 0;
        if (data.ques_type.toString() === 'Objective') {
          obj_count++;
        } else if (data.ques_type.toString() === 'Subjective') {
          sub_count++;
        } else if (data.ques_type.toString() === 'Rating') {
          rating_count++;
        } else if (data.ques_type.toString() === 'Dropdown') {
          dropdown_count++;
        } else if (data.ques_type.toString() === 'Slider') {
          slider_count++;
        }
        newQuesArray.push(data);
      }

      newItem.objective_count = obj_count;
      newItem.dropdown_count = dropdown_count;
      newItem.subective_count = sub_count;
      newItem.rating_count = rating_count;
      newItem.slider_count = slider_count;
      newItem.total_count = obj_count + sub_count + rating_count + dropdown_count + slider_count;
      newItem.questionTagged = newQuesArray;
      newResult.push(newItem);
    })

    return res.json({ message: 'Success', state: 1, data: newResult })

  } catch (error) {
    //console.log(error);
    return res.json({ 'err': error, state: -1, data: null });
  }
};

const deactivateEngagementForm = async (req, res) => {
  try {
    let obj = req.body;
    let obj1 = {};
    obj.action = ACTION.DEACTIVATEENGAGEMENTFORM;

    const result = await query('call usp_engagement_dynamicquestion(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result && result[0] })

  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
};

const getSelectedEngagementQuestions = async (req, res) => {
  try {
    let obj = req.body;
    let obj1 = {};
    obj.action = 'selected_questions';

    const result = await query('call usp_engagement_dynamicquestion(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    let items = result && result[0];
    for (let i = 0; i < items.length; i++) {
      if (items[i].options !== null) {
        items[i].options = JSON.parse(items[i].options);
      }
    }
    return res.json({ message: 'Success', state: 1, data: items })

  } catch (error) {
    //console.log(error)
    return res.json({ 'err': error, state: -1, data: null });
  }
};

const getEngagementQuestionDetails = async (req, res) => {
  try {
    let obj = req.body;
    let obj1 = {};
    obj.action = 'question_details';

    const result = await query('call usp_engagement_dynamicquestion(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    let items = result && result[0];
    for (let i = 0; i < items.length; i++) {
      if (items[i].options !== null) {
        items[i].options = JSON.parse(items[i].options);
      }
    }
    return res.json({ message: 'Success', state: 1, data: items })

  } catch (error) {
    //console.log(error)
    return res.json({ 'err': error, state: -1, data: null });
  }
};

module.exports = {
  getEngagementQuestionTypeMaster,
  createEngagementQuestions,
  getEngagementQuestions,
  deactivateEngagementQuestions,
  createEngagementForm,
  saveEngagementForm,
  viewEngagementForm,
  deactivateEngagementForm,
  getSelectedEngagementQuestions,
  getEngagementQuestionDetails,
  getEngagementFormFrequencyType,
};
