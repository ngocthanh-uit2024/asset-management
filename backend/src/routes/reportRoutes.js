import express from 'express';
import { dashboard } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
const router = express.Router();
router.use(protect);
router.get('/dashboard', dashboard);
export default router;
