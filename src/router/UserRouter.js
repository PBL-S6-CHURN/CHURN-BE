"use strict";

const express = require("express");
const userRouter = express.Router();

// memanggil controller
const { UserController } = require("../controller/UserController");

// list router
userRouter.post("/register", UserController.RegisterController);
userRouter.post("/login", UserController.LoginController);
userRouter.get("/profile", UserController.ProfileController);

module.exports = { userRouter };