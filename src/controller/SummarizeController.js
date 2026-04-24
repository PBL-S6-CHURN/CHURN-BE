"use strict";

class SummarizeController {
    static async SummarizeGetController(req, res) {
        try {
            res.send("Lihat Summarize Controller");
        } catch (error) {
            console.log(error);
        }
    }

    static async SummarizeGetRatingslController(req, res) {
        try {
            res.send(`Lihat Summarize Ratings`);
        } catch (error) {
            console.log(error);
        }
    }

    static async SummarizeSentimentController(req, res) {
        try {
            res.send(`Lihat Summarize Sentiment`);
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = { SummarizeController };