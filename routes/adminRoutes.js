import express from 'express';
import { getAllBeneficiaries } from '../controllers/adminController.js';


const router = express.Router();

router.get('/allBeneficiaries', getAllBeneficiaries);


export default router;
