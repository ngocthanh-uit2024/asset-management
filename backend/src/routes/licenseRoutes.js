import express from 'express';
import { getLicenses, createLicense, updateLicense } from '../controllers/licenseController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/', getLicenses);
router.post('/', authorize('admin', 'asset_manager'), createLicense);
router.put('/:id', authorize('admin', 'asset_manager'), updateLicense);

export default router;
