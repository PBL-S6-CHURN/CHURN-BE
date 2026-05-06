"use strict";

const express = require("express");
const customerRouter = express.Router();
const mutler = require('multer');
const upload = mutler({storage: mutler.memoryStorage()});

// memanggil controller
const { CustomerController } = require("../controller/CustomerController");

// list router
customerRouter.get("/customers", CustomerController.CustomerGetController);
customerRouter.get("/customers/search", CustomerController.CustomerSearchController);
customerRouter.get("/customers/:id", CustomerController.CustomerDetailController);
customerRouter.get("/customers/type/:type", CustomerController.CustomerTypeController);
customerRouter.post("/customers", CustomerController.CustomerAddController);
customerRouter.post("/customers/upload", upload.single('file'), CustomerController.CustomerUploadFile);

module.exports = { customerRouter };