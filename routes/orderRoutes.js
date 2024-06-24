import express from 'express';
import { createOrder, cancelUserOrder } from '../controllers/orderController.js';

const router = express.Router();

router.post('/create', createOrder);
router.post('/cancel', cancelUserOrder);

export default router;
