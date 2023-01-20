const socketIo = require("socket.io");
const getGroupByUser = require("./routes/chat/chatUtils").getGroupByUser;
const authService = require("./services/authService");

const timelineSocket = require("./routes/timeline/socket.io");
const chatSocket = require("./routes/chat/socket.io");

module.exports = function (server) {
  const io = socketIo(server);
  global.io = io;
  io.use(function (socket, next) {
    if (socket.handshake.query) {
      socket.handshake.query["x-access-token"] = socket.handshake.query.token;
      authService.getData(socket.handshake.query, "user", async (err, data) => {
        if (err) {
          return next(new Error("Authenication Error!"));
        }
        socket.createdby = data.id;
        socket.lastseen = data.lastseen;
        socket.tokenFetchedData = data;
        socket.group = (await getGroupByUser(data.id)) || [];

        next();
      });
    } else {
      next(new Error("Authentication Error!"));
    }
  });
  timelineSocket(io);
  chatSocket(io);
};
