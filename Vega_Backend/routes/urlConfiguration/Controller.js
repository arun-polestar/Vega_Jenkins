'use strict'

const query = require('../../routes/common/Model').mysqlPromiseModelService;

module.exports = {

  urlconfig: async (req, res) => {
    try {
      const [result] = await query('call usp_outsourceurl(?)', [JSON.stringify(req.body)])
      const dbres = result && result[0]
      return res.json({
        state: 1,
        message: req.body.action != 'geturldata' ? dbres && dbres.message : 'success',
        data: result
      })

    } catch (err) {
      //console.log('Error!',err);
      res.json({
        state: -1,
        message: (err && err.message || err),
        data: null
      })
    }
  }
}
