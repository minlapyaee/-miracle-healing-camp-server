require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const config = require("./config");
const userRoutes = require("./app/routes/user");
const clientRoutes = require("./app/routes/client");

const app = express();

function connect() {
  const options = { useNewUrlParser: true };
  mongoose.connect(config.db, options);
  return mongoose.connection;
}

function listen() {
  app.listen(process.env.PORT);
  console.log(`App started on port http://localhost:${process.env.PORT}/`);
}

const connection = connect();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());

// route
app.use("/user", userRoutes);
app.use("/client", clientRoutes);

connection
  .on("error", console.log)
  .on("disconnected", connect)
  .once("open", listen);
