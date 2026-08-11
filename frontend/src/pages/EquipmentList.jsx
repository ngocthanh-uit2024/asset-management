import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';

const emptyForm = {
  assetName: '',
  company: '',
  location: '',
  department: '',
  category: '',

  manufacturer: '',
  brand: '',
  model: '',
  serialNumber: '',
  computerName: '',
  cpu: '',
  ram: '',
  storage: '',
  operatingSystem: '',
  macAddress: '',
  ipAddress: '',

  supplier: '',
  purchaseDate: '',
  receivedDate: '',
  purchasePrice: 0,
  currency: 'VND',
  invoiceNumber: '',
  poNumber: '',

  warrantyStartDate: '',
  warrantyEndDate: '',
  usefulLifeYears: 0,
  depreciationYears: 0,
  depreciationCost: 0,

  legacyAssetCode: '',
  accountingAssetCode: '',
  note1: '',
  note2: '',

  condition: 'good',
  status: 'available',
  remark: ''
};

function getReferenceId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id || '';
}

function formatDateForInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

const sectionHeadingStyle = {
  gridColumn: '1 / -1',
  margin: '8px 0 0',
  paddingBottom: '8px',
  borderBottom: '1px solid #d9e1ec'
};

export default function EquipmentList() {
  const currentUser = getCurrentUser();
  const canManage = ['admin', 'asset_manager'].includes(currentUser.role);

  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    companyId: '',
    locationId: '',
    categoryId: '',
    status: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);

      const [
        equipmentResponse,
        companyResponse,
        locationResponse,
        departmentResponse,
        categoryResponse
      ] = await Promise.all([
        api.get('/equipments', { params: filters }),
        api.get('/master/companies'),
        api.get('/master/locations'),
        api.get('/master/departments'),
        api.get('/master/categories')
      ]);

      setItems(equipmentResponse.data);
      setCompanies(companyResponse.data);
      setLocations(locationResponse.data);
      setDepartments(departmentResponse.data);
      setCategories(categoryResponse.data);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể tải dữ liệu thiết bị');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const activeCompanies = useMemo(
    () => companies.filter((item) => item.status !== 'inactive'),
    [companies]
  );

  const formLocations = useMemo(
    () =>
      locations.filter(
        (item) =>
          item.status !== 'inactive' &&
          (!form.company || getReferenceId(item.company) === form.company)
      ),
    [locations, form.company]
  );

  const formDepartments = useMemo(
    () =>
      departments.filter(
        (item) =>
          item.status !== 'inactive' &&
          (!form.company || getReferenceId(item.company) === form.company) &&
          (!form.location ||
            !item.location ||
            getReferenceId(item.location) === form.location)
      ),
    [departments, form.company, form.location]
  );

  const equipmentCategories = useMemo(
    () =>
      categories.filter(
        (item) => item.status !== 'inactive' && item.parent
      ),
    [categories]
  );

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage('');
  }

  function beginEdit(item) {
    setForm({
      assetName: item.assetName || '',
      company: getReferenceId(item.company),
      location: getReferenceId(item.location),
      department: getReferenceId(item.department),
      category: getReferenceId(item.category),

      manufacturer: item.manufacturer || '',
      brand: item.brand || '',
      model: item.model || '',
      serialNumber: item.serialNumber || '',
      computerName: item.computerName || '',
      cpu: item.cpu || '',
      ram: item.ram || '',
      storage: item.storage || '',
      operatingSystem: item.operatingSystem || '',
      macAddress: item.macAddress || '',
      ipAddress: item.ipAddress || '',

      supplier: item.supplier || '',
      purchaseDate: formatDateForInput(item.purchaseDate),
      receivedDate: formatDateForInput(item.receivedDate),
      purchasePrice: item.purchasePrice || 0,
      currency: item.currency || 'VND',
      invoiceNumber: item.invoiceNumber || '',
      poNumber: item.poNumber || '',

      warrantyStartDate: formatDateForInput(item.warrantyStartDate),
      warrantyEndDate: formatDateForInput(item.warrantyEndDate),
      usefulLifeYears: item.usefulLifeYears || 0,
      depreciationYears: item.depreciationYears || 0,
      depreciationCost: item.depreciationCost || 0,

      legacyAssetCode: item.legacyAssetCode || '',
      accountingAssetCode: item.accountingAssetCode || '',
      note1: item.note1 || '',
      note2: item.note2 || '',

      condition: item.condition || 'good',
      status: item.status || 'available',
      remark: item.remark || ''
    });

    setEditingId(item._id);
    setMessage(`Đang chỉnh sửa thiết bị ${item.assetCode}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit(event) {
    event.preventDefault();
    setMessage('');

    try {
      setLoading(true);

      const payload = {
        ...form,
        department: form.department || null
      };

      if (editingId) {
        const { data } = await api.put(`/equipments/${editingId}`, payload);
        setMessage(`Đã cập nhật thiết bị ${data.assetCode}`);
      } else {
        const { data } = await api.post('/equipments', payload);
        setMessage(`Đã tạo thiết bị ${data.assetCode}`);
      }

      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể lưu thiết bị');
    } finally {
      setLoading(false);
    }
  }

  async function dispose(id) {
    if (!window.confirm('Chuyển thiết bị sang trạng thái thanh lý?')) return;

    try {
      setLoading(true);
      await api.delete(`/equipments/${id}`);
      if (editingId === id) resetForm();
      setMessage('Thiết bị đã chuyển sang trạng thái thanh lý');
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể thanh lý thiết bị');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Quản lý thiết bị</h1>
          <p>Mã thiết bị được tự sinh theo Công ty - Loại - Số thứ tự</p>
        </div>
      </div>

      {canManage && (
        <div className="panel">
          <h3>{editingId ? 'Cập nhật thiết bị' : 'Thêm thiết bị mới'}</h3>

        {message && <div className="notice">{message}</div>}

        <form className="grid-form" onSubmit={submit}>
          <h4 style={sectionHeadingStyle}>1. Thông tin tài sản</h4>

          <input
            placeholder="Tên thiết bị"
            value={form.assetName}
            onChange={(event) => setForm({ ...form, assetName: event.target.value })}
            required
          />

          <select
            value={form.company}
            onChange={(event) =>
              setForm({
                ...form,
                company: event.target.value,
                location: '',
                department: ''
              })
            }
            required
          >
            <option value="">Chọn công ty</option>
            {activeCompanies.map((item) => (
              <option key={item._id} value={item._id}>
                {item.companyCode} - {item.companyName}
              </option>
            ))}
          </select>

          <select
            value={form.location}
            onChange={(event) =>
              setForm({
                ...form,
                location: event.target.value,
                department: ''
              })
            }
            required
          >
            <option value="">Chọn địa điểm</option>
            {formLocations.map((item) => (
              <option key={item._id} value={item._id}>
                {item.locationCode} - {item.locationName}
              </option>
            ))}
          </select>

          <select
            value={form.department}
            onChange={(event) => setForm({ ...form, department: event.target.value })}
          >
            <option value="">Không chọn phòng ban</option>
            {formDepartments.map((item) => (
              <option key={item._id} value={item._id}>
                {item.departmentCode} - {item.departmentName}
              </option>
            ))}
          </select>

          <select
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
            required
          >
            <option value="">Chọn loại thiết bị</option>
            {equipmentCategories.map((item) => (
              <option key={item._id} value={item._id}>
                {item.categoryCode} - {item.categoryName}
              </option>
            ))}
          </select>

          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="available">Sẵn sàng</option>
            <option value="assigned">Đã cấp phát</option>
            <option value="maintenance">Đang bảo trì</option>
            <option value="broken">Hư hỏng</option>
            <option value="lost">Mất</option>
            <option value="disposed">Thanh lý</option>
          </select>

          <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
            <option value="new">Mới</option>
            <option value="good">Tốt</option>
            <option value="fair">Đã qua sử dụng</option>
            <option value="damaged">Hư hỏng</option>
            <option value="broken">Không hoạt động</option>
          </select>

          <h4 style={sectionHeadingStyle}>2. Thông số kỹ thuật</h4>

          <input placeholder="Hãng sản xuất" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
          <input placeholder="Thương hiệu" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          <input placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          <input placeholder="Serial Number" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
          <input placeholder="Tên máy tính" value={form.computerName} onChange={(e) => setForm({ ...form, computerName: e.target.value })} />
          <input placeholder="CPU" value={form.cpu} onChange={(e) => setForm({ ...form, cpu: e.target.value })} />
          <input placeholder="RAM" value={form.ram} onChange={(e) => setForm({ ...form, ram: e.target.value })} />
          <input placeholder="Ổ cứng / Storage" value={form.storage} onChange={(e) => setForm({ ...form, storage: e.target.value })} />
          <input placeholder="Hệ điều hành" value={form.operatingSystem} onChange={(e) => setForm({ ...form, operatingSystem: e.target.value })} />
          <input placeholder="MAC Address" value={form.macAddress} onChange={(e) => setForm({ ...form, macAddress: e.target.value })} />
          <input placeholder="IP Address" value={form.ipAddress} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} />

          <h4 style={sectionHeadingStyle}>3. Thông tin mua sắm</h4>

          <input placeholder="Nhà cung cấp" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />

          <label>Ngày mua<input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} /></label>
          <label>Ngày nhập<input type="date" value={form.receivedDate} onChange={(e) => setForm({ ...form, receivedDate: e.target.value })} /></label>

          <input type="number" min="0" placeholder="Giá mua" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })} />

          <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
            <option value="VND">VND</option>
            <option value="USD">USD</option>
            <option value="JPY">JPY</option>
          </select>

          <input placeholder="Số hóa đơn" value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} />
          <input placeholder="Số PO" value={form.poNumber} onChange={(e) => setForm({ ...form, poNumber: e.target.value })} />

          <h4 style={sectionHeadingStyle}>4. Bảo hành và khấu hao</h4>

          <label>Bắt đầu bảo hành<input type="date" value={form.warrantyStartDate} onChange={(e) => setForm({ ...form, warrantyStartDate: e.target.value })} /></label>
          <label>Hết bảo hành<input type="date" value={form.warrantyEndDate} onChange={(e) => setForm({ ...form, warrantyEndDate: e.target.value })} /></label>

          <label>Thời gian sử dụng hữu ích (năm)<input type="number" min="0" value={form.usefulLifeYears}onChange={e =>setForm({...form,usefulLifeYears: Number(e.target.value)})}/></label>
          <label>Số năm khấu hao<input type="number"min="0" value={form.depreciationYears}onChange={e =>setForm({...form,depreciationYears: Number(e.target.value)})}/></label>
          <label>Chi phí khấu hao<input type="number"min="0" value={form.depreciationCost}onChange={e =>setForm({...form,depreciationCost: Number(e.target.value)})}/></label>
          <h4 style={sectionHeadingStyle}>5. Thông tin tham chiếu / Ghi chú</h4>

          <label>Mã thiết bị cũ
            <input type="text" placeholder="Mã quản lý cũ trên Excel"
              value={form.legacyAssetCode}
              onChange={(e) => setForm({ ...form, legacyAssetCode: e.target.value })} />
          </label>

          <label>Mã tài sản kế toán
            <input type="text" placeholder="Code quản lý của Kế toán"
              value={form.accountingAssetCode}
              onChange={(e) => setForm({ ...form, accountingAssetCode: e.target.value })} />
          </label>

          <label>Ghi chú 1
            <input type="text" placeholder="Thông tin tham chiếu khác"
              value={form.note1}
              onChange={(e) => setForm({ ...form, note1: e.target.value })} />
          </label>

          <label>Ghi chú 2
            <input type="text" placeholder="Thông tin tham chiếu khác"
              value={form.note2}
              onChange={(e) => setForm({ ...form, note2: e.target.value })} />
          </label>

          <textarea
            placeholder="Ghi chú chung"
            value={form.remark}
            onChange={(event) => setForm({ ...form, remark: event.target.value })}
            style={{ gridColumn: '1 / -1' }}
          />

          <button disabled={loading}>
            {editingId ? 'Cập nhật thiết bị' : 'Thêm thiết bị'}
          </button>

          {editingId && (
            <button type="button" className="secondary" onClick={resetForm}>
              Hủy sửa
            </button>
          )}
        </form>
        </div>
      )}

      {!canManage && (
        <div className="notice">
          Chế độ chỉ xem: bạn có thể xem, tìm kiếm và lọc thiết bị nhưng không được thêm, sửa hoặc thanh lý.
        </div>
      )}

      <div className="toolbar">
        <input
          placeholder="Tìm mã AssetPro, mã cũ, mã kế toán, tên, serial, hãng, MAC, IP..."
          value={filters.search}
          onChange={(event) => setFilters({ ...filters, search: event.target.value })}
        />

        <select
          value={filters.companyId}
          onChange={(event) =>
            setFilters({
              ...filters,
              companyId: event.target.value,
              locationId: ''
            })
          }
        >
          <option value="">Tất cả công ty</option>
          {activeCompanies.map((item) => (
            <option key={item._id} value={item._id}>{item.companyCode}</option>
          ))}
        </select>

        <select
          value={filters.locationId}
          onChange={(event) => setFilters({ ...filters, locationId: event.target.value })}
        >
          <option value="">Tất cả địa điểm</option>
          {locations
            .filter(
              (item) =>
                item.status !== 'inactive' &&
                (!filters.companyId || getReferenceId(item.company) === filters.companyId)
            )
            .map((item) => (
              <option key={item._id} value={item._id}>{item.locationCode}</option>
            ))}
        </select>

        <select
          value={filters.categoryId}
          onChange={(event) => setFilters({ ...filters, categoryId: event.target.value })}
        >
          <option value="">Tất cả loại thiết bị</option>
          {equipmentCategories.map((item) => (
            <option key={item._id} value={item._id}>{item.categoryCode}</option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(event) => setFilters({ ...filters, status: event.target.value })}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="available">Sẵn sàng</option>
          <option value="assigned">Đã cấp phát</option>
          <option value="maintenance">Bảo trì</option>
          <option value="broken">Hư hỏng</option>
          <option value="lost">Mất</option>
          <option value="disposed">Thanh lý</option>
        </select>

        <button type="button" onClick={load} disabled={loading}>Lọc</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên thiết bị</th>
              <th>Công ty</th>
              <th>Địa điểm</th>
              <th>Phòng ban</th>
              <th>Loại</th>
              <th>Serial</th>
              <th>Giá trị</th>
              <th>Trạng thái</th>
              {canManage && <th>Thao tác</th>}
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>{item.assetCode}</td>
                <td>
                  {item.assetName}
                  <small>
                    {[item.manufacturer, item.brand, item.model].filter(Boolean).join(' ')}
                  </small>
                </td>
                <td>{item.company?.companyCode || '-'}</td>
                <td>{item.location?.locationCode || '-'}</td>
                <td>{item.department?.departmentCode || '-'}</td>
                <td>{item.category?.categoryCode || '-'}</td>
                <td>{item.serialNumber || '-'}</td>
                <td>{Number(item.purchasePrice || 0).toLocaleString()} {item.currency}</td>
                <td><span className="status">{item.status}</span></td>
                {canManage && (
                  <td>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => beginEdit(item)}>Sửa</button>
                      {item.status !== 'disposed' && (
                        <button
                          type="button"
                          className="danger"
                          onClick={() => dispose(item._id)}
                        >
                          Thanh lý
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={canManage ? 10 : 9}>Không có dữ liệu thiết bị.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
