import React, { useEffect, useState } from 'react';
import api from '../services/api.js';

export default function Dashboard() {
  const [data, setData] = useState({});
  useEffect(() => { api.get('/reports/dashboard').then(res => setData(res.data)); }, []);

  const cards = [
    ['Tổng thiết bị', data.total], ['Sẵn sàng', data.available], ['Đang cấp phát', data.assigned],
    ['Đang bảo trì', data.maintenance], ['Hư hỏng', data.broken], ['Thanh lý', data.disposed],
    ['Phiếu cấp phát active', data.activeAssignments], ['Yêu cầu bảo trì mở', data.openMaintenances],
    ['Công ty', data.companies], ['Địa điểm', data.locations]
  ];

  return <section>
    <div className="page-heading"><div><h1>Dashboard</h1><p>Tổng quan tình hình quản lý tài sản</p></div></div>
    <div className="cards">{cards.map(([title, value]) => <div className="card" key={title}><p>{title}</p><h2>{value ?? 0}</h2></div>)}</div>
  </section>;
}
