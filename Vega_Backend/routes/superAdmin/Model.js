'use strict';

var mysql = require('../../services/mysqlService').executeQuery;

module.exports = {
    loginSPCall: function(data, callback) {
        var query = {
            sql: 'call usp_login_superadmin(?);',
            values: [data]
        };
        mysql(query, function(err, result) {
            callback(err, result);
        });
    }
}  