const commonModel = require('../../../routes/common/Model');
const commonCtrl = require('../../../routes/common/Controller');

module.exports = {
    addProgram: addProgram,
    viewprogram:viewprogram
}

async function addProgram(req, res) {
    if(!req.body.createdby || !req.body.reqtype){
        return res.json({state:-1,message:"Send required data"});
    }
     if (req.body.reqtype == 'add' || req.body.reqtype == 'edit') {
        var obj = req.body.program;
        obj.programId=req.body.programId;
        obj.projectheaderid = req.body.projectheaderid;
        obj.reqtype = req.body.reqtype;
        obj.createdby=req.body.createdby;
        obj = await commonCtrl.verifyNull(obj);
    }
    else {
        var obj = req.body;
        obj = await commonCtrl.verifyNull(obj);
    }
    obj = JSON.stringify(obj);
    commonModel.mysqlModelService('call usp_mstprogram_operations(?)', [obj], function (err, results) {
        if (err) {
            return res.json({ state: -1, message: err, data: null });
        }else if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == -1) {
            return res.json({ state: results[1][0].state, message: results[1][0].message, data: null });
        } else if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
            return res.json({ state: 1, message: "Success", data: results });
        } else {
            return res.json({ state: -1, message: "Something went Wrong", data: null });
        }
    });
}


function viewprogram(req, res) {
    if (!req.body.createdby || !req.body.projectheaderid || !req.body.reqtype) {
         return res.json({ state: -1, message: "Send required data" });
    }
    var obj = req.body;
    commonModel.mysqlModelService('call usp_mstprogram_operations(?)', [JSON.stringify(obj)], function (err, results) {
        if (err) {
            return res.json({ state: -1, message: err, data: null });
        } else if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
            return res.json({ state: results[1][0].state, message: results[1][0].message, data: results });
        } else {
            return res.json({ state: -1, message: "somethng went wrong", data: null });
        }
    });
}


