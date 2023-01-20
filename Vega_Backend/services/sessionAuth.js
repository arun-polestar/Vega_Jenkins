var _ = require("underscore");
// var bcrypt = require('bcryptjs');
var authService = require("./authService");

module.exports = async function (req, res, next) {
  authService.getData(req.headers, 'user', function (err, data) {
    if (err) return res.json({ "state": 0, "message": err });
    if (req.body) {
      req.body.createdby = data.id;
      req.body.tokenFetchedData = data;
      req.body = _.mapObject(req.body, function (val, key) {
        if (val && val.constructor === Array && val.length == 0) val = '';
        return (val == null) ? undefined : val;
      });
    }
    return next();
  });
};
