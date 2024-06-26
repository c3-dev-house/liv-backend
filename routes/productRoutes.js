import express from 'express';
import { getVendorProducts, getUserOwnedProducts } from '../controllers/productController.js';

const router = express.Router();

router.get('/vendor-products', getVendorProducts); //fetches all products from vendor (calls getProducts Shopify service)
router.get('/owned-products', getUserOwnedProducts); //fetches all owned products (calls getUserOwnedProducts Salesforce service)

export default router;
