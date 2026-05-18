// =================================================================
// ISI FILE: app.js (BACKEND)
// =================================================================
"use strict";

require("dotenv").config();

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const path = require("path");
const cors = require("cors");

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const { router } = require("./router");
app.use(router);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});