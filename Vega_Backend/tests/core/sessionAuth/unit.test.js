const sessionAuth = require("../../../services/sessionAuth");

const {
  mockRequest,
  mockResponse,
  mockNextFunction,
  loginData,
  mockgetData,
} = require("./mock");

jest.mock("../../../services/authService", () => ({
  getData: (headers, type, cb) => mockgetData(headers, type, cb),
}));

describe("sessionAuth", () => {
  beforeEach(() => jest.clearAllMocks());

  it("Should gives no token found err when no token founds in headers", (done) => {
    const req = mockRequest("");
    const res = mockResponse(loginData);
    sessionAuth(req, res, mockNextFunction);
    expect(res.json).toHaveBeenCalledWith({
      state: 0,
      message: "No Token found",
    });
    done();
  });
});
