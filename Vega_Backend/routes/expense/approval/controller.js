"use strict";
const commonModel = require('../../common/Model');
const query = require('../../common/Model').mysqlPromiseModelService;

module.exports = {
  addExpenseApprovalMaster,
  editExpenseApprovalMaster,
  viewExpenseApprovalMaster,
  deactivateExpenseApprovalMaster
}

async function addExpenseApprovalMaster(req, res) {
  try {
    const reqData = JSON.stringify(req.body);
    query('call usp_expense_approval_operations(?)', [reqData]);
    return res.json({
      message: "success",
      state: 1,
    });
  } catch (err) {
    return res.json({
      state: -1,
      message: err.message || err,
      data: null,
    });
  }
}

async function editExpenseApprovalMaster(req, res) {
  try {
    const reqData = JSON.stringify(req.body);
    await query('call usp_expense_approval_operations(?)', [reqData]);
    return res.json({
      message: "success",
      state: 1,
    });
  } catch (err) {
    return res.json({
      state: -1,
      message: err.message || err,
      data: null,
    });
  }
}

async function deactivateExpenseApprovalMaster(req, res) {
  try {
    const reqData = JSON.stringify(req.body);
    await query('call usp_expense_approval_operations(?)', [reqData]);
    return res.json({
      message: "success",
      state: 1,
    });
  } catch (err) {
    return res.json({
      state: -1,
      message: err.message || err,
      data: null,
    });
  }
}

async function viewExpenseApprovalMaster(req, res) {
  try {
    const reqData = JSON.stringify(req.body);
    const results = await query('call usp_expense_approval_view(?)', [reqData]);
    //console.log("ressssultsss", results[0]);
    //results[0].approval_structure = JSON.parse(results[0].approval_structure);
    return res.json({
      message: "success",
      data: results[0],
      state: 1,
    });
  } catch (err) {
    return res.json({
      state: -1,
      message: err.message || err,
      data: null,
    });
  }
}

