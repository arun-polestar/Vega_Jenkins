module.exports = {
  fetchmaster: "call usp_fetch_masters(?)",
  employeeList: "call usp_mstuser_emplistview(?)",

  trxrequisitionAdd: "call usp_trxrequisition_add(?)",
  trxrequisitionEdit: "call usp_trxrequisition_edit(?)",
  requisition: "call usp_requisition_operations(?)",
  uploadoperations: "call usp_upload_operations(?)",
  uservalidate: "call usp_mstuser_validate(?)",
  trxrequisition: "call usp_trxrequisition_operations(?)",
  rmscandidate: "call usp_trxcandidate_data(?)", //used in Requisition
  rmscandidatetest: "call usp_trxcandidate_data_test(?)", //used in Requisition
  userview: "call usp_mstuser_view(?)",
  candidatebulk_edit: "call usp_candidatebulk_edit(?)",
  interviewquestion_view: "call usp_trxinterviewquestion_view(?)",
  scheduler_mgm: "call usp_trxscheduler_mgm(?)",
  mstconfigview: "call usp_mstconfig_view(?)",
  tokenmgm: "call usp_trxtoken_mgm(?)",
  alumnitokenmgm: "call usp_alumni_trxtoken_mgm(?)",
  forgetpassword: "call usp_mstuser_forgotpassword(?)",
  vendorview: "call usp_vendor_view(?)",
  requisitionaction: "call usp_rmsrequisition_action(?)",
  requisitionquestion: "call usp_rmsrequisition_action(?)",
  mstuser_module_view: "call usp_mstuser_moduleview(?)",
  onboardadd: "call usp_trxonboard_add(?,?,?)",
  rmstempcandidateedit: "call usp_rmstempcandidate_edit(?)",
  viewreferralsresume: "call usp_trxviewresume_history(?)",
  tokenview: "call usp_msttoken_view(?)",
  mstusermoduleView: "call usp_mstusermodule_view(?)",
  uploadQuestion: "call usp_question_upload(?,?)",
  candidateView: "call usp_candidate_view(?)",
  candidateadd: "call usp_rmscandidate_add(?)",
  tempoperation: "call usp_rmstempcandidate_edit(?)", //will be changed
  candidateoperations: "call usp_rmscandidate_operations(?)",
  candidateedit: "call usp_candidate_edit(?)",
  tokenaction: "call usp_msttoken_action(?)",
  requisitionline: "call usp_trxrequisitionline_add(?)",
  rmstempcandidateadd: "call usp_rmstempcandidate_add(?)",
  rmspipeline: "call usp_trxrequisition_view(?)",
  dashboardproc: "call usp_trxassessment_view(?)",
  drivemasterproc: "call usp_trxdrivemaster(?)",
  savefeedback: "call usp_trxfeedback_add(?)",
  savebatchproc: "call usp_trxassessment_add(?,?)",
  editbatchproc: "call usp_trxassessment_edit(?,?)",
  bachcheckproc: "call usp_trxonlinecandidate_view(?)",
  requisitionshare: "call usp_trxsharedcandidate_add(?)",

  //will be changed
  //tempoperation:'call usp_rmstempcandidate_edit(?)',
  rmsparseroperation: "call usp_rmsparser_operations(?)",
  trxrequisitionView: "call usp_trxrequisition_view(?)",
  configedit: "call usp_mstconfig_edit(?)",
  configadd: "call usp_mstconfig_add(?)",
  //will be changed
  mstreportview: "call usp_mstreport_view(?)",
  getofferletter: "call usp_get_offerletter(?)",

  /*-------------------------------vendor St----------------------------------*/
  vendor: "Call usp_vendor_login(?,?,?)",
  /*-------------------------------vendor En----------------------------------*/

  /*----------------------------------  notification start-------------------*/
  notificationview: "call usp_trxnotification_view(?)",
  notificationedit: "call usp_trxnotification_edit(?)",
  mailnotification: "call usp_mail_notifications(?)",
  /*---------------------------------------online screening----------------------------------------*/
  screening: "call usp_onlinescreening(?)",

  /*---------------------------------------policy event holiday----------------------------------------*/
  policy: "call usp_policy_operation(?)",
  holidayupload: "call usp_holiday_upload(?,?)",
  dsr: "call usp_dsr_operation(?)",

  notes: "call usp_trxnotes_operations(?)",
  /*-------------------------------------------profile ------------------------------*/

  mstoperation: "call usp_mstuser_operation(?)",

  /**----------------------------------resignation-------------------------------------------- */
  resignationOperation: "call usp_resignation_operation(?)",
  resignationMaster: "call usp_mst_resignation(?,?)",
  updatechecklist: "call usp_update_checklist(?,?)",
  checklistOperation: "call usp_checklist_operation(?)",

  /**------------------------------------helpdesk ------------------------------- */
  helpdeskMaster: "call usp_mst_helpdesk(?)",
  helpdesk: "call usp_helpdesk_operations(?,?)",

  /*-------------------------------DSR--------------------------------------- */
  dsrentryview: "call usp_dsrentry_view(?)",
  dsrentryedit: "call usp_dsrentry_edit(?,?)",
  dsrentryadd: "call usp_dsrentry_add(?,?)",
  eployeelocationadd: "call usp_trxemployeelocation_add(?)",
  trxbgvadd: "call usp_trxbgv_add(?,?,?)",
  uploadview: "call usp_upload_view(?)",

  /*-------------------------------Leave Operations----------------------------*/
  leaveOperations: "call usp_leave_operations(?)",

  //******************************Expense******************************************* */
  expenseProc: "call usp_expense(?)",
  expenseReport: "call usp_trxexpense_reports(?)",
  raiseExpense: "call usp_trxexpense_add(?,?)",
  viewExpense: "call usp_trxexpense_view(?)",
  approveExpense: "call usp_trxexpense_approve(?)",
  mstemployees: "call usp_mstemployee_data(?)",

  //*********************************Chat Module***************************************** */
  chatProc: "call usp_trxchat_operations(?)",

  //*********************************Attendance Module***************************************** */
  attendance: "call usp_attendance_operations(?)",

  /*---------------------------------------feedback----------------------------------------*/
  mstfeedback: "call usp_mst_feedback_operation(?)",
  mstfeedbackpayout: "call usp_mst_feedback_payout(?)",
  mstfeedbacktag: "call usp_mst_feedback_tag(?)",
  feedback: "call usp_feedback_operation(?)",
  selffeedback: "call usp_feedback_self_operation(?)",
  feedbackraise: "call usp_feedback_raise(?)",
  feedbackdraft: "call usp_feedback_draft(?)",

  feedback_timeline: "call usp_feedback_timeline(?)",
  feedback_dashboard: "call usp_feedback_dashboard(?)",
  feedback_report: "call usp_feedback_report(?)",
  feedbacksuggestion: "call usp_feedback_suggestion(?)",
  mstsign: "call usp_mst_signature(?)",
  feedbackbudgetvalidate: "call usp_feedback_budget_validate(?)",
  homeFeedback: "call usp_feedback_home(?)",
  offlineFeedback: "call usp_offline_award_feedback(?)",
  feedbackkra: "call usp_feedback_user_kra(?)",


  /*--------------------------------------- Milestone ----------------------------------------*/
  mstmilestone: "call usp_mst_milestone(?)",
  usermilestone: "call usp_user_milestone(?)",
  mstmilestoneupload:"call usp_mst_milestone_upload(?)",
  mstmilestoneuserdata:"call usp_mst_milestone_user(?)",

  //*********************************patym ***************************************** */
  mstpaytm: "call usp_mst_paytm_operations(?)",
  mstbudget: "call usp_mst_budget(?)",
  budgetoperation: "call usp_budget_operation(?)",
  paytm: "call usp_paytm_operations(?)",
  //*********************************coupon  ***************************************** */
  coupon: "call usp_coupon_operations(?)",
  couponpasscode: "call usp_coupon_passcode(?)",
  couponorder: "call usp_coupon_order(?)",
  c2ccouponorder: "call usp_c2ccoupon_order(?)",
  townhall: "call usp_townhall_operation(?)",
  redeemLimit: "call usp_redeem_limit(?)",

  // ********************************   Payroll  *********************************** */

  mstpayroll: "call usp_mst_payroll_operation(?)",
  payroll: "call usp_payroll_operation(?)",

  // ********************************   ESOP   *********************************** */

  mstesop: "call usp_mst_esop_operations(?)",
  mstesopgrant: "call usp_mst_esop_grant(?)",
  mstesopexercise: "call usp_mst_esop_exercise(?)",
  mstcaptable: "call usp_mst_esop_captable(?)",
  mstesopdetails: "call usp_mst_esop_details(?)",
  mstesopreport: "call usp_mst_esop_report(?)",
  esop: "call usp_esop_operations(?)",
  mstupload: "call usp_mst_esop_upload(?)",
  mstuploadzip: "call usp_mst_esop_upload_zip(?)",
  mstdashboard: "call usp_mst_esop_dashboard(?)",
  sendletter: "call usp_ESOP_sendletter(?)",
  useroperation: "call usp_user_operation(?)",
  esopcheckerapprove: "call usp_esop_checker_approve(?)",
  esopcheckerview: "call usp_esop_checker_view(?)",
  mstesopupdateletter: "call usp_mst_esop_updateletter(?)",

  // ********************************   Competency Development   *********************************** */

  competencydevelopmentoperations:
    "call usp_competencydevelopment_operations(?)",
};
