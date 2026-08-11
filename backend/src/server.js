import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import equipmentRoutes from './routes/equipmentRoutes.js';
import masterRoutes from './routes/masterRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import licenseRoutes from './routes/licenseRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();
await connectDB();

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(item => item.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/', (req, res) => res.json({ message: 'AssetPro API is running', version: '2.0.0' }));
app.use('/api/auth', authRoutes);
app.use('/api/equipments', equipmentRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/reports', reportRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Lỗi hệ thống' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
