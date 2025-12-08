import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const menuItems = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/data-sensor", label: "Data Sensor", icon: "📈" },
    { path: "/action-history", label: "Action History", icon: "📜" },
    { path: "/stats", label: "Stats", icon: "📈" }, // ---------------------------------------------
    { path: "/profile", label: "Profile", icon: "👤" },
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-cyan-50 to-blue-50 min-h-screen shadow-lg">
      {" "}
      <div className="p-6">
        {" "}
        <h2 className="text-xl font-bold text-gray-800 mb-8">
          Admin Page
        </h2>{" "}
        <nav className="space-y-2">
          {" "}
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-cyan-500 text-white shadow-md"
                    : "text-gray-700 hover:bg-cyan-100"
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>{" "}
              <span className="font-medium">{item.label}</span>{" "}
            </NavLink>
          ))}{" "}
        </nav>{" "}
      </div>{" "}
    </aside>
  );
};

export default Sidebar;
