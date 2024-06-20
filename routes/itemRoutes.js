import express from 'express';
import { addSalesItem } from '../controllers/addSalesItemController.js';
import { updateSalesItem } from '../controllers/updateSalesItemController.js';

const router = express.Router();

router.post('/addItem/:clothingBundleId', addSalesItem);
router.patch('/updateItem/:recordId', updateSalesItem);

export default router;
