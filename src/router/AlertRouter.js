"use strict";

const express = require("express");
const alertRouter = express.Router();

// memanggil controller
const { AlertController } = require("../controller/AlertController");

// list router
alertRouter.get("/alerts", AlertController.AlertGetController);
alertRouter.get("/alerts/stats", AlertController.AlertStatsController);
alertRouter.get("/alerts/:id", AlertController.AlertGetByIdController);
alertRouter.get("/alerts/risk/:risk", AlertController.AlertRiskController);
alertRouter.get("/alerts/plan/:plan", AlertController.AlertPlanController);
alertRouter.patch("/alerts/:id/resolved", AlertController.AlertResolvedController);

module.exports = { alertRouter };