const mongoose = require("mongoose");

const mongoURL = "mongodb://localhost:27017/JobPortal";

mongoose.connect(mongoURL);
const db = mongoose.connection

db.on("connected", () => {
  console.log("the server is connected to the db...");
});

db.on("error", () => {
  console.log("error occured during the connection of db...");
});

db.on("disconnected", () => {
  console.log("the db connection is disconnected...");
});
