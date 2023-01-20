const common = require("../../lib/common");
const option = require("../../config/config").superadmin;
const optionConfig = require("../../config/config");
const commonModel = require("../../routes/common/Model");
const config = require("../../config/config");
const _ = require("underscore");
const axios = require("axios");

var http;
if (config.env && config.env == "development") {
  http = require("http");
} else {
  http = require("https");
}
// const https = require('https');

module.exports = {
  getfeature: getfeature,
  upgradepackage: upgradepackage,
  getclientdata: getclientdata,
  commonfunc: commonfunc,
  axioscommonfunc,
};

var options = {
  method: "POST",
  rejectUnauthorized: false,
};
/*
var options = {
    host: option.host,
    port: option.port,
    method: option.method,
    url:option.url
} */

function commonfunc(options) {
  // //console.log(options,"hasdjkasdjhdjasd");
  return new Promise((resolve, reject) => {
    var data1 = "";
    var req = http.request(option.url, options, (response) => {
      response.setEncoding("utf8");
      response.on("data", (chunk) => (data1 = data1.concat(chunk)));
      response.on("end", () => resolve(JSON.parse(data1)));
    });
    req.on("error", (err) => {
      reject(err);
    });
    req.write(options.data);
    req.end();
  });
}

function axioscommonfunc(url, obj) {
  // //console.log(options,"hasdjkasdjhdjasd");
  return new Promise((resolve, reject) => {
    axios
      .post(url, obj, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((results) => {
        resolve(results);
      })
      .catch((e) => {
        reject((e && e.message) || e);
      });
  });
}

function upgradepackage(req, res) {
  var obj = req.body;
  let domain = optionConfig.webUrlLink.substring(
    optionConfig.webUrlLink.indexOf("/") + 2,
    optionConfig.webUrlLink.indexOf(".")
  );
  obj.domain = domain;
  var data = JSON.stringify({
    obj,
  });
  // //console.log("sajhadhdaj;lhdajads",data)
  options.path = "/upgradeRequest";
  options.data = data;
  headers = {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  };
  options.headers = headers;

  commonfunc(options)
    .then((res33) => {
      if (res33) {
        // let currdate = new Date().toLocaleString();
        // //console.log(currdate,"lkfhkjhdslkfhbdj.lkfna");
        // //console.log(res33,"ahdjhdjsk");
        res.json({
          state: "1",
          message: "Data",
          data: res33.data,
        });
      }
    })
    .catch((err) => {
      //console.log(err);
      res.json({
        state: "0",
        message: "Something Went Wrong",
        err: err,
      });
    });
}

function getfeature(req, res) {
  // frontendheader : req.headers
  // var data = JSON.stringify({
  // });
  let domain = optionConfig.webUrlLink.substring(
    optionConfig.webUrlLink.indexOf("/") + 2,
    optionConfig.webUrlLink.indexOf(".")
  );
  var data = JSON.stringify({
    domain: domain,
  });
  options.data = data;
  options.path = "/getfeatures";
  headers = {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  };
  options.headers = headers;

  commonfunc(options)
    .then((res33) => {
      if (res33) {
        // let currdate = new Date().toLocaleString();
        // //console.log(currdate,"lkfhkjhdslkfhbdj.lkfna");
        // //console.log(res33,"ahdjhdjsk");
        res.json({
          state: "1",
          message: "Data",
          data: res33.data,
          clientpackage: res33.clientpackage,
          CompanyName:
            res33.expire && res33.expire[0] && res33.expire[0].CompanyName,
        });
      }
    })
    .catch((err) => {
      //console.log(err);
      res.json({
        state: "0",
        message: "Something Went Wrong",
        err: err,
      });
    });
}

function getclientdata(req, res) {
  // frontendheader : req.headers
  // var data = JSON.stringify({
  // });

  let domain = optionConfig.webUrlLink.substring(
    optionConfig.webUrlLink.indexOf("/") + 2,
    optionConfig.webUrlLink.indexOf(".")
  );
  var data = JSON.stringify({
    domain: domain,
  });
  options.path = "/getfeatures";
  options.data = data;
  headers = {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  };
  options.headers = headers;

  commonModel.mysqlModelService(
    "call usp_userinfo_count()",
    [],
    (err, resultdata) => {
      if (!err) {
        commonfunc(options)
          .then((res33) => {
            if (res33) {
              // //console.log((res33.isblock == 0)?1:0,"asjkaljakd",res33.isblock);
              let currdate = new Date();
              let modulesaccess = [];
              resultdata &&
                resultdata[2] &&
                resultdata[2].map(function (item1) {
                  res33 &&
                    res33.data.map(function (item2) {
                      if (item1.alias == item2.alias) {
                        modulesaccess.push(item1.configvalue2);
                      }
                    });
                });

              // //console.log("Api Request for Client Data With SuperAdmin Api at :-" + currdate,res33&&res33.data, res33&& res33.clientpackage,res33&&res33.expire&&res33.expire[0]);
              res.json({
                state: res33.isblock == 0 ? 1 : 0,
                message:
                  res33.isblock == 0
                    ? "Data Fetch Sucessfully"
                    : "Something Went Wrong",
                data: res33 && res33.data,
                clientpackage: res33 && res33.clientpackage,
                enddate:
                  res33 &&
                  res33.expire &&
                  res33.expire[0] &&
                  res33.expire[0].packageenddate,
                clientdata: res33 && res33.expire && res33.expire[0],
                currentdate: currdate,
                employee: {
                  currentusercount:
                    resultdata[0][0] && resultdata[0][0].currentusercount,
                  currentcvcount:
                    resultdata[0][0] && resultdata[0][0].currentcvcount,
                  employeecount: resultdata[1][0] && resultdata[1][0].count,
                  hiringmanager: resultdata[1][1] && resultdata[1][1].count,
                  hodcount: resultdata[1][2] && resultdata[1][2].count,
                  hradmincount: resultdata[1][3] && resultdata[1][3].count,
                  hrusercount: resultdata[1][4] && resultdata[1][4].count,
                  interviewercount: resultdata[1][5] && resultdata[1][5].count,
                },
                quarantineperiod: res33 && res33.quarantineperiod,
                modulesaccess: modulesaccess && _.uniq(modulesaccess),
              });
            }
          })
          .catch((err) => {
            //console.log(err);
            res.json({
              state: "0",
              message: "Something Went Wrong",
              err: err,
            });
          });
      } else {
        res.json({
          state: "0",
          message: "Something Went Wrong",
          err: err,
        });
      }
    }
  );
}
