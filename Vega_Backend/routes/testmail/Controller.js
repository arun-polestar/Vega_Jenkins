
var mailservice = require('../../services/mailerService');


module.exports = {
  mail: mail
}

function mail(req, res) {
  //console.log("Main Function1");
  var attach = {
    filename: "Vibhor.jpeg",
    path: "C:/Users/Admin/Downloads/0.jpeg"
  }
  mailservice.sendEmail('support@vegahr.com', 'vibhor.malik@polestarllp.com', 'This is mail for test', 'This is mail for You ', attach, (err, result) => {
    //console.log("Main Function2");
    if (err) {
      //console.log("Main Function3");
      res.json({
        "err": err
      })
    }
    else {
      //console.log("Main Function4");
      res.json({
        "result": result
      })
    }
  });
}