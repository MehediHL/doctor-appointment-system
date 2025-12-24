import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD format for date-specific availability
    default: null
  },
  dayOfWeek: {
    type: Number, // 0-6 (Sunday-Saturday) for recurring weekly availability
    default: null,
    min: 0,
    max: 6
  },
  slots: {
    type: [String], // Array of time strings like ["09:00", "09:15", ...]
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
availabilitySchema.index({ doctorId: 1, date: 1 });
availabilitySchema.index({ doctorId: 1, dayOfWeek: 1 });

export default mongoose.model('Availability', availabilitySchema);

