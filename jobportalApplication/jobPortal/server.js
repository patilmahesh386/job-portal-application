const express = require('express');
require('dotenv').config();
const app = express();
const bodyParser = require('body-parser');
const db = require("./config/db");
const jobRouter = require('./routes/jobPost.routes');
const userRouter = require("./routes/userRegister.routes");
const applicationRouter = require("./routes/application.routes");
const notificationRouter = require('./routes/notification.routes');
const cors = require('cors');

app.use(cors());

// 50MB limits across both express and bodyParser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use("/", userRouter);
app.use("/", jobRouter);
app.use("/", applicationRouter);
app.use("/", notificationRouter);

// Global JSON error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`The server is running on http://localhost:${PORT}`);
});
