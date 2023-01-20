const mysql = require("../../services/mysqlService");

module.exports = {
  mysqlModelService: mysqlModelService,
  mysqlPromiseModelService: mysqlPromiseModelService,
  mysqlPromiseModelServiceLazy: mysqlPromiseModelServiceLazy,
};
function mysqlModelService(query, data, callback) {
  var query1 = {
    sql: query,
    values: data,
  };
  mysql.procedure_call(query1, function (err, result) {
    callback(err, result);
  });
}

function mysqlPromiseModelService(query, data) {
  return new Promise((resolve, reject) => {
    var query1 = {
      sql: query,
      values: data,
    };
    mysql.procedure_call(query1, function (err, result) {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
}

function mysqlPromiseModelServiceLazy(query, data, callback) {
  var query1 = {
    sql: query,
    values: data,
  };
  mysql.procedure_call_Lazy(query1, function (err, result) {
    callback(err, result);
  });
}
