"use strict";
const query = require("../../common/Model").mysqlPromiseModelService;
const proc = require("../../common/procedureConfig");
const commonCtrl = require("../../common/Controller");
const _ = require('lodash');

module.exports = {
  getMasterData: async (req, res) => {
    try {
      if (!req.body.createdby)
        throw new Error('Not a valid user!');
      const reqData = JSON.stringify(req.body)
      let [results, results1] = await query(proc.expenseProc, [reqData]);

      let data = results.filter(
        (item) => item.configcode == req.body.masterType
      );
      let chaindata;
      if (req.body.masterType == 'rateperkm') {
        chaindata = _.chain(results1)
          .groupBy(item => item.commonid + 'mtr#' + item.isactive)
          .map((val, key) => ({
            commonid: key.split('mtr#')[0],
            mappedData: val,
            isactive: +key.split('mtr#')[1]
          }))
          .map(val => _.assign(val, _.find(data, {
            commonid: val.commonid,
            isactive: val.isactive
          })))
          .orderBy('configvalue1', 'desc')
          .value();
      } else {
        chaindata = data
      }
      var lazydata = commonCtrl.lazyLoading(chaindata, req.body) || {};
      return res.json({
        message: "success",
        data: lazydata.data,
        totalcount: lazydata.count,
        state: 1,
      });
    } catch (err) {
      return res.json({
        state: -1,
        message: err.message || err,
      });
    }
  },

  saveExpenseMaster: async (req, res) => {
    try {
      const [results] = await query(proc.expenseProc, [
        JSON.stringify(req.body),
      ]);
      if (results && results[0] && results[0].state < 0) {
        throw new Error(results[0].message);
      }
      return res.json({
        state: 1,
        message: "Success",
        data: results,
      });
    } catch (err) {
      return res.json({
        state: -1,
        message: err.message || err || "Something went wrong!",
        data: null,
      });
    }
  },

  hqmvrBudgetAdd: async (req, res) => {
    try {
      const [results] = await query(proc.expenseProc, [
        JSON.stringify(req.body),
      ]);
      if (results && results[0] && results[0].state < 0) {
        throw new Error(results[0].message);
      }
      return res.json({
        state: 1,
        message: "Success",
        data: results,
      });
    } catch (err) {
      return res.json({
        state: -1,
        message: err.message || err || "Something went wrong!",
        data: null,
      });
    }
  },

  hqmvrBudgetEdit: async (req, res) => {
    try {
      const [results] = await query(proc.expenseProc, [
        JSON.stringify(req.body),
      ]);
      if (results && results[0] && results[0].state < 0) {
        throw new Error(results[0].message);
      }
      return res.json({
        state: 1,
        message: "Success",
        data: results,
      });
    } catch (err) {
      return res.json({
        state: -1,
        message: err.message || err || "Something went wrong!",
        data: null,
      });
    }
  },

  hqmvrBudgetView: async (req, res) => {
    try {
      const reqData = JSON.stringify(req.body);
      const results = await query('call usp_expense(?)', [reqData]);
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
}
