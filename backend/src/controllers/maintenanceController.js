import Maintenance from '../models/Maintenance.js';
import Equipment from '../models/Equipment.js';
import User from '../models/User.js';
import nextCode from '../utils/codeGenerator.js';

const populateMaintenance = [
  { path: 'equipment', populate: ['company', 'location', 'department', 'category'] },
  { path: 'requestedBy', select: '-password', populate: ['company', 'department', 'location'] },
  { path: 'recordedBy', select: 'employeeCode fullName role' },
  { path: 'handledBy', select: 'employeeCode fullName department' },
  'company',
  'location'
];

export async function getMaintenances(req, res) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.equipmentId) filter.equipment = req.query.equipmentId;

    const items = await Maintenance.find(filter)
      .populate(populateMaintenance)
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function createMaintenance(req, res) {
  try {
    const equipment = await Equipment.findById(req.body.equipment);
    if (!equipment) return res.status(404).json({ message: 'Không tìm thấy thiết bị' });

    const requesterId = req.body.requestedBy || req.user._id;
    const requester = await User.findById(requesterId);
    if (!requester) return res.status(404).json({ message: 'Không tìm thấy người yêu cầu' });

    const maintenanceCode = await nextCode(
      Maintenance,
      'maintenanceCode',
      `MNT-${new Date().getFullYear()}`
    );

    const item = await Maintenance.create({
      ...req.body,
      maintenanceCode,
      requestedBy: requesterId,
      recordedBy: req.user._id,
      company: req.body.company || equipment.company,
      location: req.body.location || equipment.location,
      status: 'open'
    });

    // Open = request only. Equipment changes to maintenance when processing starts.
    res.status(201).json(
      await Maintenance.findById(item._id).populate(populateMaintenance)
    );
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function updateMaintenanceStatus(req, res) {
  try {
    const item = await Maintenance.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Không tìm thấy yêu cầu bảo trì' });

    Object.assign(item, req.body);

    if (req.body.handledBy) {
      item.handledBy = req.body.handledBy;
    } else if (!item.handledBy) {
      item.handledBy = req.user._id;
    }

    if (req.body.status === 'processing') {
      if (!item.startDate) item.startDate = new Date();
      await Equipment.findByIdAndUpdate(item.equipment, { status: 'maintenance' });
    }

    if (req.body.status === 'waiting_parts') {
      if (!item.startDate) item.startDate = new Date();
      await Equipment.findByIdAndUpdate(item.equipment, { status: 'maintenance' });
    }

    if (req.body.status === 'completed') {
      item.finishDate = req.body.finishDate || new Date();

      const nextStatus =
        req.body.equipmentCondition === 'broken' ? 'broken' : 'available';

      await Equipment.findByIdAndUpdate(item.equipment, {
        status: nextStatus,
        condition: req.body.equipmentCondition || 'good'
      });
    }

    if (req.body.status === 'cancelled') {
      // Cancel request. Do not overwrite condition.
      const equipment = await Equipment.findById(item.equipment);
      if (equipment?.status === 'maintenance') {
        equipment.status = 'available';
        await equipment.save();
      }
    }

    await item.save();

    res.json(
      await Maintenance.findById(item._id).populate(populateMaintenance)
    );
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
