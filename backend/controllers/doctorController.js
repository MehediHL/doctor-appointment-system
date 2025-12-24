import Doctor from '../models/Doctor.js';
import User from '../models/User.js';

export const getAllDoctors = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const doctors = await Doctor.find(query)
      .populate('hospitalId', 'name address')
      .select('-password');
    res.json(doctors);
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ error: 'Error fetching doctors' });
  }
};

export const getPendingDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: 'pending' })
      .populate('hospitalId', 'name address contact')
      .select('-password');
    res.json(doctors);
  } catch (error) {
    console.error('Get pending doctors error:', error);
    res.status(500).json({ error: 'Error fetching pending doctors' });
  }
};

export const getApprovedDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ status: 'approved' })
      .populate('hospitalId', 'name address')
      .select('-password');
    res.json(doctors);
  } catch (error) {
    console.error('Get approved doctors error:', error);
    res.status(500).json({ error: 'Error fetching approved doctors' });
  }
};

export const getDoctorsByHospital = async (req, res) => {
  try {
    const doctors = await Doctor.find({ 
      hospitalId: req.params.hospitalId,
      status: 'approved'
    })
      .select('-password');
    res.json(doctors);
  } catch (error) {
    console.error('Get doctors by hospital error:', error);
    res.status(500).json({ error: 'Error fetching doctors' });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('hospitalId')
      .select('-password');
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json(doctor);
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({ error: 'Error fetching doctor' });
  }
};

export const approveDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    ).select('-password');
    
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Also create a User entry for the doctor
    const existingUser = await User.findOne({ email: doctor.email });
    if (!existingUser) {
      const user = new User({
        name: doctor.name,
        email: doctor.email,
        password: doctor.password,
        phone: doctor.phone,
        photo: doctor.photo,
        role: 'doctor'
      });
      await user.save();
    }

    res.json({ message: 'Doctor approved successfully', doctor });
  } catch (error) {
    console.error('Approve doctor error:', error);
    res.status(500).json({ error: 'Error approving doctor' });
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Delete doctor error:', error);
    res.status(500).json({ error: 'Error deleting doctor' });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json(doctor);
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({ error: 'Error updating doctor' });
  }
};

