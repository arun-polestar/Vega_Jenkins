const proc = require("../common/procedureConfig");
const config = require("./../../config/config");
const userCtrl = require("./userlogin.controller");

const passport = require("passport");
var Strategy = require("passport-google-oauth2").Strategy;

/*
passport.serializeUser(function (user, cb) {
  cb(null, user);
});
passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});
*/

module.exports = {
  passport: passport,
};
