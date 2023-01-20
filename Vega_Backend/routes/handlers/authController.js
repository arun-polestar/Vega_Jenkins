'use strict';
var requestip = require('request-ip');
var NodeCache = require('persistent-cache');
const servercache = new NodeCache();
var _ = require('lodash');
var moment = require('moment');

var authModel = require('../../model/authModel');
var common = require('../../lib/common');
var tokenconfig = require('../../config/config').tokenconfig;
const companyModel = require('../company/Model');

module.exports = {
  
	loginUser: function(req, res, next) {
		if(!req.body.user_login_id || !req.body.password) {
			res.status(400);
			return res.json({"state":-1,"message":"please provide the user login id and password"})
		}
		var data = {
			"type":"user",
			"user_login_id":req.body.user_login_id,
			"password":req.body.password
		}
		authModel.loginSPCall(JSON.stringify(data),function(err,result){
			if(err) {
				next(err);
			} else {
				if(result && result[0]) {
					if(result[0][0]) {
						if(!(result[0][0].state)) {
							var clientdata = result[0];
							if(clientdata.length == 1) {
								req.body.loginid = clientdata[0].user_id;
								req.body.type = 'user';
								next();
							} else {
								return res.json({"state":-1,"message":"User Id or Password is wrong"});
							}
						} else {
							return res.json({"state":-1,"message":result[0][0].message});
						}
					} else {
						return res.json({"state":-1,"message":"User Id or Password is wrong"});
					}
				} else {
					return res.json({"state":-1,"message":"Something went wrong"});
				}
			}
		});
	},

	loginCompany: function(req, res, next) {
		if(!req.body.user_login_id || !req.body.password) {
			res.status(400);
			return res.json({"state":-1,"message":"please provide the user login id and password"})
		}
		var data = {
			"type":"company",
			"user_login_id":req.body.user_login_id,
			"password":req.body.password
		}
		authModel.loginSPCall(JSON.stringify(data),function(err,result){
			if(err) {
				next(err);
			} else {
				if(result && result[0]) {
					if(result[0][0]) {
						if(!(result[0][0].state)) {
							var clientdata = result[0];
							if(clientdata.length == 1) {
								req.body.loginid = clientdata[0].company_id;
								req.body.type = 'company';
								next();
							} else {
								return res.json({"state":-1,"message":"User Id or Password is wrong"});
							}
						} else {
							return res.json({"state":-1,"message":result[0][0].message});
						}
					} else {
						return res.json({"state":-1,"message":"User Id or Password is wrong"});
					}
				} else {
					return res.json({"state":-1,"message":"Something went wrong"});
				}
			}
		});
	},

	 generateToken:function(req, res, next) {
		// console.log("into the generate token aappiiiiiiiii=============>>>>>>>>>>");
		var clientip = requestip.getClientIp(req);
		// console.log("clientipppppppppppp",clientip);
		var token = common.generateToken(req.body.loginid,clientip);
		// console.log("return toookkkkeeeennnnn",common.generateToken(req.body.loginid,clientip));
	   // console.log("toookkkkeeeennnnn",token);
		token = "Bearer-"+token;
		// console.log("ttttttttttttttttttttttttttttttttttttttttt",token);
		var tokentime = moment().format('YYYY-MM-DD h:mm:ss a');
		var tokenobj={
			"token":token,
			"time":tokentime,
			"flag":true
		}
		var data={
			"user_login_id":req.body.loginid,
			"token":token,
			"ipaddress":clientip,
			"expiryvalue":tokenconfig.expiryvalue,
			"expirytype":tokenconfig.expirytype.hours,
			"createdby":1,
			"type":req.body.type
		}
		// console.log("data of superadmin login generate--===",data);
		companyModel.storeTokenSPCall(JSON.stringify(data),function(err,result){
			if(err) {
				// console.log("errererererererer",err);
				
				next(err);
			}else {
				// console.log("rrrresultttddgdgdgdgdg",result[0]);
				
				if(result && result[0]) {
					if(result[0][0].state==-1) {
						return res.json({"state":-1,"message":result[0][0].message});
					} else {
						var obj = {
							"login_id":req.body.loginid,
							"tokens": [tokenobj],
							"type":req.body.type
						}
						common.saveTokenInCache(obj,tokenobj,function(error,response){
							if(error) {
								return res.json({"state":-1,"message":"user not loggedin"});
							} else {
								// console.log("rrrresultttddgdgdgdgdg",{"state":1,"loginid":req.body.loginid,"company_name":req.body.company_name,"token":token,"type":req.body.type,"message":"user loggedin successfully"});
								return res.json({"state":1,"loginid":req.body.loginid,"company_name":req.body.company_name,"token":token,"type":req.body.type,"message":"user loggedin successfully"});
							}
						});
					}
				} else {
					return res.json({"state":-1,"message":"Something went wrong"});
				}
			} 
		}); 
	},

	validateToken: function(req, res, next) {
		// console.log("reqqqqqeeeeeee",req.body,"jhbdjhbdsjhfjh",req.headers);
		
		if(req.headers.csrf_token) {
			var token = req.headers.csrf_token;
			if(req.body.logindata) {
				var logindata = req.body.logindata;
				if(logindata.loginid && logindata.type) {
					var object = {
						"login_id":logindata.loginid,
						"type":logindata.type,
						"token":token
					};
					common.checkTokeninCache(object,function(error,valid){
						if(error) {
							return res.json({"state":-1,"message":error});
						} else {
							if(valid) {
								next();
							} else {
								authModel.checkTokenSPCall(JSON.stringify(object),function(err,result){
									if(err) {
										next(err);
									} else{
										if(result && result[0]) {
											if(result[1][0].state == 1) {
												var tokentime = moment().format('YYYY-MM-DD h:mm:ss a');
												var tokenobj={
													"token":token,
													"time":tokentime,
													"flag":true
												};
												var obj = {
													"login_id":logindata.loginid,
													"tokens": [tokenobj],
													"type":logindata.type
												};
												common.saveTokenInCache(obj,tokenobj,function(error,response){
													if(error) {
														return res.json({"state":-1,"message":error});
													} else {
														next();
													}
												});
											} else {
												return res.json({"state":-1,"message":result[0][0].message});
											}
										} else {
											return res.json({"state":-1,"message":"Something went wrong"});
										}
									}
								});
							}
						}
					});
				} else {
					return res.json({"state":-1,"message":"Required fields are missing in Logindata"});
				}
			} else {
				return res.json({"state":-1,"message":"Logindata is missing"});
			}
		} else {
			return res.json({"state":-1,"message":"Token is missing"});
		}
	},
	tokenStatus: function(req, res, next) {
		return res.json({"state":1,"message":"valid"});
	},
	logout: function(req, res, next) {
		var token = req.headers.csrf_token;
		// console.log('token',token);
		var logindata = req.body.logindata;
		var object = {
			"login_id":logindata.loginid,
			"type":logindata.type,
			"token":token,
			"option":"single"
		};
		common.deleteTokeninCache(object,function(error,status){
			if(error) {
				return res.json({"state":-1,"message":error});
			} else {
				if(status) {
					authModel.deleteTokenSPCall(JSON.stringify(object),function(err,result){
						if(err) {
							next(err);
						} else {
							if(result && result[0]) {
								if(result[0][0].state == 1) {
									return res.json({"state":1,"message":"logout successfully"});
								} else {
									return res.json({"state":-1,"message":result[0][0].message});
								}
							} else {
								return res.json({"state":-1,"message":"Something went wrong"});
							}
						}
					});
				} else {
					return res.json({"state":-1,"message":"Token is not valid"});
				}
			}
		});
	},
	logoutFromAllDevice: function(req, res, next) {
		var token = req.headers.csrf_token;
		var logindata = req.body.logindata;
		var object = {
			"login_id":logindata.loginid,
			"type":logindata.type,
			"token":token,
			"option":"all"
		};
		common.deleteUserinCache(object,function(error,status){
			if(error) {
				return res.json({"state":-1,"message":error});
			} else {
				if(status) {
					authModel.deleteTokenSPCall(JSON.stringify(object),function(err,result){
						if(err) {
							next(err);
						} else {
							if(result && result[0]) {
								if(result[0][0].state == 1) {
									return res.json({"state":1,"message":"logout successfully"});
								} else {
									return res.json({"state":-1,"message":result[0][0].message});
								}
							} else {
								return res.json({"state":-1,"message":"Something went wrong"});
							}
						}
					});
				} else {
					return res.json({"state":-1,"message":"Token is not valid"});
				}
			}
		});
	}
}

