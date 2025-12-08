import axiosClient from "./axiosClient";

const sensorApi = {
  // Lấy tất cả dữ liệu cảm biến
  getAll: (params = {}) => {
    return axiosClient.get("/sensors", { params });
  },

  //  Lấy dữ liệu cảm biến có phân trang + search + sort
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

  getRecent: (limit = 20) =>
    axiosClient.get("/sensors", {
      params: {
        page: 1,
        limit: parseInt(limit, 10),
        sortField: "created_at",
        sortOrder: "desc",
      },
    }),

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
    sortOrder = "desc",
    page = 1,
    limit = 10
  ) =>
    axiosClient.get("/actions/history", {
      params: { device, action, time, sortField, sortOrder, page, limit },
    }),

  // Lấy trạng thái thiết bị
  getDeviceStates: () => axiosClient.get("/actions/states"),

  // Trạng thái ESP32
  getEsp32Status: () => axiosClient.get("/actions/esp32-status"),

  // Thống kê số lần cảm biến vượt ngưỡng
  getSensorExceedStats: (temp_limit, humidity_limit, light_limit) =>
    axiosClient.get("/sensors/sensor-exceed-stats", {
      params: { temp_limit, humidity_limit, light_limit },
    }),

  // Thống kê số lượt bật/tắt thiết bị
  getDeviceActionStats: () => axiosClient.get("/actions/device-actions-stats"),
};

export default sensorApi;
