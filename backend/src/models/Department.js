import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  departmentCode: { type: String, required: true, trim: true, uppercase: true },
  departmentName: { type: String, required: true, trim: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

departmentSchema.index({ departmentCode: 1, company: 1 }, { unique: true });

export default mongoose.model('Department', departmentSchema);
