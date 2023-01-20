'use strict'

var fs = require('fs');
var request = require('request');
const path = require('path');
var qlik=require('../../config/qlikconfig')

//define certificate folder
//var directory = "C:\\ProgramData\\Qlik\\Sense\\Repository\\Exported Certificates\\your-sense-server\\";
var filepath=path.join(__dirname+'../../../assets/qlik_cert/');
var userDirectory="";
var userName="";


module.exports = {
  qlikauth:qlikAuth,
}


function qlikAuth (req,res){
  
  /**   PUT QLIK UserName and userDirectory here 
    userDirectory=req.body.tokenFatchedData.userdir;
    userName=req.body.tokenFatchedData.username;*/

    userDirectory="Polestar";
    userName="qlikproductsdev2";
    //set up request options
    var options = {
      uri: 'https://'+qlik.host+':'+qlik.port+'/qps/'+qlik.virtualproxy + '/ticket?xrfkey='+qlik.xrfKey,
      headers: {'content-type': qlik.contentType,
      'X-Qlik-xrfkey': qlik.xrfKey,
      'X-Qlik-user': 'UserDirectory='+userDirectory+';UserId='+userName
        },
      method: 'POST',
      body: {
      "UserDirectory": userDirectory,
      "UserId": userName,
      "Attributes": [],
      //"TargetId": targetId
    },
    json: true,
      ca: fs.readFileSync(filepath+ "server.pem"),
      key: fs.readFileSync(filepath+"client_key.pem"),
      cert: fs.readFileSync(filepath+"client.pem"),
      rejectUnauthorized: false
    };
    
    //send request
    request(options, function (error, response, body) {
        if(error) 
        {
            console.log('Error: '+error);
            //console.log(response);
            return res.json({ state: -1, message: error, data: null });
        } 
        else 
        {
            console.log("== Got a ticket ==");
            // console.log(response.statusCode);
            // console.log("Ticket: " + response.body.Ticket);
            //console.log("TargetUri: " + response.body.TargetUri);
            return res.json({ state: 1, message: "Success", data: response && response.body && response.body.length && response.body['Ticket'].length && response.body.Ticket });

            //callback(response.body.Ticket); // This is the redirect URL!
        }
    });
    
}
