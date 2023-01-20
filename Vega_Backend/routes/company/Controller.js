const companyModel = require('./Model');
const md5 = require('md5');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const config = require('../../config/config');
const common = require('../../lib/common');

module.exports = {
  registerCompany: registerCompany,
  companyLogin: companyLogin,
  generateToken: generateToken,
  logout: logout,
  validateRegisterToken: validateRegisterToken,
  setUpServer: setUpServer,
  validatedomain: validatedomain,
  confirmaccount: confirmaccount
}


function registerCompany(req, res, next) {


  // //console.log(`Requested data From the frontend: ${req.body}`);
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  //Validate Entries Send From Front End
  var ppppp = {
    "type": "company",
    "company_name": req.body.company_name,
    "company_email": req.body.company_email,
    "password": req.body.password,
    "company_address": req.body.company_address,
    "company_contact": req.body.company_contact
  }
  // //console.log("ppppppppp",ppppp,req.body);


  if (!req.body.company_name || !req.body.company_email || !req.body.password || !req.body.confirm_password || !req.body.company_contact) {
    res.status(400);
    return res.json({ "state": -1, "message": "Do not leave a field empty" })
  }
  else if (!re.test(String(req.body.company_email).toLowerCase())) {
    res.status(400);
    return res.json({ "state": -1, "message": "please provide the valid email Id" })
  }
  else if (!(/^[a-zA-Z ]+$/.test(req.body.company_name))) {
    res.status(400);
    return res.json({ "state": -1, "message": "please provide the valid name" })
  }
  else if (!(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$/.test(req.body.password))) {
    res.status(400);
    return res.json({ "state": -1, "message": "password should be of length more than 8 atleast 1 upprecase alphabet 1 number and 1 special character among !@#$%^&*" })
  }
  else if (req.body.password != req.body.confirm_password) {
    res.status(400);
    return res.json({ "state": -1, "message": "password and confirm password should be same" })
  }

  //If all the Entry was correct set data that will be sent to Database
  else {
    var data = {
      "type": "company",
      "company_name": req.body.company_name,
      "company_email": req.body.company_email,
      "password": md5(req.body.password),
      "company_address": req.body.company_address,
      "company_contact": req.body.company_contact,
      "subdomain": req.body.subdomain
    }

    //Call the procedure to insert data into database
    companyModel.registerSPCall(JSON.stringify(data), function (err, result) {
      // //console.log("rrrreeesssuuullttt", result);
      if (err) {
        return res.json({ "state": -1, "message": err });
      }
      else {
        var clientdata = result[0];
        if (clientdata.length == 1) {
          // //console.log("user:" ,config.mailconfig.user);
          // //console.log("pass:", config.mailconfig.password);

          var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: config.mailconfig.user,
              pass: config.mailconfig.password
            }
          });
          var linkurl = req.body.linkurl + '/confirmation?token=' + result[0][0].token + '&company_login_id=' + data.company_email;
          var filepath = path.join(__dirname + "../../emailTemplate.html");
          // //console.log("filepath----=======", filepath);
          // //console.log("linkUrl-------->",linkurl);

          var readFile = fs.readFileSync(filepath);

          readFile = readFile.toString().replace("linktheurl", linkurl);
          var mailOptions = {
            from: config.mailconfig.user,
            to: data.company_email,
            cc: config.mailconfig.user,
            subject: 'Registration Confirmation Email !!!!!!',
            html: readFile

          };
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              // //console.log(error);
            } else {
              // //console.log('Email sent: ' + info.response);
            }
          });
          return res.json({ "state": clientdata[0].state, "message": clientdata[0].message });
        }

      }
    });
  }
}



function confirmaccount(req, res, next) {
  // //console.log("Inside company login-------------====================");
  if (!req.body.company_login_id || !req.body.token) {
    res.status(400);
    return res.json({ "state": -1, "message": "Link Expired !" })
  }
  else {

    var data = {
      "type": "company",
      "company_login_id": req.body.company_login_id,
      "password": req.body.token,
      "domainkey": 'vegahrpssl'
    }
    // //console.log("dataaadaavvvvva--===>",JSON.stringify(data));
    companyModel.confirmSPCall(JSON.stringify(data), function (err, result) {
      // //console.log(result,'kkjjjjj')
      if (err) {
        return res.json({ "state": -1, "message": err });
      }

      else {
        let createdRow = result && result[0] && result[0][0];

        let foldername = createdRow.domainkey;

        // //console.log('asahshdjasdh0',createdRow);
        if (result && result[0]) {



          // //console.log('sajkfjasdjkasd',foldername);
          let elem = (createdRow.domainname.toString() + '.vega-hr.com');
          let elem2 = '192.168.1.5:' + createdRow.frontendport;
          let elem3 = ('http://localhost:' + createdRow.frontendport);
          // //console.log(elem,'keleme')
          createdRow.allowedHost = [elem, elem2, elem3];
          let dbname = createdRow.domainkey;



          // //console.log("11111111111");
          //folder creation
          var prefix = "pssl";
          var clientFolder = foldername;
          var apppath = `/home/polestar/Documents/superadmin/vegaclients/${clientFolder}`;
          var newpath = `~/Documents/superadmin/vegaclients/${clientFolder}`;
          var oldpath = '~/Documents/superadmin/skeleton';

          execSync(`mkdir ${newpath}`);
          // //console.log('Folder Created !')
          //copying the application
          //execSync(`cp -r ${oldpath}/vega.zip ${newpath}`);
          execSync(`unzip ${oldpath}/vega.zip -d ${newpath}`);
          //console.log('Folder copied !')
          execSync(`mysql -u root -pOffice365Exp3rt -h 192.168.1.54 ${dbname} < ~/Documents/superadmin/skeleton/vega_hr_skeletonscript.sql`);

          //execSync(`mysql -u root -pOffice365Exp3rt -h 192.168.1.54 ${dbname} < ~/Documents/superadmin/skeleton/vega_hr_skeletonscript.sql`);
          //execSync(`node ${newpath}/vegahr-backend/app.js`);



          let configpath = `${apppath}/vegahr-backend/config/config.js`
          let domainkey = 'test';
          let database = 'test2';
          let configdata = `'use strict';

module.exports = {
    mysqlconfig: {
        host: '192.168.1.54',
        user: 'root',//'${createdRow.domainkey}',
        password: 'Office365Exp3rt',//'test@123',
        port: 3306,
        database: '${createdRow.domainkey}'
    },
    mailconfig: {
        service: 'Gmail',
        user: 'support@polestarllp.com',
        password: '13xchange@!',
        
    },
    tokenconfig: {
        expirytype: {
            "minutes": "minutes",
            "hours": "hours",
            "days": "days",
            "weeks": "weeks",
            "months": "months",
            "years": "years"
        },//days,weeks,months,years,hours,minutes
        expiryvalue: 7
    },
    googleApiObj: {
        "type": "service_account",
        "project_id": "mimetic-surf-197106",
        "private_key_id": "c9babed65f008c5ec329d8751e4cd4711bebef2e",
        "private_key": "",
        "client_email": "addeventingooglecalendar@mimetic-surf-197106.iam.gserviceaccount.com",
        "client_id": "106969251509642947322",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://accounts.google.com/o/oauth2/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/addeventingooglecalendar%40mimetic-surf-197106.iam.gserviceaccount.com"
    },
    expiryconfig: {
        expiretime: 1
    },
    jwt:{
        secretcode:'IndiaIsGreat$@',
        expiresin:84000*7 // expires in 24 hours
    },
    jwtSecret: 'keyboardcatfusion',
    allowedHost:['${elem}','${elem2}','${elem3}'],
    appPort: ${createdRow.backendport},
    webUrl: ''

}`;
          //config file creation
          //console.log('updateing file')
          fs.writeFile(configpath, configdata, (err) => {
            if (err) throw err;
            //console.log('The Config file has been updated');
          });

          let envdata = `export const environment = {
    production: false,
    port:${createdRow.frontendport},
      apiUrl: 'http://192.168.1.5:${createdRow.backendport}/'
     };`;
          ///home/polestar/Documents/superadmin/vegaclients/vegahrpsslpssl7/vegahr-frontend-newtheme/src/environments
          let envpath = `${apppath}/vegahr-frontend-newtheme/src/environments/environment.ts`;

          fs.writeFile(envpath, envdata, (err) => {
            if (err) throw err;
            //console.log('The environment.ts file has been updated');
          });

          execSync(`cd ${newpath}/vegahr-backend && pm2 start app.js --name ${dbname}`);

          //console.log("11111111111333333");





          exec(`cd ${newpath}/vegahr-frontend-newtheme && ng s --port ${createdRow.frontendport} --host 0.0.0.0`);

          //exec(`ng s ${newpath}/app.js`);

          //config file creation





          //console.log("222222222222222222222222");
          //server up and running
          //execSync('node ~/client/psslfusion/app.js');






          res.json({ state: 1, message: 'Account confirmed !', linkurl: createdRow.domainname + '.vega-hr.com' })
        } else {
          res.json({ state: -1, messag156: 'Link Expired' })
        }
        //     if((result[0][0].state)) {156:
        //             var clientdata = result[0];
        //             if(clientdata.length) {
        //                 //console.log("cllidddddiieeeeee",clientdata[0]);
        //                 req.body.loginid = clientdata[0].loginid;
        //                 req.body.dbcreated = clientdata[0].dbcreated;
        //                 req.body.company_name = clientdata[0].company_name;
        //                 req.body.type=clientdata[0].type;
        //                 req.body.result = result;
        //                 //console.log("bodyyendffhf",req.body);
        //                res.json({state:1,message:'Acount validated !'});// next();
        //             }
        // }
      }
    });
  }
}


function setUpAccount() {
  //console.log("11111111111");
  //folder creation
  var prefix = "pssl"
  var clientFolder = `${prefix}fusion`;
  var newpath = `~/client/${clientFolder}`;
  var oldpath = '~/Documents/VegaHr/vegahr-backend';

  execSync(`mkdir ${newpath}`);
  //copying the application
  execSync(`cp -r ${oldpath}/. ${newpath}`);

  //config file creation


  /*      var app_dir=`${newpath}/config/config.js`;
     var str = `dbconfig = {
          // host: '192.168.1.54',
           host: '180.151.101.177',
           user: 'fusiontestnfjklgnsdjklg',
           password: 'test@123dfjkhdfjklh',
          // port: 3306,
          port: 9656,
           database: 'vega_hr_portalrfjkd'
       }`
  //config file creation
      fs.openSync(app_dir,'w',(err,fd) => {
          if(err) {
              //console.log("Error:",err);
              return;
          }
            fs.writeFile(fd, str, (err) => {
              if (err) throw err;
              //console.log('The file has been saved!');
          });
  
  
      });
  
  */
  //console.log("222222222222222222222222");
  //server up and running
  execSync('node ~/client/psslfusion/app.js');


}

function companyLogin(req, res, next) {
  //console.log("Inside company login-------------====================");
  if (!req.body.company_login_id || !req.body.password) {
    res.status(400);
    return res.json({ "state": -1, "message": "please provide the user login id and password" })
  }
  else {
    var data = {
      "type": "company",
      "company_login_id": req.body.company_login_id,
      "password": req.body.password
    }
    //console.log("dataaaaavvvvva--===>",data);
    companyModel.loginSPCall(JSON.stringify(data), function (err, result) {
      if (err) {
        return res.json({ "state": -1, "message": err });
      }
      // else {
      //     //console.log("result--===>",result);
      //     if(result && result[0]) {
      //         if(result[0][0]) {
      //             if(!(result[0][0].state)) {
      //                 var clientdata = result[0];

      //                 if(clientdata.length) {
      //                     req.body.loginid = clientdata[0].company_id;
      //                     req.body.company_login_id = clientdata[0].company_login_id;
      //                     req.body.dbcreated = clientdata[0].dbcreated;
      //                     req.body.company_name = clientdata[0].company_name;
      //                     req.body.type=clientdata[0].type;
      //                     req.body.result = result;
      //                     next();
      //                 } else {
      //                     return res.json({"state":-1,"message":"User Id or Password is wrong"});
      //                 }
      //             } else {
      //                 return res.json({"state":-1,"message":result[0][0].message});
      //             }
      //         } else {
      //             return res.json({"state":-1,"message":"User Id or Password is wrong"});
      //         }
      //     } else {
      //         return res.json({"state":-1,"message":"Something went wrong"});
      //     }
      // }
      else {
        if ((result[0][0].state)) {
          var clientdata = result[0];
          if (clientdata.length) {
            //console.log("clliiieeeeee",clientdata[0]);

            // req.body.loginid = clientdata[0].userloginid;
            req.body.loginid = clientdata[0].loginid;
            req.body.dbcreated = clientdata[0].dbcreated;
            req.body.company_name = clientdata[0].company_name;
            req.body.type = clientdata[0].type;
            req.body.result = result;

            //console.log("bodyyendffhf",req.body);
            next();
          }
        }
      }
    });
  }
}

function generateToken(req, res, next) {
  //console.log("into the generate token aappiiiiiiiii=============>>>>>>>>>>");
  var clientip = requestip.getClientIp(req);
  //console.log("clientipppppppppppp",clientip);
  var token = common.generateToken(req.body.loginid, clientip);
  // //console.log("return toookkkkeeeennnnn",common.generateToken(req.body.loginid,clientip));
  // //console.log("toookkkkeeeennnnn",token);
  token = "Bearer-" + token;
  // //console.log("ttttttttttttttttttttttttttttttttttttttttt",token);
  var tokentime = moment().format('YYYY-MM-DD h:mm:ss a');
  var tokenobj = {
    "token": token,
    "time": tokentime,
    "flag": true
  }
  var data = {
    "user_login_id": req.body.loginid,
    "token": token,
    "ipaddress": clientip,
    "expiryvalue": tokenconfig.expiryvalue,
    "expirytype": tokenconfig.expirytype.hours,
    "createdby": 1,
    "type": req.body.type
  }
  // //console.log("data of superadmin login generate--===",data);
  companyModel.storeTokenSPCall(JSON.stringify(data), function (err, result) {
    if (err) {
      //console.log("errererererererer",err);

      next(err);
    } else {
      //console.log("rrrresultttddgdgdgdgdg",result[0]);

      if (result && result[0]) {
        if (result[0][0].state == -1) {
          return res.json({ "state": -1, "message": result[0][0].message });
        } else {
          var obj = {
            "login_id": req.body.loginid,
            "tokens": [tokenobj],
            "type": req.body.type
          }
          common.saveTokenInCache(obj, tokenobj, function (error, response) {
            if (error) {
              return res.json({ "state": -1, "message": "user not loggedin" });
            } else {
              //console.log("rrrresultttddgdgdgdgdg",result[0]);
              return res.json({ "state": 1, "loginid": req.body.loginid, "company_name": req.body.company_name, "token": token, "type": req.body.type, "message": "user loggedin successfully" });
            }
          });
        }
      } else {
        return res.json({ "state": -1, "message": "Something went wrong" });
      }
    }
  });
}

function validateRegisterToken(req, res, next) {
  //console.log("validate register token apiiiiiiiiiiiii============>>>>>>>>>>");
  //console.log("req.body================>>>>>>>>>>>>",req.body);
  var data = req.body;
  companyModel.validateResetTokenSPCall(JSON.stringify(data), function (err, result) {
    if (err) {
      return res.json({ "state": -1, "message": err });
    } else {
      //     if(result && result[0] && result[0][0]){
      //         if(result[0][0].state==-1){	
      //             return res.json({"state":-1,"message": result[0][0].message}); 
      //         }else{
      //             res.json({
      //             "error_code":-1,
      //             "data":null,
      //             "message":"Success"
      //             });
      //             return; 
      //         } 
      // }else{
      // return res.json({"state":-1,"message": 'INVALID USER' }); 
      // }

      return res.json({ "state": result[0][0].state, "message": result[0][0].message });

    }
  });
}


function validatedomain(req, res, next) {
  //console.log("validate register token apiiiiiiiiiiiii============>>>>>>>>>>");
  if (!req.body.subdomain) {
    //console.log("req.body================>>>>>>>>>>>>",req.body);
    return res.json({ "state": -1, "message": "Required parameter is missing" });

  }
  var data = req.body;
  data.type = 'checkdomain';
  companyModel.validateResetTokenSPCall(JSON.stringify(data), function (err, result) {
    if (err) {
      return res.json({ "state": -1, "message": err });
    } else {
      return res.json({ "state": result[0][0].state, "message": result[0][0].message });

    }
  });
}


function logout(req, res, next) {
  var token = req.headers.csrf_token;
  //console.log('token',token);
  var logindata = req.body.logindata;
  var object = {
    "login_id": logindata.loginid,
    "type": logindata.type,
    "token": token,
    "option": "single"
  };
  common.deleteTokeninCache(object, function (error, status) {
    if (error) {
      return res.json({ "state": -1, "message": error });
    } else {
      if (status) {
        authModel.deleteTokenSPCall(JSON.stringify(object), function (err, result) {
          if (err) {
            next(err);
          } else {
            if (result && result[0]) {
              if (result[0][0].state == 1) {
                return res.json({ "state": 1, "message": "logout successfully" });
              } else {
                return res.json({ "state": -1, "message": result[0][0].message });
              }
            } else {
              return res.json({ "state": -1, "message": "Something went wrong" });
            }
          }
        });
      } else {
        return res.json({ "state": -1, "message": "Token is not valid" });
      }
    }
  });
}

const { execSync, exec } = require('child_process');

function setUpServer() {
  //console.log("11111111111");
  //folder creation
  var prefix = "pssl"
  var clientFolder = `${prefix}fusion`;
  var newpath = `~/client/${clientFolder}`;
  var oldpath = '~/Documents/VegaHr/vegahr-backend';

  execSync(`mkdir ${newpath}`);
  //copying the application
  execSync(`cp -r ${oldpath}/. ${newpath}`);

  //config file creation


  /*      var app_dir=`${newpath}/config/config.js`;
     var str = `dbconfig = {
          // host: '192.168.1.54',
           host: '180.151.101.177',
           user: 'fusiontestnfjklgnsdjklg',
           password: 'test@123dfjkhdfjklh',
          // port: 3306,
          port: 9656,
           database: 'vega_hr_portalrfjkd'
       }`
  //config file creation
      fs.openSync(app_dir,'w',(err,fd) => {
          if(err) {
              //console.log("Error:",err);
              return;
          }
            fs.writeFile(fd, str, (err) => {
              if (err) throw err;
              //console.log('The file has been saved!');
          });
  
  
      });
  
  */
  //console.log("222222222222222222222222");
  //server up and running
  execSync('node ~/client/psslfusion/app.js');


}
