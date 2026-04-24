"use strict";

class CustomerController {
    static async CustomerGetController(req, res) {
        try {
            res.send("Lihat Customer Controller");
        } catch (error) {
            console.log(error);
        }
    }

    static async CustomerDetailController(req, res) {
        try {
            const { id } = req.params;
            res.send(`Lihat Customer : ${id}`);
        } catch (error) {
            console.log(error);
        }
    }

    static async CustomerTypeController(req, res) {
        try {
            const { type } = req.params;
            res.send(`Lihat Customer : ${type}`);
        } catch (error) {
            console.log(error);
        }
    }

    static async CustomerSearchController(req, res) {
        try {
            const { name } = req.query;
            res.send(`Lihat Customer : ${name}`);
        } catch (error) {
            console.log(error);
        }
    }

    static async CustomerAddController(req, res) {
        try {
            const { name, email, password } = req.body;
            res.send(`Tambah Customer: ${name}, ${email}, ${password}`);
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = { CustomerController };