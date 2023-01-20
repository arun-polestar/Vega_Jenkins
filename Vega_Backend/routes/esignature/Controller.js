'use strict'
const query = require('../common/Model').mysqlPromiseModelService,
  path = require('path'),
  utils = require('../common/utils'),
  fs = require('fs'),
  mime = require('mime'),
  makeDir = require('../common/utils').makeDirectories,
  { v4: uuidv4 } = require('uuid');
module.exports = {

  addeSignature: async (req, res) => {
    try {
      const obj = req.body;
      const dest = makeDir('veSignature');
      const decodeddata = utils.decodeBase64File(obj.file),
        extension = mime.extension(decodeddata.type),
        mediaName = `${uuidv4()}.${extension}`;
      fs.writeFileSync(path.join(dest, mediaName), decodeddata.data);
      const mediaPath = path.join('veSignature', mediaName);
      obj['configvalue1'] = mediaPath
      // obj['configcode'] = 'esignature'
      obj['configvalue2'] = mediaName
      obj['reqtype'] = 'addesign';
      const reqData = JSON.stringify(obj)
      const [results] = await query('call usp_rms_mapping_master(?,?)', [reqData, JSON.stringify([])]);
      const rs = results && results[0]
      if (!rs || (rs && rs.state && rs.state == -1))
        throw new Error('Something went wrong!')
      return res.json({ state:1, mediaPath, mediaName });
    } catch (err) {
      return res.json({ state: -1, message: err.message || err });
    }

  }
}