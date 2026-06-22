const { ChartController } = require('../controller/ChartController'); // sesuaikan path-nya

const express = require('express');
const chartRouter = express.Router();

// Daftarkan endpoint untuk Front-End
chartRouter.get('/churn-chart', ChartController.ChurnChartGetController);

module.exports = { chartRouter };