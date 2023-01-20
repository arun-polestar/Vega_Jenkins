const proc = require('../../../common/procedureConfig')
const commonModel = require('../../../common/Model');

module.exports = {
    getBatchInstructions: getBatchInstructions,
}

function getBatchInstructions(req, res) {
    if (req && req.body) {
        var reqData = req.body;
        reqData = JSON.stringify(reqData);
        commonModel.mysqlModelService(proc.bachcheckproc, [reqData], function (err, results) {
            if (err) {
                return res.json({
                    "state": -1,
                    "message": err,
                    "data": null
                });
            } else if (results) {
                return res.json({
                    "state": 1,
                    "message": "success",
                    "data": results[0]
                });
            }
        });
    } else {
        return res.json({
            "state": -1,
            "message": 'Invalid Request',
            "data": null
        });
    }
}