import mqtt from "mqtt";
import db from "./db.js";

const mqttClient = mqtt.connect("mqtt://localhost:1884", {
  username: "scwud",
  password: "Abc@1234",
});

// 🔍 Lưu trạng thái ESP32
let esp32Status = {
  isOnline: false,
  lastSeen: null,
  disconnectTime: null,
};

// ⏱️ Kiểm tra ESP32 còn online không (timeout 5 giây)
const checkEsp32Timeout = setInterval(() => {
  const now = Date.now();

  if (esp32Status.isOnline && esp32Status.lastSeen) {
    const timeSinceLastMessage = now - esp32Status.lastSeen;

    // Nếu không nhận được message trong 5 giây, coi ESP32 offline
    if (timeSinceLastMessage > 5000) {
      esp32Status.isOnline = false;
      esp32Status.disconnectTime = now;
      console.log("⚠️ ESP32 OFFLINE (timeout)");
    }
  }
}, 2000);

mqttClient.on("connect", () => {
  console.log("📡 MQTT Broker connected");

  mqttClient.subscribe("dataSensor", (err) => {
    if (err) console.error("❌ Lỗi subscribe dataSensor:", err);
    else console.log("✅ Subscribed: dataSensor");
  });

  mqttClient.subscribe("controlLED", (err) => {
    if (err) console.error("❌ Lỗi subscribe controlLED:", err);
    else console.log("✅ Subscribed: controlLED");
  });

  mqttClient.subscribe("esp32/status", (err) => {
    if (err) console.error("❌ Lỗi subscribe esp32/status:", err);
    else console.log("✅ Subscribed: esp32/status");
  });
});

mqttClient.on("message", (topic, message) => {
  const msg = message.toString();

  try {
    // --- Nhận dữ liệu cảm biến ---
    if (topic === "dataSensor") {
      // Cập nhật trạng thái ESP32 online khi nhận được dữ liệu
      const wasOffline = !esp32Status.isOnline;
      esp32Status.isOnline = true;
      esp32Status.lastSeen = Date.now();

      if (wasOffline) {
        console.log("🟢 ESP32 ONLINE (vừa kết nối lại)");
      }
      const data = JSON.parse(msg);
      const { temp, humidity, light, status } = data;
      // 🔍 Nếu chỉ có "status": "ONLINE" hoặc "ALIVE" (heartbeat)
      if (!temp && !humidity && (status === "ONLINE" || status === "ALIVE")) {
        console.log("💓 [Heartbeat] ESP32 vẫn online");
        esp32Status.lastSeen = Date.now();
        return;
      }
      // 📊 Nếu có dữ liệu cảm biến đầy đủ
      if (temp !== undefined && humidity !== undefined && light !== undefined) {
        const sql =
          "INSERT INTO sensor_data (temperature, humidity, light) VALUES (?, ?, ?)";
        db.query(sql, [temp, humidity, light], (err, result) => {
          if (err) {
            console.error("❌ Lỗi ghi DB:", err);
          } else {
            console.log("💾 Dữ liệu sensor lưu vào DB - ID:", result.insertId);
          }
        });
      }
    }

    // --- Nhận trạng thái từ ESP32 ---
    else if (topic === "esp32/status") {
      if (msg === "ONLINE" || msg === "ALIVE") {
        esp32Status.isOnline = true;
        esp32Status.lastSeen = Date.now();
        console.log("🟢 ESP32 ONLINE");
      }
    }

    // --- Xử lý controlLED topic ---
    else if (topic === "controlLED") {
      if (msg === "GET_STATE") {
        console.log("🔁 ESP32 yêu cầu trạng thái thiết bị");
        const sql = "SELECT device_name, state FROM device_state";
        db.query(sql, (err, results) => {
          if (err) return console.error("❌ Lỗi đọc trạng thái:", err);
          results.forEach(({ device_name, state }) => {
            const command = `${device_name}_${state}`;
            mqttClient.publish("controlLED", command);
            console.log("📤 Gửi lệnh:", command);
          });
        });
      }
    }
  } catch (err) {
    console.error("❌ Lỗi xử lý MQTT:", err);
  }
});

mqttClient.on("error", (err) => {
  console.error("❌ MQTT Error:", err);
  esp32Status.isOnline = false;
});

mqttClient.on("disconnect", () => {
  console.log("⚠️ MQTT Broker Disconnected");
  esp32Status.isOnline = false;
});

// 📍 Export hàm lấy trạng thái ESP32
export function getEsp32Status() {
  return esp32Status;
}

export default mqttClient;
