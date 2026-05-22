'use strict';

const express = require('express');
const router = express.Router();
const { SentimentController } = require('../controller/SentimentController');

// Route POST: http://localhost:8000/sentiment/check
router.post('/check', SentimentController.checkSentiment);

module.exports = { SentimentRouter: router };