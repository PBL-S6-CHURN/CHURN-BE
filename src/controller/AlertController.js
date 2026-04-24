"use strict";

class AlertController {
    static async AlertGetController(req, res) {
        try {
            res.send("Lihat Alert Controller");
        } catch (error) {
            console.log(error);
        }
    }

    static async AlertGetByIdController(req, res) {
        try {
            const { id } = req.params;
            res.send(`Lihat Alert : ${id}`);
        } catch (error) {
            console.log(error);
        }
    }

    static async AlertRiskController(req, res) {
        try {
            const { risk } = req.params;
            res.send(`Lihat Alert risk : ${risk}`);
        } catch (error) {
            console.log(error);
        }
    }

    static async AlertStatsController(req, res) {
        try {
            const total = 20;
            res.send(`Lihat Alert Stats : ${total}`);
        } catch (error) {
            console.log(error);
        }
    }

    
    static async AlertResolvedController(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            res.send(`customer id(${id}) status(${status})`);
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = { AlertController };