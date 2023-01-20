"use strict";
const query = require("../common/Model").mysqlPromiseModelService;

const getChatHistory = async (req, res) => {
  try {
    const data = req.body;
    data.reqtype = "getchathistory";
    data.isgroup = 0;
    const reqdata = JSON.stringify(data);
    const dbdata = await query("call usp_trxchat_operations(?)", [reqdata]);
    return res.json({
      state: 1,
      data: dbdata,
      message: "success",
    });
  } catch (err) {
    return res.json({ state: -1, message: err.message || err });
  }
};

module.exports = {
  getChatHistory,
};
