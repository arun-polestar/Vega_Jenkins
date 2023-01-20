"use strict";
const query = require("../../common/Model").mysqlPromiseModelService;
const proc = require("../../common/procedureConfig");

module.exports = {
  getExpenseReportData: async (req, res) => {
    try {
      const reqData = JSON.stringify(req.body);
      const [results] = await query(proc.expenseReport, [reqData]);
      return res.json({
        message: "success",
        data: results,
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
};
