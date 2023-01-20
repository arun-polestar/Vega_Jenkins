const proc = require('../common/procedureConfig');
const commonModel = require('../common/Model');
const commonCtrl = require('../common/Controller');



module.exports={
    addnotes:addnotes,
    viewnotes:viewnotes
}


function addnotes(req,res){
    if(!req.body || !req.body.action || !req.body.description){
        return res.json({message:"Send required data",state:-1})

    }
     let obj=JSON.stringify(req.body);
     commonModel.mysqlPromiseModelService(proc.notes, [obj])
     .then(results => {
         if (results && results[0] && results[0][0] && results[0][0].state && results[0][0].state == 1) {
             return res.json({ state: results[0][0].state, message: results[0][0].message, data: results && results[0] });
         } else {
             return res.json({ state: -1, message: "Something went wrong", data: null });
         }
     })
     .catch(err => {
         return res.json({ state: -1, data: null, message: err.message || err });
     })
}

function viewnotes(req,res){
    if(!req.body || !req.body.action ){
        return res.json({message:"Send required data",state:-1})

    }
     let obj=JSON.stringify(req.body);
     commonModel.mysqlPromiseModelService(proc.notes, [obj])
     .then(results => {
         if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
             return res.json({ state: results[1][0].state, message: results[1][0].message, data: results && results[0] });
         } else {
             return res.json({ state: -1, message: "Something went wrong", data: null });
         }
     })
     .catch(err => {
         return res.json({ state: -1, data: null, message: err.message || err });
     })
}