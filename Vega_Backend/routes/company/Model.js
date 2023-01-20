var mysql = require('../../services/mysqlService');

module.exports = {
	registerSPCall : registerSPCall,
	loginSPCall:loginSPCall,
	storeTokenSPCall:storeTokenSPCall,
	checkTokenSPCall:checkTokenSPCall,
	validateResetTokenSPCall:validateResetTokenSPCall,
	confirmSPCall:confirmSPCall

}	

 function registerSPCall(data, callback) {
	var parsedData = JSON.parse(data);
	var query = {
		sql: 'call usp_register_company(?);',
		values: [data]
	};
	mysql.procedure_call(query, function(err, result) {
		callback(err, result);
	});
}


 function loginSPCall(data, callback) {
	var query = {
		sql: 'call usp_login(?);',
		values: [data]
	};
	mysql.procedure_call(query, function(err, result) {
		callback(err, result);
	});
}


function confirmSPCall(data, callback) {
	var query = {
		sql: 'call usp_company_confirmation(?);',
		values: [data]
	};
	mysql.procedure_call(query, function(err, result) {
		callback(err, result);
	});
}


function storeTokenSPCall(data,callback){
	var query={
		sql: 'call usp_storetoken(?);',
		values: [data]
	};
	mysql.procedure_call(query, function(err, result) {
		callback(err, result);
	});
}


function checkTokenSPCall(data,callback){
	var query={
		sql: 'call usp_validate_token(?);',
		values: [data]
	};
	mysql.procedure_call(query, function(err, result) {
		callback(err, result);
	});
}

function validateResetTokenSPCall(data,callback){
	var query={
		sql: 'call usp_validate_reset_token(?);',
		values: [data]
	};
	mysql.procedure_call(query, function(err, result) {
		callback(err, result);
	});
}
