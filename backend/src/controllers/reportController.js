import Equipment from '../models/Equipment.js';
import Assignment from '../models/Assignment.js';
import Maintenance from '../models/Maintenance.js';
import Company from '../models/Company.js';
import Location from '../models/Location.js';

export async function dashboard(req, res) {
  try {
    const [total, available, assigned, maintenance, broken, disposed, activeAssignments, openMaintenances, companies, locations] = await Promise.all([
      Equipment.countDocuments(),
      Equipment.countDocuments({ status: 'available' }),
      Equipment.countDocuments({ status: 'assigned' }),
      Equipment.countDocuments({ status: 'maintenance' }),
      Equipment.countDocuments({ status: 'broken' }),
      Equipment.countDocuments({ status: 'disposed' }),
      Assignment.countDocuments({ status: 'active' }),
      Maintenance.countDocuments({ status: { $in: ['open', 'processing', 'waiting_parts'] } }),
      Company.countDocuments({ status: 'active' }),
      Location.countDocuments({ status: 'active' })
    ]);
    res.json({ total, available, assigned, maintenance, broken, disposed, activeAssignments, openMaintenances, companies, locations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
