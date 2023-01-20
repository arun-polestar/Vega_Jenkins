"use strict";
const query = require("../../common/Model").mysqlPromiseModelService,
  makeDir = require("../../common/utils").makeDirectories,
  { getExcelData } = require('./Model'),
  utils = require('../../common/utils'),
  xlsx = require("xlsx"),
  path = require('path'),
  _ = require('lodash');
module.exports = {

  _getbudget: async (req, res) => {
    try {
      req.body['action'] = req.body['action'] ? req.body['action'] : 'getbudget'
      const rd = JSON.stringify(req.body),
        [r1] = await query('call usp_expense_budget_master(?)', [rd]);
      return res.json({
        message: "success",
        data: r1,
        state: 1,
      });
    } catch (err) {
      return res.json({
        state: -1,
        message: err.message || err,
        data: null,
      });
    }
  },

  _addbudget: async (req, res) => {
    const { io } = require('../../../app');
    res.json({ state: 1 });
    try {
      if (!req.files) throw new Error('File Required!');

      const exl = req.files.file,
        dir = makeDir("uploads/expenseBudget"),
        uploadPath = path.join(dir, `${Date.now()}_${exl.name}`);
      await exl.mv(uploadPath);

      console.time('Template Validated!')
      const exlarr = await getExcelData(uploadPath);
      console.timeEnd('Template Validated!');

      const x = ['departmentname', 'designationname', 'username', 'gradename'],
        y = Object.keys(exlarr[0]),
        level = _.intersectionWith(x, y, _.isEqual);

      req.body['is_individual_budget'] = y.includes('bill_limit') ? 1 : 0
      req.body['booklevel'] = level.toString().slice(0, -4);
      req.body['mappingData'] = exlarr;
      req.body['action'] = 'addbudget';

      console.time('Database Operation Time:')
      const reqData = JSON.stringify(req.body),
        results = await query('call usp_expense_budget_master(?)', [reqData]);
      console.timeEnd('Database Operation Time:')


      const re = results && results[1] && results[1][0] && results[1][0];
      if (re && re.state == -1) {
        await utils.removeFalseyLike(results);
        return io.sockets.emit('budgetsocket', { state: -1, message: re.message, data: results })
      } else {
        return io.sockets.emit('budgetsocket', { state: 1, message: "Success", data: results });
      }
    } catch (err) {
      console.error('Error!--', err)
      return io.sockets.emit('budgetsocket', { state: -1, message: err.message || err });
    }
  },

  _editbudget: async (req, res) => {
    const { io } = require('../../../app');
    try {
      const reqd = req.body;
      if (req.files) {
        res.json({ state: 1 });
        let errb = [], errx = [], errbill = [];
        const exl = req.files.file,
          dir = makeDir("uploads/expenseBudget"),
          uploadPath = path.join(dir, `edited_${Date.now()}_${exl.name}`);
        await exl.mv(uploadPath);
        const wb = xlsx.readFile(uploadPath),
          ws = wb.Sheets["data"],
          exlarr = xlsx.utils.sheet_to_json(ws);
        reqd['mappingData'] = exlarr;

        /* *************Error handling for template********************** */

        const x = ['departmentname', 'designationname', 'username', 'gradename'],
          y = Object.keys(exlarr[0]),
          level = _.intersectionWith(x, y, _.isEqual).toString();

        if (!exlarr.length)
          throw new Error("Make sure the worksheet named 'data' in the template should not be empty!")

        if (exlarr.length > 1000)
          reject("Maximum 1000 rows can be edited at a time!");
        _.each(exlarr, (item, index) => {

          const bill_limit = +item['minimum_limit_for_attachment'];

          if (+item['budget'] < 0 || typeof +item['budget'] !== "number" || +item['budget'] > Number.MAX_SAFE_INTEGER) {
            errb.push(index + 2);
          }
          item['bill_limit'] = bill_limit

          if (+reqd.is_individual_budget && (typeof bill_limit !== "number" || bill_limit < 0 || bill_limit > Number.MAX_SAFE_INTEGER || bill_limit > +item['budget'])) {
            errbill.push(index + 2)
          }

          if (!(item[level] && item[level].toString().trim())) {
            errx.push(index + 2);
          }
          if (reqd.booklevel == 'user' && item.username && item.username.includes('(') && item.username.includes(')'))
            item['ecode'] = item['username'].split('(')[1].split(')')[0]
        });

        if (errbill.length) {
          throw new Error(`Row no. ${errbill.toString()} should have correct maximum 'budget without bill' and it should be less then budget`)
        }

        switch (true) {
          case Boolean(level != reqd['booklevel'] + 'name'):
            throw new Error(`Make sure the booklevel of the template is correct!`);
          case Boolean(errb.length == exlarr.length):
            throw new Error(`Template should have correct budget in 'budget' column!`);
          case Boolean(errx.length == exlarr.length):
            throw new Error(`Template should have correct ${level}!`);
          case Boolean((errx.length + errb.length) == exlarr.length):
            throw new Error(`Template should have correct ${level} and budget!`);
          case Boolean(errb.length && errx.length):
            throw new Error(`Row no. ${errb.toString()} should have correct budget and ${level}!`);
          case Boolean(errb.length):
            throw new Error(`Row no. ${errb.toString()} should have correct budget!`);
          case Boolean(errx.length):
            throw new Error(`Row no. ${errb.toString()} should have correct ${level}!`);
          default:
            break;
        }

        /* *************END Error handling for template********************** */

      }

      reqd['action'] = reqd['action'] ? reqd['action'] : 'editbudget';
      const bl = +reqd['minimum_limit_for_attachment'];

      if (reqd.action === 'singleedit' && reqd.budget && reqd.budget > Number.MAX_SAFE_INTEGER) {
        throw new Error('Budget should be correct!')
      }

      if (reqd.action === 'singleedit' && (bl && bl > Number.MAX_SAFE_INTEGER || bl > +reqd.budget)) {
        throw new Error('Minimum Limit For Attachment should be correct and less then Budget!')
      }
      const reqData = JSON.stringify(reqd);
      const results = await query('call usp_expense_budget_master(?)', [reqData]);
      const re = results && results[1] && results[1][0] && results[1][0];

      if (re && re.state == -1) {

        await utils.removeFalseyLike(results);

        if (req.files) {
          return io.sockets.emit('budgetsocket', { state: -1, message: re.message, data: results })
        } else {
          return res.json({ state: -1, message: re.message, data: results });
        }
      } else {

        if (req.files) {
          return io.sockets.emit('budgetsocket', { state: 1, message: "Success", data: results })
        } else {
          return res.json({ state: 1, message: "Success", data: results });
        }
      }
    } catch (err) {

      if (req.files) {
        return io.sockets.emit('budgetsocket', { state: -1, message: err.message || err })
      } else {
        return res.json({ state: -1, message: err.message || err });
      }
    }
  },

  _usersbulkedit: async (req, res) => {
    const { io } = require('../../../app');
    try {
      if (!req.files) //chexk if files exists in request or not
        throw new Error('File Required!');

      res.json({ state: 1 });
      const exl = req.files.file,
        dir = makeDir("uploads/expenseBudget"),
        uploadPath = path.join(dir, `userbulkedit_${Date.now()}_${exl.name}`);
      await exl.mv(uploadPath);

      const exlarr = await getExcelData(uploadPath);

      const code = 'INSERT INTO `dummy_expense_user_edit`(`username`,`expensetype`,`budget`,`budgettype`,`bill_limit`,`ecode`) VALUES ?';

      await query('truncate dummy_expense_user_edit');
      await query(code, [_.map(exlarr, item => _.values(item))]);
      req.body['action'] = 'usersbulkedit';

      const reqData = JSON.stringify(req.body);

      await query('call usp_expense_budget_master(?)', [reqData]);
      return io.sockets.emit('budgetsocket', { state: 1, message: 'All matching data updated!' })

    } catch (err) {
      console.error(err);
      return io.sockets.emit('budgetsocket', { state: -1, message: err.message || err })
    }
  }
}



