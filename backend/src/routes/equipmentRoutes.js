import express from 'express';
import { getEquipments, getEquipmentById, createEquipment, updateEquipment, deleteEquipment } from '../controllers/equipmentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/', getEquipments);
router.get('/:id', getEquipmentById);
router.post('/', authorize('admin', 'asset_manager'), createEquipment);
router.put('/:id', authorize('admin', 'asset_manager'), updateEquipment);
router.delete('/:id', authorize('admin', 'asset_manager'), deleteEquipment);

export default router;
