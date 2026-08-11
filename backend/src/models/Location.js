import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  locationCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
  locationName: { type: String, required: true, trim: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  locationType: { type: String, enum: ['office', 'warehouse', 'branch', 'store', 'data_center', 'other'], default: 'office' },
  address: { type: String, trim: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

export default mongoose.model('Location', locationSchema);
