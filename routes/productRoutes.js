import express from 'express';
import { getVendorProducts } from '../controllers/productController.js';

const router = express.Router();

router.get('/vendor-products', getVendorProducts); //fetches all products from vendor (calls getProducts Shopify service)

export default router;
