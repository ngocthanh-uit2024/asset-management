import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema({
  maintenanceCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
  equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },

  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },

  requestDate: { type: Date, default: Date.now },
  problemDescription: { type: String, required: true, trim: true },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },

  maintenanceType: {
    type: String,
    enum: ['corrective', 'preventive', 'warranty', 'inspection', 'cleaning'],
    default: 'corrective'
  },

  vendor: { type: String, trim: true },
  technician: { type: String, trim: true },

  startDate: Date,
  finishDate: Date,

  repairCost: { type: Number, min: 0, default: 0 },
  currency: { type: String, enum: ['VND', 'USD', 'JPY'], default: 'VND' },

  result: { type: String, trim: true },
  equipmentCondition: {
    type: String,
    enum: ['good', 'fair', 'damaged', 'broken']
  },

  attachment: { type: String, trim: true },
  note: { type: String, trim: true },

  status: {
    type: String,
    enum: ['open', 'processing', 'waiting_parts', 'completed', 'cancelled'],
    default: 'open'
  }
}, { timestamps: true });

maintenanceSchema.index({ equipment: 1, createdAt: -1 });
maintenanceSchema.index({ status: 1, priority: 1 });

export default mongoose.model('Maintenance', maintenanceSchema);
