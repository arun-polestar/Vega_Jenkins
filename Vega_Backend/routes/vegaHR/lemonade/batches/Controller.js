const proc = require('../../../common/procedureConfig')
const query = require('../../../common/Model').mysqlPromiseModelService;
const commonCtrl = require('../../../common/Controller');
const _ = require('lodash');

module.exports = {
  getBatches: getBatches,
  changeBatchStatus: changeBatchStatus,
}

async function getBatches(req, res) {
  try {
    const reqData = JSON.stringify(req.body);
    let [r1, r2] = await query(proc.dashboardproc, [reqData]);
    const lazydata = commonCtrl.lazyLoading(r1, req.body);
    if (lazydata && "data" in lazydata && "count" in lazydata) {
      r1 = lazydata.data;
      if (req.body.action == 'Batch') {
        const g = _.groupBy(r2, 'batchid');
        _.map(r1, item => {
          if (g[item.id])
            item['sections'] = g[item.id]
          return item
        });
      }
      return res.json({
        "state": 1,
        "message": "success",
        "totalcount": lazydata.count,
        "data": r1
      });
    } else {
      throw new Error('No Lazy Data!')
    }
  } catch (err) {
    return res.json({
      "state": -1,
      "message": err.message || err,
      "data": null
    });
  }
}

async function changeBatchStatus(req, res) {
  try {
    var reqData = req.body;
    reqData = JSON.stringify(reqData);
    let [rej] = await query(proc.editbatchproc, [reqData, '']);
    if (rej && rej[0] && rej[0].state == 1) {
      return res.json({
        "state": 1,
        "message": "success",
        "data": rej
      });
    } else {
      throw new Error(rej && rej[0] && rej[0].message || 'Something went wrong')
    }
  } catch (err) {
    return res.json({
      "state": -1,
      "message": err.message || err || "Failed",
      "data": null
    });
  }

}