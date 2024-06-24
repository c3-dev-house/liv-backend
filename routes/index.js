import express from 'express';
import testRoute from './testRoute.js';
import productRoutes from './productRoutes.js';
import orderRoutes from './orderRoutes.js';

const router = express.Router();

router.use('/test', testRoute);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);


export default router;