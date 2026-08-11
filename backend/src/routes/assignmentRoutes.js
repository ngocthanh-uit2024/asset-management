import express from 'express';
import {
  getAssignments,
  getEquipmentHistory,
  createAssignment,
  returnAssignment,
  transferAssignment,
  cancelAssignment,
  disposeEquipment
} from '../controllers/assignmentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// All logged-in users can view assignment/history
router.get('/', getAssignments);
router.get('/equipment/:equipmentId/history', getEquipmentHistory);

// Only HR/Admin asset users can change asset movement
router.post('/', authorize('admin', 'asset_manager'), createAssignment);
router.put('/:id/return', authorize('admin', 'asset_manager'), returnAssignment);
router.put('/:id/transfer', authorize('admin', 'asset_manager'), transferAssignment);
router.put('/:id/cancel', authorize('admin', 'asset_manager'), cancelAssignment);
router.post('/equipment/:equipmentId/dispose', authorize('admin', 'asset_manager'), disposeEquipment);

export default router;
