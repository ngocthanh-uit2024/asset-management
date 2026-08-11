import mongoose from 'mongoose';

const equipmentSchema = new mongoose.Schema(
  {
    assetCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    assetName: { type: String, required: true, trim: true },

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },

    manufacturer: { type: String, trim: true },
    brand: { type: String, trim: true },
    model: { type: String, trim: true },
    serialNumber: { type: String, trim: true, sparse: true, unique: true },

    computerName: { type: String, trim: true },
    cpu: { type: String, trim: true },
    ram: { type: String, trim: true },
    storage: { type: String, trim: true },
    operatingSystem: { type: String, trim: true },
    macAddress: { type: String, trim: true },
    ipAddress: { type: String, trim: true },

    supplier: { type: String, trim: true },
    purchaseDate: Date,
    receivedDate: Date,
    purchasePrice: { type: Number, min: 0, default: 0 },
    currency: { type: String, enum: ['VND', 'USD', 'JPY'], default: 'VND' },
    invoiceNumber: { type: String, trim: true },
    poNumber: { type: String, trim: true },

    warrantyStartDate: Date,
    warrantyEndDate: Date,
    usefulLifeYears: { type: Number, min: 0, default: 0 },
    depreciationYears: { type: Number, min: 0, default: 0 },
    depreciationCost: { type: Number, min: 0, default: 0 },

    legacyAssetCode: { type: String, trim: true },
    accountingAssetCode: { type: String, trim: true },
    note1: { type: String, trim: true },
    note2: { type: String, trim: true },

    condition: {
      type: String,
      enum: ['new', 'good', 'fair', 'damaged', 'broken'],
      default: 'good'
    },
    status: {
      type: String,
      enum: ['available', 'assigned', 'maintenance', 'broken', 'disposed', 'lost'],
      default: 'available'
    },

    remark: { type: String, trim: true }
  },
  { timestamps: true }
);

equipmentSchema.index({ company: 1, category: 1, status: 1 });
equipmentSchema.index({ location: 1, department: 1 });

export default mongoose.model('Equipment', equipmentSchema);
