const ACCESS_TOKEN = "xyz";

const mockgetData = jest.fn((headers, type, cb) => {
  const token = headers["x-access-token"] || headers["token"];
  if (!token) return cb("No Token found");
  cb(null, loginData);
});

const mockRequest = (token = ACCESS_TOKEN) => {
  const req = {};
  req.headers = {
    "Content-Type": "application/json",
    "x-access-token": token,
  };
  return req;
};
const mockResponse = (body = {}) => {
  const res = {};
  res.body = body;
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNextFunction = jest.fn();

const addHeaders = (request) =>
  request.set("Content-Type", "application/json").timeout(2000);

const addAuthHeaders = (request, accessToken = ACCESS_TOKEN) =>
  request
    .set("Content-Type", "application/json")
    .set("Authorization", `Bearer ${accessToken}`)
    .set("x-access-token", accessToken)
    .timeout(2000);

module.exports = {
  mockRequest,
  mockResponse,
  mockNextFunction,
  mockgetData,
  ACCESS_TOKEN,
  addHeaders,
  addAuthHeaders,
};
