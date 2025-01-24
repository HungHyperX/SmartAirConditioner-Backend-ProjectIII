const mqtt = require("mqtt"); // Thư viện MQTT
const fs = require("fs"); // Đọc file chứng chỉ và khóa
const IotData = require("../models/iot_data.model"); // Import model để lưu dữ liệu vào cơ sở dữ liệu
require("dotenv").config(); // Tải các biến môi trường từ tệp .env
const express = require("express");

const app = express();
app.use(express.json());

// Sử dụng biến môi trường để cấu hình
const topic = process.env.MQTT_TOPIC_SUB; // Tên topic cần subscribe
const endpoint = process.env.AWS_IOT_ENDPOINT; // AWS IoT endpoint
const certPath = process.env.CERT_PATH || "./certs"; // Đường dẫn thư mục chứa chứng chỉ và khóa

// Tùy chọn kết nối TLS với AWS IoT
const mqttOptions = {
  host: endpoint, // Endpoint của AWS IoT Core
  port: 8883, // Cổng TLS/SSL của MQTT
  protocol: "mqtts", // Giao thức bảo mật
  key: fs.readFileSync(`${certPath}/1e3e186fb4ef77b09a100ecc40293fc2e3251f3201812a343326fe621ef7baa1-private.pem.key`), // Private key
  cert: fs.readFileSync(`${certPath}/1e3e186fb4ef77b09a100ecc40293fc2e3251f3201812a343326fe621ef7baa1-certificate.pem.crt`), // Certificate
  ca: fs.readFileSync(`${certPath}/AmazonRootCA1.pem`), // Root CA
  clientId:
    process.env.MQTT_CLIENT_ID ||
    "aws_mqtt_client_" + Math.random().toString(16).substring(2, 10), // Tạo client ID ngẫu nhiên
  clean: true, // Kết nối sạch
};

// Kết nối đến AWS IoT
const mqttClient = mqtt.connect(mqttOptions);

// Sự kiện khi kết nối thành công
mqttClient.on("connect", () => {
  console.log("Kết nối thành công đến AWS IoT Core:", endpoint);

  // Đăng ký (subscribe) vào topic
  mqttClient.subscribe(topic, (err) => {
    if (!err) {
      console.log(`Đã subscribe vào topic: ${topic}`);
    } else {
      console.error("Lỗi khi subscribe vào topic:", err);
    }
  });
});

// API điều khiển
app.post("/api/control", async (req, res) => {
  const { value } = req.body;

  // Validate input
  if (value !== 0 && value !== 1) {
    return res.status(400).json({
      success: false,
      message: "Giá trị không hợp lệ. Chỉ chấp nhận 0 hoặc 1",
    });
  }

  try {
    // Publish to MQTT
    mqttClient.publish(topic, JSON.stringify(value), { qos: 0 }, (err) => {
      if (err) {
        console.error("Lỗi khi gửi dữ liệu:", err);
        return res.status(500).json({
          success: false,
          message: "Lỗi khi gửi dữ liệu đến AWS IoT Core",
        });
      }

      console.log(`Đã gửi dữ liệu đến topic "${topic}":`, value);
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
});

// Xử lý tin nhắn từ MQTT broker
mqttClient.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message);
    let { temperature, humidity, timestamp } = data;

    console.log("Dữ liệu MQTT nhận được:", data);

    if (timestamp) {
      timestamp = padTimestamp(timestamp);
    } else {
      throw new Error("Timestamp bị thiếu hoặc null");
    }

    const parsedTimestamp = new Date(timestamp);

    if (isNaN(parsedTimestamp)) {
      throw new Error("Không thể chuyển đổi timestamp thành ngày giờ");
    }

    const newData = await IotData.create({
      temperature,
      humidity,
      timestamp: parsedTimestamp,
    });

    console.log("Dữ liệu đã được lưu thành công:", newData.toJSON());
  } catch (error) {
    console.error("Lỗi khi xử lý tin nhắn MQTT:", error.message);
  }
});

// Sự kiện lỗi
mqttClient.on("error", (err) => {
  console.error("Lỗi MQTT:", err);
});

// Hàm chuẩn hóa timestamp
const padTimestamp = (timestamp) => {
  return timestamp.replace(
    /(\d{4}-\d{2}-\d{2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/,
    (_, date, hour, minute, second) => {
      const paddedHour = hour.padStart(2, "0");
      const paddedMinute = minute.padStart(2, "0");
      const paddedSecond = second.padStart(2, "0");
      return `${date} ${paddedHour}:${paddedMinute}:${paddedSecond}`;
    }
  );
};

// Xuất module MQTT client
module.exports = mqttClient;
