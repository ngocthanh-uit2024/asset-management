import express from 'express';
import { getMaster, createMaster, updateMaster, deleteMaster } from '../controllers/masterController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/:type', getMaster);
router.post('/:type', authorize('admin', 'asset_manager'), createMaster);
router.put('/:type/:id', authorize('admin', 'asset_manager'), updateMaster);
router.delete('/:type/:id', authorize('admin'), deleteMaster);

export default router;
