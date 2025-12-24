import Appointment from '../models/Appointment.js';
import Availability from '../models/Availability.js';

export const getAllAppointments = async (req, res) => {
  try {
    const { doctorId, patientId, status } = req.query;
    const query = {};
    
    if (doctorId) query.doctorId = doctorId;
    if (patientId) query.patientId = patientId;
    if (status) query.status = status;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization photo bmdcNumber')
      .populate('hospitalId', 'name address')
      .sort({ date: 1, timeSlot: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Error fetching appointments' });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId')
      .populate('doctorId')
      .populate('hospitalId');
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json(appointment);
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ error: 'Error fetching appointment' });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, hospitalId, date, timeSlot } = req.body;

    if (!patientId || !doctorId || !hospitalId || !date || !timeSlot) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if slot is available
    const availability = await Availability.findOne({
      doctorId,
      $or: [
        { date: date },
        { dayOfWeek: new Date(date).getDay() }
      ]
    });

    if (!availability || !availability.slots.includes(timeSlot)) {
      return res.status(400).json({ error: 'Selected time slot is not available' });
    }

    // Check if slot is already booked
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date,
      timeSlot,
      status: { $ne: 'cancelled' }
    });

    if (existingAppointment) {
      return res.status(400).json({ error: 'Time slot is already booked' });
    }

    const appointment = new Appointment({
      patientId,
      doctorId,
      hospitalId,
      date,
      timeSlot,
      status: 'pending'
    });

    await appointment.save();
    const populated = await Appointment.findById(appointment._id)
      .populate('patientId', 'name')
      .populate('doctorId', 'name specialization')
      .populate('hospitalId', 'name');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Error creating appointment' });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'pending', 'cancelled', 'completed'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('patientId', 'name')
      .populate('doctorId', 'name')
      .populate('hospitalId', 'name');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Error updating appointment' });
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ error: 'Error deleting appointment' });
  }
};

