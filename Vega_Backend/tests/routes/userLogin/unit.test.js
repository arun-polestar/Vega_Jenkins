const supertest = require("supertest");
const app = require("../../../app.js");
const bcrypt = require("bcryptjs");
const {
  USER_EMAIL,
  ECODE,
  USER_PASSWORD,
  USER_PASSWORD_HASH,
  LoginData,
  mockLogin,
} = require("./mock");

jest.mock("../../../routes/userLogin/userlogin.controller.js", () => {
  const userLoginCtrl = jest.requireActual(
    "../../../routes/userLogin/userlogin.controller.js"
  );
  return {
    ...userLoginCtrl,
    login: (req, res, next) => mockLogin(req, res, next),
  };
});

const bcryptCompareSpy = jest.spyOn(bcrypt, "compare");

describe("Post Login  new user", () => {
  const endpoint = "/login";
  const request = supertest(app);

  beforeEach(() => {
    mockLogin.mockClear();
    bcryptCompareSpy.mockClear();
  });

  it("Should send error when empty body is sent", async () => {
    const res = await request.post(endpoint);
    expect(res.status).toBe(200);
    expect(bcryptCompareSpy).not.toBeCalled();
  });

  it("Should send error when password is only sent", async () => {
    const response = await request.post(endpoint).send({
      userpassword: USER_PASSWORD,
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Don't leave a field empty");
    expect(bcryptCompareSpy).not.toBeCalled();
  });

  it("Should send error when password is only sent", async () => {
    const response = await request.post(endpoint).send({
      useremail: USER_EMAIL,
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Don't leave a field empty");
    expect(bcryptCompareSpy).not.toBeCalled();
  });

  it("Should send error when user not registered for email", async () => {
    const response = await request.post(endpoint).send({
      useremail: "xyx@gmail.com",
      userpassword: USER_PASSWORD,
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Not a valid user!");
    expect(bcryptCompareSpy).not.toBeCalled();
  });

  it("Should send error for wrong password", async () => {
    const response = await request.post(endpoint).send({
      useremail: USER_EMAIL,
      userpassword: 123,
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User name/password is incorrect!");
    expect(bcryptCompareSpy).toBeCalledTimes(1);
  });

  it("Should send success response for correct credentials", async () => {
    const response = await request.post(endpoint).send({
      useremail: USER_EMAIL,
      userpassword: USER_PASSWORD,
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/Success/i);
    expect(response.body.data).toBeDefined();

    expect(response.body).toHaveProperty("state");
    expect(response.body.state).toBe(1);
    expect(response.body).toHaveProperty("data");

    expect(response.body.token).toBeDefined();
    expect(response.body.tokenData).toBe(null);

    expect(bcryptCompareSpy).toBeCalledTimes(1);
    expect(bcryptCompareSpy).toBeCalledWith(
      USER_PASSWORD,
      USER_PASSWORD_HASH,
      expect.anything()
    );
  });

  it("Should send success response with tokenData for correct credentials when request sent from c2c", async () => {
    const response = await request.post(endpoint).send({
      useremail: USER_EMAIL,
      userpassword: USER_PASSWORD,
      c2c: 1,
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/Success/i);
    expect(response.body.data).toBeDefined();

    expect(response.body).toHaveProperty("state");
    expect(response.body.state).toBe(1);
    expect(response.body).toHaveProperty("data");

    expect(response.body.token).toBeDefined();
    expect(response.body.tokenData).toStrictEqual(LoginData);

    expect(bcryptCompareSpy).toBeCalledTimes(1);
    expect(bcryptCompareSpy).toBeCalledWith(
      USER_PASSWORD,
      USER_PASSWORD_HASH,
      expect.anything()
    );
  });
});
