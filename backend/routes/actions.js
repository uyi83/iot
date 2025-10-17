import express from "express";
import db from "../config/db.js";
import mqttClient, { getEsp32Status } from "../config/mqttClient.js";

const router = express.Router();

// 🟢 API bật/tắt đèn
router.post("/", (req, res) => {
  const { device, action } = req.body;

  if (!device || !action)
    return res.status(400).json({ error: "Thiếu device hoặc action" });

  // 🔍 Kiểm tra ESP32 có online không
  const esp32Status = getEsp32Status();

  const message = `${device}_${action}`;
  mqttClient.publish("controlLED", message);
  console.log("📤 Gửi lệnh MQTT:", message);

  // Lưu lịch sử hành động
  const historySql =
    "INSERT INTO action_history (device, action) VALUES (?, ?)";
  db.query(historySql, [device, action]);

  // Cập nhật trạng thái hiện tại
  const updateSql = "UPDATE device_state SET state = ? WHERE device_name = ?";
  db.query(updateSql, [action, device]);

  // ⚠️ Trả về thông báo nếu ESP32 offline
  if (!esp32Status.isOnline) {
    return res.json({
      success: true,
      message: `Lệnh ${device} ${action} đã gửi (⚠️ ESP32 OFFLINE - Chờ kết nối lại)`,
      esp32Status: "OFFLINE",
      warning:
        "ESP32 không kết nối - lệnh sẽ được thực thi khi thiết bị online",
    });
  }

  res.json({
    success: true,
    message: `Đã gửi lệnh ${device} ${action}`,
    esp32Status: "ONLINE",
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

// 🎯 Lấy trạng thái thiết bị hiện tại
router.get("/states", (req, res) => {
  const sql = "SELECT device_name, state FROM device_state";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Lỗi truy vấn:", err);
      res.status(500).json({ error: "Database error" });
    } else {
      res.json(results);
    }
  });
});

// 🔌 Lấy trạng thái kết nối ESP32
router.get("/esp32-status", (req, res) => {
  const esp32Status = getEsp32Status();
  res.json({
    isOnline: esp32Status.isOnline,
    lastSeen: esp32Status.lastSeen,
    disconnectTime: esp32Status.disconnectTime,
    statusText: esp32Status.isOnline ? "🟢 ONLINE" : "🔴 OFFLINE",
  });
});

export default router;
