const express = require("express");
const path = require("path");
const logger = require("morgan");
require("dotenv").config();

const indexRouter = require("./src/routes/index");
const usersRouter = require("./src/routes/users");
const { dbConnection } = require("./src/db");

const app = express();
dbConnection();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);

module.exports = app;
