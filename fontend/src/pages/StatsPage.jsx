import React, { useState, useEffect, useCallback } from "react";
import sensorApi from "../api/sensorApi";
import "./StatsPage.css";

const StatsPage = () => {
  const [exceedStats, setExceedStats] = useState([]); // thống kê vượt ngưỡng
  const [actionStats, setActionStats] = useState([]); // thống kê bật / tắt thiết bị
  const [loadingExceed, setLoadingExceed] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const [limits, setLimits] = useState({
    temperature: 40,
    humidity: 90,
    light: 3000,
  });

  // Fetch vượt ngưỡng
  const fetchExceedStats = useCallback(async () => {
    setLoadingExceed(true);
    try {
      const data = await sensorApi.getSensorExceedStats(
        limits.temperature,
        limits.humidity,
        limits.light
      );
      setExceedStats(data);
    } catch (error) {
      console.error("Lỗi vượt ngưỡng:", error);
    }
  }, [limits.temperature, limits.humidity, limits.light]);

  // Fetch bật / tắt thiết bị
  const fetchActionStats = async () => {
    setLoadingAction(true);
    try {
      const data = await sensorApi.getDeviceActionStats();
      setActionStats(data);
    } catch (error) {
      console.error("Lỗi hành động:", error);
    } finally {
      setLoadingAction(false);
    }
  };

  useEffect(() => {
    fetchExceedStats();
    fetchActionStats();
  }, [fetchExceedStats]);

  const handleLimitChange = (e) => {
    const { name, value } = e.target;
    if (value === "" || !isNaN(Number(value))) {
      setLimits((prev) => ({
        ...prev,
        [name]: value === "" ? "" : Number(value),
      }));
    }
  };

  const applyLimits = () => {
    if (
      limits.temperature !== "" &&
      limits.humidity !== "" &&
      limits.light !== ""
    ) {
      fetchExceedStats();
    }
  };

  return (
    <div className="stats-page">
      <h1>📊 Thống Kê Giám Sát Hệ Thống</h1>

      {/* --- VƯỢT NGƯỠNG --- */}
      <div className="stats-section">
        <h2>1. Số lần Cảm biến Vượt Ngưỡng</h2>

        {/* Nhập ngưỡng */}
        <div className="limit-inputs">
          <h3>⚙️ Cài đặt Ngưỡng Tối đa</h3>

          <div>
            <label>Nhiệt độ &gt;</label>
            <input
              type="number"
              name="temperature"
              value={limits.temperature}
              onChange={handleLimitChange}
              onBlur={applyLimits}
            />
            <span>°C</span>
          </div>

          <div>
            <label>Độ ẩm &gt;</label>
            <input
              type="number"
              name="humidity"
              value={limits.humidity}
              onChange={handleLimitChange}
              onBlur={applyLimits}
            />
            <span>%</span>
          </div>

          <div>
            <label>Ánh sáng &gt;</label>
            <input
              type="number"
              name="light"
              value={limits.light}
              onChange={handleLimitChange}
              onBlur={applyLimits}
            />
            <span>Lux</span>
          </div>

          <button onClick={applyLimits}>Áp dụng</button>
        </div>

        {/* Thống kê vượt ngưỡng – dạng thẻ ngang */}
        <div className="stat-row">
          {exceedStats.length === 0 ? (
            <div className="loading">Không có dữ liệu.</div>
          ) : (
            exceedStats.map((s, i) => (
              <div className="stat-card" key={i}>
                <div className="stat-title">{s.sensor}</div>
                <div className="stat-value">{s.exceed_count}</div>
                <div className="stat-sub">Ngưỡng: {s.limit}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- BẬT / TẮT --- */}
      <div className="stats-section">
        <h2>2. Số lượt Bật/Tắt Thiết bị</h2>

        <div className="stat-row">
          {loadingAction ? (
            <div className="loading">Đang tải...</div>
          ) : actionStats.length === 0 ? (
            <div className="loading">Chưa có lịch sử.</div>
          ) : (
            actionStats.map((a, i) => (
              <div className="stat-card" key={i}>
                <div className="stat-title">{a.device}</div>

                <div className="stat-value dual">
                  <div className="on-count">
                    <span>Bật</span>
                    <br></br>
                    <strong>{a.turn_on_count}</strong>
                  </div>

                  <div className="off-count">
                    <span>Tắt</span>
                    <br></br>
                    <strong>{a.turn_off_count}</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
