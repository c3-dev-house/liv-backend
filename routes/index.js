import express from 'express';
import testRoute from './testRoute.js';
import productRoutes from './productRoutes.js';
import overviewRoutes from './overviewRoutes.js';
import itemRoutes from './itemRoutes.js';
import authRoutes from './authRoutes.js';

const router = express.Router();

router.use('/test', testRoute);
router.use('/products', productRoutes);
router.use('/overview', overviewRoutes);
router.use('/items', itemRoutes);
router.use('/auth', authRoutes);




export default router;