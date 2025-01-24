const awsIot = require("aws-iot-device-sdk");
const express = require("express");
require("dotenv").config();

const app = express();
app.use(express.json());

// Đọc cấu hình từ tệp .env
//const thingName = process.env.AWS_THING_NAME || "YourThingName"; // Tên Thing của bạn trong AWS IoT Core
const topic = process.env.MQTT_TOPIC_PUB_2; // Tên topic cần subscribe
const certPath = process.env.CERT_PATH; // Đường dẫn tới thư mục chứa chứng chỉ

// Tạo kết nối đến AWS IoT
const device = awsIot.device({
  keyPath: `${certPath}/1e3e186fb4ef77b09a100ecc40293fc2e3251f3201812a343326fe621ef7baa1-private.pem.key`, // Tệp khóa riêng tư
  certPath: `${certPath}/1e3e186fb4ef77b09a100ecc40293fc2e3251f3201812a343326fe621ef7baa1-certificate.pem.crt`, // Tệp chứng chỉ
  caPath: `${certPath}/AmazonRootCA1.pem`, // Tệp Root CA
  clientId: `mqtt_publisher_${Math.random().toString(16).slice(2, 10)}`, // ID client ngẫu nhiên
  host: process.env.AWS_IOT_ENDPOINT, // Endpoint của AWS IoT Core
});

// API POST để gửi dữ liệu 0 hoặc 1 đến AWS IoT
const awsMqttControl = (req, res) => {
  const { value } = req.body;

  // Validate input
  if (value !== 0 && value !== 1) {
    return res.status(400).json({
      success: false,
      message: "Giá trị không hợp lệ. Chỉ chấp nhận 0 hoặc 1",
    });
  }

  try {
    // const payload = {
    //   // state: {
    //   //   desired: { on: value === 1 },
    //   // },
    //   value
    // };

    // Publish dữ liệu tới topic trong AWS IoT
    device.publish(topic, JSON.stringify(value), (err) => {
      if (err) {
        console.error("Lỗi khi gửi dữ liệu:", err);
        return res.status(500).json({
          success: false,
          message: "Lỗi khi gửi dữ liệu đến AWS IoT",
        });
      }

      console.log(`Đã gửi dữ liệu đến topic ${topic}:`, payload);
      res.json({
        success: true,
        message: "Đã gửi dữ liệu thành công",
        data: { value, topic },
      });
    });
  } catch (error) {
    console.error("Lỗi:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};
// Định nghĩa route API
app.post("/api/control", awsMqttControl);

// Kết nối tới AWS IoT
device.on("connect", () => {
  console.log("ON/OFF Kết nối thành công đến AWS IoT Core");
});

// Xử lý lỗi
device.on("error", (err) => {
  console.error("Lỗi kết nối AWS IoT:", err);
});

module.exports = {
  awsMqttControl,
};
