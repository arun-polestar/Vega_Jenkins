let sendBellIconNotification = async (data) => {
  console.log("------------------------Notification---connection---successfull--------------------------------------");
  let assignedtouserid = data.assignedtouserid && data.assignedtouserid.toString() && data.assignedtouserid.toString().split(',');
  assignedtouserid && assignedtouserid.forEach(userid => {
    let sid = global.onlineuser && global.onlineuser[userid]
    if (sid) {
      sid.forEach(sockets => {
        data.notification_id = `${data.datevalue}_${userid}`
        data.isread = 0
        global.io.to(sockets.id).emit('get-module-push-notifications', [data]);
      });
    }
  })
}

module.exports = {
  sendBellIconNotification
}