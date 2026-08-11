import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  companyCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
  companyName: { type: String, required: true, trim: true },
  shortName: { type: String, trim: true },
  taxCode: { type: String, trim: true },
  address: { type: String, trim: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

export default mongoose.model('Company', companySchema);
