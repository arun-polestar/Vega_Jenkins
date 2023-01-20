// const proc = require("../common/procedureConfig");
// const commonModel = require("../common/Model");
const couponService = require("./service");
const logger = require("../../services/logger");

module.exports = {
  voucherlist,
  fileterlist,
  placedorder,
};

async function voucherlist(req, res) {
  if (!req.body || !(req.body && req.body.secret_key)) {
    return res.json({
      state: -1,
      message: "Unauthorized Request!",
    });
  }
  try {
    let { Vega_StoreCouponToken, walletGuid, includeProducts } =
      await couponService.getCouponToken(
        (req.body && req.body.wallet_id) || 1,
        req.body && req.body.secret_key,
        "c2c"
      );
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
    return res.json({
      state: -1,
      message: err.message || err || "Something went Wrong",
      results: null,
    });
  }
}

async function fileterlist(req, res) {
  if (!req.body || !req.body.secret_key) {
    return res.json({
      state: -1,
      message: "Unauthorized Request!",
    });
  }
  try {
    let { Vega_StoreCouponToken, walletGuid } =
      await couponService.getCouponToken(
        (req.body && req.body.wallet_id) || 1,
        req.body && req.body.secret_key,
        "c2c"
      );

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
    return res.json({
      state: -1,
      message: err.message || err || "Something went Wrong",
      results: null,
    });
  }
}

async function placedorder(req, res) {
  if (
    !req.body ||
    !req.body.exchangeRateRule ||
    !req.body.productId ||
    !req.body.quantity ||
    !req.body.denomination ||
    !req.body.email ||
    !req.body.contact ||
    !(req.body.candidateid || req.body.employeeid) ||
    !req.body.secret_key ||
    !req.body.contest_id
  ) {
    return res.json({
      message: "Send required data",
      state: -1,
    });
  }
  try {
    /**----------------------------------------------# get Coupon token data is okay?------------------------------------ */

    let { Vega_StoreCouponToken, walletGuid } =
      await couponService.getCouponToken(
        (req.body && req.body.wallet_id) || 1,
        req.body && req.body.secret_key,
        "c2c"
      );
    const Vega_StoreAccessToken =
      Vega_StoreCouponToken && Vega_StoreCouponToken.accessToken;

    /**----------------------------------------------#Validate Data From C2C is Valid------------------------------------ */

    await couponService.c2cValidateOrder(req);

    /**----------------------------------------------#Validate Coupon data is okay?------------------------------------ */

    // await couponService.validateorder(
    //   req.body.productId,
    //   coupontoken.access_token,
    //   req.body && req.body.exchangeRateRule,
    //   req.body.quantity,
    //   req.body.amount,
    //   req.body.denomination
    // );

    /**----------------------------------------------#3nd party api for Coupon redeeem------------------------------------ */

    couponResult = await couponService.vegaStoreRedeemCoupon(
      req,
      Vega_StoreAccessToken,
      walletGuid
    );
    storeId = 1;
    storeData =
      couponResult && couponResult.placeOrder && couponResult.placeOrder.data;

    /**----------------------------------------------#Coupon Data Save------------------------------------ */

    await couponService.c2cSaveCouponDetails(req, storeData, storeId);

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
