"use strict";

const express = require("express");
const userRouter = express.Router();

// memanggil controller
const { UserController } = require("../controller/UserController");
const { Auth } = require("../middleware/auth");

// import logika mutler
const { uploadProfileImage } = require('../helper/uploadManager');

// list router
userRouter.post("/register", UserController.RegisterController);
userRouter.post("/login", UserController.LoginController);
userRouter.get("/profile", Auth.authenticate, UserController.ProfileController);
userRouter.post("/refresh-token", UserController.RefreshTokenController);
userRouter.delete("/logout", UserController.LogoutController);
userRouter.put("/update-profile", Auth.authenticate, uploadProfileImage.single("profile_image"), UserController.UpdateProfileController);
userRouter.put("/change-password", Auth.authenticate, UserController.ChangePasswordController);

module.exports = { userRouter };