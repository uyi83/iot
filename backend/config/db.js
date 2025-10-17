// backend/config/db.js
import mysql from "mysql2";

const db = mysql.createConnection({
  host: "localhost",
  user: "root", // giữ như bạn đã cấu hình
  password: "123456", // mật khẩu của bạn
  database: "iotdb",
  timezone: "+07:00", // ✅ Giữ nguyên múi giờ Việt Nam
  dateStrings: true,
  multipleStatements: false,
});

db.connect((err) => {
  if (err) {
    console.error("❌ Lỗi kết nối MySQL:", err);
  } else {
    console.log("✅ MySQL connected to iotdb");
  }
});

export default db;
