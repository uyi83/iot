import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import DataSensor from "./pages/DataSensor";
import ActionHistory from "./pages/ActionHistory";
import Profile from "./pages/Profile";

function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/data-sensor" element={<DataSensor />} />
              <Route path="/action-history" element={<ActionHistory />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
