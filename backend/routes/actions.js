import express from "express";
import db from "../config/db.js";
import mqttClient, { getEsp32Status } from "../config/mqttClient.js";

const router = express.Router();

// 🔌 Bật/tắt thiết bị
router.post("/", (req, res) => {
  const { device, action } = req.body;
  if (!device || !action)
    return res.status(400).json({ error: "Thiếu device hoặc action" });

  const esp32Status = getEsp32Status();
  const message = `${device}_${action}`;

  mqttClient.publish("controlLED", message);
  console.log("📤 Gửi lệnh MQTT:", message);

  // Lưu lịch sử
  db.query("INSERT INTO action_history (device, action) VALUES (?, ?)", [
    device,
    action,
  ]);

  // Cập nhật trạng thái tạm
  db.query("UPDATE device_state SET state = ? WHERE device_name = ?", [
    action,
    device,
  ]);

  // ESP32 offline
  if (!esp32Status.isOnline) {
    return res.json({
      success: false,
      state: action, // trạng thái vẫn gửi nhưng FE sẽ không cập nhật
      esp32Status: "OFFLINE",
      warning:
        "ESP32 không kết nối - lệnh sẽ được thực thi khi thiết bị online",
      message: `Lệnh ${device} ${action} đã gửi (⚠️ ESP32 OFFLINE)`,
    });
  }

  // Online, FE sẽ poll trạng thái
  res.json({
    success: true,
    esp32Status: "ONLINE",
    message: `Lệnh ${device} ${action} đã gửi`,
  });
});

// 📋 Lấy trạng thái devices
router.get("/states", (req, res) => {
  const sql = "SELECT device_name, state FROM device_state";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

// 🔌 ESP32 status
router.get("/esp32-status", (req, res) => {
  const esp32Status = getEsp32Status();
  res.json({
    isOnline: esp32Status.isOnline,
    lastSeen: esp32Status.lastSeen,
    disconnectTime: esp32Status.disconnectTime,
    statusText: esp32Status.isOnline ? "🟢 ONLINE" : "🔴 OFFLINE",
  });
});

// 📋 Lấy lịch sử hành động (hỗ trợ lọc & sort)
router.get("/history", (req, res) => {
  const {
    device = "",
    action = "",
    time = "",
    sortField = "created_at",
    sortOrder = "desc",
  } = req.query;

  const allowedFields = ["id", "device", "action", "created_at"];
  const field = allowedFields.includes(sortField) ? sortField : "created_at";
  const order = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

  // Xây dựng câu truy vấn động
  let sql = `SELECT * FROM action_history WHERE 1=1`;
  const params = [];

  if (device) {
    sql += " AND device = ?";
    params.push(device);
  }

  if (action) {
    sql += " AND action = ?";
    params.push(action);
  }

  if (time) {
    sql += " AND created_at LIKE ?";
    params.push(`%${time}%`);
  }

  sql += ` ORDER BY ${field} ${order}`;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ Lỗi truy vấn:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// api thôngs kê
router.get("/device-actions-stats", (req, res) => {
  const sql = `
SELECT
  device,
  SUM(CASE WHEN action = 'ON' THEN 1 ELSE 0 END) AS turn_on_count,
  SUM(CASE WHEN action = 'OFF' THEN 1 ELSE 0 END) AS turn_off_count
  FROM
  action_history
  GROUP BY
  device
  ORDER BY
  turn_on_count DESC;
`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Lỗi truy vấn thống kê hành động:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});
export default router;
