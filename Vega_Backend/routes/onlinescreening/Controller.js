module.exports = {
  readOnilneScreening: readOnilneScreening,
  validateotp: validateotp,
  updatescreeningrating: updatescreeningrating,
}
const proc = require('../common/procedureConfig');
const query = require('../common/Model').mysqlPromiseModelService;
const path = require('path');
const makeDir = require('../common/utils').makeDirectories

async function readOnilneScreening(req, res) {
  try {
    const obj = req.body;
    const videoName = new Date().getTime().toString();
    const candidateid = obj.candidateid && obj.candidateid.toString();
    const mediaFileName = videoName.concat('_', candidateid, '.mp4');
    makeDir('videointerview');
    let mediaFilePath = path.join('videointerview', candidateid);
    mediaFilePath = makeDir(mediaFilePath);
    const videopath = path.join(mediaFilePath, mediaFileName);
    const filepathDB = path.join('uploads', 'videointerview', candidateid, mediaFileName)
    const filedata = req.files && req.files.file;
    await filedata.mv(videopath);
    obj['videopath'] = filepathDB;
    obj['action'] = 'onlinescreening';
    const [results] = await query(proc.screening, [JSON.stringify(obj)]);
    const rs = results && results[0]
    if (!rs || (rs && rs.state && rs.state == -1))
      throw new Error('Something went wrong!')
    return res.json({ state: rs.state, message: rs.message, data: results });
  } catch (err) {
    return res.json({ state: -1, message: err.message || err });
  }
}

function updatescreeningrating(req, res) {
  if (!req.body) {
    return res.json({ message: 'Required Information is Missing!', state: -1 });
  }
  var obj = JSON.stringify({
    screeningrating: req.body.rating,
    guid: req.body.guid,
    action: 'updatescreeningrating'
  });
  query(proc.screening, [obj])
    .then(results => {
      if (results && results[0] && results[0][0] && results[0][0].state && results[0][0].state == 1) {
        return res.json({ state: results[0][0].state, message: results && results[0] && results[0][0] && results[0][0].message, data: results && results[0] });
      } else if (results && results[0] && results[0][0] && results[0][0].state && results[0][0].state == -1) {
        return res.json({ state: results[0][0].state, message: "Something went wrong", data: null });
      }
    })
    .catch(err => {
      return res.json({ state: -1, data: null, message: err.message || err });
    })
}

function validateotp(req, res) {
  if (!req.body) {
    return res.json({ state: -1, message: "requrired data missing" });
  }
  var obj = JSON.stringify({
    guid: req.body.guid,
    onlinescreeningotp: req.body.otp,
    action: 'validotp'
  });
  query(proc.screening, [obj])
    .then(results => {
      if (results && results[0] && results[0][0] && results[0][0].state && results[0][0].state > 0) {
        return res.json({ state: results[0][0].state, message: results && results[0] && results[0][0] && results[0][0].message, data: results && results[0][0].candidateid });
      } else if (results && results[0] && results[0][0] && results[0][0].state && results[0][0].state == -1) {
        return res.json({ state: results[0][0].state, message: "Not a valid OTP", data: null });
      }
    })
    .catch(err => {
      return res.json({ state: -1, data: null, message: err.message || err });

    })
}
