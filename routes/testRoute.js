import express from 'express';
import { test } from '../controllers/testController.js';
import { deleteAllClothingItems } from '../controllers/testController.js';
import { deleteAllClothingBundles } from '../controllers/testController.js';

const router = express.Router();

router.get('/', test);
router.delete('/deleteAllItems',deleteAllClothingItems)
router.delete('/deleteAllBundles',deleteAllClothingBundles)

export default router;
