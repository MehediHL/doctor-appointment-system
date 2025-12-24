import Availability from '../models/Availability.js';
import Appointment from '../models/Appointment.js';

export const getAvailability = async (req, res) => {
  try {
    const { doctorId, date } = req.params;

    if (!doctorId || !date) {
      return res.status(400).json({ error: 'Doctor ID and date are required' });
    }

    // First check for date-specific availability
    let availability = await Availability.findOne({
      doctorId,
      date: date
    });

    // If no date-specific availability, check for day-of-week availability
    if (!availability) {
      const dayOfWeek = new Date(date).getDay();
      availability = await Availability.findOne({
        doctorId,
        dayOfWeek: dayOfWeek
      });
    }

    if (!availability) {
      return res.json({ slots: [] });
    }

    // Get booked appointments for this date
    const appointments = await Appointment.find({
      doctorId,
      date,
      status: { $ne: 'cancelled' }
    });

    const bookedSlots = appointments.map(apt => apt.timeSlot);
    const availableSlots = availability.slots.filter(slot => !bookedSlots.includes(slot));

    res.json({ slots: availableSlots });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: 'Error fetching availability' });
  }
};

export const setAvailability = async (req, res) => {
  try {
    const { doctorId, date, slots } = req.body;

    if (!doctorId || !date || !Array.isArray(slots)) {
      return res.status(400).json({ error: 'Doctor ID, date, and slots array are required' });
    }

    let availability = await Availability.findOne({
      doctorId,
      date: date
    });

    if (availability) {
      availability.slots = slots;
      await availability.save();
    } else {
      availability = new Availability({
        doctorId,
        date,
        slots
      });
      await availability.save();
    }

    res.json(availability);
  } catch (error) {
    console.error('Set availability error:', error);
    res.status(500).json({ error: 'Error setting availability' });
  }
};

export const setDayAvailability = async (req, res) => {
  try {
    const { doctorId, dayOfWeek, slots } = req.body;

    if (!doctorId || dayOfWeek === undefined || !Array.isArray(slots)) {
      return res.status(400).json({ error: 'Doctor ID, day of week (0-6), and slots array are required' });
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ error: 'Day of week must be between 0 (Sunday) and 6 (Saturday)' });
    }

    let availability = await Availability.findOne({
      doctorId,
      dayOfWeek: dayOfWeek
    });

    if (availability) {
      availability.slots = slots;
      await availability.save();
    } else {
      availability = new Availability({
        doctorId,
        dayOfWeek,
        slots
      });
      await availability.save();
    }

    res.json(availability);
  } catch (error) {
    console.error('Set day availability error:', error);
    res.status(500).json({ error: 'Error setting day availability' });
  }
};

export const getDayAvailability = async (req, res) => {
  try {
    const { doctorId, dayOfWeek } = req.params;

    if (!doctorId || dayOfWeek === undefined) {
      return res.status(400).json({ error: 'Doctor ID and day of week are required' });
    }

    const availability = await Availability.findOne({
      doctorId,
      dayOfWeek: Number(dayOfWeek)
    });

    if (!availability) {
      return res.json({ slots: [] });
    }

    res.json({ slots: availability.slots });
  } catch (error) {
    console.error('Get day availability error:', error);
    res.status(500).json({ error: 'Error fetching day availability' });
  }
};

