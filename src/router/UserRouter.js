"use strict";

const express = require("express");
const userRouter = express.Router();

// memanggil controller
const { UserController } = require("../controller/UserController");
const { Auth } = require("../middleware/auth");

// list router
userRouter.post("/register", UserController.RegisterController);
userRouter.post("/login", UserController.LoginController);
userRouter.get("/profile", Auth.authenticate, UserController.ProfileController);

module.exports = { userRouter };