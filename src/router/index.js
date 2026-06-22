"use strict";

const express = require("express");
const router = express.Router();

// memanggil controller
const { Controller } = require("../controller");

// memanggil router
const { customerRouter } = require("./CustomerRouter");
const { userRouter } = require("./UserRouter");
const { summarizeRouter } = require("./SummarizeRouter");
const { alertRouter } = require("./AlertRouter");
const { SentimentRouter } = require("./SentimentRouter"); 
const { chartRouter } = require("./ChatRouter");

router.get("/", Controller.HomeController);
router.use(userRouter);
router.use(customerRouter);
router.use(summarizeRouter);
router.use(alertRouter);
router.use(chartRouter);
router.use('/sentiment', SentimentRouter);

module.exports = { router };