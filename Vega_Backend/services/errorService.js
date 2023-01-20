module.exports = {
  getError: getError,
};
function getError(response, cb) {
  if (response && (response.state == -1 || response.State == -1)) {
    if (response.Message) {
      return cb(response.Message);
    }
    return cb(response.message);
  }
  cb();
}
