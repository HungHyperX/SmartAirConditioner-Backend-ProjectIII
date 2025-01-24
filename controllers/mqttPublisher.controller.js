const mqtt = require("mqtt");
const fs = require("fs");
const { suggest } = require("../fuzzyModel/fuzzyController");
require("dotenv").config(); // Đọc các biến từ tệp .env

// Đọc cấu hình từ tệp .env
const topic = process.env.MQTT_TOPIC_PUB_1; // Topic để publish
const clientId =
  process.env.MQTT_CLIENT_ID ||
  "mqtt_publisher_" + Math.random().toString(16).slice(2, 10); // Tạo Client ID ngẫu nhiên nếu không được cấu hình
const publishInterval = process.env.PUBLISH_INTERVAL || 5000; // Tần suất gửi (ms)
const endpoint = process.env.AWS_IOT_ENDPOINT; // AWS IoT endpoint
const certPath = process.env.CERT_PATH || "./certs"; // Đường dẫn thư mục chứa chứng chỉ và khóa

// Kiểm tra xem các tệp chứng chỉ có tồn tại không
// if (!fs.existsSync(privateKeyPath) || !fs.existsSync(clientCertPath) || !fs.existsSync(caCertPath)) {
//   console.error("Lỗi: Các tệp chứng chỉ không tồn tại. Vui lòng kiểm tra đường dẫn.");
//   process.exit(1);
// }

// Cấu hình MQTT để kết nối với AWS IoT Core
const mqttClient = mqtt.connect({
  host: endpoint,
  port: 8883, // Port mặc định cho TLS
  protocol: "mqtts", // MQTT qua TLS
  key: fs.readFileSync(`${certPath}/1e3e186fb4ef77b09a100ecc40293fc2e3251f3201812a343326fe621ef7baa1-private.pem.key`), // Private key
  cert: fs.readFileSync(`${certPath}/1e3e186fb4ef77b09a100ecc40293fc2e3251f3201812a343326fe621ef7baa1-certificate.pem.crt`), // Certificate
  ca: fs.readFileSync(`${certPath}/AmazonRootCA1.pem`), // Root CA
  clientId: clientId, // Client ID
  clean: true, // Kết nối sạch
});

// Xử lý khi kết nối thành công
mqttClient.on("connect", () => {
  console.log("Kết nối thành công đến AWS IoT Core:", endpoint);

  // Hàm để gửi dữ liệu
  const publishData = async () => {
    try {
      const suggestedValue = await suggest(); // Lấy giá trị từ hàm suggest()
      const payload = Math.floor(suggestedValue); // Chuyển đổi giá trị về số nguyên

      mqttClient.publish(topic, JSON.stringify(payload), { qos: 0 }, (err) => {
        if (!err) {
          console.log(`Đã gửi dữ liệu đến topic "${topic}":`, payload);
        } else {
          console.error("Lỗi khi gửi dữ liệu:", err);
        }
      });
    } catch (error) {
      console.error("Lỗi khi tính toán giá trị:", error);
    }
  };

  // Gửi dữ liệu định kỳ
  setInterval(publishData, parseInt(publishInterval, 10));
});

// Xử lý lỗi kết nối
mqttClient.on("error", (err) => {
  console.error("Lỗi kết nối MQTT:", err);
});
