import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  employeeCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true, sparse: true, unique: true },
  phone: { type: String, trim: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  position: { type: String, trim: true },
  canLogin: { type: Boolean, default: false },
  password: { type: String, select: false },
  role: { type: String, enum: ['admin', 'asset_manager', 'manager', 'employee', 'viewer'], default: 'employee' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function(password) {
  return bcrypt.compare(password, this.password || '');
};

export default mongoose.model('User', userSchema);
