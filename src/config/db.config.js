'use strict';

require('dotenv').config();

module.exports = {
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGNAME,
    port: process.env.PGPORT
};