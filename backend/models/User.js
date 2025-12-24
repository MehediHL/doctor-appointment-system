import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  photo: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('User', userSchema);

