import express from 'express';
import {
  getAllHospitals,
  getHospitalById,
  createHospital,
  updateHospital,
  deleteHospital
} from '../controllers/hospitalController.js';

const router = express.Router();

router.get('/', getAllHospitals);
router.get('/:id', getHospitalById);
router.post('/', createHospital);
router.put('/:id', updateHospital);
router.delete('/:id', deleteHospital);

export default router;

