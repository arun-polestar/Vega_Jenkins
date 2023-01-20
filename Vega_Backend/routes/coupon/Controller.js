const axios = require("axios");
const proc = require("../common/procedureConfig");
const config = require("../../config/config");
const commonModel = require("../common/Model");
const commonCtrl = require("../common/Controller");
const superCtrl = require("../superAdmin/Controller");
const mailservice = require("../../services/mailerService");
const optionConfig = require("../../config/config");
const webUrlLink = require("../../config/config").webUrlLink;
const { object } = require("underscore");
const bcrypt = require("bcryptjs");
const logger = require("../../services/logger");
const couponService = require("./service");

const prefix = webUrlLink.split(".")[0].slice(webUrlLink.indexOf(":") + 3);

module.exports = {
  couponbalance,
  fileterlist,
  voucherlist,
  placedorder,
  // orderdetails,
  viewBalance,
  // couponaccestoken,
  redeemcoupon,
  updatecouponbalance,
  passcodeset,
  viewcouponcode,
  useCoupon,
  viewRedeemLimit,
};

var OAUTH_URL = (config && config.COUPON && config.COUPON.OAUTH_URL) || "";
var VEGA_STORE_OAUTH_URL =
  (config && config.VEGA_STORE_COUPON && config.VEGA_STORE_COUPON.OAUTH_URL) ||
  "";
// VEGA_STORE_OAUTH_URL = "http://localhost:8214";

/**     ----------------------------        This api will be needed in Upcomming Release--------------------------- */

async function viewBalance(req, res) {
  if (!req.body) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  try {
    /**----------------------------------------------# get Coupon token ------------------------------------ */
    let { Vega_StoreCouponToken, walletGuid } =
      await couponService.getCouponToken(req.body && req.body.wallet_id);
    const Vega_StoreAccessToken =
      Vega_StoreCouponToken && Vega_StoreCouponToken.accessToken;

    /**----------------------------------------------#3nd party api for Voucher List------------------------------------ */

    let couponBalance = await couponService.vegaStoreViewBalance(
      req,
      Vega_StoreAccessToken,
      walletGuid
    );
    return res.json({
      state: 1,
      message: "Success",
      results: couponBalance,
    });
  } catch (err) {
    logger.error(`Error From viewbalance   API ${err}`);
    return res.json({
      state: -1,
      message: err.message || err || "Something went Wrong",
      results: null,
    });
  }
}

async function couponbalance(req, res) {
  try {
    let obj = req.body;
    obj.action = "couponaccestoken";
    commonModel
      .mysqlPromiseModelService(proc.coupon, [JSON.stringify(obj)])
      .then(async (results) => {
        if (
          !(results && results[1] && results[1][0] && results[1][0].coupontoken)
        ) {
          return res.json({
            state: -1,
            message: "Coupon keys not found!",
          });
        }
        var coupontoken = {};
        coupontoken = results[1] && results[1][0] && results[1][0].coupontoken;
        coupontoken = JSON.parse(coupontoken);
        if (!coupontoken.hasOwnProperty("access_token")) {
          return res.json({
            state: -1,
            message: "access_token keys not found!",
          });
        }
        const token = coupontoken.access_token;
        let url = `${OAUTH_URL}/v1/oauth/api`;
        let obj = {
          query: "plumProAPI.query.getBalance",
          tag: "plumProAPI",
          variables: {
            data: {},
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
              results.data.data.getBalance &&
              results.data.data.getBalance.status == 1
            ) {
              return res.json({
                state: 1,
                message: "Success",
                results:
                  results.data.data &&
                  results.data.data.getBalance &&
                  results.data.data.getBalance.data,
              });
            } else {
              return res.json({
                state: -1,
                message:
                  (results.data &&
                    results.data.data &&
                    results.data.data.getBalance &&
                    results.data.data.getBalance.errorInfo) ||
                  "Something went Wrong",
                results: null,
              });
            }
          })
          .catch((e) => {
            return res.json({
              state: -1,
              message:
                (e && e.response && e.response.data && e.response.data.error) ||
                e ||
                "Something went Wrong",
              results: null,
            });
          });
      })
      .catch((err) => {
        return res.json({
          state: -1,
          message: err.message || err,
        });
      });
  } catch (err) {
    return res.json({
      state: -1,
      message: err.message || err || "Something went Wrong",
      results: null,
    });
  }
}

async function voucherlist(req, res) {
  if (!req.body) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  try {
    /**----------------------------------------------# get Coupon token ------------------------------------ */
    let { Vega_StoreCouponToken, walletGuid, includeProducts } =
      await couponService.getCouponToken(req.body && req.body.wallet_id);
    const Vega_StoreAccessToken =
      Vega_StoreCouponToken && Vega_StoreCouponToken.accessToken;
    /**----------------------------------------------#3nd party api for Voucher List------------------------------------ */

    req.body.includeProducts = includeProducts;
    let voucherList = await couponService.vegaStoreVoucherList(
      req,
      Vega_StoreAccessToken,
      walletGuid
    );
    return res.json({
      state: 1,
      message: "Success",
      results: voucherList,
    });
  } catch (err) {
    logger.error(`Error From voucherList  API ${err}`);
    return res.json({
      state: -1,
      message: err.message || err || "Something went Wrong",
      results: null,
    });
  }
}

// async function voucherlist(req, res) {
//   try {
//     let obj = req.body;
//     obj.action = "couponaccestoken";
//     commonModel
//       .mysqlPromiseModelService(proc.coupon, [JSON.stringify(obj)])
//       .then(async (results) => {
//         if (
//           !(results && results[1] && results[1][0] && results[1][0].coupontoken)
//         ) {
//           return res.json({
//             state: -1,
//             message: "Coupon keys not found!",
//           });
//         }
//         let allow_coupon_id =
//           (results &&
//             results[2] &&
//             results[2][0] &&
//             results[2][0].allow_coupon_id) ||
//           "";
//         allow_coupon_id = allow_coupon_id.toString();
//         var coupontoken = {};
//         coupontoken = results[1] && results[1][0] && results[1][0].coupontoken;
//         coupontoken = JSON.parse(coupontoken);
//         if (!coupontoken.hasOwnProperty("access_token")) {
//           return res.json({
//             state: -1,
//             message: "access_token keys not found!",
//           });
//         }
//         const token = coupontoken.access_token;
//         let url = `${OAUTH_URL}/v1/oauth/api`;
//         let obj = {
//           query: "plumProAPI.mutation.getVouchers",
//           tag: "plumProAPI",
//           variables: {
//             data: {
//               limit: 3000, //(req && req.body && req.body.limit) || 10,
//               page: 1, //(req && req.body && req.body.page) || 1,
//               includeProducts: allow_coupon_id,
//               excludeProducts: "",
//               // "48332,47630,30587,52762,49196,32320,11106,49892,47702,47631,50376,48801,21692,52823,52917,31057,46653,50460,51678,48722,21598,52824,52866,", // // negative Surchrge  vocher has been excluded
//               sort: {
//                 field: (req && req.body && req.body.field) || "",
//                 order: (req && req.body && req.body.order) || "",
//               },
//               filters: [
//                 {
//                   key: "productName",
//                   value: (req && req.body && req.body.productName) || "",
//                 },
//                 {
//                   key: "country",
//                   value: (req && req.body && req.body.country) || "",
//                 },
//                 {
//                   key: "For",
//                   value: (req && req.body && req.body.For) || "",
//                 },
//                 {
//                   key: "gift_for",
//                   value: (req && req.body && req.body.gift_for) || "",
//                 },
//                 {
//                   key: "location",
//                   value: (req && req.body && req.body.location) || "",
//                 },
//                 {
//                   key: "valid_for",
//                   value: (req && req.body && req.body.valid_for) || "",
//                 },
//                 {
//                   key: "voucher_category",
//                   value: (req && req.body && req.body.voucher_category) || "",
//                 },
//                 {
//                   key: "price",
//                   value: (req && req.body && req.body.price) || "",
//                 },
//                 {
//                   key: "minPrice",
//                   value: (req && req.body && req.body.minPrice) || "",
//                 },
//                 {
//                   key: "maxPrice",
//                   value: (req && req.body && req.body.maxPrice) || "",
//                 },
//                 {
//                   key: "occasion",
//                   value: (req && req.body && req.body.occasion) || "",
//                 },
//                 {
//                   key: "productName",
//                   value: (req && req.body && req.body.productName) || "",
//                 },
//               ],
//             },
//           },
//         };
//         axios
//           .post(url, obj, {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               "Content-Type": "application/json",
//             },
//           })
//           .then((results) => {
//             if (
//               results &&
//               results.data &&
//               results.data.data &&
//               results.data.data.getVouchers &&
//               results.data.data.getVouchers.status == 1
//             ) {
//               return res.json({
//                 state: 1,
//                 message: "Success",
//                 results: results.data.data,
//               });
//             } else {
//               return res.json({
//                 state: -1,
//                 message:
//                   (results.data &&
//                     results.data.data &&
//                     results.data.data.getVouchers &&
//                     results.data.data.getVouchers) ||
//                   "Something went Wrong",
//                 results: null,
//               });
//             }
//           })
//           .catch((e) => {
//             return res.json({
//               state: -1,
//               message: "No Records Found!",
//               results: null,
//             });
//           });
//       })
//       .catch((err) => {
//         return res.json({
//           state: -1,
//           message: err.message || err,
//         });
//       });
//   } catch (err) {
//     return res.json({
//       state: -1,
//       message: err.message || err || "Something went Wrong",
//       results: null,
//     });
//   }
// }

async function fileterlist(req, res) {
  if (!req.body) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  try {
    /**----------------------------------------------# get Coupon token ------------------------------------ */
    let { Vega_StoreCouponToken, walletGuid } =
      await couponService.getCouponToken((req.body && req.body.wallet_id) || 1);
    const Vega_StoreAccessToken =
      Vega_StoreCouponToken && Vega_StoreCouponToken.accessToken;

    /**----------------------------------------------#3nd party api for Voucher List------------------------------------ */

    let filterList = await couponService.vegaStoreFilterList(
      req,
      Vega_StoreAccessToken,
      walletGuid
    );

    return res.json({
      state: 1,
      message: "Success",
      results: filterList,
    });
  } catch (err) {
    logger.error(`Error From filterList  API ${err}`);
    return res.json({
      state: -1,
      message: err.message || err || "Something went Wrong",
      results: null,
    });
  }
}

// async function fileterlist(req, res) {
//   try {
//     let obj = req.body;
//     obj.action = "couponaccestoken";
//     commonModel
//       .mysqlPromiseModelService(proc.coupon, [JSON.stringify(obj)])
//       .then(async (results) => {
//         if (
//           !(results && results[1] && results[1][0] && results[1][0].coupontoken)
//         ) {
//           return res.json({
//             state: -1,
//             message: "Coupon keys not found!",
//           });
//         }
//         var coupontoken = {};
//         coupontoken = results[1] && results[1][0] && results[1][0].coupontoken;
//         coupontoken = JSON.parse(coupontoken);
//         if (!coupontoken.hasOwnProperty("access_token")) {
//           return res.json({
//             state: -1,
//             message: "access_token keys not found!",
//           });
//         }
//         const token = coupontoken.access_token;
//         let url = `${OAUTH_URL}/v1/oauth/api`;
//         let obj = {
//           query: "plumProAPI.mutation.getFilters",
//           tag: "plumProAPI",
//           variables: {
//             data: {
//               filterGroupCode: "",
//               includeFilters: "",
//               excludeFilters: "",
//             },
//           },
//         };
//         axios
//           .post(url, obj, {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               "Content-Type": "application/json",
//             },
//           })
//           .then((results) => {
//             if (
//               results &&
//               results.data &&
//               results.data.data &&
//               results.data.data.getFilters &&
//               results.data.data.getFilters.status == 1
//             ) {
//               return res.json({
//                 state: 1,
//                 message: "Success",
//                 results: results.data.data,
//               });
//             } else {
//               return res.json({
//                 state: -1,
//                 message:
//                   (results &&
//                     results.data &&
//                     results.data.data &&
//                     results.data.data.getFilters &&
//                     results.data.data.getFilters.error) ||
//                   "Something went Wrong",
//                 results: null,
//               });
//             }
//           })
//           .catch((e) => {
//             return res.json({
//               state: -1,
//               message:
//                 (e && e.response && e.response.data && e.response.data.error) ||
//                 e ||
//                 "Something went Wrong",
//               results: null,
//             });
//           });
//       })
//       .catch((err) => {
//         return res.json({
//           state: -1,
//           message: err.message || err,
//         });
//       });
//   } catch (err) {
//     return res.json({
//       state: -1,
//       message: err.message || err || "Something went Wrong",
//       results: null,
//     });
//   }
// }

async function placedorder(req, res) {
  if (
    !req.body ||
    !req.body.exchangeRateRule ||
    !req.body.productId ||
    !req.body.quantity ||
    !req.body.denomination ||
    !req.body.email ||
    !req.body.contact
  ) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  try {
    /**----------------------------------------------# get Coupon token data is okay------------------------------------ */
    await couponService.amountValidate(req);
    let { Vega_StoreCouponToken, walletGuid } =
      await couponService.getCouponToken(req.body && req.body.wallet_id);
    const Vega_StoreAccessToken =
      Vega_StoreCouponToken && Vega_StoreCouponToken.accessToken;

    // /**----------------------------------------------#Validate Coupon data is okay------------------------------------ */

    // await couponService.validateorder(
    //   req.body.productId,
    //   Vega_StoreAccessToken,
    //   req.body && req.body.exchangeRateRule,
    //   req.body.quantity,
    //   req.body.amount,
    //   req.body.denomination
    // );
    let couponResult, storeId, storeData;

    /**----------------------------------------------#3nd party api for Coupon redeeem------------------------------------ */

    // if (isFromVegaStore == 1) {
    couponResult = await couponService.vegaStoreRedeemCoupon(
      req,
      Vega_StoreAccessToken,
      walletGuid
    );
    storeId = 1;
    storeData =
      couponResult && couponResult.placeOrder && couponResult.placeOrder.data;
    // } else {
    //   couponResult = await couponService.XOXOStoreRedeemCoupon(req, token);
    //   storeId = 2;
    //   storeData = couponResult.placeOrder.data;
    // }

    /**----------------------------------------------#Coupon Data Save------------------------------------ */

    let resultCouponSaveData = await couponService.saveCouponDetails(
      req,
      storeData,
      storeId
    );

    /**----------------------------------------------Send Coupon mail------------------------------------ */

    couponService.sendCouponMail(
      req.body.email,
      resultCouponSaveData.imageUrl,
      resultCouponSaveData.couponName,
      resultCouponSaveData.orderId,
      storeData.vouchers || storeData
    );
    return res.json({
      state: 1,
      message: "Success",
      results: couponResult,
    });
  } catch (err) {
    logger.error(`Error From placecoupon API ${err}`);
    return res.json({
      state: -1,
      message: err.message || err || "Something went Wrong",
      results: null,
    });
  }
}

async function orderdetails(req, res) {
  try {
    commonModel
      .mysqlPromiseModelService(proc.coupon, [
        JSON.stringify({
          action: "couponaccestoken",
        }),
      ])
      .then(async (results) => {
        if (
          !(results && results[0] && results[0][0] && results[0][0].couponkey)
        ) {
          return res.json({
            state: -1,
            message: "Coupon key not found",
            data: null,
          });
        }
        var coupontoken = {};
        coupontoken = results[1] && results[1][0] && results[1][0].coupontoken;
        coupontoken = JSON.parse(coupontoken);

        if (!coupontoken.hasOwnProperty("access_token")) {
          return res.json({
            state: -1,
            message: "access_token keys not found!",
          });
        }
        const token = coupontoken.access_token;
        let url = `${OAUTH_URL}/v1/oauth/api`;
        let obj = {
          query: "plumProAPI.mutation.getOrderDetails",
          tag: "plumProAPI",
          variables: {
            data: {
              poNumber: "",
              orderId: req.body && req.body.orderId,
              sendMailToReceiver: 0,
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
          .then((data) => {
            return res.json({
              state: 1,
              message: "Success",
              data: data.data.data.getOrderDetails.data,
            });
          })
          .catch((e) => {
            return res.json({
              state: -1,
              message: e.message || e || "Something went Wrong",
              data: null,
            });
          });
      })
      .catch((err) => {
        return res.json({
          state: -1,
          message: err.message || err || "Something went Wrong",
          data: null,
        });
      });
  } catch (err) {
    return res.json({
      state: -1,
      message: err.message || err || "Something went Wrong",
      data: null,
    });
  }
}

async function couponaccestoken() {
  try {
    let url = `${OAUTH_URL}/v1/oauth/token/user`;
    commonModel
      .mysqlPromiseModelService(proc.coupon, [
        JSON.stringify({
          action: "couponaccestoken",
        }),
      ])
      .then(async (results) => {
        if (
          !(results && results[0] && results[0][0] && results[0][0].couponkey)
        ) {
          //console.log("Coupon keys  not found!");
        }
        var couponconfig = {};
        couponconfig = results[0] && results[0][0] && results[0][0].couponkey;
        couponconfig = JSON.parse(couponconfig);
        var coupontoken = {};
        coupontoken = results[1] && results[1][0] && results[1][0].coupontoken;
        coupontoken = JSON.parse(coupontoken);
        if (
          !couponconfig.hasOwnProperty("Client_ID") ||
          !couponconfig.hasOwnProperty("Secret_ID") ||
          !coupontoken.hasOwnProperty("refresh_token")
        ) {
          //console.log("Coupon keys not found!");
        }
        let obj = {
          grant_type: "refresh_token",
          refresh_token: coupontoken && coupontoken.refresh_token,
          client_id: couponconfig && couponconfig.Client_ID,
          client_secret: couponconfig && couponconfig.Secret_ID,
        };
        axios
          .post(url, obj)
          .then((data) => {
            let obj1 = {};
            obj1.access_token = data && data.data;
            obj1.action = "changetoken";
            commonModel
              .mysqlPromiseModelService(proc.coupon, [JSON.stringify(obj1)])
              .then((results) => {
                //console.log("Success", results);
              })
              .catch((err) => {
                //console.log(err.message || err);
              });
          })
          .catch((e) => {
            //console.log(
            // "eeeeeeeeeeeeee",
            //  e && e.response && e.response.data && e.response.data.error
            //);
          });
      })
      .catch((err) => {
        //console.log("eeeeeeeeeeeeee", err.message || err);
      });
  } catch (e) {
    //console.log(e.message || e);
  }
}

function redeemcoupon(req, res) {
  if (!req.body) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.coupon, [obj])
    .then((results) => {
      var dbresult = commonCtrl.lazyLoading(results[0], req.body);
      if (dbresult && "data" in dbresult && "count" in dbresult) {
        return res.json({
          state: 1,
          message: "success",
          data: dbresult.data,
          count: dbresult.count,
        });
      } else {
        return res.json({
          state: -1,
          message: "Something went wrong",
          data: null,
        });
      }
    })
    .catch((err) => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}

function axioscommonfunc(url, obj) {
  return new Promise((resolve, reject) => {
    axios
      .post(url, obj, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((results) => {
        resolve(results);
      })
      .catch((e) => {
        reject((e && e.message) || e);
      });
  });
}

async function updatecouponbalance() {
  try {
    let obj = JSON.stringify({
      action: "updatecouponbalance",
    });
    commonModel
      .mysqlPromiseModelService(proc.coupon, [obj])
      .then(async (results) => {
        if (
          results &&
          results[1] &&
          results[1][0] &&
          results[1][0].state &&
          results[1][0].state == 1
        ) {
          let url;
          if (config && config.env && config.env == "development") {
            url = `http://180.151.101.114:8988/updatebalance`;
          } else {
            url = `https://superadmin.vega-hr.com/webapi/updatebalance`;
          }
          let domain = optionConfig.webUrlLink.substring(
            optionConfig.webUrlLink.indexOf("/") + 2,
            optionConfig.webUrlLink.indexOf(".")
          );
          let obj1 = {
            domain: domain,
            couponusedamount:
              results &&
              results[0] &&
              results[0][0] &&
              results[0][0].couponusedamount &&
              results[0][0].couponusedamount,
            paytmusedamount:
              results &&
              results[0] &&
              results[0][0] &&
              results[0][0].paytmusedamount &&
              results[0][0].paytmusedamount,
            coupondiscount:
              results &&
              results[0] &&
              results[0][0] &&
              results[0][0].paytmusedamount &&
              results[0][0].coupondiscount,
          };
          let axios_res = await axioscommonfunc(url, obj1);
          if (axios_res && axios_res.data && axios_res.data.state == 1) {
          } else {
          }
        } else {
        }
      })
      .catch((err) => {});
  } catch (error) {}
}

async function passcodeset(req, res) {
  if (
    !(req.body && req.body.createdby) ||
    !(req.body && req.body.userpassword) ||
    !(req.body && req.body.passcode)
  ) {
    return res.json({ state: -1, message: "Send required Data", data: null });
  }
  try {
    let obj = req.body;
    obj.action = "viewuserpassword";
    var results = await commonModel.mysqlPromiseModelService(
      proc.couponpasscode,
      [JSON.stringify(obj)]
    );
    var response = results[0][0];
    bcrypt.compare(
      req.body.userpassword,
      response.userpassword,
      async function (err, result) {
        if (!result) {
          return res.json({
            state: -1,
            message: "Invalid Password. Please try again!",
            data: null,
          });
        }
      }
    );
    let obj1 = JSON.stringify({
      createdby: req.body.createdby,
      passcode: req.body.passcode,
      action: "setpasscode",
    });
    var results1 = await commonModel.mysqlPromiseModelService(
      proc.couponpasscode,
      [obj1]
    );
    return res.json({
      state: 1,
      message: "Succefully Passcode updated!",
      data: null,
    });
  } catch (e) {
    return res.json({
      state: -1,
      message: e.message || e,
      data: null,
    });
  }
}

function viewcouponcode(req, res) {
  if (!req.body) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body);
  commonModel
    .mysqlPromiseModelService(proc.couponpasscode, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "success",
        data: results,
      });
    })
    .catch((err) => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}

function useCoupon(req, res) {
  if (!req.body) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = JSON.stringify(req.body); //    action  =   markasunused
  commonModel
    .mysqlPromiseModelService(proc.coupon, [obj])
    .then((results) => {
      return res.json({
        state: 1,
        message: "success",
      });
    })
    .catch((err) => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}

function viewRedeemLimit(req, res) {
  if (!req.body) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  let obj = req.body;
  obj.reqType = "redeemLimit";
  obj = JSON.stringify(req.body); //    action  =   markasunused
  commonModel
    .mysqlPromiseModelService(proc.redeemLimit, [obj])
    .then((results) => {
      return res.json({
        data: results && results[0] && results[0][0],
        state: 1,
        message: "success",
      });
    })
    .catch((err) => {
      return res.json({
        state: -1,
        data: null,
        message: err.message || err,
      });
    });
}
