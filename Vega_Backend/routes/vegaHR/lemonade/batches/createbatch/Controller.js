const pr = require('../../../../common/procedureConfig')
const query = require('../../../../common/Model').mysqlPromiseModelService;
const utils = require('../../../../common/utils');

const webUrl = require('../../../../../config/config').webUrlLink;

module.exports = {
    saveBatchData,
}
async function saveBatchData(req, res) {
    try {
      const rd = req.body;
      const proc = rd.action == "E" ? pr.editbatchproc : pr.savebatchproc;
      await utils.removeFalseyLike(rd)
        const [results] = await query(proc, [JSON.stringify(rd), '']);
        if (results && results[0] && results[0].state == 1) {
            let batchUrl = `${webUrl}/#lemonade/${req.body.batchname && req.body.batchname.toLowerCase()}`
            results[0].batchUrl = batchUrl
            return res.json({
                "state": 1,
                "message": "success",
                "data": results,
                batchUrl
                
            });
        } else {
            throw new Error('Failed!')
        }
    } catch (err) {
        return res.json({
            "state": -1,
            "message": err.message || err,
            "data": null
        });
    }
}
