import express from 'express';
import { addApplicant } from '../controllers/registrationController.js';

const router = express.Router();

router.post('/addApplicant', addApplicant);

export default router;