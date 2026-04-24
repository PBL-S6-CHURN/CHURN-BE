"use strict";

class Model { 
    static async Home() {
        try {
            return "Landing Page CHURN";
        } catch (err) {
            console.log(err.message);
        }
    }
}

module.exports = { Model };