import SoftwareLicense from '../models/SoftwareLicense.js';
import nextCode from '../utils/codeGenerator.js';

export async function getLicenses(req, res) {
  try {
    const filter = {};
    if (req.query.equipmentId) filter.equipment = req.query.equipmentId;
    res.json(await SoftwareLicense.find(filter).populate('equipment').populate('assignedUser', '-password').sort({ createdAt: -1 }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function createLicense(req, res) {
  try {
    const licenseCode = req.body.licenseCode || await nextCode(SoftwareLicense, 'licenseCode', `LIC-${new Date().getFullYear()}`);
    const item = await SoftwareLicense.create({ ...req.body, licenseCode });
    res.status(201).json(await SoftwareLicense.findById(item._id).populate('equipment').populate('assignedUser', '-password'));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function updateLicense(req, res) {
  try {
    const item = await SoftwareLicense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('equipment').populate('assignedUser', '-password');
    if (!item) return res.status(404).json({ message: 'Không tìm thấy license' });
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
