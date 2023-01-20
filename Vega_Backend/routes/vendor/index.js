const vendor = require("./Controller");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/vendorlogin", vendor.vendorLogin);
app.post("/vendorregister", vendor.vendorRegister);
app.post("/resendVendorOtp", vendor.resendVendorOtp);
app.post("/validateVendorOtp", vendor.validateVendorOtp);
app.post("/updateVendorPassword", vendor.updateVendorPassword);
app.post("/updateVendorTheme", vendor.updateVendorTheme);
app.post("/changeVendorPassword", vendor.changeVendorPassword);
app.post("/checkVendorSession", vendor.checkVendorSession);
app.post("/getVendorMaster", sessionAuth, vendor.getVendorMaster);
app.post("/getCandidateInfo", vendor.getCandidateInfo);
app.post("/changeVendorStatus", sessionAuth, vendor.changeVendorStatus);
app.post("/deactivateVendor", sessionAuth, vendor.deactivateVendor);

/*--------------------------------------------------------------------------------------*/
/*------------------------Start RecruitmentVendorController-----------------------------*/
/*--------------------------------------------------------------------------------------*/

app.post("/updateVendorDetails", sessionAuth, vendor.updateVendorDetails);
app.post("/getVendorDetails", sessionAuth, vendor.getVendorDetails);
app.post("/getVendorData", sessionAuth, vendor.getVendorData);
app.post("/approvalAction", sessionAuth, vendor.approvalAction);
app.post("/getVendorDetailsById", sessionAuth, vendor.getVendorDetailsById);
app.post("/getVendorJD", sessionAuth, vendor.getVendorJD);
app.post("/rmsUploadVendor", sessionAuth, vendor.rmsUploadVendor);
//app.post("/getParsedData",sessionAuth,vendor.getParsedData)
app.post("/downloadResumeFile", sessionAuth, vendor.downloadResumeFile);
app.post("/addCandidateVendor", sessionAuth, vendor.addCandidateVendor);
app.post("/getVendorRequisition", sessionAuth, vendor.getVendorRequisition);
app.post(
  "/getCandidateOnBoardData",
  sessionAuth,
  vendor.getCandidateOnBoardData
);
app.post(
  "/getVendorRequisitionDetails",
  sessionAuth,
  vendor.getVendorRequisitionDetails
);
app.post(
  "/getVendorCandidateDetails",
  sessionAuth,
  vendor.getVendorCandidateDetails
);

/*--------------------------------------------------------------------------------------*/
/*--------------------------End RecruitmentVendorController-----------------------------*/
/*--------------------------------------------------------------------------------------*/

/*--------------------------------------------------------------------------------------*/
/*--------------------------------Start BGVVendorController-----------------------------*/
/*--------------------------------------------------------------------------------------*/
app.post("/saveCandidateDetailBGV", sessionAuth, vendor.saveCandidateDetailBGV);
app.post("/getCandidateDetailBGV", sessionAuth, vendor.getCandidateDetailBGV);
app.post("/getBgvCandidateData", sessionAuth, vendor.getBgvCandidateData);
app.post("/updateBgvVendorDetails", sessionAuth, vendor.updateBgvVendorDetails);
app.post("/getBgvVendorDetails", sessionAuth, vendor.getBgvVendorDetails);

/*--------------------------------------------------------------------------------------*/
/*-------------------------------------End VendorController-----------------------------*/
/*--------------------------------------------------------------------------------------*/
app.post(
  "/vendorPaymentOperations",
  sessionAuth,
  vendor.vendorPaymentOperations
);
app.post("/vendorCandidatePayment", sessionAuth, vendor.vendorCandidatePayment);

module.exports = app;
