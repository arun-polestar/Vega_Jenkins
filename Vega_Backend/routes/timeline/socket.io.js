"use strict";
const timelineController = require("./Controller");
const timelinePoll = require("./poll.js");
let onlineUser = {};
const notificationCtrl = require("../notification/Controller");
const feedbackCtrl = require("../feedback/Controller");
const messages = require("../../lib/messages");

module.exports = async (io) => {
  io.on("connection", async (socket) => {
    console.log(
      "------------------------TIMELINE---connection---successfull--------------------------------------"
    );
    if (!onlineUser[socket.createdby]) {
      onlineUser[socket.createdby] = [socket];
    } else {
      onlineUser[socket.createdby].push(socket);
    }
    socket.on("like-or-comment", async (keys, callback) => {
      keys.createdby = socket.createdby;
      let data = await timelineController.checkLikedOrNot(keys);
      io.emit("like-or-comment-count", data);
      callback({ action_done: true });
    });

    socket.on("edit-comment", async (keys) => {
      keys.createdby = socket.createdby;
      let data = await timelineController.editComment(keys);
      io.emit("get-edited-comment", data);
    });

    socket.on("delete-like-or-comment", async (keys, callback) => {
      keys.createdby = socket.createdby;
      let data = await timelineController.deleteLikeOrComment(keys);
      io.emit("fetch-like-or-comment-count", data[0]);
      callback({ action_done: true });
    });

    socket.on("timeline-notification", async (keys, callback) => {
      keys.createdby = socket.createdby;
      let arr = await timelineController.check_notification_exists_or_not(keys);
      let item = arr[0];

      //Sending push notification using FCM to mobile devices
      let message = {
        notification: {
          title: "Timeline",
          body: "",
        },
        data: keys.data,
      };

      //Conditions for notification content
      if (item && item.action_type == 1 && (item && item.reaction_type) > 1) {
        message.notification.body = `${item.notificationdesc} reacted on your post`;
      } else if (
        (item && item.action_type) == 1 &&
        (item && item.reaction_type) == 1
      ) {
        message.notification.body = `${item.notificationdesc} liked your post`;
      } else if ((item && item.action_type) == 2) {
        message.notification.body = `${item.notificationdesc} commented on your post`;
      } else if ((item && item.action_type) == 3) {
        message.notification.body = `${item.notificationdesc} liked your comment`;
      }

      if ((keys && keys.action_type) == 4) {
        if (arr && arr[0] && arr[0].assignedtouserid) {
          //Sending notification to mobile user
          notificationCtrl.sendNotificationToMobileDevices(
            arr[0].assignedtouserid,
            message
          );

          //Sending notification on web to online users
          let sid = onlineUser[arr[0].assignedtouserid];
          if (sid) {
            sid.forEach((sockets) => {
              sockets.emit("get-notification", [arr[0]]);
            });
          }
        }

        if (arr && arr[1] && arr[1].assignedtouserid) {
          //Sending notification to mobile user
          message.notification.body = `${arr[1].notificationdesc} replied on your comment`;
          notificationCtrl.sendNotificationToMobileDevices(
            arr[1].assignedtouserid,
            message
          );

          let sid = onlineUser[arr[1].assignedtouserid];
          if (sid) {
            sid.forEach((sockets) => {
              sockets.emit("get-notification", [arr[1]]);
            });
          }
        }
      } else {
        if (arr && arr[0] && arr[0].assignedtouserid) {
          //Sending notification to mobile user
          notificationCtrl.sendNotificationToMobileDevices(
            arr[0].assignedtouserid,
            message
          );

          let sid = onlineUser[arr[0].assignedtouserid];
          if (sid) {
            sid.forEach((sockets) => {
              sockets.emit("get-notification", arr);
            });
          }
        }
      }
      callback({ action_done: true });
    });

    socket.on("module-push-notifications", async (keys) => {
      keys.createdby = socket.createdby;
      if (keys.raiseby) keys.createdby = keys.raiseby;
      let data = await timelinePoll.pushNotificationsForModules(keys);
      //console.log(data, "----------push---notif--dataa--------");

      //Sending push notification using FCM to mobile devices
      let message = {
        notification: {
          title: data[0].moduleval,
          body: data[0].notificationdesc,
        },
      };

      //adding data key to navigate user to related module from push notification
      //console.log("_____-----____-----____--KKKEYYSSSS--_____---___", keys)
      if (keys && keys.data) message.data = keys.data;
      if (message.notification.title.toLowerCase() == "time")
        message.notification.title = "Timesheet";

      //console.log("________ASSIGNED USER ID FOR MODULES____________", data[0]);
      notificationCtrl.sendNotificationToMobileDevices(
        data[0].assignedtouserid,
        message
      );

      //Sending notification on web to online users
      let sid = onlineUser[data[0].assignedtouserid];
      if (sid) {
        sid.forEach((sockets) => {
          sockets.emit("get-module-push-notifications", data);
        });
      }
    });

    socket.on("createstory", async (keys) => {
      keys.createdby = socket.createdby;
      let data = await feedbackCtrl.feedbackstory(keys);
      io.emit("showstory", data);
    });

    socket.on("likeonfeedback", async (keys) => {
      keys.createdby = socket.createdby;
      //console.log('SOCKETTTTTTTTTTTTTTTTTTT', keys.createdby)
      let data = await feedbackCtrl.feedbacklike(keys);
      //console.log('DAAAAAAAAAAAAAAAAAAA', data)
      io.emit("viewfeedbacklike", data);
    });

    socket.on("disconnect", () => {
      let sid = onlineUser[socket.createdby];
      if (sid && sid.length == 1 && sid[0] == socket) {
        delete onlineUser[socket.createdby];
      } else {
        onlineUser[socket.createdby].splice(sid.indexOf(socket), 1);
      }
    });
  });
};
