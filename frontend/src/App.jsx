import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import EquipmentList from './pages/EquipmentList.jsx';
import AssignmentList from './pages/AssignmentList.jsx';
import MaintenanceList from './pages/MaintenanceList.jsx';
import LicenseList from './pages/LicenseList.jsx';
import MasterData from './pages/MasterData.jsx';
import Report from './pages/Report.jsx';

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

function PrivateRoute({ children }) {
  return localStorage.getItem('token')
    ? children
    : <Navigate to="/login" replace />;
}

function RoleRoute({ roles, children }) {
  const user = getCurrentUser();

  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="equipments" element={<EquipmentList />} />
        <Route path="assignments" element={<AssignmentList />} />
        <Route path="maintenance" element={<MaintenanceList />} />
        <Route path="licenses" element={<LicenseList />} />
        <Route path="reports" element={<Report />} />

        <Route
          path="master-data"
          element={
            <RoleRoute roles={['admin', 'asset_manager']}>
              <MasterData />
            </RoleRoute>
          }
        />
      </Route>
    </Routes>
  );
}
