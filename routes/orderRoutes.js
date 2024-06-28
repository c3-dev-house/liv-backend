import express from 'express';
import { createOrder, cancelUserOrder, getCustomerOrders, getCustomerOrderById} from '../controllers/orderController.js';

const router = express.Router();

router.post('/create', createOrder);
router.post('/cancel', cancelUserOrder);
router.get('/customer-orders/:customerId', getCustomerOrders);
router.get('/:orderId', getCustomerOrderById);

export default router;
