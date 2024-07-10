import express from 'express';
import {getProfile,updateBeneficiary} from '../controllers/profileController.js';
const router = express.Router();

router.get('/beneficiaryDetails/:userId', getProfile);
router.patch('/updateBeneficiary/:userId', updateBeneficiary);


export default router;
