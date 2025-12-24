import express from 'express';
import {
  getAvailability,
  setAvailability,
  setDayAvailability,
  getDayAvailability
} from '../controllers/availabilityController.js';

const router = express.Router();

router.get('/:doctorId/:date', getAvailability);
router.post('/date', setAvailability);
router.post('/day', setDayAvailability);
router.get('/day/:doctorId/:dayOfWeek', getDayAvailability);

export default router;

