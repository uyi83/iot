import express from "express";
import cors from "cors";
import "./config/mqttClient.js";
import actionRoutes from "./routes/actions.js";
import sensorRoutes from "./routes/sensors.js";
import db from "./config/db.js";

const app = express();

app.use(cors());
app.use(express.json()); // ✅ Bắt buộc
app.use(express.urlencoded({ extended: true })); // ✅ Để đọc form-data nếu cần

app.use("/api/actions", actionRoutes);
app.use("/api/sensors", sensorRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại: http://localhost:${PORT}`);
});
