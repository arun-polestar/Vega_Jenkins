const { check, validationResult } = require("express-validator/check");
const { body } = require("express-validator/check");
const moment = require("moment");
const _ = require("underscore");
module.exports = {
  validate: validate,
};
/**
 * Example set 
                in createUser logic
                req.assert('email', 'Email is not valid').isEmail();
                req.assert('password', 'Password must be at least 4 characters long').len(4);
                req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
                req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });
                body('userData.firstname', "firstname doesn't exists").exists(),
                body('email', 'Invalid email').exists().isEmail(),
                body('phone').optional().isInt(),
                body('status').optional().isIn(['enabled', 'disabled']),
                check('password')
                .isLength({ min: 5 }).withMessage('must be at least 5 chars long')
                .matches(/\d/).withMessage('must contain a number'),
                check('passworddssdds','invalid password calue').exists().custom((value, { req }) => value === 'd')
 * @param {*} method 
 */
function validate(method) {
  switch (method) {
    case "createEmployee": {
      return [
        body("urllink", "URL link is Required for sending mail").exists(),
        body("userData", "User Information Required").exists(),
        body("assignedModules", "Modules Information Required").exists(),
        //.custom(  (item)=>_.isArray(item) && item.length > 0).withMessage("At least one module is required"),
        check("userData.firstname", "First Name is required").not().isEmpty(),
        check("userData.lastname", "Last Name is required").not().isEmpty(),
        check("userData.ecode", "Employee Code is required").not().isEmpty(),
        check("userData.useremail", "Invalid email").exists().isEmail(),
        check("userData.managerid", "Manager is required").not().isEmpty(),
        //check('userData.departmentid', 'Department is required').not().isEmpty(),
        //check('userData.designationid', 'Designation is required').not().isEmpty(),
        //check('userData.dateofjoining','Date of Joining is required').exists().custom(
        //(value, { req }) => moment(new Date(value)).isValid()).withMessage( 'Date of Joining format is (YYYY/MM/DD)')
      ];
    }
  }
}
