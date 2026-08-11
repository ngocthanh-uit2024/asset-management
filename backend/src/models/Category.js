import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  categoryCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
  categoryName: { type: String, required: true, trim: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);
