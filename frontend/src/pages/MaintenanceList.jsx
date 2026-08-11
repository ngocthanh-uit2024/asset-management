import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';

const emptyForm = {
  equipment: '',
  requestedBy: '',
  problemDescription: '',
  priority: 'medium',
  maintenanceType: 'corrective',
  vendor: '',
  repairCost: 0,
  currency: 'VND',
  note: ''
};

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

export default function MaintenanceList() {
  const currentUser = getCurrentUser();

  const canCreate = ['admin', 'asset_manager', 'manager', 'employee'].includes(currentUser.role);
  const canProcess = ['admin', 'asset_manager'].includes(currentUser.role);

  const [items, setItems] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);

      const [maintenanceRes, equipmentRes, userRes] = await Promise.all([
        api.get('/maintenance'),
        api.get('/equipments'),
        api.get('/master/users', { params: { status: 'active' } })
      ]);

      setItems(maintenanceRes.data);
      setEquipments(equipmentRes.data);
      setUsers(userRes.data);

      if (!form.requestedBy && currentUser._id) {
        setForm(prev => ({ ...prev, requestedBy: currentUser._id }));
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể tải dữ liệu bảo trì');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(event) {
    event.preventDefault();

    try {
      setLoading(true);

      await api.post('/maintenance', {
        ...form,
        requestedBy: form.requestedBy || currentUser._id
      });

      setMessage('Đã tạo yêu cầu bảo trì');
      setForm({
        ...emptyForm,
        requestedBy: currentUser._id || ''
      });

      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể tạo yêu cầu bảo trì');
    } finally {
      setLoading(false);
    }
  }

  async function startProcessing(item) {
    const handledBy =
      window.prompt(
        'Nhập User ID nhân viên HR/Admin xử lý. Để trống = người đang đăng nhập.'
      ) || undefined;

    try {
      setLoading(true);

      await api.put(`/maintenance/${item._id}`, {
        status: 'processing',
        handledBy
      });

      setMessage(`Đã bắt đầu xử lý ${item.maintenanceCode}`);
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể cập nhật bảo trì');
    } finally {
      setLoading(false);
    }
  }

  async function complete(item) {
    const result = window.prompt('Kết quả sửa chữa / xử lý:') || '';
    const vendor = window.prompt('Nhà cung cấp sửa chữa (có thể để trống):') || item.vendor || '';
    const technician = window.prompt('Kỹ thuật viên (có thể để trống):') || item.technician || '';
    const costText = window.prompt('Chi phí sửa chữa:', String(item.repairCost || 0));
    const repairCost = Number(costText || 0);

    const condition =
      window.prompt(
        'Tình trạng sau xử lý: good / fair / damaged / broken',
        'good'
      ) || 'good';

    try {
      setLoading(true);

      await api.put(`/maintenance/${item._id}`, {
        status: 'completed',
        result,
        vendor,
        technician,
        repairCost,
        equipmentCondition: condition
      });

      setMessage(`Đã hoàn tất ${item.maintenanceCode}`);
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể hoàn tất bảo trì');
    } finally {
      setLoading(false);
    }
  }

  async function cancel(item) {
    if (!window.confirm(`Hủy yêu cầu ${item.maintenanceCode}?`)) return;

    try {
      setLoading(true);

      await api.put(`/maintenance/${item._id}`, {
        status: 'cancelled'
      });

      setMessage(`Đã hủy ${item.maintenanceCode}`);
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể hủy yêu cầu');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Bảo trì / Báo hỏng</h1>
          <p>Theo dõi lỗi, người yêu cầu, người xử lý, nhà cung cấp, chi phí và kết quả</p>
        </div>
      </div>

      {message && <div className="notice">{message}</div>}

      {canCreate && (
        <div className="panel">
          <h3>Tạo yêu cầu bảo trì</h3>

          <form className="grid-form" onSubmit={submit}>
            <select
              value={form.equipment}
              onChange={e => setForm({ ...form, equipment: e.target.value })}
              required
            >
              <option value="">Chọn thiết bị</option>
              {equipments
                .filter(x => x.status !== 'disposed')
                .map(x => (
                  <option key={x._id} value={x._id}>
                    {x.assetCode} - {x.assetName}
                  </option>
                ))}
            </select>

            <select
              value={form.requestedBy}
              onChange={e => setForm({ ...form, requestedBy: e.target.value })}
              required
            >
              <option value="">Người yêu cầu</option>
              {users.map(x => (
                <option key={x._id} value={x._id}>
                  {x.employeeCode} - {x.fullName}
                </option>
              ))}
            </select>

            <input
              placeholder="Mô tả lỗi"
              value={form.problemDescription}
              onChange={e => setForm({ ...form, problemDescription: e.target.value })}
              required
            />

            <select
              value={form.priority}
              onChange={e => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
              <option value="critical">Khẩn cấp</option>
            </select>

            <select
              value={form.maintenanceType}
              onChange={e => setForm({ ...form, maintenanceType: e.target.value })}
            >
              <option value="corrective">Sửa chữa</option>
              <option value="preventive">Bảo trì định kỳ</option>
              <option value="warranty">Bảo hành</option>
              <option value="inspection">Kiểm tra</option>
              <option value="cleaning">Vệ sinh</option>
            </select>

            <input
              placeholder="Nhà cung cấp (nếu biết)"
              value={form.vendor}
              onChange={e => setForm({ ...form, vendor: e.target.value })}
            />

            <textarea
              placeholder="Ghi chú"
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
            />

            <button disabled={loading}>Tạo yêu cầu</button>
          </form>
        </div>
      )}

      {!canCreate && (
        <div className="notice">
          Tài khoản của bạn có quyền xem dữ liệu bảo trì nhưng không được tạo hoặc chỉnh sửa.
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã</th>
              <th>Thiết bị</th>
              <th>Người yêu cầu</th>
              <th>Người xử lý</th>
              <th>Lỗi</th>
              <th>Ưu tiên</th>
              <th>Vendor</th>
              <th>Chi phí</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {items.map(item => (
              <tr key={item._id}>
                <td>{item.maintenanceCode}</td>
                <td>{item.equipment?.assetCode}</td>
                <td>{item.requestedBy?.fullName || '-'}</td>
                <td>{item.handledBy?.fullName || '-'}</td>
                <td>{item.problemDescription}</td>
                <td>{item.priority}</td>
                <td>{item.vendor || '-'}</td>
                <td>
                  {Number(item.repairCost || 0).toLocaleString()} {item.currency}
                </td>
                <td>
                  <span className="status">{item.status}</span>
                </td>
                <td>
                  {canProcess && !['completed', 'cancelled'].includes(item.status) && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {item.status === 'open' && (
                        <button type="button" onClick={() => startProcessing(item)}>
                          Xử lý
                        </button>
                      )}

                      <button type="button" onClick={() => complete(item)}>
                        Hoàn tất
                      </button>

                      <button
                        type="button"
                        className="danger"
                        onClick={() => cancel(item)}
                      >
                        Hủy
                      </button>
                    </div>
                  )}

                  {!canProcess && '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
