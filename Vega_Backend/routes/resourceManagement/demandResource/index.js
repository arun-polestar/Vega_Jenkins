'use strict'
let demandCtrl = require("./demand.controller");
const sessionAuth = require("../../../services/sessionAuth");
const express = require('express');
const app = express.Router();

app.post('/generate_demand', sessionAuth, demandCtrl.generateDemand);
app.post('/view_generated_demand', sessionAuth, demandCtrl.viewGeneratedDemand);
app.post('/view_saved_draft', sessionAuth, demandCtrl.viewSavedDraft);
app.post('/save_resource_demand_comments', sessionAuth, demandCtrl.saveResourceDemandComments);
app.post('/get_resource_demand_comments', sessionAuth, demandCtrl.fetchResourceDemandComments);
app.post('/get_resource_list', sessionAuth, demandCtrl.getResourceList);
app.post('/approve_resource_demand', sessionAuth, demandCtrl.approveResourceDemand);
app.post('/resource_action', sessionAuth, demandCtrl.resourceAction);
app.post('/get_demand_counts', sessionAuth, demandCtrl.getDemandCounts);
app.post('/mark_demand_as_closed', sessionAuth, demandCtrl.markDemandAsClosed);
app.post('/get_rejected_resource_details', sessionAuth, demandCtrl.getRejectedResourceDetails);

module.exports = app;