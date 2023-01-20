const userLoginCtrl = require("./userlogin.controller");
const sessionAuth = require("../../services/sessionAuth");
const alumnisessionAuth = require("../../services/alumnisessionAuth");
const express = require("express");
const app = express.Router();
// const googleimport = require("./passport.Controller");
const passport = require("passport");
const Strategy = require("passport-google-oauth2").Strategy;

const rateLimit = require("express-rate-limit");
const forgetPasswordLimiter = rateLimit({
  windowMs: 60 * 2 * 1000, // 1 hour window
  max: 5, // start blocking after 5 requests
  message:
    "Too many forget password attempts requested from this IP, please try again after few minutes!",
});
const loginAccountLimiter = rateLimit({
  windowMs: 60 * 2 * 1000, // 2 min window
  max: 5, // start blocking after 5 requests
  message:
    "Too many login attempts requested from this IP, please try again after few minutes!",
});

// let redirect_url = "https://salesdemo.vega-hr.com/auth";

// module.exports = function (app) {

app.post("/login", userLoginCtrl.login);
app.post("/SSOlogin", userLoginCtrl.SSOlogin);
app.post("/applogin", userLoginCtrl.appLogin);
app.post("/checksession", userLoginCtrl.checkSession);
app.post(
  "/forgetpassword",
  forgetPasswordLimiter,
  userLoginCtrl.forgetPassword
);
app.post(
  "/logoutFromAllDevices",
  alumnisessionAuth,
  userLoginCtrl.logoutFromAllDevices
);
app.post(
  "/logoutFromSingleDevice",
  alumnisessionAuth,
  userLoginCtrl.logoutFromSingleDevice
); // Alumni can access this API
app.post("/changePassword", alumnisessionAuth, userLoginCtrl.changePassword); // Alumni can access this API
app.post(
  "/forgetpasswordwithotp",
  forgetPasswordLimiter,
  userLoginCtrl.forgetPasswordWithOtp
);
app.post("/dataonlogin", alumnisessionAuth, userLoginCtrl.dataonlogin); // Alumni can access this API
app.post("/updatempin", sessionAuth, userLoginCtrl.updateMpin);
app.post("/validatempin", sessionAuth, userLoginCtrl.validateMpin);
app.post("/validateuserotp", userLoginCtrl.validateOtp);
app.post(
  "/verifySecurityQuesResponse",
  sessionAuth,
  userLoginCtrl.verifySecurityQuesResponse
);
app.post("/checksessionC2C", userLoginCtrl.checkSessionC2C);
app.post(
  "/getLoginUserDetails",
  sessionAuth,
  userLoginCtrl.getLoginUserDetails
);
app.post(
  "/sendOtpForPasswordSetting",
  forgetPasswordLimiter,
  userLoginCtrl.sendOtpForPasswordSetting
);
app.post(
  "/validateOtpForFirstTimeLogin",
  userLoginCtrl.validateOtpForFirstTimeLogin
);
app.post("/setPassword", userLoginCtrl.setPassword);
app.post("/updateFirstLogin", sessionAuth, userLoginCtrl.updateFirstLogin);

const googleConfig = {
  clientID:
    "721217361596-ta4mf31uf26c183mrvfdoglkdiuhb3su.apps.googleusercontent.com",
  clientSecret: "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",
  callbackURL: "http://polestarllp.vegahrdev.com/webapi/auth/google/callback",
  //Successfully Login "http://polestarllp.vegahrdev.com/socialauth"
};
let redirect_url = "http://localhost:4200/auth";
let failureRedirect_url = "http://polestarllp.vegahrdev.com";

passport.serializeUser(function (user, cb) {
  cb(null, user);
});
passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new Strategy(googleConfig, async function (
    accessToken,
    refreshToken,
    profile,
    done
  ) {
    let user = await userLoginCtrl.findUser(profile.email);
    if (!user || user.length == 0) {
      console.log("_________________________________________insideuser", user);
      // return res.send({ success: false, message: "authentication failed" });
      // return res.status(400).send(["Not Valid User!"]);
      return done(null, false);
    }

    // if (!user.verifyPassword(password)) {
    //   return done(null, false);
    // }
    // return done(null, profile);
    return done(null, profile);
  })
);

app.get(
  "/authgoogle",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: failureRedirect_url,
  }),
  async function (req, res) {
    let useremail = req && req.user.email;
    if (!useremail) {
      return res.send({ success: false, message: "authentication failed" });
    }
    let ssotype = 3; // for Google login
    const token = await userLoginCtrl.getUserToken(useremail, ssotype);
    if (!token) {
      return res.send({ success: false, message: "authentication failed" });
    }
    res.redirect(
      `${redirect_url}?token=${JSON.stringify(token && token.token)}`
    );
  }
);

// app.get("/error", (req, res) => res.send("authentication failed"));

module.exports = app;
