const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">IoT Dashboard</h1>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Welcome back,</p>
            <p className="font-semibold text-gray-800">Nguyễn Văn Đức</p>
          </div>
          <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">👤</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
