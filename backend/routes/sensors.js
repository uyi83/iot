import express from "express";
import db from "../config/db.js";

const router = express.Router();

// Helper query promise
const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

router.get("/", async (req, res) => {
  console.log("🔍 API /api/sensors được gọi");

  try {
    const {
      page = 1,
      limit = 10,
      sortField = "created_at",
      sortOrder = "desc",
      search = "",
      searchField = "all",
    } = req.query;

    const limitNum = Number(limit); // chuyển sang kiểm Number
    const offset = (page - 1) * limitNum; // vị trí bắt đầu

    // Validate sort field
    const allowedSortFields = [
      "temperature",
      "humidity",
      "light",
      "created_at",
      "id",
    ];
    const field = allowedSortFields.includes(sortField)
      ? sortField
      : "created_at";
    const order = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

    // 🔎 Build WHERE
    let whereSQL = "";
    let whereParams = [];

    if (search.trim() !== "") {
      const s = `%${search}%`;

      if (searchField === "all") {
        whereSQL = `WHERE id LIKE ? OR temperature LIKE ? OR humidity LIKE ? OR light LIKE ? OR created_at LIKE ?`;
        whereParams = [s, s, s, s, s];
      } else {
        // Tìm theo một cột cụ thể khác
        whereSQL = `WHERE ${searchField} LIKE ?`;
        whereParams = [s];
      }
    }

    // Count total
    const countSql = `SELECT COUNT(*) as total FROM sensor_data ${whereSQL}`; // đếm tổng bản ghi
    const totalResult = await query(countSql, whereParams);
    const total = totalResult[0].total; // lấy giá trị tổng các bản ghi

    // Get data
    const dataSql = `
      SELECT * 
      FROM sensor_data 
      ${whereSQL}
      ORDER BY ${field} ${order}
      LIMIT ? OFFSET ?
    `;

    const data = await query(dataSql, [...whereParams, limitNum, offset]);

    console.log(`✅ Trả về ${data.length} records`);

    res.json({
      data,
      total,
      page: Number(page),
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      sortField: field,
      sortOrder: order,
    });
  } catch (err) {
    console.error("❌ Lỗi API:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/latest", (req, res) => {
  const sql = "SELECT * FROM sensor_data ORDER BY created_at DESC LIMIT 1";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Lỗi truy vấn:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results[0] || null);
  });
});

router.get("/sensor-exceed-stats", (req, res) => {
  const { temp_limit, humidity_limit, light_limit } = req.query;

  const tempLimitNum = Number(temp_limit);
  const humidityLimitNum = Number(humidity_limit);
  const lightLimitNum = Number(light_limit); // Kiểm tra tính hợp lệ

  if (isNaN(tempLimitNum) || isNaN(humidityLimitNum) || isNaN(lightLimitNum)) {
    return res
      .status(400)
      .json({ error: "Ngưỡng giới hạn phải là số hợp lệ." });
  } // 🆕 Câu truy vấn SQL mới để tính toán số lần vượt ngưỡng

  const sql = `
    SELECT
    SUM(CASE WHEN temperature > ? THEN 1 ELSE 0 END) AS temp_exceed_count,
    SUM(CASE WHEN humidity > ? THEN 1 ELSE 0 END) AS humidity_exceed_count,
    SUM(CASE WHEN light > ? THEN 1 ELSE 0 END) AS light_exceed_count
    FROM
    sensor_data;
    `; // Truyền các biến đã ép kiểu vào db.query

  db.query(
    sql,
    [tempLimitNum, humidityLimitNum, lightLimitNum],
    (err, results) => {
      if (err) {
        console.error("❌ Lỗi truy vấn thống kê vượt ngưỡng:", err);
        return res.status(500).json({ error: "Database error" });
      } // Logic xử lý dữ liệu và sắp xếp đã có sẵn

      const result = results[0];
      const data = [
        {
          sensor: "Nhiệt độ",
          limit: temp_limit,
          exceed_count: result.temp_exceed_count,
        },
        {
          sensor: "Độ ẩm",
          limit: humidity_limit,
          exceed_count: result.humidity_exceed_count,
        },
        {
          sensor: "Ánh sáng",
          limit: light_limit,
          exceed_count: result.light_exceed_count,
        },
      ].sort((a, b) => b.exceed_count - a.exceed_count);

      res.json(data);
    }
  );
});
export default router;
