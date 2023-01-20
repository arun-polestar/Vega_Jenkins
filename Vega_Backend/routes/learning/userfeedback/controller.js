const query = require('../../../routes/common/Model').mysqlPromiseModelService;
const notificationCtrl = require('../../notification/Controller');
const mailservice = require('../../../services/mailerService');

var lodash = require('lodash');
const moment = require("moment");
const verifyNull = require('../../common/utils').removeFalseyLike;


module.exports = {
  getFeedbackQuestionTypeMaster: getFeedbackQuestionTypeMaster,
  addFeedbackQuestions: addFeedbackQuestions,
  getFeedbackQuestions: getFeedbackQuestions,
  deactivateFeedbackQuestions: deactivateFeedbackQuestions,
  saveFeedbackResponse: saveFeedbackResponse,
  viewFeedbackResponse: viewFeedbackResponse,
  saveFeedbackForm: saveFeedbackForm,
  createFeedbackForm: createFeedbackForm,
  viewFeedbackForm: viewFeedbackForm,
  deactivateFeedbackForm: deactivateFeedbackForm,
  getSelectedFormQuestions: getSelectedFormQuestions,
  getLearningQuestionDetails: getLearningQuestionDetails,

}

async function getFeedbackQuestionTypeMaster(req, res) {
  try {
    var obj = req.body;
    var obj1 = {};
    await verifyNull(obj);
    var result = await query('call usp_learning_feedback_question(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function addFeedbackQuestions(req, res) {
  try {
    let obj = req.body;
    var obj1 = {};
    var result = await query('call usp_learning_feedback_question(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result && result[0] })

  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function deactivateFeedbackQuestions(req, res) {
  try {
    let obj = req.body;
    var obj1 = {};
    obj.action = 'deactivate_feedback_question';
    var result = await query('call usp_learning_feedback_question(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result && result[0] })

  } catch (error) {
    return res.json({ 'message': error, state: -1, data: null });
  }
}

async function getFeedbackQuestions(req, res) {
  try {
    let obj = req.body;
    var obj1 = {};
    obj.action = 'feedback_questions';
    var result = await query('call usp_learning_feedback_question(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }
    let items = result && result[0];
    //console.log(items);
    let newItems = [];
    for (let i = 0; i < items.length; i++) {
      let data = items[i];
      if (items[i].ques_typeid != 1) {
        data = lodash.omit(items[i], ["options", "objective_type_name", "objective_type"]);
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
}

async function saveFeedbackResponse(req, res) {
  try {
    let obj = req.body;
    var obj1 = req.body.responseData;
    obj.action = 'save_feedback_response';

    var result = await query('call usp_learning_feedback_question(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result && result[0] })

  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function viewFeedbackResponse(req, res) {
  try {
    let obj = req.body;
    var obj1 = {};
    obj.action = 'view_feedback_response';

    var result = await query('call usp_learning_feedback_question(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    let items = result && result[0];
    let newItems = [];
    for (let i = 0; i < items.length; i++) {
      let data = items[i];
      if (items[i].ques_typeid == 1) {
        items[i].options = JSON.parse(items[i].options);
        data = lodash.omit(items[i], ["rating_typeid", "rating_type_name"]);
      } else if (items[i].ques_typeid == 2) {
        data = lodash.omit(items[i], ["options", "objective_type_name", "objective_type", "rating_typeid", "rating_type_name"]);
      } else {
        data = lodash.omit(items[i], ["options", "objective_type_name", "objective_type"]);
      }
      newItems.push(data);
    }

    return res.json({ message: 'Success', state: 1, data: newItems })

  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function saveFeedbackForm(req, res) {
  try {
    let obj = req.body;
    var obj1 = {};

    var result = await query('call usp_learning_feedback_question(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result && result[0] })

  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function createFeedbackForm(req, res) {
  try {
    let obj = req.body;
    var obj1 = req.body.selectedQuestionData;
    obj.action = obj.action ? obj.action : 'create_feedback_form';

    var result = await query('call usp_learning_feedback_question(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result && result[0] })

  } catch (error) {
    //console.log("error", error);
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function viewFeedbackForm(req, res) {
  try {
    let obj = req.body;
    var obj1 = {};
    obj.action = 'view_feedback_form';

    var result = await query('call usp_learning_feedback_question(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }
    let dbResult = result && result[0];
    ////console.log("dbResult", dbResult);
    let newResult = [];

    dbResult.map(item => {
      let questionArr = item && item.question && item.question.split(',');
      let questionIdArr = item && item.question_id && item.question_id.split(',');
      let questionTypeArray = item && item.ques_type && item.ques_type.split(',');
      let sequenceIdArray = item && item.sequence_id && item.sequence_id.split(',');
      let mandatoryKeyArray = item && item.is_mandatory && item.is_mandatory.split(',');
      let newItem = lodash.omit(item, ["question", "ques_type", "ques_typeid", "sequence_id", "is_mandatory"]);
      let newQuesArray = [];
      let obj_count = 0, sub_count = 0, rating_count = 0;
      for (let i = 0; i < questionArr.length; i++) {
        let data = {};
        data.question_id = questionIdArr[i];
        data.ques_title = questionArr[i];
        data.ques_type = questionTypeArray[i];
        data.sequence_id = sequenceIdArray[i];
        data.is_mandatory = mandatoryKeyArray[i];
        if (data.ques_type.toString() === 'Objective') {
          obj_count++;
        } else if (data.ques_type.toString() === 'Subjective') {
          sub_count++;
        } else if (data.ques_type.toString() === 'Rating') {
          rating_count++;
        }
        newQuesArray.push(data);
      }
      newItem.objective_count = obj_count;
      newItem.subective_count = sub_count;
      newItem.rating_count = rating_count;
      newItem.total_count = obj_count + sub_count + rating_count;
      newItem.questionTagged = newQuesArray;
      newResult.push(newItem);
    })

    return res.json({ message: 'Success', state: 1, data: newResult })

  } catch (error) {
    //console.log(error);
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function deactivateFeedbackForm(req, res) {
  try {
    let obj = req.body;
    var obj1 = {};
    obj.action = 'deactivate_feedback_form';

    var result = await query('call usp_learning_feedback_question(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result && result[0] })

  } catch (error) {
    return res.json({ 'err': error, state: -1, data: null });
  }
}

async function getSelectedFormQuestions(req, res) {
  try {
    let obj = req.body;
    var obj1 = {};
    obj.action = 'selected_questions';

    var result = await query('call usp_learning_feedback_question(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    let items = result && result[0];
    ////console.log(items);
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
}

async function getLearningQuestionDetails(req, res) {
  try {
    let obj = req.body;
    var obj1 = {};
    obj.action = 'question_details';

    var result = await query('call usp_learning_feedback_question(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    let items = result && result[0];
    ////console.log(items);
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
}
