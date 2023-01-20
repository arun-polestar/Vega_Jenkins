var jwt = require("jsonwebtoken");
const commonModel = require("../routes/common/Model");
const proc = require("../routes/common/procedureConfig");
const config = require("../config/config");
const fs = require("fs");
const path = require("path");
const appRoot = require("app-root-path");
var crypto = require("crypto");

appRoot.path = config.UPLOAD_DIRECTORY_PATH || appRoot.path;

module.exports = {
  getData: getData,
  validateAPIKey,
  generateKeyFiles,
  alumniGetData,
};
function getData(headers, type, callback) {
  var token = headers["x-access-token"] || headers["token"];
  if (!token) return callback("No Token found");
  var tokendata = {
    utoken: token,
    action: "view",
  };

  if (headers.deviceToken) {
    tokendata.devicetoken = headers.deviceToken;
  }

  var tokendataobj = JSON.stringify(tokendata);

  commonModel.mysqlModelService(
    proc.tokenmgm,
    [tokendataobj],
    function (err, results1) {
      if (err) {
        callback("Session not applicable");
      } else {
        if (results1[0] && results1[0][0] && results1[0][0].jsondata) {
          jwt.verify(token, config.jwt.secretcode, function (err, decoded) {
            if (err) {
              var tokendata = {
                utoken: token,
                action: "delete",
              };
              var tokendataobj = JSON.stringify(tokendata);
              commonModel.mysqlModelService(
                proc.tokenmgm,
                [tokendataobj],
                function (err, resultdb) {
                  // //console.log('err, resultdberr, resultdb',err, resultdb,tokendataobj)
                  callback("Session not applicable");
                }
              );
            } else {
              var finalData = JSON.parse(results1[0][0].jsondata);
              finalData.lastseen = results1[0][0].lastseen;
              finalData.logo = results1[1][0];
              finalData.singlesignin =
                results1[2] && results1[2][0] && results1[2][0].singlesignin;
              finalData.rankingparam =
                results1[2] && results1[2][0] && results1[2][0].rankingparam;
              finalData.tokenData = decoded;

              callback(null, finalData);
              //callback(null, JSON.parse(results1[0][0].jsondata));
            }
          });
        } else {
          // //console.log("bcdbcjdbj111111",err);
          callback("Session not applicable");
        }
      }
    }
  );
}

function alumniGetData(headers, type, callback) {
  var token = headers["x-access-token"] || headers["token"];
  if (!token) return callback("No Token found");
  var tokendata = {
    utoken: token,
    action: "view",
  };

  if (headers.deviceToken) {
    tokendata.devicetoken = headers.deviceToken;
  }

  var tokendataobj = JSON.stringify(tokendata);

  commonModel.mysqlModelService(
    proc.alumnitokenmgm,
    [tokendataobj],
    function (err, results1) {
      if (err) {
        console.log("err", err);
        callback("Session not applicable");
      } else {
        if (results1[0] && results1[0][0] && results1[0][0].jsondata) {
          jwt.verify(token, config.jwt.secretcode, function (err, decoded) {
            if (err) {
              var tokendata = {
                utoken: token,
                action: "delete",
              };
              var tokendataobj = JSON.stringify(tokendata);
              commonModel.mysqlModelService(
                proc.alumnitokenmgm,
                [tokendataobj],
                function (err, resultdb) {
                  // //console.log('err, resultdberr, resultdb',err, resultdb,tokendataobj)
                  //console.log('@@@@@@@@@@@@@@@@', err);
                  callback("Session not applicable");
                }
              );
            } else {
              var finalData = JSON.parse(results1[0][0].jsondata);
              finalData.lastseen = results1[0][0].lastseen;
              finalData.logo = results1[1][0];
              finalData.singlesignin =
                results1[2] && results1[2][0] && results1[2][0].singlesignin;
              finalData.rankingparam =
                results1[2] && results1[2][0] && results1[2][0].rankingparam;
              callback(null, finalData);
              //callback(null, JSON.parse(results1[0][0].jsondata));
            }
          });
        } else {
          // //console.log("bcdbcjdbj111111",err);
          callback("Session not applicable");
        }
      }
    }
  );
}
function generateKeyFiles() {
  const passphrase = "mySecret";
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 4096,
    namedCurve: "secp256k1",
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
      cipher: "aes-256-cbc",
      passphrase: passphrase,
    },
  });
  fs.writeFileSync(path.join(appRoot.path, "config", "public.pem"), publicKey);

  fs.writeFileSync(
    path.join(appRoot.path, "config", "private.pem"),
    privateKey
  );
}

function validateAPIKey(req, callback) {
  try {
    if (req.headers.authorization) {
      // verify auth credentials
      const base64Credentials = req.headers.authorization.split(" ")[1];
      const credentials = Buffer.from(base64Credentials, "base64").toString(
        "ascii"
      );
      [req.body.useremail, req.body.userpassword] = credentials.split(":");
    }
    if (!req.body.useremail || !req.body.userpassword) {
      return callback("Empty username or password");
    }
    if (
      req.body.useremail != config.publicapi.username ||
      req.body.userpassword != config.publicapi.password
    ) {
      return callback("Invalid  username or password");
    }

    const passphrase = "mySecret";

    var encryptStringWithRsaPublicKey = function (
      toEncrypt,
      relativeOrAbsolutePathToPublicKey
    ) {
      var absolutePath = path.resolve(relativeOrAbsolutePathToPublicKey);
      var publicKey = fs.readFileSync(absolutePath, "utf8");
      var buffer = Buffer.from(toEncrypt);
      var encrypted = crypto.publicEncrypt(publicKey, buffer);
      return encrypted.toString("base64");
    };

    var decryptStringWithRsaPrivateKey = function (
      toDecrypt,
      relativeOrAbsolutePathtoPrivateKey
    ) {
      var absolutePath = path.resolve(relativeOrAbsolutePathtoPrivateKey);
      var privateKey = fs.readFileSync(absolutePath, "utf8");
      var buffer = Buffer.from(toDecrypt, "base64");
      const decrypted = crypto.privateDecrypt(
        {
          key: privateKey.toString(),
          passphrase: passphrase,
        },
        buffer
      );
      return decrypted.toString("utf8");
    };
    var employee_payload = req.body["employee_payload"];
    var encrypted_aes_key = req.body["encrypted_aes_key"];

    if (!employee_payload || !encrypted_aes_key)
      return callback("No encrypted payload or key found");

    let decmyaeskey = decryptStringWithRsaPrivateKey(
      encrypted_aes_key,
      path.join(appRoot.path, "config", "private.pem")
    );
    //console.log('decrytped key', decmyaeskey)
    const iv = Buffer.alloc(16, 0); // Initialization vector.
    const decrmyaeskey = crypto.scryptSync(decmyaeskey, "salt", 24);
    var decrypt = crypto.createDecipheriv("aes-192-cbc", decrmyaeskey, iv);
    var decryptwithaes = decrypt.update(employee_payload, "hex", "utf8");
    decryptwithaes += decrypt.final("utf8");
    // let a = encryptStringWithRsaPublicKey(myaeskey, path.join(appRoot.path, 'config', "public.pem"))

    // //console.log('encrypted', a)

    //let jsondata = decryptStringWithRsaPrivateKey(a, path.join(appRoot.path, 'config', "private.pem"));

    // //console.log('decrytped', JSON.parse(decryptwithaes))
    callback(null, JSON.parse(decryptwithaes));
  } catch (err) {
    callback("Error: " + err);
  }
}
