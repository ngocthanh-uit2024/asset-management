import Assignment from '../models/Assignment.js';
import Equipment from '../models/Equipment.js';
import User from '../models/User.js';
import nextCode from '../utils/codeGenerator.js';

const populateAssignment = [
  { path: 'equipment', populate: ['company', 'location', 'department', 'category'] },
  { path: 'user', select: '-password', populate: ['company', 'department', 'location'] },
  { path: 'fromUser', select: '-password', populate: ['company', 'department', 'location'] },
  { path: 'toUser', select: '-password', populate: ['company', 'department', 'location'] },
  'company', 'department', 'issuedFromLocation', 'assignedLocation', 'returnedToLocation',
  'fromCompany', 'toCompany', 'fromDepartment', 'toDepartment', 'fromLocation', 'toLocation',
  { path: 'performedBy', select: 'employeeCode fullName department location' },
  { path: 'recordedBy', select: 'employeeCode fullName role' },
  { path: 'approvedBy', select: 'employeeCode fullName' },
  { path: 'relatedAssignment', select: 'assignmentCode transactionType status' }
];

async function buildCode() {
  return nextCode(Assignment, 'assignmentCode', `ASN-${new Date().getFullYear()}`);
}

async function populatedById(id) {
  return Assignment.findById(id).populate(populateAssignment);
}

const currentUser = item => item.toUser || item.user || null;
const currentCompany = item => item.toCompany || item.company || null;
const currentDepartment = item => item.toDepartment || item.department || null;
const currentLocation = item => item.toLocation || item.assignedLocation || item.returnedToLocation || null;

export async function getAssignments(req, res) {
  try {
    const filter = {};
    if (req.query.equipmentId) filter.equipment = req.query.equipmentId;
    if (req.query.transactionType) filter.transactionType = req.query.transactionType;
    if (req.query.status) filter.status = req.query.status;

    const items = await Assignment.find(filter)
      .populate(populateAssignment)
      .sort({ transactionDate: -1, createdAt: -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function getEquipmentHistory(req, res) {
  try {
    const items = await Assignment.find({ equipment: req.params.equipmentId })
      .populate(populateAssignment)
      .sort({ transactionDate: -1, createdAt: -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function createAssignment(req, res) {
  try {
    const equipment = await Equipment.findById(req.body.equipment);
    const user = await User.findById(req.body.user);

    if (!equipment || !user) {
      return res.status(404).json({ message: 'Thiết bị hoặc nhân viên không tồn tại' });
    }
    if (equipment.status !== 'available') {
      return res.status(400).json({ message: 'Thiết bị không ở trạng thái sẵn sàng' });
    }

    const toLocation = req.body.assignedLocation || user.location || equipment.location;

    const item = await Assignment.create({
      ...req.body,
      assignmentCode: await buildCode(),
      transactionType: 'ISSUE',

      user: user._id,
      toUser: user._id,

      company: req.body.company || user.company || equipment.company,
      toCompany: req.body.company || user.company || equipment.company,

      department: req.body.department || user.department || null,
      toDepartment: req.body.department || user.department || null,

      issuedFromLocation: req.body.issuedFromLocation || equipment.location,
      assignedLocation: toLocation,

      fromCompany: equipment.company,
      fromDepartment: equipment.department || null,
      fromLocation: equipment.location,
      toLocation,

      assignDate: req.body.assignDate || new Date(),
      transactionDate: req.body.assignDate || new Date(),

      conditionBefore: req.body.equipmentConditionOut || equipment.condition || 'good',
      equipmentConditionOut: req.body.equipmentConditionOut || equipment.condition || 'good',

      performedBy: req.body.performedBy || req.user._id,
      recordedBy: req.user._id,
      status: 'active'
    });

    equipment.status = 'assigned';
    equipment.location = toLocation;
    equipment.department = user.department || null;
    await equipment.save();

    res.status(201).json(await populatedById(item._id));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function returnAssignment(req, res) {
  try {
    const activeItem = await Assignment.findById(req.params.id);
    if (!activeItem) return res.status(404).json({ message: 'Không tìm thấy giao dịch đang hiệu lực' });

    if (activeItem.status !== 'active' || !['ISSUE', 'TRANSFER'].includes(activeItem.transactionType)) {
      return res.status(400).json({ message: 'Giao dịch này không còn hiệu lực để thu hồi' });
    }

    const equipment = await Equipment.findById(activeItem.equipment);
    if (!equipment) return res.status(404).json({ message: 'Không tìm thấy thiết bị' });

    const returnLocation =
      req.body.returnedToLocation ||
      activeItem.fromLocation ||
      activeItem.issuedFromLocation ||
      equipment.location;

    const conditionIn = req.body.equipmentConditionIn || equipment.condition || 'good';

    activeItem.status = 'completed';
    activeItem.actualReturnDate = req.body.actualReturnDate || new Date();
    await activeItem.save();

    const event = await Assignment.create({
      assignmentCode: await buildCode(),
      equipment: activeItem.equipment,
      transactionType: 'RETURN',

      fromUser: currentUser(activeItem),
      fromCompany: currentCompany(activeItem),
      fromDepartment: currentDepartment(activeItem),
      fromLocation: currentLocation(activeItem),

      toCompany: equipment.company,
      toLocation: returnLocation,
      returnedToLocation: returnLocation,

      transactionDate: req.body.actualReturnDate || new Date(),
      actualReturnDate: req.body.actualReturnDate || new Date(),
      returnReason: req.body.returnReason,

      conditionBefore: equipment.condition,
      conditionAfter: conditionIn,
      equipmentConditionIn: conditionIn,

      performedBy: req.body.performedBy || req.user._id,
      recordedBy: req.user._id,
      relatedAssignment: activeItem._id,
      note: req.body.note,
      status: 'completed'
    });

    equipment.status = conditionIn === 'broken' ? 'broken' : 'available';
    equipment.condition = conditionIn;
    equipment.location = returnLocation;
    equipment.department = null;
    await equipment.save();

    res.json(await populatedById(event._id));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function transferAssignment(req, res) {
  try {
    const activeItem = await Assignment.findById(req.params.id);
    if (!activeItem) return res.status(404).json({ message: 'Không tìm thấy giao dịch đang hiệu lực' });

    if (activeItem.status !== 'active' || !['ISSUE', 'TRANSFER'].includes(activeItem.transactionType)) {
      return res.status(400).json({ message: 'Giao dịch này không còn hiệu lực để điều chuyển' });
    }

    const equipment = await Equipment.findById(activeItem.equipment);
    const newUser = await User.findById(req.body.toUser);
    if (!equipment || !newUser) {
      return res.status(404).json({ message: 'Thiết bị hoặc nhân viên nhận mới không tồn tại' });
    }

    activeItem.status = 'completed';
    await activeItem.save();

    const toLocation = req.body.toLocation || newUser.location || equipment.location;

    const event = await Assignment.create({
      assignmentCode: await buildCode(),
      equipment: activeItem.equipment,
      transactionType: 'TRANSFER',

      fromUser: currentUser(activeItem),
      toUser: newUser._id,
      user: newUser._id,

      fromCompany: currentCompany(activeItem),
      toCompany: newUser.company || equipment.company,
      company: newUser.company || equipment.company,

      fromDepartment: currentDepartment(activeItem),
      toDepartment: newUser.department || null,
      department: newUser.department || null,

      fromLocation: currentLocation(activeItem),
      toLocation,
      assignedLocation: toLocation,

      transactionDate: req.body.transactionDate || new Date(),
      conditionBefore: equipment.condition,
      conditionAfter: req.body.conditionAfter || equipment.condition,

      assignReason: req.body.transferReason,
      performedBy: req.body.performedBy || req.user._id,
      recordedBy: req.user._id,
      relatedAssignment: activeItem._id,
      note: req.body.note,
      status: 'active'
    });

    equipment.status = 'assigned';
    equipment.location = toLocation;
    equipment.department = newUser.department || null;
    await equipment.save();

    res.json(await populatedById(event._id));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function cancelAssignment(req, res) {
  try {
    const target = await Assignment.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
    if (target.status !== 'active') {
      return res.status(400).json({ message: 'Chỉ có thể hủy giao dịch đang hiệu lực' });
    }

    const equipment = await Equipment.findById(target.equipment);
    if (!equipment) return res.status(404).json({ message: 'Không tìm thấy thiết bị' });

    target.status = 'cancelled';
    await target.save();

    const event = await Assignment.create({
      assignmentCode: await buildCode(),
      equipment: target.equipment,
      transactionType: 'CANCEL',

      fromUser: currentUser(target),
      fromCompany: currentCompany(target),
      fromDepartment: currentDepartment(target),
      fromLocation: currentLocation(target),

      transactionDate: new Date(),
      performedBy: req.body.performedBy || req.user._id,
      recordedBy: req.user._id,
      relatedAssignment: target._id,
      note: req.body.note || 'Hủy giao dịch',
      status: 'completed'
    });

    equipment.status = 'available';
    equipment.location = target.fromLocation || target.issuedFromLocation || equipment.location;
    equipment.department = null;
    await equipment.save();

    res.json(await populatedById(event._id));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function disposeEquipment(req, res) {
  try {
    const equipment = await Equipment.findById(req.params.equipmentId);
    if (!equipment) return res.status(404).json({ message: 'Không tìm thấy thiết bị' });

    if (equipment.status === 'assigned') {
      return res.status(400).json({
        message: 'Thiết bị đang được cấp phát. Vui lòng thu hồi trước khi thanh lý.'
      });
    }
    if (equipment.status === 'disposed') {
      return res.status(400).json({ message: 'Thiết bị đã được thanh lý trước đó' });
    }

    const event = await Assignment.create({
      assignmentCode: await buildCode(),
      equipment: equipment._id,
      transactionType: 'DISPOSE',

      fromCompany: equipment.company,
      fromDepartment: equipment.department || null,
      fromLocation: equipment.location,

      transactionDate: req.body.transactionDate || new Date(),
      conditionBefore: equipment.condition,
      conditionAfter: equipment.condition,

      performedBy: req.body.performedBy || req.user._id,
      recordedBy: req.user._id,
      note: req.body.note,
      status: 'completed'
    });

    equipment.status = 'disposed';
    equipment.department = null;
    await equipment.save();

    res.json(await populatedById(event._id));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
