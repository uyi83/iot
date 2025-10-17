import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const ChartSensor = ({ data }) => {
  // Đảo ngược thứ tự để thời gian mới nhất nằm bên phải
  const chartData = [...data].reverse().map((item) => ({
    time: new Date(item.created_at).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    temperature: item.temperature,
    humidity: item.humidity,
    light: item.light,
  }));

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-center">Sensor Data Chart</h2>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} />

          {/* Trục trái: Nhiệt độ & độ ẩm */}
          <YAxis
            yAxisId="left"
            orientation="left"
            domain={[0, 100]} // cố định giá trị trục tung
            label={{
              value: "Temp / Humidity",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle" },
            }}
          />

          {/* Trục phải: Ánh sáng */}
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 4000]} // cố định giá trị trục tung ánh sáng
            label={{
              value: "Light (lux)",
              angle: 90,
              position: "insideRight",
              style: { textAnchor: "middle" },
            }}
          />

          <Tooltip />
          <Legend />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="temperature"
            stroke="#ef4444"
            name="Temperature (°C)"
            strokeWidth={2}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="humidity"
            stroke="#3b82f6"
            name="Humidity (%)"
            strokeWidth={2}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="light"
            stroke="#f59e0b"
            name="Light (lux)"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartSensor;
