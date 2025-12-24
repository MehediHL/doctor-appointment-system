import express from 'express';
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment
} from '../controllers/appointmentController.js';

const router = express.Router();

router.get('/', getAllAppointments);
router.get('/:id', getAppointmentById);
router.post('/', createAppointment);
router.put('/:id/status', updateAppointmentStatus);
router.delete('/:id', deleteAppointment);

export default router;

