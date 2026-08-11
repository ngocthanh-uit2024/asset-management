import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';

const tabs = [
  ['companies', 'Công ty'],
  ['locations', 'Địa điểm'],
  ['departments', 'Phòng ban'],
  ['categories', 'Loại thiết bị'],
  ['users', 'Nhân viên']
];

const emptyData = {
  companies: [],
  locations: [],
  departments: [],
  categories: [],
  users: []
};

export default function MasterData() {
  const [active, setActive] = useState('companies');
  const [data, setData] = useState(emptyData);
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const responses = await Promise.all(
        tabs.map(([key]) => api.get(`/master/${key}`))
      );
      const next = {};
      tabs.forEach(([key], index) => {
        next[key] = responses[index].data;
      });
      setData(next);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể tải dữ liệu danh mục');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    resetForm();
  }, [active]);

  const fields = useMemo(() => ({
    companies: [
      ['companyCode', 'Mã công ty'],
      ['companyName', 'Tên công ty'],
      ['shortName', 'Tên ngắn'],
      ['taxCode', 'Mã số thuế'],
      ['address', 'Địa chỉ']
    ],
    locations: [
      ['locationCode', 'Mã địa điểm'],
      ['locationName', 'Tên địa điểm'],
      ['company', 'Công ty', 'select', 'companies'],
      ['locationType', 'Loại địa điểm', 'selectStatic', ['office', 'warehouse', 'branch', 'store', 'data_center', 'other']],
      ['address', 'Địa chỉ']
    ],
    departments: [
      ['departmentCode', 'Mã phòng ban'],
      ['departmentName', 'Tên phòng ban'],
      ['company', 'Công ty', 'select', 'companies'],
      ['location', 'Địa điểm', 'select', 'locations']
    ],
    categories: [
      ['categoryCode', 'Mã loại'],
      ['categoryName', 'Tên loại thiết bị'],
      ['parent', 'Nhóm cha', 'select', 'categories']
    ],
    users: [
      ['employeeCode', 'Mã nhân viên'],
      ['fullName', 'Họ tên'],
      ['email', 'Email'],
      ['phone', 'Điện thoại'],
      ['company', 'Công ty', 'select', 'companies'],
      ['department', 'Phòng ban', 'select', 'departments'],
      ['location', 'Địa điểm', 'select', 'locations'],
      ['position', 'Chức danh'],
      ['role', 'Vai trò', 'selectStatic', ['admin', 'asset_manager', 'manager', 'employee', 'viewer']],
      ['canLogin', 'Cho phép đăng nhập', 'checkbox'],
      ['password', editingId ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu']
    ]
  })[active], [active, editingId]);

  const activeOptions = useMemo(() => {
    const result = {};
    Object.keys(data).forEach((key) => {
      result[key] = data[key].filter((item) => item.status !== 'inactive');
    });
    return result;
  }, [data]);

  function resetForm() {
    setForm({});
    setEditingId(null);
    setMessage('');
  }

  function labelFor(type, item) {
    if (type === 'companies') return `${item.companyCode} - ${item.companyName}`;
    if (type === 'locations') return `${item.locationCode} - ${item.locationName}`;
    if (type === 'departments') return `${item.departmentCode} - ${item.departmentName}`;
    if (type === 'categories') return `${item.categoryCode} - ${item.categoryName}`;
    return `${item.employeeCode} - ${item.fullName}`;
  }

  function getReferenceId(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value._id || '';
  }

  function beginEdit(item) {
    const nextForm = {};
    fields.forEach(([name, , type]) => {
      if (type === 'select') {
        nextForm[name] = getReferenceId(item[name]);
      } else if (type === 'checkbox') {
        nextForm[name] = Boolean(item[name]);
      } else if (name === 'password') {
        nextForm[name] = '';
      } else {
        nextForm[name] = item[name] ?? '';
      }
    });

    setForm(nextForm);
    setEditingId(item._id);
    setMessage('Đang chỉnh sửa dữ liệu.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit(event) {
    event.preventDefault();
    setMessage('');

    try {
      setLoading(true);

      const payload = { ...form };

      if (active === 'categories' && !payload.parent) {
        payload.parent = null;
      }

      if (editingId) {
        await api.put(`/master/${active}/${editingId}`, payload);
        setMessage('Đã cập nhật dữ liệu');
      } else {
        await api.post(`/master/${active}`, payload);
        setMessage('Đã lưu dữ liệu');
      }

      setForm({});
      setEditingId(null);
      await load();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        'Không thể lưu dữ liệu'
      );
    } finally {
      setLoading(false);
    }
  }

  async function disable(id) {
    if (!window.confirm('Vô hiệu hóa dữ liệu này?')) return;

    try {
      setLoading(true);
      await api.delete(`/master/${active}/${id}`);
      if (editingId === id) resetForm();
      setMessage('Đã vô hiệu hóa dữ liệu');
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể vô hiệu hóa dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Danh mục hệ thống</h1>
          <p>Quản lý dữ liệu nền cho toàn bộ hệ thống</p>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(([key, label]) => (
          <button
            className={active === key ? 'active' : ''}
            key={key}
            onClick={() => setActive(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="panel">
        <h3>
          {editingId ? 'Cập nhật' : 'Thêm'}{' '}
          {tabs.find((item) => item[0] === active)?.[1]}
        </h3>

        {message && <div className="notice">{message}</div>}

        <form className="grid-form" onSubmit={submit}>
          {fields.map(([name, label, type, source]) => {
            if (type === 'select') {
              return (
                <select
                  key={name}
                  value={form[name] || ''}
                  onChange={(event) => setForm({ ...form, [name]: event.target.value })}
                  required={name === 'company'}
                >
                  <option value="">
                    {active === 'categories' && name === 'parent'
                      ? 'Không có nhóm cha'
                      : label}
                  </option>

                  {activeOptions[source]
                    .filter((item) => item._id !== editingId)
                    .map((item) => (
                      <option key={item._id} value={item._id}>
                        {labelFor(source, item)}
                      </option>
                    ))}
                </select>
              );
            }

            if (type === 'selectStatic') {
              return (
                <select
                  key={name}
                  value={form[name] || source[0]}
                  onChange={(event) => setForm({ ...form, [name]: event.target.value })}
                >
                  {source.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              );
            }

            if (type === 'checkbox') {
              return (
                <label className="check" key={name}>
                  <input
                    type="checkbox"
                    checked={Boolean(form[name])}
                    onChange={(event) => setForm({ ...form, [name]: event.target.checked })}
                  />
                  {label}
                </label>
              );
            }

            return (
              <input
                key={name}
                type={name === 'password' ? 'password' : 'text'}
                placeholder={label}
                value={form[name] || ''}
                onChange={(event) => setForm({ ...form, [name]: event.target.value })}
                required={[
                  'companyCode', 'companyName',
                  'locationCode', 'locationName',
                  'departmentCode', 'departmentName',
                  'categoryCode', 'categoryName',
                  'employeeCode', 'fullName'
                ].includes(name)}
              />
            );
          })}

          <button disabled={loading}>
            {editingId ? 'Cập nhật' : 'Lưu'}
          </button>

          {editingId && (
            <button type="button" className="secondary" onClick={resetForm}>
              Hủy sửa
            </button>
          )}
        </form>
      </div>

      <div className="panel">
        <h3>Danh sách</h3>
        {loading && <p>Đang xử lý...</p>}
        <div className="simple-list">
          {data[active].map((item) => (
            <div className="list-row" key={item._id}>
              <div>
                <strong>{labelFor(active, item)}</strong>

                {active === 'categories' && item.parent && (
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#666',
                      marginTop: '4px'
                    }}
                  >
                    Nhóm: {item.parent.categoryCode} - {item.parent.categoryName}
                  </div>
                )}

                <small>{item.status || 'active'}</small>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => beginEdit(item)}>
                  Sửa
                </button>
                {item.status !== 'inactive' && (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => disable(item._id)}
                  >
                    Vô hiệu hóa
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
