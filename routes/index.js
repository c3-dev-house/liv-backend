import express from 'express';
import testRoute from './testRoute.js';
import productRoutes from './productRoutes.js';

const router = express.Router();

router.use('/test', testRoute);
router.use('/products', productRoutes);


export default router;