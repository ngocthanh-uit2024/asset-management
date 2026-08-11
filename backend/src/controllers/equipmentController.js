import Equipment from '../models/Equipment.js';
import Company from '../models/Company.js';
import Category from '../models/Category.js';
import nextCode from '../utils/codeGenerator.js';

const populateEquipment = [
  { path: 'company', select: 'companyCode companyName' },
  { path: 'location', select: 'locationCode locationName company' },
  { path: 'department', select: 'departmentCode departmentName company location' },
  {
    path: 'category',
    select: 'categoryCode categoryName parent',
    populate: { path: 'parent', select: 'categoryCode categoryName' }
  }
];

function normalizeEquipmentPayload(body) {
  const payload = { ...body };

  if (!payload.department) payload.department = null;

  const optionalStrings = [
    'manufacturer', 'brand', 'model', 'serialNumber', 'computerName',
    'cpu', 'ram', 'storage', 'operatingSystem', 'macAddress',
    'ipAddress', 'supplier', 'invoiceNumber', 'poNumber',
    'legacyAssetCode', 'accountingAssetCode', 'note1', 'note2', 'remark'
  ];

  optionalStrings.forEach((field) => {
    if (typeof payload[field] === 'string') {
      payload[field] = payload[field].trim();
      if (!payload[field]) delete payload[field];
    }
  });

  ['purchaseDate', 'receivedDate', 'warrantyStartDate', 'warrantyEndDate']
    .forEach((field) => {
      if (!payload[field]) delete payload[field];
    });

  ['purchasePrice', 'usefulLifeYears', 'depreciationYears', 'depreciationCost']
    .forEach((field) => {
      payload[field] = payload[field] === '' || payload[field] == null
        ? 0
        : Number(payload[field]);
    });

  return payload;
}

function sendEquipmentError(res, error, fallbackMessage) {
  if (error?.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0];
    const value = field ? error.keyValue[field] : '';
    const labels = { assetCode: 'Mã thiết bị', serialNumber: 'Serial Number' };

    return res.status(409).json({
      message: `${labels[field] || 'Giá trị'}${value ? ` "${value}"` : ''} đã tồn tại.`
    });
  }

  if (error?.name === 'ValidationError') {
    const firstError = Object.values(error.errors || {})[0];
    return res.status(400).json({
      message: firstError?.message || 'Dữ liệu thiết bị không hợp lệ.'
    });
  }

  return res.status(400).json({
    message: error?.message || fallbackMessage
  });
}

export async function getEquipments(req, res) {
  try {
    const { status, categoryId, companyId, locationId, departmentId, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (categoryId) filter.category = categoryId;
    if (companyId) filter.company = companyId;
    if (locationId) filter.location = locationId;
    if (departmentId) filter.department = departmentId;

    if (search) {
      filter.$or = [
        { assetCode: new RegExp(search, 'i') },
        { assetName: new RegExp(search, 'i') },
        { serialNumber: new RegExp(search, 'i') },
        { manufacturer: new RegExp(search, 'i') },
        { brand: new RegExp(search, 'i') },
        { model: new RegExp(search, 'i') },
        { computerName: new RegExp(search, 'i') },
        { macAddress: new RegExp(search, 'i') },
        { ipAddress: new RegExp(search, 'i') },
        { invoiceNumber: new RegExp(search, 'i') },
        { poNumber: new RegExp(search, 'i') },
        { legacyAssetCode: new RegExp(search, 'i') },
        { accountingAssetCode: new RegExp(search, 'i') },
        { note1: new RegExp(search, 'i') },
        { note2: new RegExp(search, 'i') },
        { remark: new RegExp(search, 'i') }
      ];
    }

    const items = await Equipment.find(filter)
      .populate(populateEquipment)
      .sort({ createdAt: -1 });

    return res.json(items);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getEquipmentById(req, res) {
  try {
    const item = await Equipment.findById(req.params.id).populate(populateEquipment);
    if (!item) return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    return res.json(item);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function createEquipment(req, res) {
  try {
    const payload = normalizeEquipmentPayload(req.body);

    if (!payload.assetCode) {
      const [company, category] = await Promise.all([
        Company.findById(payload.company),
        Category.findById(payload.category)
      ]);

      if (!company || !category) {
        return res.status(400).json({
          message: 'Công ty hoặc loại thiết bị không hợp lệ'
        });
      }

      if (!category.parent) {
        return res.status(400).json({
          message: 'Vui lòng chọn loại thiết bị chi tiết, không chọn nhóm cha.'
        });
      }

      payload.assetCode = await nextCode(
        Equipment,
        'assetCode',
        `${company.companyCode}-${category.categoryCode}`
      );
    }

    const item = await Equipment.create(payload);

    return res.status(201).json(
      await Equipment.findById(item._id).populate(populateEquipment)
    );
  } catch (error) {
    return sendEquipmentError(res, error, 'Không thể tạo thiết bị');
  }
}

export async function updateEquipment(req, res) {
  try {
    const payload = normalizeEquipmentPayload(req.body);
    delete payload.assetCode;

    const item = await Equipment.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    ).populate(populateEquipment);

    if (!item) return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    return res.json(item);
  } catch (error) {
    return sendEquipmentError(res, error, 'Không thể cập nhật thiết bị');
  }
}

export async function deleteEquipment(req, res) {
  try {
    const item = await Equipment.findByIdAndUpdate(
      req.params.id,
      { status: 'disposed' },
      { new: true, runValidators: true }
    );

    if (!item) return res.status(404).json({ message: 'Không tìm thấy thiết bị' });

    return res.json({
      message: 'Thiết bị đã chuyển sang trạng thái thanh lý'
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
