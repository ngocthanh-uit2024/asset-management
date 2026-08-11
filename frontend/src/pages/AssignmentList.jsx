import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';

const emptyIssue = {
  equipment: '',
  user: '',
  issuedFromLocation: '',
  assignedLocation: '',
  performedBy: '',
  assignDate: '',
  expectedReturnDate: '',
  assignReason: '',
  equipmentConditionOut: 'good',
  accessories: '',
  note: ''
};

const emptyReturn = {
  assignmentId: '',
  equipmentId: '',
  equipmentLabel: '',
  fromUserLabel: '',
  performedBy: '',
  returnedToLocation: '',
  actualReturnDate: '',
  equipmentConditionIn: 'good',
  returnReason: '',
  note: ''
};

const emptyTransfer = {
  assignmentId: '',
  equipmentId: '',
  equipmentLabel: '',
  fromUserLabel: '',
  toUser: '',
  performedBy: '',
  toLocation: '',
  transactionDate: '',
  transferReason: '',
  conditionAfter: 'good',
  note: ''
};

const emptyCancel = {
  assignmentId: '',
  equipmentId: '',
  assignmentCode: '',
  performedBy: '',
  note: ''
};

const emptyDispose = {
  equipmentId: '',
  equipmentLabel: '',
  performedBy: '',
  transactionDate: '',
  note: ''
};

function currentUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

function refId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id || '';
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function typeLabel(type) {
  return {
    ISSUE: 'Cấp phát',
    RETURN: 'Thu hồi',
    TRANSFER: 'Điều chuyển',
    CANCEL: 'Hủy',
    DISPOSE: 'Thanh lý'
  }[type] || type;
}

function conditionLabel(value) {
  return {
    new: 'Mới',
    good: 'Tốt',
    fair: 'Đã qua sử dụng',
    damaged: 'Hư hỏng',
    broken: 'Không hoạt động'
  }[value] || value || '-';
}

function statusLabel(value) {
  return {
    active: 'Đang hiệu lực',
    completed: 'Hoàn tất',
    cancelled: 'Đã hủy'
  }[value] || value;
}

const formSectionStyle = {
  marginTop: '18px',
  paddingTop: '14px',
  borderTop: '1px solid #e3e8ef'
};

export default function AssignmentList() {
  const me = currentUser();
  const canManage = ['admin', 'asset_manager'].includes(me.role);

  const [items, setItems] = useState([]);
  const [availableEquipments, setAvailableEquipments] = useState([]);
  const [allEquipments, setAllEquipments] = useState([]);
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);

  const [form, setForm] = useState(emptyIssue);
  const [returnForm, setReturnForm] = useState(emptyReturn);
  const [transferForm, setTransferForm] = useState(emptyTransfer);
  const [cancelForm, setCancelForm] = useState(emptyCancel);
  const [disposeForm, setDisposeForm] = useState(emptyDispose);

  const [mode, setMode] = useState('');
  const [historyEquipmentId, setHistoryEquipmentId] = useState('');
  const [history, setHistory] = useState([]);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);

      const [a, e, all, u, l] = await Promise.all([
        api.get('/assignments'),
        api.get('/equipments', { params: { status: 'available' } }),
        api.get('/equipments'),
        api.get('/master/users', { params: { status: 'active' } }),
        api.get('/master/locations', { params: { status: 'active' } })
      ]);

      setItems(a.data);
      setAvailableEquipments(e.data);
      setAllEquipments(all.data);
      setUsers(u.data);
      setLocations(l.data);

      if (!form.performedBy && me._id) {
        setForm(prev => ({ ...prev, performedBy: me._id }));
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể tải dữ liệu Assignment');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const activeTransactions = useMemo(
    () =>
      items.filter(
        item =>
          item.status === 'active' &&
          ['ISSUE', 'TRANSFER'].includes(item.transactionType)
      ),
    [items]
  );

  function selectEquipment(id) {
    const eq = availableEquipments.find(x => x._id === id);

    setForm({
      ...form,
      equipment: id,
      issuedFromLocation: refId(eq?.location)
    });
  }

  function selectUser(id) {
    const user = users.find(x => x._id === id);

    setForm({
      ...form,
      user: id,
      assignedLocation: refId(user?.location)
    });
  }

  function closeActionForm() {
    setMode('');
    setReturnForm(emptyReturn);
    setTransferForm(emptyTransfer);
    setCancelForm(emptyCancel);
    setDisposeForm(emptyDispose);
  }

  function openReturn(item) {
    setMode('return');

    setReturnForm({
      assignmentId: item._id,
      equipmentId: item.equipment?._id || '',
      equipmentLabel: `${item.equipment?.assetCode || ''} - ${item.equipment?.assetName || ''}`,
      fromUserLabel: item.toUser?.fullName || item.user?.fullName || '-',
      performedBy: me._id || '',
      returnedToLocation:
        refId(item.fromLocation) ||
        refId(item.issuedFromLocation) ||
        '',
      actualReturnDate: today(),
      equipmentConditionIn: 'good',
      returnReason: '',
      note: ''
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openTransfer(item) {
    setMode('transfer');

    setTransferForm({
      assignmentId: item._id,
      equipmentId: item.equipment?._id || '',
      equipmentLabel: `${item.equipment?.assetCode || ''} - ${item.equipment?.assetName || ''}`,
      fromUserLabel: item.toUser?.fullName || item.user?.fullName || '-',
      toUser: '',
      performedBy: me._id || '',
      toLocation: '',
      transactionDate: today(),
      transferReason: '',
      conditionAfter: item.equipment?.condition || 'good',
      note: ''
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openCancel(item) {
    setMode('cancel');

    setCancelForm({
      assignmentId: item._id,
      equipmentId: item.equipment?._id || '',
      assignmentCode: item.assignmentCode,
      performedBy: me._id || '',
      note: ''
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openDispose(equipmentId) {
    const eq = allEquipments.find(x => x._id === equipmentId);

    setMode('dispose');

    setDisposeForm({
      equipmentId,
      equipmentLabel: `${eq?.assetCode || ''} - ${eq?.assetName || ''}`,
      performedBy: me._id || '',
      transactionDate: today(),
      note: ''
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submitIssue(event) {
    event.preventDefault();

    try {
      setLoading(true);

      const { data } = await api.post('/assignments', form);

      setMessage(`Đã cấp phát theo phiếu ${data.assignmentCode}`);
      setForm({
        ...emptyIssue,
        performedBy: me._id || ''
      });

      await load();

      if (data.equipment?._id) {
        setHistoryEquipmentId(data.equipment._id);
        await loadHistory(data.equipment._id);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể cấp phát');
    } finally {
      setLoading(false);
    }
  }

  async function submitReturn(event) {
    event.preventDefault();

    try {
      setLoading(true);

      await api.put(`/assignments/${returnForm.assignmentId}/return`, {
        performedBy: returnForm.performedBy || undefined,
        returnedToLocation: returnForm.returnedToLocation || undefined,
        actualReturnDate: returnForm.actualReturnDate || undefined,
        equipmentConditionIn: returnForm.equipmentConditionIn,
        returnReason: returnForm.returnReason,
        note: returnForm.note
      });

      setMessage(`Đã thu hồi ${returnForm.equipmentLabel}`);

      const equipmentId = returnForm.equipmentId;
      closeActionForm();
      await load();

      setHistoryEquipmentId(equipmentId);
      await loadHistory(equipmentId);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể thu hồi thiết bị');
    } finally {
      setLoading(false);
    }
  }

  async function submitTransfer(event) {
    event.preventDefault();

    try {
      setLoading(true);

      await api.put(`/assignments/${transferForm.assignmentId}/transfer`, {
        toUser: transferForm.toUser,
        performedBy: transferForm.performedBy || undefined,
        toLocation: transferForm.toLocation || undefined,
        transactionDate: transferForm.transactionDate || undefined,
        transferReason: transferForm.transferReason,
        conditionAfter: transferForm.conditionAfter,
        note: transferForm.note
      });

      setMessage(`Đã điều chuyển ${transferForm.equipmentLabel}`);

      const equipmentId = transferForm.equipmentId;
      closeActionForm();
      await load();

      setHistoryEquipmentId(equipmentId);
      await loadHistory(equipmentId);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể điều chuyển thiết bị');
    } finally {
      setLoading(false);
    }
  }

  async function submitCancel(event) {
    event.preventDefault();

    if (!window.confirm(`Xác nhận hủy giao dịch ${cancelForm.assignmentCode}?`)) {
      return;
    }

    try {
      setLoading(true);

      await api.put(`/assignments/${cancelForm.assignmentId}/cancel`, {
        performedBy: cancelForm.performedBy || undefined,
        note: cancelForm.note || 'Hủy giao dịch'
      });

      setMessage(`Đã hủy giao dịch ${cancelForm.assignmentCode}`);

      const equipmentId = cancelForm.equipmentId;
      closeActionForm();
      await load();

      setHistoryEquipmentId(equipmentId);
      await loadHistory(equipmentId);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể hủy giao dịch');
    } finally {
      setLoading(false);
    }
  }

  async function submitDispose(event) {
    event.preventDefault();

    if (!window.confirm(`Xác nhận thanh lý ${disposeForm.equipmentLabel}?`)) {
      return;
    }

    try {
      setLoading(true);

      await api.post(
        `/assignments/equipment/${disposeForm.equipmentId}/dispose`,
        {
          performedBy: disposeForm.performedBy || undefined,
          transactionDate: disposeForm.transactionDate || undefined,
          note: disposeForm.note
        }
      );

      setMessage(`Đã thanh lý ${disposeForm.equipmentLabel}`);

      const equipmentId = disposeForm.equipmentId;
      closeActionForm();
      await load();

      setHistoryEquipmentId(equipmentId);
      await loadHistory(equipmentId);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể thanh lý thiết bị');
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory(id) {
    if (!id) {
      setHistory([]);
      return;
    }

    try {
      const { data } = await api.get(`/assignments/equipment/${id}/history`);
      setHistory(data);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể tải lịch sử thiết bị');
    }
  }

  function setTransferUser(id) {
    const user = users.find(x => x._id === id);

    setTransferForm({
      ...transferForm,
      toUser: id,
      toLocation: refId(user?.location)
    });
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Cấp phát / Thu hồi / Điều chuyển</h1>
          <p>
            Quản lý toàn bộ vòng đời thiết bị, người thực hiện và người nhập giao dịch
          </p>
        </div>
      </div>

      {message && <div className="notice">{message}</div>}

      {canManage && (
        <div className="panel">
          <h3>Tạo phiếu cấp phát</h3>

          <form className="grid-form" onSubmit={submitIssue}>
            <select
              value={form.equipment}
              onChange={e => selectEquipment(e.target.value)}
              required
            >
              <option value="">Chọn thiết bị sẵn sàng</option>
              {availableEquipments.map(x => (
                <option key={x._id} value={x._id}>
                  {x.assetCode} - {x.assetName}
                </option>
              ))}
            </select>

            <select
              value={form.user}
              onChange={e => selectUser(e.target.value)}
              required
            >
              <option value="">Chọn nhân viên nhận</option>
              {users.map(x => (
                <option key={x._id} value={x._id}>
                  {x.employeeCode} - {x.fullName}
                </option>
              ))}
            </select>

            <select
              value={form.performedBy}
              onChange={e => setForm({ ...form, performedBy: e.target.value })}
            >
              <option value="">Người thực hiện cấp phát</option>
              {users.map(x => (
                <option key={x._id} value={x._id}>
                  {x.employeeCode} - {x.fullName}
                </option>
              ))}
            </select>

            <select
              value={form.issuedFromLocation}
              onChange={e =>
                setForm({ ...form, issuedFromLocation: e.target.value })
              }
              required
            >
              <option value="">Nơi xuất</option>
              {locations.map(x => (
                <option key={x._id} value={x._id}>
                  {x.locationCode} - {x.locationName}
                </option>
              ))}
            </select>

            <select
              value={form.assignedLocation}
              onChange={e =>
                setForm({ ...form, assignedLocation: e.target.value })
              }
              required
            >
              <option value="">Nơi sử dụng</option>
              {locations.map(x => (
                <option key={x._id} value={x._id}>
                  {x.locationCode} - {x.locationName}
                </option>
              ))}
            </select>

            <label>
              Ngày cấp
              <input
                type="date"
                value={form.assignDate}
                onChange={e => setForm({ ...form, assignDate: e.target.value })}
              />
            </label>

            <label>
              Dự kiến thu hồi
              <input
                type="date"
                value={form.expectedReturnDate}
                onChange={e =>
                  setForm({ ...form, expectedReturnDate: e.target.value })
                }
              />
            </label>

            <input
              placeholder="Mục đích cấp phát"
              value={form.assignReason}
              onChange={e =>
                setForm({ ...form, assignReason: e.target.value })
              }
            />

            <input
              placeholder="Phụ kiện đi kèm"
              value={form.accessories}
              onChange={e =>
                setForm({ ...form, accessories: e.target.value })
              }
            />

            <textarea
              placeholder="Ghi chú"
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
            />

            <button disabled={loading}>Cấp phát</button>
          </form>

          {mode === 'return' && (
            <form
              className="grid-form"
              onSubmit={submitReturn}
              style={formSectionStyle}
            >
              <h3 style={{ gridColumn: '1 / -1' }}>Thu hồi thiết bị</h3>

              <input value={returnForm.equipmentLabel} readOnly />
              <input value={`Thu hồi từ: ${returnForm.fromUserLabel}`} readOnly />

              <select
                value={returnForm.performedBy}
                onChange={e =>
                  setReturnForm({ ...returnForm, performedBy: e.target.value })
                }
                required
              >
                <option value="">Nhân viên thực hiện thu hồi</option>
                {users.map(x => (
                  <option key={x._id} value={x._id}>
                    {x.employeeCode} - {x.fullName}
                  </option>
                ))}
              </select>

              <select
                value={returnForm.returnedToLocation}
                onChange={e =>
                  setReturnForm({
                    ...returnForm,
                    returnedToLocation: e.target.value
                  })
                }
                required
              >
                <option value="">Nơi thu hồi về</option>
                {locations.map(x => (
                  <option key={x._id} value={x._id}>
                    {x.locationCode} - {x.locationName}
                  </option>
                ))}
              </select>

              <label>
                Ngày thu hồi
                <input
                  type="date"
                  value={returnForm.actualReturnDate}
                  onChange={e =>
                    setReturnForm({
                      ...returnForm,
                      actualReturnDate: e.target.value
                    })
                  }
                  required
                />
              </label>

              <select
                value={returnForm.equipmentConditionIn}
                onChange={e =>
                  setReturnForm({
                    ...returnForm,
                    equipmentConditionIn: e.target.value
                  })
                }
              >
                <option value="new">Mới</option>
                <option value="good">Tốt</option>
                <option value="fair">Đã qua sử dụng</option>
                <option value="damaged">Hư hỏng</option>
                <option value="broken">Không hoạt động</option>
              </select>

              <input
                placeholder="Lý do thu hồi"
                value={returnForm.returnReason}
                onChange={e =>
                  setReturnForm({
                    ...returnForm,
                    returnReason: e.target.value
                  })
                }
              />

              <textarea
                placeholder="Ghi chú thu hồi"
                value={returnForm.note}
                onChange={e =>
                  setReturnForm({ ...returnForm, note: e.target.value })
                }
              />

              <button disabled={loading}>Xác nhận thu hồi</button>
              <button type="button" className="secondary" onClick={closeActionForm}>
                Hủy thao tác
              </button>
            </form>
          )}

          {mode === 'transfer' && (
            <form
              className="grid-form"
              onSubmit={submitTransfer}
              style={formSectionStyle}
            >
              <h3 style={{ gridColumn: '1 / -1' }}>Điều chuyển thiết bị</h3>

              <input value={transferForm.equipmentLabel} readOnly />
              <input value={`Từ người: ${transferForm.fromUserLabel}`} readOnly />

              <select
                value={transferForm.toUser}
                onChange={e => setTransferUser(e.target.value)}
                required
              >
                <option value="">Người nhận mới</option>
                {users.map(x => (
                  <option key={x._id} value={x._id}>
                    {x.employeeCode} - {x.fullName}
                  </option>
                ))}
              </select>

              <select
                value={transferForm.performedBy}
                onChange={e =>
                  setTransferForm({
                    ...transferForm,
                    performedBy: e.target.value
                  })
                }
                required
              >
                <option value="">Nhân viên thực hiện điều chuyển</option>
                {users.map(x => (
                  <option key={x._id} value={x._id}>
                    {x.employeeCode} - {x.fullName}
                  </option>
                ))}
              </select>

              <select
                value={transferForm.toLocation}
                onChange={e =>
                  setTransferForm({
                    ...transferForm,
                    toLocation: e.target.value
                  })
                }
                required
              >
                <option value="">Nơi sử dụng mới</option>
                {locations.map(x => (
                  <option key={x._id} value={x._id}>
                    {x.locationCode} - {x.locationName}
                  </option>
                ))}
              </select>

              <label>
                Ngày điều chuyển
                <input
                  type="date"
                  value={transferForm.transactionDate}
                  onChange={e =>
                    setTransferForm({
                      ...transferForm,
                      transactionDate: e.target.value
                    })
                  }
                  required
                />
              </label>

              <select
                value={transferForm.conditionAfter}
                onChange={e =>
                  setTransferForm({
                    ...transferForm,
                    conditionAfter: e.target.value
                  })
                }
              >
                <option value="new">Mới</option>
                <option value="good">Tốt</option>
                <option value="fair">Đã qua sử dụng</option>
                <option value="damaged">Hư hỏng</option>
                <option value="broken">Không hoạt động</option>
              </select>

              <input
                placeholder="Lý do điều chuyển"
                value={transferForm.transferReason}
                onChange={e =>
                  setTransferForm({
                    ...transferForm,
                    transferReason: e.target.value
                  })
                }
              />

              <textarea
                placeholder="Ghi chú điều chuyển"
                value={transferForm.note}
                onChange={e =>
                  setTransferForm({ ...transferForm, note: e.target.value })
                }
              />

              <button disabled={loading}>Xác nhận điều chuyển</button>
              <button type="button" className="secondary" onClick={closeActionForm}>
                Hủy thao tác
              </button>
            </form>
          )}

          {mode === 'cancel' && (
            <form
              className="grid-form"
              onSubmit={submitCancel}
              style={formSectionStyle}
            >
              <h3 style={{ gridColumn: '1 / -1' }}>Hủy giao dịch</h3>

              <input value={cancelForm.assignmentCode} readOnly />

              <select
                value={cancelForm.performedBy}
                onChange={e =>
                  setCancelForm({
                    ...cancelForm,
                    performedBy: e.target.value
                  })
                }
                required
              >
                <option value="">Người thực hiện hủy</option>
                {users.map(x => (
                  <option key={x._id} value={x._id}>
                    {x.employeeCode} - {x.fullName}
                  </option>
                ))}
              </select>

              <textarea
                placeholder="Lý do hủy giao dịch"
                value={cancelForm.note}
                onChange={e =>
                  setCancelForm({ ...cancelForm, note: e.target.value })
                }
                required
              />

              <button className="danger" disabled={loading}>
                Xác nhận hủy
              </button>
              <button type="button" className="secondary" onClick={closeActionForm}>
                Không hủy
              </button>
            </form>
          )}

          {mode === 'dispose' && (
            <form
              className="grid-form"
              onSubmit={submitDispose}
              style={formSectionStyle}
            >
              <h3 style={{ gridColumn: '1 / -1' }}>Thanh lý thiết bị</h3>

              <input value={disposeForm.equipmentLabel} readOnly />

              <select
                value={disposeForm.performedBy}
                onChange={e =>
                  setDisposeForm({
                    ...disposeForm,
                    performedBy: e.target.value
                  })
                }
                required
              >
                <option value="">Người thực hiện thanh lý</option>
                {users.map(x => (
                  <option key={x._id} value={x._id}>
                    {x.employeeCode} - {x.fullName}
                  </option>
                ))}
              </select>

              <label>
                Ngày thanh lý
                <input
                  type="date"
                  value={disposeForm.transactionDate}
                  onChange={e =>
                    setDisposeForm({
                      ...disposeForm,
                      transactionDate: e.target.value
                    })
                  }
                  required
                />
              </label>

              <textarea
                placeholder="Lý do / ghi chú thanh lý"
                value={disposeForm.note}
                onChange={e =>
                  setDisposeForm({ ...disposeForm, note: e.target.value })
                }
                required
              />

              <button className="danger" disabled={loading}>
                Xác nhận thanh lý
              </button>
              <button type="button" className="secondary" onClick={closeActionForm}>
                Hủy thao tác
              </button>
            </form>
          )}
        </div>
      )}

      {!canManage && (
        <div className="notice">
          Chế độ chỉ xem: chỉ Admin/Asset Manager được cấp phát, thu hồi,
          điều chuyển, hủy hoặc thanh lý.
        </div>
      )}

      <div className="panel">
        <h3>Thiết bị đang được cấp phát</h3>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Thiết bị</th>
                <th>Người sử dụng</th>
                <th>Nơi sử dụng</th>
                <th>Nghiệp vụ</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {activeTransactions.map(item => (
                <tr key={item._id}>
                  <td>{item.assignmentCode}</td>
                  <td>
                    {item.equipment?.assetCode} - {item.equipment?.assetName}
                  </td>
                  <td>{item.toUser?.fullName || item.user?.fullName || '-'}</td>
                  <td>
                    {item.toLocation?.locationName ||
                      item.assignedLocation?.locationName ||
                      '-'}
                  </td>
                  <td>{typeLabel(item.transactionType)}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => {
                        setHistoryEquipmentId(item.equipment?._id);
                        loadHistory(item.equipment?._id);
                      }}
                    >
                      Lịch sử
                    </button>

                    {canManage && (
                      <>
                        {' '}
                        <button type="button" onClick={() => openReturn(item)}>
                          Thu hồi
                        </button>
                        {' '}
                        <button type="button" onClick={() => openTransfer(item)}>
                          Điều chuyển
                        </button>
                        {' '}
                        <button
                          type="button"
                          className="danger"
                          onClick={() => openCancel(item)}
                        >
                          Hủy
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}

              {!loading && activeTransactions.length === 0 && (
                <tr>
                  <td colSpan="6">Không có thiết bị đang được cấp phát.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h3>Lịch sử thiết bị</h3>

        <div className="toolbar">
          <select
            value={historyEquipmentId}
            onChange={e => {
              setHistoryEquipmentId(e.target.value);
              loadHistory(e.target.value);
            }}
          >
            <option value="">Chọn thiết bị</option>
            {allEquipments.map(x => (
              <option key={x._id} value={x._id}>
                {x.assetCode} - {x.assetName}
              </option>
            ))}
          </select>

          {canManage && historyEquipmentId && (
            <button
              type="button"
              className="danger"
              onClick={() => openDispose(historyEquipmentId)}
            >
              Thanh lý thiết bị
            </button>
          )}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Mã phiếu</th>
                <th>Thiết bị</th>
                <th>Nghiệp vụ</th>
                <th>Từ người</th>
                <th>Đến người</th>
                <th>Người thực hiện</th>
                <th>Người nhập</th>
                <th>Từ nơi</th>
                <th>Đến nơi</th>
                <th>Tình trạng</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
              </tr>
            </thead>

            <tbody>
              {history.map(item => (
                <tr key={item._id}>
                  <td>
                    {(item.transactionDate || item.createdAt || '')?.slice?.(0, 10)}
                  </td>
                  <td>{item.assignmentCode}</td>
                  <td>
                    <strong>{item.equipment?.assetCode || '-'}</strong>
                    <small style={{ display: 'block' }}>
                      {item.equipment?.assetName || '-'}
                    </small>
                  </td>
                  <td>{typeLabel(item.transactionType)}</td>
                  <td>{item.fromUser?.fullName || '-'}</td>
                  <td>{item.toUser?.fullName || item.user?.fullName || '-'}</td>
                  <td>{item.performedBy?.fullName || '-'}</td>
                  <td>{item.recordedBy?.fullName || '-'}</td>
                  <td>
                    {item.fromLocation?.locationName ||
                      item.issuedFromLocation?.locationName ||
                      '-'}
                  </td>
                  <td>
                    {item.toLocation?.locationName ||
                      item.returnedToLocation?.locationName ||
                      item.assignedLocation?.locationName ||
                      '-'}
                  </td>
                  <td>
                    {conditionLabel(
                      item.conditionAfter ||
                      item.equipmentConditionIn ||
                      item.conditionBefore ||
                      item.equipmentConditionOut
                    )}
                  </td>
                  <td>{statusLabel(item.status)}</td>
                  <td>
                    {item.note ||
                      item.returnReason ||
                      item.assignReason ||
                      '-'}
                  </td>
                </tr>
              ))}

              {historyEquipmentId && history.length === 0 && (
                <tr>
                  <td colSpan="13">
                    Thiết bị này chưa có lịch sử giao dịch.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}