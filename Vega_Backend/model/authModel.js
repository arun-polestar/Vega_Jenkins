'use strict';

var mysql = require('../services/mysqlService').executeQuery;

module.exports = {
	loginSPCall: function(data, callback) {
		var query = {
			sql: 'call usp_login(?);',
			values: [data]
		};
		mysql(query, function(err, result) {
			callback(err, result);
		});
	},
	storeTokenSPCall: function(data,callback){
		var query={
			sql: 'call usp_storetoken(?);',
			values: [data]
		};
		mysql(query, function(err, result) {
			callback(err, result);
		});
	},
	checkTokenSPCall: function(data,callback){
		var query={
			sql: 'call usp_validate_token(?);',
			values: [data]
		};
		mysql(query, function(err, result) {
			callback(err, result);
		});
	},
	deleteTokenSPCall: function(data,callback){
		var query={
			sql: 'call usp_delete_token(?);',
			values: [data]
		};
		mysql(query, function(err, result) {
			callback(err, result);
		});
	}

}