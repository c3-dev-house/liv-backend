import express from 'express';
import { getBeneficiarySales } from '../controllers/getOverviewDataController.js';

const router = express.Router();

router.get('/beneficiarySales/:userId', getBeneficiarySales);

export default router;
