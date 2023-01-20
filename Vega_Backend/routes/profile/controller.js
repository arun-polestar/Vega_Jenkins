const proc = require('../common/procedureConfig');
const commonModel = require('../common/Model');
const rdb = require('../../redisconnect');
const axios = require('axios');

module.exports = {
  putProfileData: putProfileData,
  getProfileData: getProfileData,
  getQuoteofDay: getQuoteofDay
}
/*--------------------------------------for save the data ---------------------------- */
function putProfileData(req, res) {
  if (!req.body || !req.body.tokenFetchedData) {
    return res.json({ message: 'User authorization failed', state: 0, data: null });
  }
  req.body.createdby = req.body.type && (req.body.type == 'vendor' || 'bgv') ? req.body.tokenFetchedData.credentialid : req.body.createdby;
  var obj = JSON.stringify(req.body);
  commonModel.mysqlPromiseModelService(proc.mstoperation, [obj])
    .then(results => {
      if (results && results[0] && results[0][0] && results[0][0].state && results[0][0].state == 1) {
        return res.json({ state: results[0][0].state, message: results && results[0] && results[0][0] && results[0][0].message, data: results && results[0] });
      } else {
        return res.json({ state: -1, message: "Something went wrong", data: null });
      }
    }).catch(err => {
      return res.json({ "state": -1, "message": err });
    })
}
/*----------------------------------------for get the data-------------------------------------------*/
function getProfileData(req, res) {
  if (!req.body || !req.body.tokenFetchedData) {
    return res.json({ message: 'User authorization failed', state: 0, data: null });
  }
  req.body.createdby = req.body.type && (req.body.type == 'vendor' || 'bgv') ? req.body.tokenFetchedData.credentialid : req.body.createdby;
  var obj = JSON.stringify(req.body);
  commonModel.mysqlPromiseModelService(proc.mstoperation, [obj]).
    then(results => {
      if (results && results[1] && results[1][0] && results[1][0].state && results[1][0].state == 1) {
        return res.json({ state: results[1][0].state, message: results && results[1] && results[1][0] && results[1][0].message, data: results && results[0] });
      } else {
        return res.json({ state: -1, message: "Something went wrong", data: null });
      }
    }).catch(err => {
      return res.json({ "state": -1, "message": err });
    })
}
async function getQuoteofDay(req, res) {
  try {
    let qd = await rdb.getGlobalKey('quote_day')
    if (qd) {
      return res.json({ state: 1, message: 'Success', data: JSON.parse(qd) })
    } else {
      qd = await axios.get(`https://quotes.rest/qod`);
      if (qd) {
        //console.log('qddd', qd['data']['contents']['quotes'])
        let quotes = qd['data'] && qd['data']['contents'] && qd['data']['contents']['quotes'];
        //let todayEnd = new Date().setHours(23, 59, 59, 999);
        rdb.setGlobalKey('quote_day', JSON.stringify(quotes), 24 * 60 * 60)
        return res.json({ state: 1, message: 'Success', data: quotes })
      } else {
        return res.json({ state: -1, message: 'Something went wrong' });
      }
    }
  } catch (err) {
    //console.log('err', err)
    return res.json({ state: -1, message: 'Something went wrong' });
  }
}