'use strict';
const utils = require('./chatUtils');
const verifyNull = require('../common/utils').removeFalseyLike;
let onlineuser = {};
/**
 * @param {*} io SocketIO.Server
 */

module.exports = async function (io) {
  try {
    io.on('connection', async (socket) => {
      console.log("***********Chat Connection Successfull***********", socket.id);
      const user = socket.createdby;

      // stores socket of all connected users
      onlineuser[user] ? onlineuser[user].push(socket) : onlineuser[user] = [socket];
      global.onlineuser = onlineuser

      //Join Socket group with unique ids
      if (socket.group && socket.group.length)
        socket.group.forEach(item => socket.join(item.groupid));

      // Handling Online Users Count Event
      socket.on('getonlineusers', async () => {
        // let updateduser = {}
        const [lastseen] = await utils.getLastSeen({ createdby: user });
        for (let i = 0, n = lastseen.length; i < n; i++) {
          if (onlineuser[lastseen[i].userid])
            lastseen[i]['isonline'] = 1;
          // if (lastseen[i].userid == user)
          //   updateduser = lastseen[i];
        }

        // Emiting event to user with isonline = 1 key for online users
        // const sid = onlineuser[user];
        // if (sid)
        //   sid.forEach(sockets => sockets.emit('onlineuser', { lastseen }));

        // Emiting Indivisual User Online/Offline Event
        // io.sockets.emit('updatedUser', { updateduser });
        io.sockets.emit('onlineuser', { lastseen });
      });

      //Get Recent Chats and chat History
      socket.on('getrecentchats', async () => {
        const [rc, tc] = await utils.getRecentChats(user);
        const sid = onlineuser[user];
        if (sid)
          sid.forEach(sockets => sockets.emit('recentchat', {
            recentchat: rc,
            totalunseen: tc
          }));
      });

      // Creating Group and Joining Group
      socket.on('Creategroup', async (data, callback) => {
        data['createdby'] = user;
        if (data.file) {
          data['filepath'] = await utils.saveGroupIcon(data);
          delete data.file
        }
        const [groupinfo, usrs] = await utils.createGroup(data);
        usrs.forEach(item => {
          const gid = onlineuser[item.userid];
          if (gid) {
            utils.getRecentChats(item.userid).then(res => {
              gid.forEach(sockets => {
                sockets.join(item.groupid);
                sockets.emit('recentchat', {
                  recentchat: res && res[0],
                  totalunseen: res && res[1]
                })
              });
            });
          }
        });
        callback({ groupinfo })
      });

      // Join Group for new chats
      socket.on('joinGroup', (data) => {
        const rooms = Object.keys(socket.rooms);
        if (rooms.indexOf(data.groupid) < 0) {
          if (onlineuser[data.senderid])
            onlineuser[data.senderid].forEach(sockets => sockets.join(data.groupid))
          if (onlineuser[data.partnerid])
            onlineuser[data.partnerid].forEach(sockets => sockets.join(data.groupid))
        }
      });

      // Handling Message Events
      socket.on('newMessage', async (data, callback) => {
        data['createdby'] = user;
        if (data.file) {
          data['filepath'] = await utils.savefiles(data);
          delete data.file
        }
        const [dbd] = await utils.saveChatMessage(data);
        socket.to(data.groupid).emit('message', data);
        callback(dbd && dbd[0] && dbd[0].state);
      });

      //Handling Typing Events
      socket.on('typing', (data) => {
        socket.to(data.groupid).emit('typing', data);
      });

      //Handling Sent/Read Events
      socket.on('markRead', data => {
        data['createdby'] = user;
        utils.markedAsRead(data).then(([res]) => {
          if (res && res[0] && res[0].state == 2) {
            if (res[0].message != 'success')
              data['readmessage'] = res[0].message;
            socket.to(data.groupid).emit('markRead', data);
          }
        });
      });
      //Handling Leave Group Event
      socket.on('modifyGroup', async (data, callback) => {
        if (data.file) {
          data['filepath'] = await utils.saveGroupIcon(data);
          delete data.file
        }
        await verifyNull(data);
        data['createdby'] = user;
        const [resData] = await utils.modifyGroup(data);
        io.in(data.groupid).emit('message', resData && resData[0]);
        socket.to(data.groupid).emit('modifyGroup', data);
        if (data.id) {
          const usr = data.id.split(',');
          usr.forEach(item => {
            const gid = onlineuser[item];
            if (gid) {
              utils.getRecentChats(item).then(res => {
                gid.forEach(sockets => {
                  sockets.join(data.groupid);
                  sockets.emit('recentchat', {
                    recentchat: res && res[0],
                    totalunseen: res && res[1]
                  })
                });
              });
            }
          })
        }
        callback(resData);
      });

      //Handling Leave Group Event
      socket.on('leaveGroup', async (data, callback) => {
        data['createdby'] = user;
        const [resData] = await utils.leaveGroup(data);
        socket.to(data.groupid).emit('message', resData && resData[0]);
        socket.to(data.groupid).emit('leaveGroup', data);
        const gid = onlineuser[user];
        if (gid) {
          utils.getRecentChats(user).then(res => {
            gid.forEach(sockets => {
              sockets.leave(data.groupid);
              sockets.emit('recentchat', {
                recentchat: res && res[0],
                totalunseen: res && res[1]
              })
            });
          });
        }
        callback(resData);
      });
      //handle logout from all device
      socket.on('allDevicesLogout', (d) => {
        const sid = onlineuser[user];
        if (sid)
          sid.forEach(sockets => sockets.disconnect(true));
      });

      // Handling Disconnect Events...
      socket.on("disconnect", async () => {
        //console.log(`*****chat disconnect for ${user} *****`);
        const dab = await utils.updateSocketLastseen(user, onlineuser);
        // io.sockets.emit('updatedUser', dab);
        io.sockets.emit('onlineuser', dab);
        onlineuser = utils.onDisconnect(user, onlineuser, socket);
        delete socket.createdby;
      });

    });
  } catch (err) {
    //console.log('Chat Socket Error!--------------->>>>>>>>>>>>', err);
    io.on('connection', (socket) => socket.emit('exception', { errorMessage: err.message || err }));
  }
}
