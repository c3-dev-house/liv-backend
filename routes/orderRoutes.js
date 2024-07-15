import express from 'express';
import { createOrder, cancelUserOrder, getCustomerOrders, getCustomerOrderById,markUserOrderAsPaid} from '../controllers/orderController.js';

const router = express.Router();

router.post('/create', createOrder);
router.post('/cancel', cancelUserOrder);
router.post('/markAsPaid',markUserOrderAsPaid);
router.get('/customer-orders/:customerId', getCustomerOrders);
router.get('/:orderId', getCustomerOrderById);
export default router;
