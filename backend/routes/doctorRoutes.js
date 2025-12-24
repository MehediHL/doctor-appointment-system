import express from 'express';
import {
  getAllDoctors,
  getPendingDoctors,
  getApprovedDoctors,
  getDoctorsByHospital,
  getDoctorById,
  approveDoctor,
  deleteDoctor,
  updateDoctor
} from '../controllers/doctorController.js';

const router = express.Router();

router.get('/', getAllDoctors);
router.get('/pending', getPendingDoctors);
router.get('/approved', getApprovedDoctors);
router.get('/hospital/:hospitalId', getDoctorsByHospital);
router.get('/:id', getDoctorById);
router.put('/:id/approve', approveDoctor);
router.put('/:id', updateDoctor);
router.delete('/:id', deleteDoctor);

export default router;

