const { ACCESS_TOKEN } = require("../../core/sessionAuth/mock"),
  moment = require("moment"),
  bcrypt = require("bcryptjs"),
  uuid = require("uuid");

const USER_EMAIL = "abc@gmail.com",
  ECODE = "00015",
  USER_PASSWORD = "Qwerty@123",
  USER_PASSWORD_HASH = bcrypt.hashSync(USER_PASSWORD, 10);

const LoginData = {
  id: 1,
  email: USER_EMAIL,
  firstname: "MTR",
  lastname: " ",
  managerid: 1,
  accessType: "user",
  timestamp: moment().format("LLLL"),
  guid: uuid.v4(),
  ssotype: 1,
  ecode: ECODE,
  client_id: 31,
  client_domain: "polestarllp",
  name: "MTR",
  role: "Candidate",
  phone_number: "+918976787656",
};

const mockLogin = jest.fn((req, res, next) => {
  if (req.headers.authorization) {
    // verify auth credentials
    const base64Credentials = req.headers.authorization.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "ascii"
    );
    [req.body.useremail, req.body.userpassword] = credentials.split(":");
  }
  if (!req.body.useremail || !req.body.userpassword) {
    return res.json({
      state: -1,
      message: "Don't leave a field empty",
      data: null,
    });
  }
  if (!(req.body.useremail == USER_EMAIL || req.body.useremail == ECODE)) {
    return res.json({
      state: -1,
      message: "Not a valid user!",
      data: null,
    });
  }

  bcrypt.compare(
    req.body.userpassword.toString(),
    USER_PASSWORD_HASH,
    function (err, result) {
      if (!result) {
        return res.json({
          state: -1,
          message: "User name/password is incorrect!",
          data: null,
        });
      }
      return res.json({
        state: 1,
        message: "Success",
        data: `Bearer ${ACCESS_TOKEN}`,
        token: ACCESS_TOKEN,
        RMSrole: "HR User",
        isclientadmin: 0,
        defaultrole: "",
        defaultModule: "",
        ispremium: 1,
        islicense: 1,
        tokenData: req.body.c2c ? LoginData : null,
      });
    }
  );
});

module.exports = {
  USER_EMAIL,
  ECODE,
  USER_PASSWORD,
  USER_PASSWORD_HASH,
  LoginData,
  mockLogin,
};
