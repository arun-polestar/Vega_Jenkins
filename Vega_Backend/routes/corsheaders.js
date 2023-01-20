var { allowedHost, env } = require("../config/config");
var allowedHosts = allowedHost;
allowedHosts.push("https://accounts.google.com");
allowedHosts.push("https://c2c.vega-hr.com");
var ipsec = {
  CrossOriginHeaders: function (req, res, next) {
    //var date = new Date();
    console.log(
      "**************" +
      req.path +
      "*************" +
      req.connection.remoteAddress
    );
    let referer = req.headers["referer"] && req.headers["referer"].slice(0, -1);
    let ifconditon =
      env == "development"
        ? true
        : allowedHosts.indexOf(req.headers.origin) > -1 ||
        allowedHosts.indexOf(req.connection.remoteAddress) > -1 ||
        (allowedHosts.indexOf(referer) > -1 &&
          req.method == "GET" &&
          (!req.headers.origin || req.headers.origin == referer)) ||
        (req.headers["x-walletkey"] &&
          req.headers["x-walletkey"] == "walletkey") ||
        (req.headers["x-origin"] &&
          (req.headers["x-origin"] == "mawai" ||
            req.headers["x-origin"] == "VegaC2C"));
    if (ifconditon) {
      //if (1 == 1) {

      res.header(
        "Access-Control-Allow-Origin",
        req.headers.origin ? req.headers.origin : referer ? referer : true
      );
      // res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, PATCH, DELETE"
      );
      res.header("Access-Control-Allow-Credentials", "true");
      res.header(
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Headers,withCredentials, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization, X-access-token,Date,Token,x-origin"
      );
      res.header("Access-Control-Expose-Headers", "Date");
      res.header("Access-Control-Request-Private-Network", "true")
      // res.header('date',new Date())
      if (req.method === "OPTIONS") {
        res.sendStatus(200);
        return;
      }
      return next();
    }
    return res.sendStatus(403);
  },
};

module.exports = ipsec;
