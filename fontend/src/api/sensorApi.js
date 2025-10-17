import axiosClient from "./axiosClient";

const sensorApi = {
  // Lấy tất cả dữ liệu cảm biến
  getAll: () => axiosClient.get("/sensors"),

  // 🔹 Lấy dữ liệu cảm biến có phân trang + search + sort
  getPaginated: (
    page = 1,
    limit = 10,
    search = "",
    searchField = "all",
    sortField = "created_at",
    sortOrder = "desc"
  ) =>
    axiosClient.get("/sensors", {
      params: { page, limit, search, searchField, sortField, sortOrder },
    }),

  // Lấy dữ liệu cảm biến theo khoảng thời gian
  getByTimeRange: (startDate, endDate) =>
    axiosClient.get("/sensors/range", { params: { startDate, endDate } }),

  // Lấy dữ liệu mới nhất
  getLatest: () => axiosClient.get("/sensors/latest"),

  // Điều khiển thiết bị
  controlDevice: (device, action) =>
    axiosClient.post("/actions", { device, action }),

  // 📋 Lịch sử hành động
  getActionHistory: (
    device = "",
    action = "",
    time = "",
    sortField = "created_at",
    sortOrder = "desc"
  ) =>
    axiosClient.get("/actions/history", {
      params: { device, action, time, sortField, sortOrder },
    }),

  // Lấy trạng thái thiết bị
  getDeviceStates: () => axiosClient.get("/actions/states"),

  // Trạng thái ESP32
  getEsp32Status: () => axiosClient.get("/actions/esp32-status"),
};

export default sensorApi;
