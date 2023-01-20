var jwt = require('jsonwebtoken');
const config = require("../config/config");
const commonModel = require("../routes/common/Model")
module.exports = {
  getData: getData,
};
function getData(headers, type, callback) {
  var token = headers['x-access-token'];
  if (!token) return callback('No Token found');

  //  jwt.verify(token, config.jwt.secretcode, function(err, decoded) {
  //     if (err) return callback('Invalid Token');
  //     if(decoded) {
  //       if(!type || (type == 'user' || type == 'vendor') && ( decoded.accessType == 'user' || decoded.accessType == 'vendor')){
  //         callback(null,decoded);
  //       }
  //       else{
  //         callback('Session not applicable');
  //       }
  //     } else {
  var tokendata = {
    utoken: token,
    action: 'view',
    type: 'vendor'
  }
  var tokendataobj = JSON.stringify(tokendata);
  commonModel.mysqlModelService('call usp_trxtoken_mgm(?)', [tokendataobj], function (err, results1) {
    if (err) {
      callback('Session not applicable');
    } else {
      if (results1[0] && results1[0][0] && results1[0][0].jsondata) {
        var newData = JSON.parse(results1[0][0].jsondata);
        newData.vendor_status = results1[0][0].vendor_status;
        newData.logo = results1[1][0];
        //console.log("new DTAAAAAAAAAAAAAAA",newData,"aaaaaaa",results1[0][0].vendor_status)
        callback(null, newData);
      } else {
        callback('Session not applicable');
      }
    }
  });
}
  //});
//}