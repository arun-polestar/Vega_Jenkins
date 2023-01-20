const query = require('../../common/Model').mysqlPromiseModelService;
const { check, validationResult } = require('express-validator');

module.exports = {
  getDropdownLists
}

async function getDropdownLists(req, res) {
  try {
    if (!req.body || !req.body.configcode) {
      return res.json({
        message: "Configcode is missing!",
        state: -1,
        data: null
      });
    }
    var obj = req.body;
    obj.action = "dropdown_lists";
    var obj1 = {};
    var result = await query('call usp_resource_demand_operation(?,?)', [JSON.stringify(obj), JSON.stringify(obj1)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result[0] })
  } catch (error) {
    return res.json({ message: error, state: -1, data: null });
  }
}