"use strict";

const express = require("express");
const router = express.Router();

// memanggil controller
const { Controller } = require("../controller");

// memanggil router
const { customerRouter } = require("./CustomerRouter");
const { userRouter } = require("./UserRouter");

router.get("/", Controller.HomeController);
router.use(customerRouter);
router.use(userRouter);

module.exports = { router };