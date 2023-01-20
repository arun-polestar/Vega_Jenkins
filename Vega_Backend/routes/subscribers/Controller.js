'use strict'

var mysql = require('../../services/mysqlService').executeQuery;


module.exports={
    subscriberData:subscriberData,
    superadminRequest:superadminRequest
}

function subscriberData(req,res){
    var obj = req.body;
    
    var query = {
        sql: 'call usp_superadmin_request(?);',
		values: [JSON.stringify(obj)]
    }
    mysql(query, (err, result)=>{
        if(err){
            res.json({
                'state':-1
            })
        }else{
            res.json({
                'res' : result
            })
        }
    });
}

function superadminRequest(req,res){
    var obj = req.body;
    
    var query = {
        sql: 'call usp_superadmin_request(?);',
		values: [JSON.stringify(obj)]
    }
    mysql(query, (err, result)=>{
        if(err){
            res.json({
                'state':-1
            })
        }else{
            res.json({
                'res' : result
            })
        }
    });
}
