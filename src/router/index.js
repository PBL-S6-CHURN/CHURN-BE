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

router.get("/", Controller.HomeController);
router.use(userRouter);
router.use(customerRouter);
router.use('/summarize', summarizeRouter);
router.use(alertRouter);
router.use('/sentiment', SentimentRouter);

module.exports = { router };