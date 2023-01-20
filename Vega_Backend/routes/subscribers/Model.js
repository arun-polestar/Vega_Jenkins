var mysql = require('../../services/mysqlService');

module.exports = {
	superadminRequest:superadminRequest
}	

function superadminRequest(data, callback) {
	var parsedData = JSON.parse(data);
	var query = {
		sql: 'call usp_superadmin_request(?);',
		values: [data]
	};
	mysql.procedure_call(query, function(err, result) {
		callback(err, result);
    });
}