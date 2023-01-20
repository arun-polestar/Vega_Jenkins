"use Strict";
const helpdesk = require("./Controller");
const sessionAuth = require("../../services/sessionAuth");
const express = require("express");
const app = express.Router();

app.post("/addhelpdeskmaster", sessionAuth, helpdesk.addhelpdeskmaster);
app.post("/viewhelpdeskmaster", sessionAuth, helpdesk.viewhelpdeskmaster);
/*-----------------helpdesk revamp apis------------------------*/
app.post("/addtickettype", sessionAuth, helpdesk.addticketmaster);
app.post("/edittickettype", sessionAuth, helpdesk.editticketmaster);
app.post("/viewtickettype", sessionAuth, helpdesk.viewticketmaster);
app.post("/activateticket", sessionAuth, helpdesk.activateticket);
app.post("/ticketHeadDropdown", sessionAuth, helpdesk.ticketHeadDropdown);
app.post("/viewIcons", sessionAuth, helpdesk.viewIcons);
app.post("/raiseTickets", sessionAuth, helpdesk.raiseTickets);
app.post("/approveTickets", sessionAuth, helpdesk.approveTickets);
app.post("/ticketOperation", sessionAuth, helpdesk.ticketOperation);
app.post("/viewRaisedTickets", sessionAuth, helpdesk.viewRaisedTickets);
/*--------------------------------------------------------------*/
app.post(
  "/activatehelpdeskmaster",
  sessionAuth,
  helpdesk.activatehelpdeskmaster
);
app.post("/viewsubticket", sessionAuth, helpdesk.viewsubticket);
app.post("/viewstatus", sessionAuth, helpdesk.viewstatus);
app.post("/viewticket", sessionAuth, helpdesk.viewticket);
app.post("/raiseticket", sessionAuth, helpdesk.raiseticket);
app.post("/viewraiseticket", sessionAuth, helpdesk.viewraiseticket);
app.post("/helpdeskoperation", sessionAuth, helpdesk.helpdeskoperation);
app.post("/viewhistory", sessionAuth, helpdesk.viewhistory);
app.post("/selfviewmaster", sessionAuth, helpdesk.selfviewmaster);
app.post("/viewhelpmaster", sessionAuth, helpdesk.viewmaster);
app.post("/helpdeskreport", sessionAuth, helpdesk.helpdeskreport);
app.post("/viewRaisedTicketCount", sessionAuth, helpdesk.viewRaisedTicketCount);



module.exports = app;
