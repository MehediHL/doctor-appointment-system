import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import bcrypt from 'bcryptjs';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check in User collection first
    let user = await User.findOne({ email: email.toLowerCase() });
    
    // If not found, check in Doctor collection
    if (!user) {
      const doctor = await Doctor.findOne({ email: email.toLowerCase() });
      if (doctor && doctor.status === 'approved') {
        user = doctor;
      } else if (doctor && doctor.status === 'pending') {
        return res.status(403).json({ error: 'Your doctor account is pending approval' });
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare password (assuming passwords are stored as plain text for now)
    // In production, use bcrypt.compare
    const isPasswordValid = user.password === password;
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toObject();

    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, hospitalId, specialization, experience, photo, bmdcNumber } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    const existingDoctor = await Doctor.findOne({ email: email.toLowerCase() });
    
    if (existingUser || existingDoctor) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    if (role === 'doctor') {
      if (!hospitalId || !specialization || !experience || !bmdcNumber) {
        return res.status(400).json({ error: 'Hospital, specialization, experience, and BM&DC number are required for doctors' });
      }

      const doctor = new Doctor({
        name,
        email: email.toLowerCase(),
        password, // In production, hash with bcrypt
        phone,
        role: 'doctor',
        hospitalId,
        specialization,
        experience: Number(experience),
        photo: photo || '',
        bmdcNumber,
        status: 'pending'
      });

      await doctor.save();
      const { password: _, ...doctorWithoutPassword } = doctor.toObject();

      return res.status(201).json({
        success: true,
        message: 'Doctor registration submitted. An admin will review and approve your account.',
        user: doctorWithoutPassword
      });
    } else {
      const user = new User({
        name,
        email: email.toLowerCase(),
        password, // In production, hash with bcrypt
        phone,
        role: role || 'patient'
      });

      await user.save();
      const { password: _, ...userWithoutPassword } = user.toObject();

      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        user: userWithoutPassword
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

