const app = require("./app");
const http = require("http");
const https = require("https");
const fs = require("fs");
const config = require("./config/config");
const path = require("path");



app.set("trust proxy", 1);
app.set("port", process.env.PORT || config.appPort);

let server;
if (config.env && config.env == "development") {
  server = http.createServer(app).on("error", function (err) {
    console.error(err);
    process.exit(1);
  });
} else {
  const httpsOptions = {
    cert: fs.readFileSync(path.join(__dirname, "ssl", "server.crt")),
    key: fs.readFileSync(path.join(__dirname, "ssl", "myserver.key")),
  };
  server = https.createServer(httpsOptions, app).on("error", function (err) {
    console.error(err);
    process.exit(1);
  });
}
server.listen(app.get("port"), "0.0.0.0", function () {
  console.log(
    "Server listening on port " + app.get("port") + " in " + app.get("env")
  );
});

require("./socket")(server);

