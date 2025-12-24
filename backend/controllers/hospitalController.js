import Hospital from '../models/Hospital.js';

export const getAllHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find().sort({ createdAt: -1 });
    res.json(hospitals);
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({ error: 'Error fetching hospitals' });
  }
};

export const getHospitalById = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    res.json(hospital);
  } catch (error) {
    console.error('Get hospital error:', error);
    res.status(500).json({ error: 'Error fetching hospital' });
  }
};

export const createHospital = async (req, res) => {
  try {
    const { name, address, contact, image } = req.body;

    if (!name || !address || !contact) {
      return res.status(400).json({ error: 'Name, address, and contact are required' });
    }

    const hospital = new Hospital({
      name,
      address,
      contact,
      image: image || ''
    });

    await hospital.save();
    res.status(201).json(hospital);
  } catch (error) {
    console.error('Create hospital error:', error);
    res.status(500).json({ error: 'Error creating hospital' });
  }
};

export const updateHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    res.json(hospital);
  } catch (error) {
    console.error('Update hospital error:', error);
    res.status(500).json({ error: 'Error updating hospital' });
  }
};

export const deleteHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndDelete(req.params.id);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    res.json({ message: 'Hospital deleted successfully' });
  } catch (error) {
    console.error('Delete hospital error:', error);
    res.status(500).json({ error: 'Error deleting hospital' });
  }
};

