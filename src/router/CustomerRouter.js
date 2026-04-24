"use strict";

const express = require("express");
const customerRouter = express.Router();

// memanggil controller
const { CustomerController } = require("../controller/CustomerController");

// list router
customerRouter.get("/customers", CustomerController.CustomerGetController);
customerRouter.get("/customers/:id", CustomerController.CustomerDetailController);
customerRouter.get("/customers/type/:type", CustomerController.CustomerTypeController);
customerRouter.get("/customers/search", CustomerController.CustomerSearchController);
customerRouter.post("/customers", CustomerController.CustomerAddController);

module.exports = { customerRouter };