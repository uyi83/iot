import { useEffect, useState } from "react";
import sensorApi from "../api/sensorApi";

const DataSensor = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const limit = 10;

  // 🔹 Lấy dữ liệu từ server (đã bao gồm search + sort)
  const fetchData = async (currentPage = page) => {
    try {
      setLoading(true);

      const res = await sensorApi.getPaginated(
        currentPage,
        limit,
        searchTerm.trim(),
        searchField,
        sortField,
        sortOrder
      );

      if (res.data && Array.isArray(res.data)) {
        setData(res.data);
        setTotalRecords(res.total || 0);
      } else if (Array.isArray(res)) {
        setData(res);
        setTotalRecords(res.length);
      } else {
        setData([]);
        setTotalRecords(0);
      }

      setLoading(false);
    } catch (error) {
      console.error("❌ Lỗi khi tải dữ liệu:", error);
      setData([]);
      setLoading(false);
    }
  };

  // 🔹 Sắp xếp
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const renderSortIcon = (field) => {
    if (sortField !== field)
      return (
        <svg
          className="w-4 h-4 ml-1 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );

    return sortOrder === "asc" ? (
      <svg
        className="w-4 h-4 ml-1 text-cyan-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 ml-1 text-cyan-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    );
  };

  // 🔄 Gọi API khi thay đổi sort, page
  useEffect(() => {
    fetchData(page);
  }, [page, sortField, sortOrder]);

  // 🔍 Gọi API khi search thay đổi (debounce 0.5s)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchData(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, searchField]);

  // ⏱ Cập nhật tự động mỗi 2s
  useEffect(() => {
    const interval = setInterval(() => {
      if (searchTerm.trim() === "") fetchData(page);
    }, 2000);
    return () => clearInterval(interval);
  }, [searchTerm, page, sortField, sortOrder]);

  const totalPages = totalRecords > 0 ? Math.ceil(totalRecords / limit) : 1;
  const pageOptions = Array.from(
    { length: totalPages },
    (_, i) => i + 1
  ).filter((p) => p === 1 || p % 5 === 0 || p === totalPages);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* 🔍 Tìm kiếm */}
      <div className="flex flex-wrap gap-3 items-end mb-4 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Tìm kiếm:
          </label>
          <input
            type="text"
            placeholder="Nhập nội dung tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 w-64"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Tìm kiếm theo:
          </label>
          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">Tất cả</option>
            <option value="temperature">Nhiệt độ</option>
            <option value="humidity">Độ ẩm</option>
            <option value="light">Ánh sáng</option>
            <option value="time">Thời gian</option>
          </select>
        </div>

        <button
          onClick={() => fetchData(1)}
          disabled={loading}
          className={`px-5 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 text-sm ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          Tìm kiếm
        </button>
      </div>

      {/* 📊 Bảng dữ liệu */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">ID</th>
              <th
                onClick={() => handleSort("temperature")}
                className="px-3 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200"
              >
                <div className="flex items-center">
                  Temperature (°C){renderSortIcon("temperature")}
                </div>
              </th>
              <th
                onClick={() => handleSort("humidity")}
                className="px-3 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200"
              >
                <div className="flex items-center">
                  Humidity (%){renderSortIcon("humidity")}
                </div>
              </th>
              <th
                onClick={() => handleSort("light")}
                className="px-3 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200"
              >
                <div className="flex items-center">
                  Light (lux){renderSortIcon("light")}
                </div>
              </th>
              <th
                onClick={() => handleSort("created_at")}
                className="px-3 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200"
              >
                <div className="flex items-center">
                  Time{renderSortIcon("created_at")}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-600">
                  Không có dữ liệu phù hợp.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{item.id}</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      {item.temperature}°C
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {item.humidity}%
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                      {item.light} lux
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{item.created_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* 🔹 Phân trang */}
        {totalRecords > 0 && (
          <div className="flex justify-between items-center px-4 py-3 bg-gray-50 text-sm text-gray-600 border-t">
            <div className="text-xs">
              Hiển thị {Math.min((page - 1) * limit + 1, totalRecords)} -{" "}
              {Math.min(page * limit, totalRecords)} / {totalRecords}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1 || loading}
                className="px-3 py-1.5 border rounded-md hover:bg-gray-100 disabled:text-gray-400"
              >
                ⏮
              </button>

              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-3 py-1.5 border rounded-md hover:bg-gray-100 disabled:text-gray-400"
              >
                ◀
              </button>

              <select
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
                className="border rounded-md px-2 py-1 bg-white"
              >
                {pageOptions.map((p) => (
                  <option key={p} value={p}>
                    Trang {p}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="px-3 py-1.5 border rounded-md hover:bg-gray-100 disabled:text-gray-400"
              >
                ▶
              </button>

              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages || loading}
                className="px-3 py-1.5 border rounded-md hover:bg-gray-100 disabled:text-gray-400"
              >
                ⏭
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataSensor;
