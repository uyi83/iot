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

  // Gửi lệnh dưới dạng JSON với source là USER
  const payload = JSON.stringify({
    device: device,
    action: action,
    source: "USER",
  });

  // Gửi lệnh lên topic controlLED
  mqttClient.publish("controlLED", payload);
  console.log("📤 Gửi lệnh USER MQTT:", payload);

  // ESP32 offline
  if (!esp32Status.isOnline) {
    return res.json({
      success: false,
      state: action,
      esp32Status: "OFFLINE",
      warning:
        "ESP32 không kết nối - lệnh đã gửi, nhưng trạng thái DB sẽ không được cập nhật cho đến khi thiết bị online và xác nhận.",
      message: `Lệnh ${device} ${action} đã gửi (⚠️ ESP32 OFFLINE)`,
    });
  }

  // Online, FE sẽ poll trạng thái và chờ DB được cập nhật bởi feedback loop
  res.json({
    success: true,
    esp32Status: "ONLINE",
    message: `Lệnh ${device} ${action} đã gửi, chờ xác nhận từ ESP32...`,
  });
});

// 📋 Lấy trạng thái devices (GIỮ NGUYÊN)
router.get("/states", (req, res) => {
  const sql = "SELECT device_name, state FROM device_state";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

// 📋 Lấy lịch sử hành động (hỗ trợ lọc & sort) (GIỮ NGUYÊN)
router.get("/history", (req, res) => {
  let {
    device = "",
    action = "",
    time = "",
    sortField = "created_at",
    sortOrder = "desc",
    page = 1,
    limit = 10,
  } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);
  const offset = (page - 1) * limit;

  const allowedFields = ["id", "device", "action", "created_at"];
  const field = allowedFields.includes(sortField) ? sortField : "created_at";
  const order = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

  let where = "WHERE 1=1";
  const params = [];

  if (device) {
    where += " AND device = ?";
    params.push(device);
  }
  if (action) {
    where += " AND action = ?";
    params.push(action);
  }
  if (time) {
    where += " AND created_at LIKE ?";
    params.push(`%${time}%`);
  }

  // Query đếm tổng
  const countSql = `SELECT COUNT(*) AS total FROM action_history ${where}`;

  // Query dữ liệu trang hiện tại
  const dataSql = `
    SELECT * FROM action_history 
    ${where}
    ORDER BY ${field} ${order}
    LIMIT ? OFFSET ?
  `;

  db.query(countSql, params, (err, countResult) => {
    if (err) return res.status(500).json({ error: "Database error" });

    const total = countResult[0].total;

    db.query(dataSql, [...params, limit, offset], (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      res.json({
        total,
        page,
        limit,
        data: results,
      });
    });
  });
});

// api thống kê (GIỮ NGUYÊN)
router.get("/device-actions-stats", (req, res) => {
  const sql = `
SELECT
  device,
  SUM(CASE WHEN action = 'ON' THEN 1 ELSE 0 END) AS turn_on_count,
  SUM(CASE WHEN action = 'OFF' THEN 1 ELSE 0 END) AS turn_off_count,
  COUNT(*) AS total_actions
  FROM
  action_history
  GROUP BY
  device
  ORDER BY
  total_actions DESC;
`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Lỗi truy vấn thống kê hành động:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

// 🔌 ESP32 status (GIỮ NGUYÊN)
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
