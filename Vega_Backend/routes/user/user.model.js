'use strict';

var mysql = require('../../services/mysqlService').executeQuery;

module.exports = {
  loginSPCall: function (data, callback) {
    //console.log(data);
    var query = {
      sql: 'call usp_login(?);',
      values: [data]
    };
    mysql(query, function (err, result) {
      callback(err, result);
    });
  }

}