var mysql = require('../../services/mysqlService');

	module.exports = {
		todosSPCall : todosSPCall,
		todosCategorySPCall:todosCategorySPCall 
	}	

	function todosSPCall(data, callback) {
		// var parsedData = JSON.parse(data);
		var query = {
			sql: 'call usp_todos_operations(?);', 
			values: [data] 
		};
		mysql.procedure_call(query, function(err, result) { 
			callback(err, result); 
		});
	} 

	function todosCategorySPCall(data, callback) { 
		// var parsedData = JSON.parse(data);
		var query = {
			sql: 'call usp_todos_category_operations(?);', 
			values: [data]
		}; 
		mysql.procedure_call(query, function(err, result) { 
			callback(err, result); 
		});
	}

