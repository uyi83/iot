import mysql from "mysql2";

const db = mysql.createConnection({
  host: "localhost",
  user: "root", // giữ như bạn đã cấu hình
  password: "@D832004d.", // mật khẩu của bạn
  user: "root",
  password: "@D832004d.",
  database: "iotdb",
  timezone: "+07:00",
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
