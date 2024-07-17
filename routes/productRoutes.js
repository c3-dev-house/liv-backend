import express from 'express';
import { getVendorProducts, getUserOwnedProducts,getVendorAndCategoryProducts } from '../controllers/productController.js';

const router = express.Router();

router.get('/vendor-products', getVendorProducts); //fetches all products from vendor (calls getProducts Shopify service)
router.get('/vendor-products/category',getVendorAndCategoryProducts);
router.get('/owned-products/:customerId', getUserOwnedProducts); //fetches all owned products (calls getUserOwnedProducts Shopify service)


export default router;
