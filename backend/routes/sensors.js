import express from "express";
import db from "../config/db.js";

const router = express.Router();

router.get("/", (req, res) => {
  console.log("🔍 API /api/sensors được gọi");

  const {
    page = 1,
    limit = 10,
    sortField = "created_at",
    sortOrder = "desc",
    search = "",
    searchField = "all",
  } = req.query;

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

  let whereClause = "";
  const searchTerm = `%${search}%`;

  if (search && search.trim() !== "") {
    switch (searchField) {
      case "temperature":
        whereClause = "WHERE temperature LIKE ?";
        break;
      case "humidity":
        whereClause = "WHERE humidity LIKE ?";
        break;
      case "light":
        whereClause = "WHERE light LIKE ?";
        break;
      case "time":
        whereClause = "WHERE created_at LIKE ?";
        break;
      default:
        whereClause =
          "WHERE id LIKE ? OR temperature LIKE ? OR humidity LIKE ? OR light LIKE ? OR created_at LIKE ?";
        break;
    }
  }

  const countSql =
    whereClause === ""
      ? "SELECT COUNT(*) as total FROM sensor_data"
      : `SELECT COUNT(*) as total FROM sensor_data ${whereClause}`;

  const dataSqlBase = `SELECT * FROM sensor_data ${
    whereClause || ""
  } ORDER BY ${field} ${order}`;
  const offset = (page - 1) * limit;
  const dataSql = `${dataSqlBase} LIMIT ? OFFSET ?`;

  const searchParams =
    whereClause === ""
      ? []
      : searchField === "all"
      ? [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
      : [searchTerm];

  db.query(countSql, searchParams, (countErr, countResult) => {
    if (countErr) {
      console.error("❌ Lỗi đếm records:", countErr);
      return res.status(500).json({ error: countErr.message });
    }

    const total = countResult[0]?.total || 0;

    db.query(
      dataSql,
      [...searchParams, parseInt(limit), parseInt(offset)],
      (dataErr, dataResult) => {
        if (dataErr) {
          console.error("❌ Lỗi truy vấn DB:", dataErr);
          return res.status(500).json({ error: dataErr.message });
        }

        console.log(
          `✅ Trả về ${dataResult.length} records (page=${page}, total=${total}, search="${search}", sort=${field} ${order})`
        );

        res.json({
          data: dataResult,
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
          sortField: field,
          sortOrder: order,
        });
      }
    );
  });
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

router.get("/range", (req, res) => {
  const { startDate, endDate } = req.query;
  const sql =
    "SELECT * FROM sensor_data WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC";
  db.query(sql, [startDate, endDate], (err, results) => {
    if (err) {
      console.error("❌ Lỗi truy vấn:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});
router.get("/sensor-exceed-stats", (req, res) => {
  const { temp_limit, humidity_limit, light_limit } = req.query; // Ép kiểu dữ liệu từ chuỗi (query params) sang số

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
