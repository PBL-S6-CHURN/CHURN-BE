'use strict';

const express = require('express');
const router  = express.Router();
const { SummarizeController } = require('../controller/SummarizeController');

// GET /summarize → semua data (percentage + summary + top5)
router.get('/summarize', SummarizeController.SummarizeGetController);

// GET /summarize/ratings  → hanya percentage Positif & Negatif
router.get('/summarize/ratings', SummarizeController.SummarizeGetRatingsController);

// GET /summarize/sentiment → hanya paragraf summary Positif & Negatif
router.get('/summarize/sentiment', SummarizeController.SummarizeSentimentController);

module.exports = { summarizeRouter: router };
