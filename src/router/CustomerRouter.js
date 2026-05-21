"use strict";

const express = require("express");
const customerRouter = express.Router();
const mutler = require('multer');
const upload = mutler({storage: mutler.memoryStorage()});

// memanggil controller
const { Auth } = require("../middleware/auth");
const { CustomerController } = require("../controller/CustomerController");

// list router
// customerRouter.use(Auth.authenticate);
customerRouter.use(Auth.authenticate);
customerRouter.get("/customers", CustomerController.CustomerGetController);
customerRouter.get("/customers/search", CustomerController.CustomerSearchController);
customerRouter.get("/customers/stats", CustomerController.StatsCustomerController);
customerRouter.get("/customers/type/:type", CustomerController.CustomerTypeController);
customerRouter.get("/customers/stats/churn", CustomerController.StatsCustomerChurnController);
customerRouter.get("/customers/stats/risk", CustomerController.StatsCustomerRiskController);
customerRouter.get("/customers/predict/stream", CustomerController.CustomerPredictStreamController);
customerRouter.get("/customers/risk/:risk", CustomerController.CustomerFilterbyRisk);
customerRouter.get("/customers/:id", CustomerController.CustomerDetailController);
customerRouter.post("/customers", CustomerController.CustomerAddController);
customerRouter.post("/customers/upload", upload.single('file'), CustomerController.CustomerUploadFile);

// Tambahkan predict
customerRouter.post('/predict', CustomerController.PredictManual);

module.exports = { customerRouter };