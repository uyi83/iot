import { useState, useEffect } from "react";
import sensorApi from "../api/sensorApi";

const ChevronUp = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 15l7-7 7 7"
    />
  </svg>
);

const ChevronDown = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const ActionHistory = () => {
  const [data, setData] = useState([]);
  const [allDevices, setAllDevices] = useState([]); // Lưu tất cả devices từ DB
  const [filterAction, setFilterAction] = useState("");
  const [filterDevice, setFilterDevice] = useState("");
  const [filterTime, setFilterTime] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const itemsPerPage = 10;

  // 🧩 Hàm lấy dữ liệu
  const fetchData = async () => {
    try {
      const result = await sensorApi.getActionHistory(
        filterDevice,
        filterAction,
        filterTime,
        sortField,
        sortOrder
      );
      setData(result);
    } catch (error) {
      console.error("❌ Lỗi lấy action history:", error);
    }
  };

  // 🧩 Hàm lấy danh sách tất cả devices từ DB (chỉ gọi 1 lần)
  const fetchAllDevices = async () => {
    try {
      const result = await sensorApi.getActionHistory(
        "", // Không lọc device
        "", // Không lọc action
        "", // Không lọc time
        "created_at",
        "desc"
      );
      const devices = [...new Set(result.map((d) => d.device))];
      setAllDevices(devices);
    } catch (error) {
      console.error("❌ Lỗi lấy danh sách devices:", error);
    }
  };

  // 🔄 Gọi fetchAllDevices khi component mount
  useEffect(() => {
    fetchAllDevices();
  }, []);

  // 🔄 Gọi fetchData khi filter hoặc sort thay đổi
  useEffect(() => {
    fetchData();
    setCurrentPage(1);
  }, [filterDevice, filterAction, filterTime, sortField, sortOrder]);

  // 🔁 Hàm sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <div className="w-4 h-4" />;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4 text-cyan-500" />
    ) : (
      <ChevronDown className="w-4 h-4 text-cyan-500" />
    );
  };

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageData = data.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-4 bg-gray-50 min-h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-3">Action History</h1>

      {/* Bộ lọc */}
      <div className="bg-white p-3 rounded-lg shadow mb-3 flex gap-2 flex-wrap items-center">
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">Tất cả Action</option>
          <option value="ON">ON</option>
          <option value="OFF">OFF</option>
        </select>

        <select
          value={filterDevice}
          onChange={(e) => setFilterDevice(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">Tất cả Device</option>
          {allDevices.map((dev) => (
            <option key={dev} value={dev}>
              {dev}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Nhập mốc thời gian (YYYY-MM-DD HH:mm)"
          value={filterTime}
          onChange={(e) => setFilterTime(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {/* Bảng */}
      <div className="bg-white rounded-lg shadow flex flex-col flex-1">
        {data.length === 0 ? (
          <div className="p-6 text-center flex flex-col items-center justify-center">
            <div className="text-5xl mb-2">📭</div>
            <p className="text-base text-gray-600 font-semibold mb-1">
              Không có dữ liệu
            </p>
            <p className="text-sm text-gray-500">
              Không tìm thấy kết quả phù hợp
            </p>
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-xs table-fixed">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">
                      ID
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">
                      Device
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">
                      Action
                    </th>
                    <th
                      className="px-3 py-2 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors select-none"
                      onClick={() => handleSort("created_at")}
                    >
                      <div className="flex items-center gap-1">
                        <span>Time</span>
                        <SortIcon field="created_at" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pageData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-900 font-medium">
                        {item.id}
                      </td>
                      <td className="px-3 py-2">{item.device}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.action === "ON"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.action}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {item.created_at}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="px-4 py-1 border-t flex items-center justify-between bg-gray-50 text-xs">
                <div className="text-gray-600">
                  Hiển thị {startIndex + 1} -{" "}
                  {Math.min(startIndex + itemsPerPage, data.length)} /{" "}
                  {data.length} records
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                  >
                    Prev
                  </button>

                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2)
                      pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-2 py-1 rounded ${
                          currentPage === pageNum
                            ? "bg-cyan-500 text-white"
                            : "bg-gray-200 hover:bg-gray-300"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActionHistory;
