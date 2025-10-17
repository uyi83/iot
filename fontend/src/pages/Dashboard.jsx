import { useState, useEffect } from "react";
import sensorApi from "../api/sensorApi";
import ChartSensor from "../components/ChartSensor";

const Dashboard = () => {
  const [latestData, setLatestData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [devices, setDevices] = useState({
    FAN: "OFF",
    LED: "OFF",
    AIR_CONDITIONER: "OFF",
  });
  const [loading, setLoading] = useState(true);
  const [esp32Status, setEsp32Status] = useState("UNKNOWN");
  const [isEsp32Online, setIsEsp32Online] = useState(false);

  useEffect(() => {
    fetchData();
    fetchDeviceStates();
    checkEsp32Status();

    const interval = setInterval(fetchData, 2000);
    const esp32Interval = setInterval(checkEsp32Status, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(esp32Interval);
    };
  }, []);

  const fetchData = async () => {
    try {
      const response = await sensorApi.getAll();
      const data = Array.isArray(response) ? response : response.data || [];

      console.log("📊 Đã lấy dữ liệu từ DB:", data.length, "records");

      if (data && data.length > 0) {
        setLatestData(data[0]);
        setChartData(data.slice(0, 20));
      }
      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      setLoading(false);
    }
  };

  const fetchDeviceStates = async () => {
    try {
      const states = await sensorApi.getDeviceStates();
      const stateObj = {};
      states.forEach((item) => {
        stateObj[item.device_name] = item.state;
      });
      setDevices(stateObj);
    } catch (error) {
      console.error("Error fetching device states:", error);
    }
  };

  // 🔌 Kiểm tra trạng thái ESP32
  const checkEsp32Status = async () => {
    try {
      const response = await sensorApi.getEsp32Status();
      setEsp32Status(response.statusText);
      setIsEsp32Online(response.isOnline);
    } catch (error) {
      console.error("Error checking ESP32 status:", error);
      setEsp32Status("🔴 ERROR");
      setIsEsp32Online(false);
    }
  };

  const handleDeviceToggle = async (device) => {
    const newState = devices[device] === "ON" ? "OFF" : "ON";
    try {
      const response = await sensorApi.controlDevice(device, newState);
      setDevices({ ...devices, [device]: newState });

      // ⚠️ Hiển thị cảnh báo nếu ESP32 offline
      if (response.esp32Status === "OFFLINE") {
        alert(`⚠️ ${response.warning}\n\n${response.message}`);
      }
    } catch (error) {
      console.error("Error controlling device:", error);
      alert("❌ Lỗi khi gửi lệnh");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        {/* 🔌 Trạng thái ESP32 */}
        <div
          className={`px-4 py-2 rounded-lg font-bold text-white ${
            isEsp32Online ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {esp32Status}
        </div>
      </div>

      {/* Cards hiển thị dữ liệu hiện tại */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-100 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Temperature</p>
              <p className="text-3xl font-bold">
                {latestData?.temperature || 0}°C
              </p>
            </div>
            <div className="text-4xl">🌡️</div>
          </div>
        </div>

        <div className="bg-blue-100 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Humidity</p>
              <p className="text-3xl font-bold">{latestData?.humidity || 0}%</p>
            </div>
            <div className="text-4xl">💧</div>
          </div>
        </div>

        <div className="bg-orange-100 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Light</p>
              <p className="text-3xl font-bold">{latestData?.light || 0} lux</p>
            </div>
            <div className="text-4xl">💡</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <ChartSensor data={chartData} />
        </div>

        {/* Điều khiển thiết bị */}
        <div
          className={`bg-cyan-400 p-6 rounded-lg shadow transition-all duration-300 ${
            !isEsp32Online ? "opacity-40 pointer-events-none" : ""
          }`}
        >
          <h2 className="text-xl font-bold mb-4 text-white">Device Control</h2>

          <div className="space-y-4">
            {/* FAN */}
            <div className="bg-white p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/icon/fan.png"
                  alt="Fan"
                  className={`w-12 h-12 ${
                    devices.FAN === "ON" ? "animate-spin" : ""
                  }`}
                />
                <span className="font-medium">Fan</span>
              </div>
              <button
                onClick={() => handleDeviceToggle("FAN")}
                className={`relative w-16 h-8 rounded-full transition-colors ${
                  devices.FAN === "ON" ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    devices.FAN === "ON" ? "translate-x-8" : ""
                  }`}
                />
              </button>
            </div>

            {/* AIR CONDITIONER */}
            <div className="bg-white p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={
                    devices.AIR_CONDITIONER === "ON"
                      ? "/icon/ac-on.png"
                      : "/icon/ac-off.png"
                  }
                  alt="AC"
                  className="w-12 h-12"
                />
                <span className="font-medium">Air Conditioner</span>
              </div>
              <button
                onClick={() => handleDeviceToggle("AIR_CONDITIONER")}
                className={`relative w-16 h-8 rounded-full transition-colors ${
                  devices.AIR_CONDITIONER === "ON"
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    devices.AIR_CONDITIONER === "ON" ? "translate-x-8" : ""
                  }`}
                />
              </button>
            </div>

            {/* LED */}
            <div className="bg-white p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={
                    devices.LED === "ON"
                      ? "/icon/light-on.png"
                      : "/icon/light-off.png"
                  }
                  alt="Light"
                  className="w-12 h-12"
                />
                <span className="font-medium">LED</span>
              </div>
              <button
                onClick={() => handleDeviceToggle("LED")}
                className={`relative w-16 h-8 rounded-full transition-colors ${
                  devices.LED === "ON" ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    devices.LED === "ON" ? "translate-x-8" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
