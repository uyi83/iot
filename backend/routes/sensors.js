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

export default router;
