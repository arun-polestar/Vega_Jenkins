const mailservice = require("../../services/mailerService");
const commonModel = require("../common/Model");
const proc = require("../common/procedureConfig");
const axios = require("axios");
const logger = require("../../services/logger");
const config = require("../../config/config");
const { resolve } = require("path");
const { reject } = require("lodash");
const OAUTH_URL = (config && config.COUPON && config.COUPON.OAUTH_URL) || "";
const VEGA_STORE_OAUTH_URL =
  (config &&
    config.VEGA_STORE_COUPON &&
    config.VEGA_STORE_COUPON.VEGA_STORE_OAUTH_URL) ||
  "";

let c2c_OAUTH_URL;
if (config && config.env && config.env == "development") {
  c2c_OAUTH_URL = "http://campus.vegahrdev.com/webapi";
} else {
  c2c_OAUTH_URL = "https://c2c.vega-hr.com/webapi";
}

module.exports = {
  // XOXOStoreRedeemCoupon,
  // XOXOVoucherList,
  // XOXOFilterList,
  getCouponToken,
  amountValidate,
  sendCouponMail,
  XOXOStoreRedeemCoupon,
  saveCouponDetails,
  vegaStoreRedeemCoupon,
  vegaStoreVoucherList,
  vegaStoreFilterList,
  // vegaStoreViewBalance, // will need in future
  // vegaStoreOrderDetails,     // will need in future
  validateorder,
  c2cValidateOrder,
  c2cSaveCouponDetails,
};

// function XOXOFilterList(coupontoken) {
//   return new Promise((resolve, reject) => {
//     try {
//       const token = coupontoken.access_token;
//       let url = `${OAUTH_URL}/v1/oauth/api`;
//       let obj = {
//         query: "plumProAPI.mutation.getFilters",
//         tag: "plumProAPI",
//         variables: {
//           data: {
//             filterGroupCode: "",
//             includeFilters: "",
//             excludeFilters: "",
//           },
//         },
//       };
//       axios
//         .post(url, obj, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         })
//         .then((results) => {
//           if (
//             results &&
//             results.data &&
//             results.data.data &&
//             results.data.data.getFilters &&
//             results.data.data.getFilters.status == 1
//           ) {
//             resolve(results.data.data);
//           } else {
//             logger.error(
//               `Error in mail send on placecoupon ${results.data.data.getFilters.error}`
//             );
//             reject(
//               (results &&
//                 results.data &&
//                 results.data.data &&
//                 results.data.data.getFilters &&
//                 results.data.data.getFilters.error) ||
//                 "Something went Wrong"
//             );
//           }
//         });
//     } catch (e) {
//       logger.error(e);
//       reject("Internal Server Error!");
//     }
//   });
// }

// function XOXOVoucherList(req, coupontoken) {
//   return new Promise((Resolve, Reject) => {
//     try {
//       const token = coupontoken.access_token;
//       let url = `${OAUTH_URL}/v1/oauth/api`;
//       let obj = {
//         query: "plumProAPI.mutation.getVouchers",
//         tag: "plumProAPI",
//         variables: {
//           data: {
//             limit: (req && req.body && req.body.limit) || 10,
//             page: (req && req.body && req.body.page) || 1,
//             includeProducts: "",
//             excludeProducts:
//               "48332,47630,30587,52762,49196,32320,11106,49892,47702,47631,50376,48801,21692,52823,52917,31057,46653,50460,51678,48722,21598,52824,52866,", // // negative Surchrge
//             sort: {
//               field: (req && req.body && req.body.field) || "",
//               order: (req && req.body && req.body.order) || "",
//             },
//             filters: [
//               {
//                 key: "productName",
//                 value: (req && req.body && req.body.productName) || "",
//               },
//               {
//                 key: "country",
//                 value: (req && req.body && req.body.country) || "",
//               },
//               {
//                 key: "For",
//                 value: (req && req.body && req.body.For) || "",
//               },
//               {
//                 key: "gift_for",
//                 value: (req && req.body && req.body.gift_for) || "",
//               },
//               {
//                 key: "location",
//                 value: (req && req.body && req.body.location) || "",
//               },
//               {
//                 key: "valid_for",
//                 value: (req && req.body && req.body.valid_for) || "",
//               },
//               {
//                 key: "voucher_category",
//                 value: (req && req.body && req.body.voucher_category) || "",
//               },
//               {
//                 key: "price",
//                 value: (req && req.body && req.body.price) || "",
//               },
//               {
//                 key: "minPrice",
//                 value: (req && req.body && req.body.minPrice) || "",
//               },
//               {
//                 key: "maxPrice",
//                 value: (req && req.body && req.body.maxPrice) || "",
//               },
//               {
//                 key: "occasion",
//                 value: (req && req.body && req.body.occasion) || "",
//               },
//               {
//                 key: "productName",
//                 value: (req && req.body && req.body.productName) || "",
//               },
//             ],
//           },
//         },
//       };
//       axios
//         .post(url, obj, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         })
//         .then((results) => {
//           if (
//             results &&
//             results.data &&
//             results.data.data &&
//             results.data.data.getVouchers &&
//             results.data.data.getVouchers.status == 1
//           ) {
//             Resolve(results.data.data);
//           } else {
//             logger.error(
//               `Error in mail send on placecoupon ${results.data.data.getVouchersrr}`
//             );
//             Reject(
//               (results.data &&
//                 results.data.data &&
//                 results.data.data.getVouchers &&
//                 results.data.data.getVouchers) ||
//                 "Something went Wrong"
//             );
//           }
//         });
//     } catch (e) {
//       reject("Internal Server Error!");
//     }
//   });
// }

async function validateorder(productId, token, exchangeRateRule) {
  try {
    return new Promise((resolve, reject) => {
      try {
        let url = `${VEGA_STORE_OAUTH_URL}/vegaPro/api/voucherList`;
        let obj = { ...req.body, includeProducts: req.body.productId };
        axios
          .post(url, obj, {
            headers: {
              Authorization: `Bearer ${Vega_StoreAccessToken}`,
              walletGuid: walletGuid,
            },
          })
          .then((results) => {
            if (
              results &&
              results.data &&
              results.data.data &&
              results.data.data.getVouchers &&
              results.data.data.getVouchers.status == 1
            ) {
              let arr = results.data.data.getVouchers.data;
              const filter = arr.filter(
                (val) =>
                  val.productId == productId &&
                  val.exchangeRateRule == exchangeRateRule
              );
              if (filter.length == 0) {
                reject("Not valid Product Details!");
              } else {
                resolve("Success");
              }
              // } else {
              //   reject("We're sorry—we've run into an issue.");
              // }
            } else {
              reject(
                (results &&
                  results.data &&
                  results.data.data &&
                  results.data.data) ||
                  "Something went Wrong"
              );
            }
          })
          .catch((e) => {
            logger.error(`Error From placecoupon API ${e.response.data}`);
            reject(
              (e && e.response && e.response.data && e.response.data.message) ||
                "Internal Server Error!"
            );
          });
      } catch (e) {
        logger.error(`Error From placecoupon API  ${e}`);
        reject("Intrenal Server Error!");
      }
    });

    return new Promise((resolve, reject) => {
      let url = `${OAUTH_URL}/v1/oauth/api`;
      let obj = {
        query: "plumProAPI.mutation.getVouchers",
        tag: "plumProAPI",
        variables: {
          data: {
            limit: 0,
            page: 0,
            includeProducts: productId.toString(),
            excludeProducts: "",
            sort: {
              field: "",
              order: "",
            },
            filters: [],
          },
        },
      };
      axios
        .post(url, obj, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        .then((results) => {
          if (
            results &&
            results.data &&
            results.data.data &&
            results.data.data.getVouchers &&
            results.data.data.getVouchers.data
          ) {
            let arr = results.data.data.getVouchers.data;
            const filter = arr.filter(
              (val) =>
                val.productId == productId &&
                val.exchangeRateRule == exchangeRateRule
            );
            if (filter.length == 0) {
              reject("Not valid Product Details!");
            } else {
              resolve("Success");
            }
          } else {
            reject("We're sorry—we've run into an issue.");
          }
        })
        .catch((e) => {
          reject((e && e.message) || e);
        });
    });
  } catch (err) {
    return res.json({
      state: -1,
      data: null,
      message: err.message || err,
    });
  }
}

async function c2cValidateOrder(req) {
  return new Promise((resolve, reject) => {
    try {
      let url = `${c2c_OAUTH_URL}/v1/coupon/candidates/verifyBalance`;
      let obj = req.body;
      axios
        .post(url, obj, {
          headers: {
            Authorization: req.headers && req.headers.authorization,
            [`x-api-key`]: req.headers && req.headers[`x-api-key`],
            "Content-Type": "application/json",
          },
        })
        .then((results) => {
          resolve("Success");
        })
        .catch((e) => {
          reject((e && e.message) || e);
        });
    } catch (err) {
      reject((e && e.message) || e);
    }
  });
}

async function getCouponToken(walletId, secret_key = "", reqType = "") {
  return new Promise(async (resolve, reject) => {
    try {
      if (!walletId) {
        reject("wallet_id is missing!");
      }
      let results = await commonModel.mysqlPromiseModelService(proc.coupon, [
        JSON.stringify({
          action: "couponaccesstoken",
          wallet_id: walletId,
          secret_key: secret_key,
          reqType: reqType,
        }),
      ]);

      let { Vega_StoreCouponToken, walletGuid, includeProducts } =
        results && results[0] && results[0][0] && results[0][0];
      if (!Vega_StoreCouponToken) {
        reject("Coupon keys not found!");
      }
      Vega_StoreCouponToken = JSON.parse(Vega_StoreCouponToken);
      if (
        !(
          Vega_StoreCouponToken &&
          Vega_StoreCouponToken.hasOwnProperty("accessToken")
        )
      ) {
        reject("AccessToken keys not found!");
      }

      resolve({
        Vega_StoreCouponToken,
        walletGuid,
        includeProducts,
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function amountValidate(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let obj = req.body;
      obj.action = "validateamount";
      obj.amount = (
        (req.body.quantity * req.body.denomination) /
        req.body.exchangeRateRule
      ).toFixed(2);

      let results = await commonModel.mysqlPromiseModelService(proc.coupon, [
        JSON.stringify(obj),
      ]);

      if (results && results[0] && results[0].state == -1) {
        reject("Internal Server Error!");
      } else {
        resolve("Success");
      }
    } catch (e) {
      reject(e);
    }
  });
}

async function saveCouponDetails(req, couponData, storeId) {
  return new Promise((resolve, reject) => {
    let obj = {
      ...req.body,
      ...couponData,
      ...{ action: "couponorder", storeId: storeId },
    };
    commonModel
      .mysqlPromiseModelService(proc.couponorder, [JSON.stringify(obj)])
      .then(async (results) => {
        resolve(results[0][0]);
      })
      .catch((er) => {
        logger.error(`Error From placecoupon API  ${er}`);
        reject(er.message || er);
      });
  });
}

async function c2cSaveCouponDetails(req, couponData, storeId) {
  return new Promise((resolve, reject) => {
    try {
      let obj = {
        ...req.body,
        ...couponData,
        ...{ action: "couponorder", storeId: storeId },
      };
      commonModel
        .mysqlPromiseModelService(proc.c2ccouponorder, [JSON.stringify(obj)])
        .then(async (results) => {
          resolve(results[0][0]);
        })
        .catch((er) => {
          logger.error(`Error From placecoupon API  ${er}`);
          reject(er.message || er);
        });
    } catch (e) {
      logger.error(`Error From placecoupon API  ${e}`);
      reject("Intrenal Server Error!");
    }
  });
}

async function XOXOStoreRedeemCoupon(req, token) {
  return new Promise((resolve, reject) => {
    try {
      let url = `${OAUTH_URL}/v1/oauth/api`;
      let obj = {
        query: "plumProAPI.mutation.placeOrder",
        tag: "plumProAPI",
        variables: {
          data: {
            productId: req.body && req.body.productId,
            quantity: req.body && req.body.quantity,
            denomination: req.body && req.body.denomination,
            email: "",
            contact: (req.body && req.body.contact) || "",
            tag: (req.body && req.body.tag) || "",
            poNumber: "",
            notifyAdminEmail: 0,
            notifyReceiverEmail: 0,
          },
        },
      };
      axios
        .post(url, obj, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        .then((results) => {
          if (
            results &&
            results.data &&
            results.data.data &&
            results.data.data.placeOrder &&
            results.data.data.placeOrder.status == 1
          ) {
            resolve(results.data.data);
          } else {
            logger.error(
              `Error From placecoupon API  ${
                results &&
                results.data &&
                results.data.data &&
                results.data.data.placeOrder &&
                results.data.data.placeOrder.error
              }`
            );
            reject(
              (results &&
                results.data &&
                results.data.data &&
                results.data.data.placeOrder &&
                results.data.data.placeOrder.error &&
                results.data.data.placeOrder.error.message) ||
                "Something went Wrong"
            );
          }
        })
        .catch((e) => {
          logger.error(`Error From placecoupon API ${e}`);
          let errmsg;
          if (
            typeof (
              e &&
              e.response &&
              e.response.data &&
              e.response.data.error &&
              e.response.data.error
            ) == "object"
          ) {
            errmsg =
              (e &&
                e.response &&
                e.response.data &&
                e.response.data.error &&
                e.response.data.error &&
                e.response.data.error[0] &&
                e.response.data.error[0].msg) ||
              "Something went Wrong";
          } else {
            errmsg =
              (e &&
                e.response &&
                e.response.data &&
                e.response.data.error &&
                e.response.data.error) ||
              "Something went Wrong";
          }
          reject(errmsg);
        });
    } catch (e) {
      logger.error(`Error From placecoupon API  ${e}`);
      reject("Intrenal Server Error!");
    }
  });
}

async function vegaStoreVoucherList(req, Vega_StoreAccessToken, walletGuid) {
  return new Promise((resolve, reject) => {
    try {
      let url = `${VEGA_STORE_OAUTH_URL}/vegaPro/api/voucherList`;
      // req.body.includeProducts = includeProducts;
      let obj = { ...req.body };
      axios
        .post(url, obj, {
          headers: {
            Authorization: `Bearer ${Vega_StoreAccessToken}`,
            walletGuid: walletGuid,
          },
        })
        .then((results) => {
          if (
            results &&
            results.data &&
            results.data.data &&
            results.data.data.getVouchers &&
            results.data.data.getVouchers.status == 1
          ) {
            resolve(results.data.data);
          } else {
            logger.error(`Error From placecoupon API  ${results.data.data}`);
            reject(
              (results &&
                results.data &&
                results.data.data &&
                results.data.data) ||
                "Something went Wrong"
            );
          }
        })
        .catch((e) => {
          logger.error(
            `Error From placecoupon API ${e && e.response && e.response.data}`
          );
          reject(
            (e && e.response && e.response.data && e.response.data.message) ||
              "Internal Server Error!"
          );
        });
    } catch (e) {
      logger.error(`Error From placecoupon API  ${e}`);
      reject("Intrenal Server Error!");
    }
  });
}

async function vegaStoreFilterList(req, Vega_StoreAccessToken, walletGuid) {
  return new Promise((resolve, reject) => {
    try {
      let url = `${VEGA_STORE_OAUTH_URL}/vegaPro/api/filterList`;
      let obj = {};
      axios
        .post(url, obj, {
          headers: {
            Authorization: `Bearer ${Vega_StoreAccessToken}`,
            walletGuid: walletGuid,
          },
        })
        .then((results) => {
          if (
            results &&
            results.data &&
            results.data.data &&
            results.data.data.getFilters &&
            results.data.data.getFilters.status == 1
          ) {
            resolve(results.data.data);
          } else {
            logger.error(
              `Error From filterlist API  ${results.data.getFilters}`
            );
            reject(
              (results &&
                results.data &&
                results.data.data &&
                results.data.data) ||
                "Something went Wrong"
            );
          }
        })
        .catch((e) => {
          logger.error(`Error From filterlist API ${e.response.data}`);
          reject(
            (e && e.response && e.response.data && e.response.data.message) ||
              "Internal Server Error!"
          );
        });
    } catch (e) {
      logger.error(`Error From placecoupon API  ${e}`);
      reject("Intrenal Server Error!");
    }
  });
}

// async function vegaStoreViewBalance(req, Vega_StoreAccessToken, walletGuid) {
//   return new Promise((resolve, reject) => {
//     try {
//       let url = `${VEGA_STORE_OAUTH_URL}/vegaPro/api/viewBalance`;
//       let obj = {};
//       axios
//         .post(url, obj, {
//           headers: {
//             Authorization: `Bearer ${Vega_StoreAccessToken}`,
//             walletGuid: walletGuid,
//           },
//         })
//         .then((results) => {
//           if (
//             results &&
//             results.data &&
//             results.data.data &&
//             results.data.data.getFilters &&
//             results.data.data.getFilters.status == 1
//           ) {
//             resolve(results.data.data);
//           } else {
//             logger.error(
//               `Error From filterList API  ${results.data.getFilters}`
//             );
//             reject(
//               (results &&
//                 results.data &&
//                 results.data.data &&
//                 results.data.data) ||
//                 "Something went Wrong"
//             );
//           }
//         })
//         .catch((e) => {
//           logger.error(`Error From filterList API ${e.response.data}`);
//           reject(
//             (e && e.response && e.response.data && e.response.data.message) ||
//               "Internal Server Errro!"
//           );
//         });
//     } catch (e) {
//       logger.error(`Error From filterList API  ${e}`);
//       reject("Intrenal Server Error!");
//     }
//   });
// }

// async function vegaStoreAccessToken(req, Vega_StoreAccessToken, walletGuid) {
//   return new Promise((resolve, reject) => {
//     try {
//       let url = `${VEGA_STORE_OAUTH_URL}/vegaPro/api/viewBalance`;
//       let obj = {};
//       axios
//         .post(url, obj, {
//           headers: {
//             Authorization: `Bearer ${Vega_StoreAccessToken}`,
//             walletGuid: walletGuid,
//           },
//         })
//         .then((results) => {
//           if (
//             results &&
//             results.data &&
//             results.data.data &&
//             results.data.data.getFilters &&
//             results.data.data.getFilters.status == 1
//           ) {
//             resolve(results.data.data);
//           } else {
//             logger.error(
//               `Error From viewBalance API  ${results.data.getFilters}`
//             );
//             reject(
//               (results &&
//                 results.data &&
//                 results.data.data &&
//                 results.data.data) ||
//                 "Something went Wrong"
//             );
//           }
//         })
//         .catch((e) => {
//           logger.error(`Error From viewBalance API ${e.response.data}`);
//           reject(
//             (e && e.response && e.response.data && e.response.data.message) ||
//               "Internal Server Errro!"
//           );
//         });
//     } catch (e) {
//       logger.error(`Error From viewBalance API  ${e}`);
//       reject("Intrenal Server Error!");
//     }
//   });
// }

// async function vegaStoreOrderDetails(req, Vega_StoreAccessToken, walletGuid) {
//   return new Promise((resolve, reject) => {
//     try {
//       let url = `${VEGA_STORE_OAUTH_URL}/vegaPro/api/orderDetails`;
//       let obj = {};
//       axios
//         .post(url, obj, {
//           headers: {
//             Authorization: `Bearer ${Vega_StoreAccessToken}`,
//             walletGuid: walletGuid,
//           },
//         })
//         .then((results) => {
//           if (
//             results &&
//             results.data &&
//             results.data.data &&
//             results.data.data.getFilters &&
//             results.data.data.getFilters.status == 1
//           ) {
//             resolve(results.data.data);
//           } else {
//             logger.error(
//               `Error From filterlist API  ${results.data.getFilters}`
//             );
//             reject(
//               (results &&
//                 results.data &&
//                 results.data.data &&
//                 results.data.data) ||
//                 "Something went Wrong"
//             );
//           }
//         })
//         .catch((e) => {
//           logger.error(`Error From filterlist API ${e.response.data}`);
//           reject(
//             (e && e.response && e.response.data && e.response.data.message) ||
//               "Internal Server Errro!"
//           );
//         });
//     } catch (e) {
//       logger.error(`Error From placecoupon API  ${e}`);
//       reject("Intrenal Server Error!");
//     }
//   });
// }

async function vegaStoreRedeemCoupon(req, Vega_StoreAccessToken, walletGuid) {
  return new Promise((resolve, reject) => {
    try {
      let url = `${VEGA_STORE_OAUTH_URL}/vegaPro/api/placeOrder`;
      let obj = {
        productId: req.body.productId,
        quantity: req.body && req.body.quantity,
        denomination: req.body && req.body.denomination,
        email: req.body && req.body.email,
        contact: (req.body && req.body.contact) || "",
        tag: (req.body && req.body.tag) || "",
        poNumber: "12121",
        notifyAdminEmail: 0,
        notifyReceiverEmail: 0,
        // walletGuid: walletGuid + "",
      };
      axios
        .post(url, obj, {
          headers: {
            Authorization: `Bearer ${Vega_StoreAccessToken}`,
            walletGuid: walletGuid,
          },
        })
        .then((results) => {
          if (
            results &&
            results.data &&
            results.data.data &&
            results.data.data.placeOrder.status == 1
          ) {
            resolve(results.data.data);
          } else {
            logger.error(
              `Error From placecoupon API  ${
                results && results.data && results.data.data
              }`
            );
            reject(
              (results &&
                results.data &&
                results.data.data &&
                results.data.data) ||
                "Something went Wrong"
            );
          }
        })
        .catch((e) => {
          logger.error(
            `Error From placecoupon API ${e && e.response && e.response.data}`
          );
          reject(
            (e && e.response && e.response.data && e.response.data.message) ||
              "Internal Server Error!"
          );
        });
    } catch (e) {
      logger.error(`Error From placecoupon API  ${e}`);
      reject("Intrenal Server Error!");
    }
  });
}

async function sendCouponMail(
  email,
  imageUrl,
  couponName,
  orderId,
  vouchersarr
) {
  let congratulationsimage, vega_logo;

  if (config && config.env && config.env == "development") {
    congratulationsimage = config.webUrlLink + "/img/congratulations.jpg";
    vega_logo = config.webUrlLink + "/cert/vega-logo.png";
  } else {
    congratulationsimage =
      config.webUrlLink + "/webapi/img/congratulations.jpg";
    vega_logo = config.webUrlLink + "/webapi/cert/vega-logo.png";
  }
  var subjecttype = `${couponName} Coupon Delivered: Vega-HR OrderID ${orderId}`;
  var couponBody = "";
  vouchersarr.forEach(function (cpn) {
    let pincode = "";
    function toTitles(s) {
      return s.replace(/\w\S*/g, function (t) {
        return t.charAt(0).toUpperCase() + t.substr(1).toLowerCase();
      });
    }
    if (cpn && cpn.pin) {
      var str = toTitles(cpn.type);
      pincode = `<p
                    style=" color: rgb( 80, 80, 80 ); font-size: 16px; margin: 6px 0px 0px; font-weight: 500; ">
                    ${str} : ${cpn.pin}
                  </p>`;
    }
    // let imageUrl = (re && re[0] && re[0][0] && re[0][0].imageUrl) || "",
    const { currency, amount, validity, voucherCode } = cpn;
    let validitytill = moment(validity, "YYYY-MM-DD").format("DD MMMM YYYY");
    couponBody += `<tr>
                                                                                        <td
                                                                                          style="padding: 10px 60px 15px 60px;">
                                                                                          <table cellpadding="0"
                                                                                            cellspacing="0" border="0"
                                                                                            width="100%"
                                                                                            style="text-align: left; font-size: 14px; background-color: rgb(250, 250, 250); border-radius: 6px;">
                                                                                            <tbody>
                                                                                              <tr>
                                                                                                <td>
                                                                                                  <table cellpadding="0"
                                                                                                    cellspacing="0"
                                                                                                    border="0"
                                                                                                    width="100%"
                                                                                                    style="text-align: left; font-size: 14px; background-color: rgb(250,250,250);border-radius: 6px;margin-bottom: 10px;">
                                                                                                    <tbody>
                                                                                                      <tr>
                                                                                                        <th
                                                                                                          style=" padding: 10px 0px 10px 20px; text-align: left; font-size: 20px; color: rgb(80,80,80);">
                                                                                                          ${couponName}
                                                                                                        </th>
                                                                                                      </tr>
                                                                                                      <tr>
                                                                                                        <td colspan="2"
                                                                                                          style=" padding: 10px 0px 15px 20px; text-align: left; border-bottom: 1px solid rgb(235,235,235)">
                                                                                                          <table
                                                                                                            cellpadding="0"
                                                                                                            cellspacing="0"
                                                                                                            border="0">
                                                                                                            <tbody>
                                                                                                              <tr>
                                                                                                                <td>
                                                                                                                  <span
                                                                                                                    style=" display: inline-block; height: 100px; width: 100px; ">
                                                                                                                    <img
                                                                                                                      src="${imageUrl}"
                                                                                                                      height="100"
                                                                                                                      width="100"
                                                                                                                      class="CToWUd" />
                                                                                                                  </span>
                                                                                                                </td>
                                                                                                                <td>
                                                                                                                  <table
                                                                                                                    cellpadding="0"
                                                                                                                    cellspacing="0"
                                                                                                                    border="0"
                                                                                                                    style=" display: inline-block; padding-left: 20px; ">
                                                                                                                    <tbody>
                                                                                                                      <tr>
                                                                                                                        <td>
                                                                                                                          <span
                                                                                                                            style=" margin: 0px; color: rgb( 144, 144, 144 ); font-size: 16px; ">
                                                                                                                            Worth
                                                                                                                          </span>
                                                                                                                        </td>
                                                                                                                      </tr>
                                                                                                                      <tr>
                                                                                                                        <td>
                                                                                                                          <strong
                                                                                                                            style=" margin: 0px; font-size: 26px; font-weight: 500; color: rgb( 26, 26, 26 ); ">
                                                                                                                            ${currency} 
                                                                                                                            ${amount}
                                                                                                                          </strong>
                                                                                                                        </td>
                                                                                                                      </tr>
                                                                                                                      <tr>
                                                                                                                        <td>
                                                                                                                          <span
                                                                                                                            style=" margin-top: 10px; font-size: 16px; ">
                                                                                                                            Valid
                                                                                                                            till
                                                                                                                            ${validitytill}
                                                                                                                          </span>
                                                                                                                        </td>
                                                                                                                      </tr>
                                                                                                                    </tbody>
                                                                                                                  </table>
                                                                                                                </td>
                                                                                                              </tr>
                                                                                                            </tbody>
                                                                                                          </table>
                                                                                                        </td>
                                                                                                      </tr>
                                                                                                      <tr>
                                                                                                        <td
                                                                                                          style=" padding: 15px 0px 15px 20px; ">
                                                                                                          <p
                                                                                                            style=" color: rgb( 144, 144, 144 ); font-size: 16px; margin: 0px; ">
                                                                                                            Gift Card
                                                                                                            Code </p>
                                                                                                          <p
                                                                                                            style=" color: rgb( 80, 80, 80 ); font-size: 16px; margin: 6px 0px 0px; font-weight: 500; ">
                                                                                                            ${voucherCode}
                                                                                                          </p>
                                                                                                          ${pincode}
                                                                                                        </td>
                                                                                                      </tr>
                                                                                                    </tbody>
                                                                                                  </table>
                                                                                                </td>
                                                                                              </tr>
                                                                                            </tbody>
                                                                                          </table>
                                                                                        </td>
                                                                                      </tr>
`;
  });
  var emailObj = {
    email: email,
    mailType: "couponvoucher",

    subjectVariables: {
      subject: subjecttype,
    },

    headingVariables: {
      heading: subjecttype,
    },

    bodyVariables: {
      CouponMailBody: couponBody,
      Congratulationimage: congratulationsimage,
      vega_logo: vega_logo,
    },
  };
  mailservice.mail(emailObj, function (err) {
    if (err) {
      logger.error(`Error in mail send on placecoupon ${err}`);
    }
  });
}
