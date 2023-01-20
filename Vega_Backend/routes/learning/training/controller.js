const query = require('../../../routes/common/Model').mysqlPromiseModelService;
const verifyNull = require('../../common/utils').removeFalseyLike;


module.exports = {
  saveTraining: saveTraining,
  viewTraining: viewTraining,
  deactivateTraining: deactivateTraining,
  myTrainings,
  treeStructureView,
  pendingVerificationAssessmentData
}

async function saveTraining(req, res) {
  try {
    var obj = req.body;
    await verifyNull(obj);
    var result = await query('call usp_learning_training(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}

async function viewTraining(req, res) {
  try {
    var obj = req.body;
    obj.action = 'view_training';
    await verifyNull(obj);
    var result = await query('call usp_learning_training(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}

async function deactivateTraining(req, res) {
  try {
    var obj = req.body;
    obj.action = "deactivate_training";
    var result = await query('call usp_learning_training(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}
async function myTrainings(req, res) {
  let obj = req.body
  obj.action = req.body.action ? req.body.action : 'mytraining';
  try {
    let result = await query('call usp_learning_training(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ state: -1, message: 'Success', data: result[0] });
    }
    return res.json({ state: 1, message: 'Success', data: result[0] })
  } catch (error) {
    return res.json({ state: -1, message: "Something went wrong!", data: result[0] })
  }
}


async function treeStructureView(req, res) {
  try {
    var obj = req.body;
    obj.action = 'tree_structure';
    await verifyNull(obj);
    //console.log("aaaaa")
    var result = await query('call usp_learning_training(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    //console.log(error);
    return res.json({ message: error, state: -1, data: null });
  }
}

async function pendingVerificationAssessmentData(req, res) {
  try {
    var obj = req.body;
    obj.action = 'verification_pending_testdata';
    await verifyNull(obj);
    var result = await query('call usp_learning_training(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    //console.log(error);
    return res.json({ message: error, state: -1, data: null });
  }
}