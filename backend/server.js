import express from "express";
import cors from "cors";
import mqttClient from "./config/mqttClient.js";
import actionRoutes from "./routes/actions.js";
import sensorRoutes from "./routes/sensors.js";
import db from "./config/db.js";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
const swaggerDocument = YAML.load("./swagger.yaml");
const app = express();

app.use(cors());
app.use(express.json()); // ✅ Bắt buộc
app.use(express.urlencoded({ extended: true })); // ✅ Để đọc form-data nếu cần

app.use("/api/actions", actionRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại: http://localhost:${PORT}`);
});
