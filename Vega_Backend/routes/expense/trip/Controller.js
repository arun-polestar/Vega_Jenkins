"use strict";
const query = require("../../common/Model").mysqlPromiseModelService;
const proc = require("../../common/procedureConfig");
const commonCtrl = require("../../common/Controller");
const _ = require("lodash");

module.exports = {
  getTripData: async (req, res) => {
    try {
      const [results,results1] = await query(proc.expenseProc, [JSON.stringify(req.body)]);
      let chaindata;
      if(req.body.action !== 'getprojectrip'){
        chaindata = _.chain(results1)
        .groupBy(item => item.commonid + 'mtr#' + item.isactive)
        .map((val,key) => ({commonid:key.split('mtr#')[0],mappedData:val,isactive: +key.split('mtr#')[1]}))
        .map(val=> _.assign(val, _.find(results, {commonid: val.commonid,isactive: val.isactive})))
        .orderBy('tripname','asc')
        .value();
      }else{
        chaindata = results
      }
      const lazydata = commonCtrl.lazyLoading(chaindata, req.body) || {};
      return res.json({
        message: "success",
        data: lazydata&&lazydata.data,
        totalcount: lazydata&&lazydata.count,
        state: 1,
      });
    } catch (err) {
      return res.json({
        state: -1,
        message: err.message || err,
        data: null,
      });
    }
  },

  saveTripData: async (req, res) => {
    try {
      const reqData = JSON.stringify(req.body);
      const [results] = await query(proc.expenseProc, [reqData]);
      return res.json({
        state: 1,
        message: "Success",
        data: results,
      });
    } catch (err) {
      return res.json({
        state: -1,
        message: err.message || err,
        data: null,
      });
    }
  },
  /**
   * @description Get all the users according to `Country,Location,
   * Businessunit,Workforce,Department and Designation`.
   */
  getUserByCLBWD: async (req, res) => {
    try {
      const reqData = JSON.stringify(req.body);
      const [results] = await query(proc.mstemployees, [reqData]);
      return res.json({
        state: 1,
        message: "Success",
        data: results
      });
    } catch (err) {
      return res.json({
        state: -1,
        message: err,
        data: null,
      });
    }
  },
};
