'use strict'
const query = require('../common/Model').mysqlPromiseModelService,
  moment = require('moment'),
  utils = require('../common/utils'),
  fs = require('fs'),
  mime = require('mime'),
  proc = require('../common/procedureConfig'),
  path = require('path');
let count = 0;

async function getChatInfo(obj) {
  try {
    obj['createddate'] = moment().format("YYYY-MM-DD HH:mm:ss");
    const reqdata = JSON.stringify(obj);
    //console.log('Chat Database hit count:----->>>', ++count);
    return await query(proc.chatProc, [reqdata]);
  } catch (err) {
    //console.log(`Chat Error! [${obj.reqtype}]`, JSON.stringify(err));
    throw new Error(err);
  }
}

module.exports = {

  getLastSeen: async function (obj) {
    obj['reqtype'] = 'getlastseen';
    return await getChatInfo(obj);
  },

  updateLastSeen: async function (createdby, lastseen) {
    return await getChatInfo({
      createdby,
      lastseen,
      reqtype: 'updatelastseen'
    });
  },

  updateSocketLastseen: async function (createdby, onlineuser) {
    const curdate = moment().format("YYYY-MM-DD HH:mm:ss");
    await this.updateLastSeen(createdby, curdate);
    const [lastseen] = await this.getLastSeen({
      createdby,
      // updateduser: createdby
    });
    for (let i = 0, n = lastseen.length; i < n; i++) {
      if (lastseen[i].userid == createdby) {
        delete lastseen[i]['isonline'];
      }
      if (onlineuser[lastseen[i].userid] && lastseen[i].userid != createdby) {
        lastseen[i]['isonline'] = 1;
      }
    }
    return { lastseen }
    // if (lastseen[0].userid == createdby)
    //   delete lastseen[0]['isonline'];
    // return { updatedUser: lastseen }
  },

  saveChatMessage: async function (data) {
    data['reqtype'] = 'savechat';
    return await getChatInfo(data);
  },

  /**
   * 
   * @param {Object} data  required base64 string of file and groupid of chat
   * @param {String} data.groupid Groupid of current chat
   * @param {String} data.file base64 string of file 
   * @returns Destination of saved files
   * 
   */
  savefiles: async function (data) {
    try {
      utils.makeDirectories('uploads/chatFiles');
      const decodeddata = utils.decodeBase64File(data.file),
        name = `${Date.now() + Math.floor(Math.random() * 99999)}_${data.groupid}`,
        extension = mime.extension(decodeddata.type),
        fileName = `${name}.${extension}`,
        dd = `chatFiles/${data.groupid}`,
        dest = utils.makeDirectories(`uploads/${dd}`);
      fs.writeFileSync(path.join(dest, fileName), decodeddata.data);
      const rdest = path.join(dd, fileName);
      return rdest;
    } catch (err) {
      throw new Error(err);
    }
  },

  saveGroupIcon: async function (data) {
    try {
      const decodeddata = utils.decodeBase64File(data.file),
        name = `${Date.now() + Math.floor(Math.random() * 99999) + '_' + data.groupName}`,
        extension = mime.extension(decodeddata.type),
        fileName = `${name}.${extension}`,
        dest = utils.makeDirectories('uploads/chatGroupIcon');
      fs.writeFileSync(path.join(dest, fileName), decodeddata.data);
      const rdest = path.join('chatGroupIcon', fileName);
      return rdest;
    } catch (err) {
      throw new Error(err);
    }
  },

  createGroup: async function (data) {
    data['isgroup'] = 1;
    data['reqtype'] = 'createGroup'
    return await getChatInfo(data);
  },

  getRecentChats: async function (createdby) {
    return await getChatInfo({
      createdby,
      reqtype: 'getrecentchat',
    });;
  },

  markedAsRead: async function (data) {
    data['reqtype'] = 'markedasread';
    return await getChatInfo(data);
  },

  leaveGroup: async function (obj) {
    obj['reqtype'] = 'leavegroup'
    return await getChatInfo(obj);
  },

  modifyGroup: async function (obj) {
    obj['reqtype'] = 'modifygroup'
    return await getChatInfo(obj);
  },

  getGroupByUser: async function (createdby) {
    const [data] = await getChatInfo({
      createdby,
      reqtype: 'getgroupbyuser'
    });
    return data;
  },

  onDisconnect: (createdby, onlineuser, socket) => {
    const sid = onlineuser[createdby];
    if ((sid && sid.length == 1 && sid[0] == socket)) {
      delete onlineuser[createdby];
    } else {
      onlineuser[createdby].splice(sid.indexOf(socket), 1);
    }
    return onlineuser;
  }
}
