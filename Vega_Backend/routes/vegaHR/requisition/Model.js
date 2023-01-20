/*var mysql = require('../../services/mysqlService');

module.exports = {
	getRequisitionData:getRequisitionData
}	


function getRequisitionData (data,callback){
    var query = {
		sql: 'call usp_rmsrequisition_operations(?);',
		values: [data]
	};
	mysql.procedure_call(query, function(err, result) {
		callback(err, result);
    });
}
*/