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

/**
 * Gửi lệnh điều khiển đến ESP32 dưới dạng JSON.
 * @param {string} device_name - Tên thiết bị
 * @param {string} state - Trạng thái (ON/OFF)
 * @param {string} source - Nguồn gốc lệnh (SYNC/USER)
 */

function sendCommandToESP32(device_name, state, source = "SYNC") {
  const payload = JSON.stringify({
    device: device_name,
    action: state,
    source: source,
  });
  //  Gửi vào topic "controlLED"
  mqttClient.publish("controlLED", payload);
  console.log(`  ✅ Gửi lệnh ${source}: ${payload} vào topic controlLED`);
}

// Gui trang thai thiet bi
function sendDeviceStatesToESP32() {
  const sql = "SELECT device_name, state FROM device_state";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Lỗi đọc trạng thái thiết bị:", err);
      return;
    }

    console.log("📤 Gửi trạng thái đồng bộ (SYNC) đến ESP32...");
    results.forEach(({ device_name, state }) => {
      // Gửi lệnh đồng bộ
      sendCommandToESP32(device_name, state, "SYNC");
    });
  });
}

mqttClient.on("connect", () => {
  console.log("📡 MQTT Broker connected");

  // Subscribe topic dataSensor
  mqttClient.subscribe("dataSensor", (err) => {
    if (err) console.error("❌ Lỗi subscribe dataSensor:", err);
    else console.log("✅ Subscribed: dataSensor");
  });

  // subscribe topic controlLED  ---
  mqttClient.subscribe("controlLED", (err) => {
    if (err) console.error("❌ Lỗi subscribe controlLED:", err);
    else console.log("✅ Subscribed: controlLED");
  });

  mqttClient.subscribe("esp32/status", (err) => {
    if (err) console.error("❌ Lỗi subscribe esp32/status:", err);
    else console.log("✅ Subscribed: esp32/status");
  });

  // Subscribe topic feedback
  mqttClient.subscribe("device/feedback", (err) => {
    if (err) console.error("❌ Lỗi subscribe device/feedback:", err);
    else console.log("✅ Subscribed: device/feedback");
  });

  setTimeout(() => {
    sendDeviceStatesToESP32();
  }, 1000);
});

mqttClient.on("message", (topic, message) => {
  const msg = message.toString();

  try {
    // --- Nhận dữ liệu cảm biến / Heartbeat ---
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
      if (
        !temp &&
        !humidity &&
        !light &&
        (status === "ONLINE" || status === "ALIVE")
      ) {
        console.log("💓 [Heartbeat] ESP32 vẫn online");
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

    // Nhận thông điệp GET_STATE từ topic controlLED
    else if (topic === "controlLED") {
      if (msg === "GET_STATE") {
        console.log("🔁 ESP32 yêu cầu trạng thái thiết bị");
        sendDeviceStatesToESP32();
      } else {
        // Không làm gì cả để tránh vòng lặp
      }
    }

    // --- XỬ LÝ XÁC NHẬN TỪ ESP32  ---
    else if (topic === "device/feedback") {
      const feedbackData = JSON.parse(msg);
      const { device, state } = feedbackData;

      if (device && state) {
        console.log(
          `✨ [FEEDBACK] ESP32 xác nhận lệnh USER: ${device} -> ${state}`
        );

        // 1. CẬP NHẬT TRẠNG THÁI DB (CHỈ KHI CÓ FEEDBACK)
        db.query(
          "UPDATE device_state SET state = ? WHERE device_name = ?",
          [state, device],
          (err) => {
            if (err) console.error("❌ Lỗi cập nhật trạng thái DB:", err);
            else
              console.log(`   💾 Cập nhật DB thành công: ${device} = ${state}`);
          }
        );

        // 2. LƯU LỊCH SỬ (CHỈ KHI CÓ FEEDBACK)
        db.query(
          "INSERT INTO action_history (device, action) VALUES (?, ?)",
          [device, state],
          (err) => {
            if (err) console.error("❌ Lỗi lưu lịch sử DB:", err);
            else
              console.log(`   📝 Lưu lịch sử thành công: ${device} - ${state}`);
          }
        );
      }
    }

    // --- Nhận trạng thái từ ESP32 (Giữ nguyên) ---
    else if (topic === "esp32/status") {
      if (msg === "ONLINE" || msg === "ALIVE") {
        esp32Status.isOnline = true;
        esp32Status.lastSeen = Date.now();
        console.log("🟢 ESP32 ONLINE");
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
