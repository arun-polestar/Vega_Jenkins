
const authServiceVendor = require('../../services/authServiceVendor');

module.exports = function(req, res, next) {

    // User is allowed, proceed to the next policy, 
    // or if this is the last policy, the controller
    authServiceVendor.getData(req.headers,'vendor',function(err,data){
        if(err){
            next(err);
        }else{
            if(data && req.body && req.body.constructor === Object){
                req.body.tokenFetchedData = data;
              }
              return next(null,data);
        }
    });
  
  };