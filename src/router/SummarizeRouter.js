'use strict';

const express = require('express');
const router  = express.Router();
const { SummarizeController } = require('../controller/SummarizeController');

// GET /summarize          → semua data (percentage + summary + top5)
router.get('/', SummarizeController.SummarizeGetController);

// GET /summarize/ratings  → hanya percentage Positif & Negatif
router.get('/ratings', SummarizeController.SummarizeGetRatingsController);

// GET /summarize/sentiment → hanya paragraf summary Positif & Negatif
router.get('/sentiment', SummarizeController.SummarizeSentimentController);

module.exports = { summarizeRouter: router };
