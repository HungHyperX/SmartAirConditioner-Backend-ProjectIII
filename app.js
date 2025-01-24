const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();

const userRoutes = require("./routes/user.routes"); // Import route user
const iotDataRouter = require("./routes/iot_data.routes.js");

const sequelize = require("./config/db.config.js");

app.use(express.json()); // Parse các request có nội dung dạng JSON
app.use(express.urlencoded({ extended: true })); // Parse các request có nội dung dạng URL-encoded
app.use(cors());
app.use("/auth", userRoutes);
app.use("/api", iotDataRouter);

//Nếu muốn be nhận dữ liệu và lưu vào db thì bỏ cmt dòng dưới
const mqtt = require("./controllers/mqttClient.controller.js");
// nếu muốn gửi dữ liệu sau khi xử lý bỏ cmt dòng dưới
const mqttPublisher = require("./controllers/mqttPublisher.controller.js");

// Kết nối database và chạy server
const PORT = process.env.PORT || 8080;

sequelize
  // .sync({alter: true})
  .sync()
  .then(() => {
    console.log("Database & tables created!");
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}/`);
    });
  })
  .catch((err) => console.error("Unable to connect to the database:", err));


