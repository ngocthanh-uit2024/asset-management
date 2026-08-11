import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  assignmentCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
  equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },

  transactionType: {
    type: String,
    enum: ['ISSUE', 'RETURN', 'TRANSFER', 'CANCEL', 'DISPOSE'],
    default: 'ISSUE',
    required: true
  },

  // Backward-compatible fields
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  issuedFromLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  assignedLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  returnedToLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },

  // Transaction history
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  fromCompany: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  toCompany: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },

  fromDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  toDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },

  fromLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  toLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },

  transactionDate: { type: Date, default: Date.now },
  assignDate: { type: Date, default: Date.now },
  expectedReturnDate: Date,
  actualReturnDate: Date,

  assignReason: { type: String, trim: true },
  returnReason: { type: String, trim: true },

  conditionBefore: { type: String, enum: ['new', 'good', 'fair', 'damaged', 'broken'] },
  conditionAfter: { type: String, enum: ['new', 'good', 'fair', 'damaged', 'broken'] },

  equipmentConditionOut: {
    type: String,
    enum: ['new', 'good', 'fair', 'damaged'],
    default: 'good'
  },
  equipmentConditionIn: {
    type: String,
    enum: ['new', 'good', 'fair', 'damaged', 'broken']
  },

  accessories: { type: String, trim: true },
  handoverDocument: { type: String, trim: true },

  // Person who actually performs the physical transaction
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Logged-in account that records the transaction in AssetPro
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  relatedAssignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
  note: { type: String, trim: true },

  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'completed'
  }
}, { timestamps: true });

assignmentSchema.index({ equipment: 1, transactionDate: -1 });
assignmentSchema.index({ equipment: 1, status: 1, transactionType: 1 });

export default mongoose.model('Assignment', assignmentSchema);
