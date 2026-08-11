import express from 'express';
import {
  getMaintenances,
  createMaintenance,
  updateMaintenanceStatus
} from '../controllers/maintenanceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// Every logged-in role can view
router.get('/', getMaintenances);

// HR/Admin + manager/employee can create a request; viewer is read-only
router.post(
  '/',
  authorize('admin', 'asset_manager', 'manager', 'employee'),
  createMaintenance
);

// Only HR/Admin asset roles process/complete/cancel
router.put(
  '/:id',
  authorize('admin', 'asset_manager'),
  updateMaintenanceStatus
);

export default router;
