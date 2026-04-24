"use strict";

const { Model } = require("../model");
class Controller {
    static async HomeController(req, res) {
        try {
            const result = await Model.Home();
            res.json({
                message: result
            });
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = { Controller };