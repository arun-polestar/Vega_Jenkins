var authService = require('./authService');


module.exports = function (req, res, next) {

  authService.validateAPIKey(req, function (err, data) {
    if (err) return res.json({ "state": 0, "message": err });
    req.body.jsondata = data;
    // console.log("dd", data)
    return next();
  });

};



