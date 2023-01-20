const proc = require('../../common/procedureConfig')
const query = require('../../common/Model').mysqlPromiseModelService;
const commonCtrl = require('../../common/Controller');
const _ = require('underscore');

module.exports = {
    drivemaster: drivemaster,
    drivebytype: drivebytype
}

function drivemaster(req, res) {
    if (!req.body.createdby) {
        return res.json({
            "state": 0,
            "message": 'Not a valid user'
        });
    }
    if (req && req.body) {
        var reqData = req.body;
        reqData = JSON.stringify(reqData);
        query(proc.drivemasterproc, [reqData])
            .then(results => {
                var lazydata = commonCtrl.lazyLoading(results && results[0], req.body);
                if (lazydata && "data" in lazydata && "count" in lazydata) {
                    results[0] = lazydata.data;
                    res.json({ message: 'success', data: results[0], totalcount: lazydata.count, state: 1 });
                } else {
                    res.json({ message: "No Lazy Data", data: null, state: -1 })
                }
            }).catch(err => {
                res.json({ message: err, data: null, state: -1 })
            })
    }
}
function drivebytype(req, res) {
    var reqData = req.body;
    reqData = JSON.stringify(reqData);
    query(proc.drivemasterproc, [reqData])
        .then(r => {
            const sdata = r && r[1] && r[1][0] && r[1][0].state == 1 ? r && r[0] : r;
            res.json({ message: "success", data: sdata, state: 1 })
        }).catch(err => {
            res.json({ message: err, data: null, state: -1 })
        })
}