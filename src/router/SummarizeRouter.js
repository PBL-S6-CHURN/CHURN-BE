"use strict";

const express = require("express");
const summarizeRouter = express.Router();

// memanggil controller
const { SummarizeController } = require("../controller/SummarizeController");

// list router
summarizeRouter.get("/summarize", SummarizeController.SummarizeGetController);
summarizeRouter.get("/summarize/sentiment", SummarizeController.SummarizeSentimentController);
summarizeRouter.get("/summarize/ratings", SummarizeController.SummarizeGetRatingslController);

module.exports = { summarizeRouter };