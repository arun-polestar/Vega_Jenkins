const errorService = require('./errorService');
const pool = require('../mysqlpool')
const stream = require('stream');

module.exports = {

  executeQuery: executeQuery,
  procedure_call: procedure_call,
  procedure_call_Lazy: procedure_call_Lazy,
  executeLazyQuery: executeLazyQuery,
  //getAllScheduler:getAllScheduler
}

function executeQuery(query, callback) {
  try {
    if (!query) {
      var error = new Error("Query field can not left blank");
      return callback(error, null);
    }
    pool.query(query, function (err, result) {
      if (err) {
        return callback(err);
      } else {
        callback(null, result);
      }
    });
  } catch (err) {
    res.status(403);
    res.json({ error_code: 403, error_message: "Please provide the values of all required fields" });
  }
}
function procedure_call(sqlQuery, cb) {
  try {
    module.exports.executeQuery(sqlQuery, function (err, results) {
      if (err) {
        return cb(err);
      }
      errorService.getError(results && results[0] && results[0][0], function (err) {
        if (err) return cb(err);
        return cb(err, results);
      });
    });
  }
  catch (e) {
    //console.log(e);
  }
}

function procedure_call_Lazy(sqlQuery, cb) {
  try {
    module.exports.executeLazyQuery(sqlQuery, function (err, results) {
      //  console.log('askjdahfsdhfdshjfdhjgdfjhgdsfa',err,results)
      if (err) {
        return cb(err);
      }
      errorService.getError(results[0][0], function (err) {
        if (err) return cb(err);
        return cb(err, results);
      });
    });
  }
  catch (e) {
    console.log(e)
  }
}
function executeLazyQuery(query, callback) {
  try {
    if (!query) {
      var error = new Error("Query field can not left blank");
      return callback(error, null);
    }
    pool.getConnection(function (err, connection) {
      if (err) {
        return callback(err, null);
      } else {
        // connection.query(query, function(err, result) {

        //  callback(err, result);
        //  connection.release();
        // });
        var rowsToProcess = [];

        connection.query(query)
          .stream()
          .pipe(stream.Transform({
            objectMode: true,
            transform: function (data, encoding, callback2) {
              rowsToProcess.push(data);

              // do something with data...
              callback2()

            }
          })
            .on('finish', function (data2) {
              callback(null, rowsToProcess)
              connection.release();
            })
          )
      }
    });
  } catch (err) {
    res.status(403);
    res.json({ error_code: 403, error_message: "Please provide the values of all required fields" });
  }

}