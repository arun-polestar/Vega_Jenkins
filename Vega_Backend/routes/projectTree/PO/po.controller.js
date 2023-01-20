const commonModel = require('../../../routes/common/Model');

const commonCtrl = require('../../../routes/common/Controller');

module.exports = {
    addPo: addPo
}

async function addPo(req, res) {
    if (!req.body.createdby || !req.body.reqtype) {
        return res.json({ state: -1, message: "Send required data" });
    } else {
        if (req.body.reqtype == 'add' || req.body.reqtype == 'edit') {
            var obj = req.body.po;
            obj.projectheaderid = req.body.projectheaderid;
            obj.reqtype = req.body.reqtype;
            obj.poId = req.body.poId;
            obj.createdby=req.body.createdby;
            obj = await commonCtrl.verifyNull(obj);
        }
        else {
            var obj = req.body;
            obj = await commonCtrl.verifyNull(obj);
        }
        obj = JSON.stringify(obj);
        commonModel.mysqlModelService('call usp_mstpo_operations(?)', [obj], function (err, results) {
            if (err) {
                return res.json({ state: -1, message: err, data: null });
            }else if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == -1) {
                return res.json({ state: results[1][0].state, message: results[1][0].message, data: null });
            }
            else if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
                return res.json({ state: 1, message: "Success", data: results });
            } else {
                return res.json({ state: -1, message: "Something went Wrong", data: null });
            }
        });
    }

}
