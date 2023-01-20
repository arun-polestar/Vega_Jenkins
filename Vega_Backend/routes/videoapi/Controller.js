const query = require('../../routes/common/Model').mysqlPromiseModelService;
module.exports = {
  videoquestion: videoquestion
}

async function videoquestion(req, res) {
  try {
    if (!req.body || !req.body.action) {
      throw new Error('Required parameters missing');
    }
    let obj1 = [];
    if (req.body.data) {
      obj1 = req.body.data;
    }
    const reqd = JSON.stringify(req.body);
    const reqd1 = JSON.stringify(obj1);
    const result = await query('call usp_video_ques(?,?)', [reqd, reqd1]);
    const dbres = result && result[0] && result[0][0];
    if (dbres && dbres.state == -1) {
      throw new Error('Required parameters missing')
    } else {
      return res.json({
        state: 1,
        message: dbres && dbres.message,
        data: result
      })
    }
  } catch (err) {
    res.json({
      state: -1,
      message: (err && err.message || err),
      err: 'Something Went Wrong',
      time: res.time
    })
  }
}
