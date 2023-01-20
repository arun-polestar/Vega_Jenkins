'use strict';

var cron = require('node-cron');

var common = require('../lib/common');
var tokenconfig = require('../config/config').expiryconfig;

module.exports = {
	checkComapnyTokenExpiry: function() {
		var ctime = "*/"+(tokenconfig.expiretime * 60)+" * * * *";
		// console.log('ctime',ctime);
		cron.schedule(ctime, function(){   //minutes hours dayOfMonth month dayOfWeek
		//   console.log('running a task every minute for company');
		  common.checkCompanyExpiry();
		});
	},

	checkUserTokenExpiry: function() {
		//var utime = "*/"+((tokenconfig.expiretime * 2)+3)+" * * * *";
		var utime = "*/"+((tokenconfig.expiretime * 60)+3)+" * * * *";
		// console.log('utime',utime);
		cron.schedule(utime, function(){   //minutes hours dayOfMonth month dayOfWeek
		//   console.log('running a task every minute for user');
		  common.checkUserExpiry();
		});
	}
}

