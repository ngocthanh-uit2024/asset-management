import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    user = {};
  }

  const canManageMaster = ['admin', 'asset_manager'].includes(user.role);

  function logout() {
    localStorage.clear();
    navigate('/login');
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2>AssetPro</h2>
        <p className="muted">Enterprise Asset Management</p>

        <nav>
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/equipments">Thiết bị</NavLink>
          <NavLink to="/assignments">Cấp phát / Thu hồi</NavLink>
          <NavLink to="/maintenance">Bảo trì</NavLink>
          <NavLink to="/licenses">Software License</NavLink>
          <NavLink to="/reports">Báo cáo / Excel</NavLink>

          {canManageMaster && (
            <NavLink to="/master-data">Danh mục</NavLink>
          )}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <strong>{user.fullName || 'User'}</strong>
            <span className="badge">{user.role || 'viewer'}</span>
          </div>

          <button onClick={logout}>Đăng xuất</button>
        </header>

        <Outlet />
      </main>
    </div>
  );
}

