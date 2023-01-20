const query = require('../../routes/common/Model').mysqlPromiseModelService;
const verifyNull = require('../common/utils').removeFalseyLike;
const commonModel = require('../../routes/common/Model');
const _ = require('underscore');

module.exports={
  organisationconfig: organisationconfig,
  getpmrm:getpmrm
}

function organisationconfig(req,res) {
    req.body = _.mapObject(req.body, function (val, key) {
        if (val && val.constructor === Array) {
            val = val.toString();
        }
        return val; 
    })
    var obj = req.body;
    obj.reqtype = 'organisation';
    console.log("sajdhasjadskjas",obj);
    commonModel.mysqlModelService('call usp_organisation_config(?)',[JSON.stringify(obj)],(err,result)=>{
        if(err){
           return  res.json({ "state": -1,"message" : err.message|| JSON.stringify(err) ||'Something Went Wrong', "data":err.message|| JSON.stringify(err)
            })
        }
        else{
            if(req.body.action=='view'){
               return res.json({"state": result[1] && result[1][0] && result[1][0].state,
                     "message" : result[1] && result[1][0] && result[1][0].message,
                     "data":result[0]}) 
            }else if(req.body.action=='insert'){
                let mapobj = {
                    countryid: req.body.country,
                    workforceid: req.body.workforce,
                    locationid: req.body.location,
                    businessunitid: req.body.businessunit,
                    createdby: req.body.createdby,
                    configcode: 'organisation',
                }
                mapobj.mapaction = req.body.id ? 'edit':'add';
                mapobj.id =req.body.id ? req.body.id : result[0] && result[0][0] && result[0][0].state;
                commonModel.mysqlModelService('call usp_hr_mapping_operations(?)',[JSON.stringify(mapobj)],(err,mapresult)=>{
                    if(err){
                        return  res.json({ "state": -1,"message" : err.message|| JSON.stringify(err) ||'Something Went Wrong', "data":err.message|| JSON.stringify(err)
                        })
                    }
                    else{
                        return res.json({"state": 1,
                                        "message" : result[0] && result[0][0] && result[0][0].message,
                                        "data":result[0]
                                    })
                    }
                })
                               
            }else{
               return res.json({"state": -1,
                     "message" : "Invalid Action"})
            }
            
        }
    })
}

async function getpmrm(req, res) {
  try {
    let obj = req.body;
    obj.action='get_pm_rm'
    await verifyNull(obj);
    let result = await query('call usp_master_data(?)', [JSON.stringify(obj)]);
    if (!result) {
      return res.json({ message: result.message, state: -1, data: null });
    }

    return res.json({ message: 'Success', state: 1, data: result })
  } catch (error) {
    console.log(error);
    return res.json({ message: error, state: -1, data: null });
  }
}


