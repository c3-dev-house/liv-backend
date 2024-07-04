import express from 'express';
import { test } from '../controllers/testController.js';
import { deleteAllClothingItems } from '../services/salesforceService.js';
import { deleteAllClothingBundles } from '../services/salesforceService.js';

const router = express.Router();

router.get('/', test);
router.delete('/deleteAllItems',deleteAllClothingItems)
router.delete('/deleteAllBundles',deleteAllClothingBundles)

export default router;
