const express = require("express");
const path = require("path");
const logger = require("morgan");
const cors = require("cors");
require("dotenv").config();

const indexRouter = require("./src/routes/index");
const usersRouter = require("./src/routes/users");
const filesRouter = require("./src/routes/files");
const foldersRouter = require("./src/routes/folders");
const { dbConnection } = require("./src/db");
const { apiVersionCheck } = require("./src/middlewares/apiVersionCheck");

const app = express();
dbConnection();

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(apiVersionCheck("v1"));

app.use("/", indexRouter);
app.use("/api/v1/user", usersRouter);
app.use("/api/v1/files", filesRouter);
app.use("/api/v1/folders", foldersRouter);

module.exports = app;
