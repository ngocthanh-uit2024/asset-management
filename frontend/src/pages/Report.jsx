import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../services/api.js';

function dateOnly(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().slice(0, 10);
}

function refLabel(value, preferred = []) {
  if (!value) return '';
  if (typeof value === 'string') return value;

  for (const key of preferred) {
    if (value?.[key]) return value[key];
  }

  return (
    value.assetCode ||
    value.employeeCode ||
    value.companyCode ||
    value.locationCode ||
    value.departmentCode ||
    value.categoryCode ||
    value.maintenanceCode ||
    value.assignmentCode ||
    value.licenseCode ||
    value.fullName ||
    value.companyName ||
    value.locationName ||
    value.departmentName ||
    value.categoryName ||
    value.softwareName ||
    value.name ||
    value._id ||
    ''
  );
}

function flattenObject(obj, prefix = '', result = {}) {
  if (obj === null || obj === undefined) return result;

  Object.entries(obj).forEach(([key, value]) => {
    if (key === '__v' || key === 'password') return;

    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (value instanceof Date) {
      result[nextKey] = value.toISOString();
    } else if (Array.isArray(value)) {
      result[nextKey] = value
        .map(item =>
          typeof item === 'object' && item !== null
            ? refLabel(item)
            : String(item)
        )
        .join(' | ');
    } else if (typeof value === 'object' && value !== null) {
      if (
        value._id &&
        Object.keys(value).some(k =>
          [
            'assetCode', 'employeeCode', 'companyCode', 'locationCode',
            'departmentCode', 'categoryCode', 'maintenanceCode',
            'assignmentCode', 'licenseCode', 'fullName', 'name',
            'softwareName'
          ].includes(k)
        )
      ) {
        result[nextKey] = refLabel(value);
      } else {
        flattenObject(value, nextKey, result);
      }
    } else {
      result[nextKey] = value;
    }
  });

  return result;
}

function addSheet(workbook, sheetName, rows) {
  const safeRows = rows?.length ? rows : [{ Thông_báo: 'Không có dữ liệu' }];
  const worksheet = XLSX.utils.json_to_sheet(safeRows);

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  const widths = [];

  for (let col = range.s.c; col <= range.e.c; col += 1) {
    let maxLength = 12;

    for (let row = range.s.r; row <= range.e.r; row += 1) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
      const value = cell?.v == null ? '' : String(cell.v);
      maxLength = Math.max(maxLength, Math.min(value.length + 2, 45));
    }

    widths.push({ wch: maxLength });
  }

  worksheet['!cols'] = widths;
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
}

export default function Report() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function exportAll() {
    try {
      setLoading(true);
      setMessage('Đang tổng hợp dữ liệu...');

      const requests = [
        ['equipments', () => api.get('/equipments')],
        ['assignments', () => api.get('/assignments')],
        ['maintenance', () => api.get('/maintenance')],
        ['licenses', () => api.get('/licenses')],
        ['companies', () => api.get('/master/companies')],
        ['locations', () => api.get('/master/locations')],
        ['departments', () => api.get('/master/departments')],
        ['categories', () => api.get('/master/categories')],
        ['users', () => api.get('/master/users')]
      ];

      const results = {};

      for (const [key, request] of requests) {
        try {
          const response = await request();
          results[key] = response.data || [];
        } catch (error) {
          // Không để một module chưa hoàn thiện làm hỏng toàn bộ file export.
          results[key] = [];
          console.warn(`Không thể tải ${key}:`, error);
        }
      }

      const equipmentRows = results.equipments.map(item => ({
        'Mã AssetPro': item.assetCode || '',
        'Mã thiết bị cũ': item.legacyAssetCode || '',
        'Mã tài sản kế toán': item.accountingAssetCode || '',
        'Tên thiết bị': item.assetName || '',
        'Công ty': item.company?.companyCode || '',
        'Tên công ty': item.company?.companyName || '',
        'Địa điểm': item.location?.locationCode || '',
        'Tên địa điểm': item.location?.locationName || '',
        'Phòng ban': item.department?.departmentCode || '',
        'Tên phòng ban': item.department?.departmentName || '',
        'Loại thiết bị': item.category?.categoryCode || '',
        'Tên loại': item.category?.categoryName || '',
        'Nhóm cha': item.category?.parent?.categoryName || '',
        'Hãng sản xuất': item.manufacturer || '',
        'Thương hiệu': item.brand || '',
        'Model': item.model || '',
        'Serial Number': item.serialNumber || '',
        'Computer Name': item.computerName || '',
        'CPU': item.cpu || '',
        'RAM': item.ram || '',
        'Storage': item.storage || '',
        'Operating System': item.operatingSystem || '',
        'MAC Address': item.macAddress || '',
        'IP Address': item.ipAddress || '',
        'Nhà cung cấp': item.supplier || '',
        'Ngày mua': dateOnly(item.purchaseDate),
        'Ngày nhập': dateOnly(item.receivedDate),
        'Giá mua': item.purchasePrice ?? 0,
        'Tiền tệ': item.currency || '',
        'Số hóa đơn': item.invoiceNumber || '',
        'Số PO': item.poNumber || '',
        'Bắt đầu bảo hành': dateOnly(item.warrantyStartDate),
        'Hết bảo hành': dateOnly(item.warrantyEndDate),
        'Thời gian sử dụng hữu ích (năm)': item.usefulLifeYears ?? 0,
        'Số năm khấu hao': item.depreciationYears ?? 0,
        'Chi phí khấu hao': item.depreciationCost ?? 0,
        'Tình trạng': item.condition || '',
        'Trạng thái': item.status || '',
        'Ghi chú 1': item.note1 || '',
        'Ghi chú 2': item.note2 || '',
        'Ghi chú chung': item.remark || '',
        'Ngày tạo': dateOnly(item.createdAt),
        'Ngày cập nhật': dateOnly(item.updatedAt)
      }));

      const assignmentRows = results.assignments.map(item => ({
        'Mã phiếu': item.assignmentCode || '',
        'Mã thiết bị': item.equipment?.assetCode || '',
        'Tên thiết bị': item.equipment?.assetName || '',
        'Nghiệp vụ': item.transactionType || '',
        'Từ nhân viên': item.fromUser?.fullName || '',
        'Đến nhân viên': item.toUser?.fullName || item.user?.fullName || '',
        'Người thực hiện': item.performedBy?.fullName || '',
        'Người nhập': item.recordedBy?.fullName || '',
        'Từ công ty': item.fromCompany?.companyCode || '',
        'Đến công ty': item.toCompany?.companyCode || item.company?.companyCode || '',
        'Từ phòng ban': item.fromDepartment?.departmentName || '',
        'Đến phòng ban': item.toDepartment?.departmentName || item.department?.departmentName || '',
        'Từ địa điểm': item.fromLocation?.locationName || item.issuedFromLocation?.locationName || '',
        'Đến địa điểm': item.toLocation?.locationName || item.returnedToLocation?.locationName || item.assignedLocation?.locationName || '',
        'Ngày giao dịch': dateOnly(item.transactionDate),
        'Ngày cấp': dateOnly(item.assignDate),
        'Dự kiến thu hồi': dateOnly(item.expectedReturnDate),
        'Ngày thu hồi thực tế': dateOnly(item.actualReturnDate),
        'Tình trạng trước': item.conditionBefore || item.equipmentConditionOut || '',
        'Tình trạng sau': item.conditionAfter || item.equipmentConditionIn || '',
        'Mục đích cấp phát': item.assignReason || '',
        'Lý do thu hồi': item.returnReason || '',
        'Phụ kiện': item.accessories || '',
        'Biên bản bàn giao': item.handoverDocument || '',
        'Trạng thái giao dịch': item.status || '',
        'Ghi chú': item.note || '',
        'Ngày tạo record': dateOnly(item.createdAt)
      }));

      const maintenanceRows = results.maintenance.map(item => ({
        'Mã bảo trì': item.maintenanceCode || '',
        'Mã thiết bị': item.equipment?.assetCode || '',
        'Tên thiết bị': item.equipment?.assetName || '',
        'Người yêu cầu': item.requestedBy?.fullName || '',
        'Người nhập': item.recordedBy?.fullName || '',
        'Người xử lý': item.handledBy?.fullName || '',
        'Công ty': item.company?.companyCode || '',
        'Địa điểm': item.location?.locationName || '',
        'Ngày yêu cầu': dateOnly(item.requestDate),
        'Mô tả lỗi': item.problemDescription || '',
        'Mức ưu tiên': item.priority || '',
        'Loại bảo trì': item.maintenanceType || '',
        'Nhà cung cấp': item.vendor || '',
        'Kỹ thuật viên': item.technician || '',
        'Ngày bắt đầu': dateOnly(item.startDate),
        'Ngày hoàn tất': dateOnly(item.finishDate),
        'Chi phí': item.repairCost ?? 0,
        'Tiền tệ': item.currency || '',
        'Kết quả': item.result || '',
        'Tình trạng thiết bị': item.equipmentCondition || '',
        'Attachment': item.attachment || '',
        'Trạng thái': item.status || '',
        'Ghi chú': item.note || '',
        'Ngày tạo record': dateOnly(item.createdAt)
      }));

      // License chưa cần biết schema cố định: xuất toàn bộ field đang có trong API.
      const licenseRows = results.licenses.map(item => flattenObject(item));

      const companyRows = results.companies.map(item => ({
        'Mã công ty': item.companyCode || '',
        'Tên công ty': item.companyName || '',
        'Tên ngắn': item.shortName || '',
        'Mã số thuế': item.taxCode || '',
        'Địa chỉ': item.address || '',
        'Trạng thái': item.status || ''
      }));

      const locationRows = results.locations.map(item => ({
        'Mã địa điểm': item.locationCode || '',
        'Tên địa điểm': item.locationName || '',
        'Công ty': item.company?.companyCode || '',
        'Loại địa điểm': item.locationType || '',
        'Địa chỉ': item.address || '',
        'Manager': item.manager?.fullName || '',
        'Trạng thái': item.status || ''
      }));

      const departmentRows = results.departments.map(item => ({
        'Mã phòng ban': item.departmentCode || '',
        'Tên phòng ban': item.departmentName || '',
        'Công ty': item.company?.companyCode || '',
        'Địa điểm': item.location?.locationName || '',
        'Manager': item.manager?.fullName || '',
        'Trạng thái': item.status || ''
      }));

      const categoryRows = results.categories.map(item => ({
        'Mã loại': item.categoryCode || '',
        'Tên loại thiết bị': item.categoryName || '',
        'Parent Code': item.parent?.categoryCode || '',
        'Parent Name': item.parent?.categoryName || '',
        'Trạng thái': item.status || ''
      }));

      const userRows = results.users.map(item => ({
        'Mã nhân viên': item.employeeCode || '',
        'Họ tên': item.fullName || '',
        'Email': item.email || '',
        'Điện thoại': item.phone || '',
        'Công ty': item.company?.companyCode || '',
        'Phòng ban': item.department?.departmentName || '',
        'Địa điểm': item.location?.locationName || '',
        'Chức danh': item.position || '',
        'Role': item.role || '',
        'Cho phép đăng nhập': item.canLogin ? 'Yes' : 'No',
        'Trạng thái': item.status || ''
      }));

      const summaryRows = [
        { 'Danh mục': 'Thiết bị', 'Số lượng': results.equipments.length },
        { 'Danh mục': 'Lịch sử cấp phát / thu hồi / điều chuyển', 'Số lượng': results.assignments.length },
        { 'Danh mục': 'Bảo trì', 'Số lượng': results.maintenance.length },
        { 'Danh mục': 'Software License', 'Số lượng': results.licenses.length },
        { 'Danh mục': 'Công ty', 'Số lượng': results.companies.length },
        { 'Danh mục': 'Địa điểm', 'Số lượng': results.locations.length },
        { 'Danh mục': 'Phòng ban', 'Số lượng': results.departments.length },
        { 'Danh mục': 'Loại thiết bị', 'Số lượng': results.categories.length },
        { 'Danh mục': 'Nhân viên', 'Số lượng': results.users.length }
      ];

      const workbook = XLSX.utils.book_new();

      addSheet(workbook, 'Summary', summaryRows);
      addSheet(workbook, 'Equipment', equipmentRows);
      addSheet(workbook, 'Assignment History', assignmentRows);
      addSheet(workbook, 'Maintenance', maintenanceRows);
      addSheet(workbook, 'Software License', licenseRows);
      addSheet(workbook, 'Companies', companyRows);
      addSheet(workbook, 'Locations', locationRows);
      addSheet(workbook, 'Departments', departmentRows);
      addSheet(workbook, 'Categories', categoryRows);
      addSheet(workbook, 'Users', userRows);

      const fileDate = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `AssetPro_All_Data_${fileDate}.xlsx`);

      setMessage('Đã xuất file Excel toàn bộ dữ liệu.');
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || error.message || 'Không thể xuất Excel');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Báo cáo / Export Excel</h1>
          <p>
            Xuất dữ liệu AssetPro thành một file Excel gồm nhiều sheet.
          </p>
        </div>
      </div>

      <div className="panel">
        <h3>Xuất toàn bộ dữ liệu</h3>

        <p>
          File Excel gồm Equipment, Assignment History, Maintenance,
          Software License và toàn bộ Master Data.
        </p>

        {message && <div className="notice">{message}</div>}

        <button type="button" onClick={exportAll} disabled={loading}>
          {loading ? 'Đang xuất dữ liệu...' : 'Export toàn bộ Excel'}
        </button>
      </div>
    </section>
  );
}
