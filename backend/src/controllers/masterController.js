import Company from '../models/Company.js';
import Location from '../models/Location.js';
import Department from '../models/Department.js';
import Category from '../models/Category.js';
import User from '../models/User.js';

const masterMap = {
  companies: {
    Model: Company,
    sort: 'companyCode',
    populate: []
  },
  locations: {
    Model: Location,
    sort: 'locationCode',
    populate: ['company', 'manager']
  },
  departments: {
    Model: Department,
    sort: 'departmentCode',
    populate: ['company', 'location', 'manager']
  },
  categories: {
    Model: Category,
    sort: 'categoryCode',
    populate: ['parent']
  },
  users: {
    Model: User,
    sort: 'fullName',
    populate: ['company', 'department', 'location']
  }
};

const duplicateLabels = {
  companyCode: 'Mã công ty',
  locationCode: 'Mã địa điểm',
  departmentCode: 'Mã phòng ban',
  categoryCode: 'Mã loại thiết bị',
  employeeCode: 'Mã nhân viên',
  email: 'Email'
};

function safeUserQuery(query) {
  return query.select('-password');
}

function sendMasterError(
  res,
  error,
  fallbackMessage = 'Không thể xử lý dữ liệu'
) {
  // Lỗi trùng dữ liệu unique trong MongoDB
  if (error?.code === 11000) {
    const duplicateField = Object.keys(
      error.keyPattern || error.keyValue || {}
    )[0];

    const duplicateValue = duplicateField
      ? error.keyValue?.[duplicateField]
      : '';

    const label = duplicateLabels[duplicateField] || 'Giá trị';

    return res.status(409).json({
      message: `${label}${duplicateValue ? ` "${duplicateValue}"` : ''
        } đã tồn tại.`
    });
  }

  // Lỗi validation của Mongoose
  if (error?.name === 'ValidationError') {
    const firstValidationError = Object.values(error.errors || {})[0];

    return res.status(400).json({
      message:
        firstValidationError?.message ||
        'Dữ liệu không hợp lệ.'
    });
  }

  return res.status(400).json({
    message: error?.message || fallbackMessage
  });
}

async function populateMasterItem(config, itemId, type) {
  let query = config.Model.findById(itemId);

  for (const path of config.populate) {
    query = query.populate(path);
  }

  if (type === 'users') {
    query = safeUserQuery(query);
  }

  return query;
}

export async function getMaster(req, res) {
  try {
    const config = masterMap[req.params.type];

    if (!config) {
      return res.status(404).json({
        message: 'Danh mục không tồn tại'
      });
    }

    const filter = {};

    if (req.query.companyId) {
      filter.company = req.query.companyId;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    let query = config.Model
      .find(filter)
      .sort(config.sort);

    for (const path of config.populate) {
      query = query.populate(path);
    }

    if (req.params.type === 'users') {
      query = safeUserQuery(query);
    }

    return res.json(await query);
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
}

export async function createMaster(req, res) {
  try {
    const config = masterMap[req.params.type];

    if (!config) {
      return res.status(404).json({
        message: 'Danh mục không tồn tại'
      });
    }

    const payload = { ...req.body };

    // Nhân viên không được đăng nhập thì không lưu password
    if (
      req.params.type === 'users' &&
      !payload.canLogin
    ) {
      delete payload.password;
    }

    const item = await config.Model.create(payload);

    return res.status(201).json(
      await populateMasterItem(
        config,
        item._id,
        req.params.type
      )
    );
  } catch (error) {
    return sendMasterError(
      res,
      error,
      'Không thể tạo dữ liệu'
    );
  }
}

export async function updateMaster(req, res) {
  try {
    const config = masterMap[req.params.type];

    if (!config) {
      return res.status(404).json({
        message: 'Danh mục không tồn tại'
      });
    }

    const payload = { ...req.body };

    // Khi sửa user, để trống mật khẩu thì giữ mật khẩu cũ
    if (
      req.params.type === 'users' &&
      !payload.password
    ) {
      delete payload.password;
    }

    const item = await config.Model.findById(
      req.params.id
    );

    if (!item) {
      return res.status(404).json({
        message: 'Không tìm thấy dữ liệu'
      });
    }

    Object.assign(item, payload);
    await item.save();

    return res.json(
      await populateMasterItem(
        config,
        item._id,
        req.params.type
      )
    );
  } catch (error) {
    return sendMasterError(
      res,
      error,
      'Không thể cập nhật dữ liệu'
    );
  }
}

export async function deleteMaster(req, res) {
  try {
    const config = masterMap[req.params.type];

    if (!config) {
      return res.status(404).json({
        message: 'Danh mục không tồn tại'
      });
    }

    const item =
      await config.Model.findByIdAndUpdate(
        req.params.id,
        { status: 'inactive' },
        {
          new: true,
          runValidators: true
        }
      );

    if (!item) {
      return res.status(404).json({
        message: 'Không tìm thấy dữ liệu'
      });
    }

    return res.json({
      message: 'Đã vô hiệu hóa dữ liệu'
    });
  } catch (error) {
    return sendMasterError(
      res,
      error,
      'Không thể vô hiệu hóa dữ liệu'
    );
  }
}