import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Tasks from './pages/Tasks';
import Badges from './pages/Badges';
import Settings from './pages/Settings';
import BusStops from './pages/BusStops';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { t } from './theme';

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{ display: 'flex', height: '100vh', background: t.bg, overflow: 'hidden' }}>
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(p => !p)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'margin 0.3s' }}>
        <Header onMenuClick={() => setSidebarOpen(p => !p)} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: t.bg }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/badges" element={<Badges />} />
            <Route path="/bus-stops" element={<BusStops />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const isAuthenticated = !!localStorage.getItem('adminToken');

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" />} />
      <Route path="/*" element={<Layout />} />
    </Routes>
  );
}
