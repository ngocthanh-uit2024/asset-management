import mongoose from 'mongoose';

const softwareLicenseSchema = new mongoose.Schema({
  licenseCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
  equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' },
  softwareName: { type: String, required: true, trim: true },
  category: { type: String, trim: true },
  version: { type: String, trim: true },
  licenseType: { type: String, enum: ['OEM', 'Retail', 'Volume', 'Subscription', 'Trial'], default: 'OEM' },
  licenseKey: { type: String, trim: true, select: false },
  vendor: { type: String, trim: true },
  purchaseDate: Date,
  expireDate: Date,
  quantity: { type: Number, min: 1, default: 1 },
  assignedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['active', 'expired', 'disabled', 'transferred'], default: 'active' },
  note: { type: String, trim: true }
}, { timestamps: true });

export default mongoose.model('SoftwareLicense', softwareLicenseSchema);
