import express from 'express';
import { addSalesItem } from '../controllers/addSalesItemController.js';
import { updateSalesItem } from '../controllers/updateSalesItemController.js';
import { deleteSalesItem } from '../controllers/deleteSalesItemController.js';

const router = express.Router();

router.post('/addItem/:clothingBundleId', addSalesItem);
router.patch('/updateItem/:recordId', updateSalesItem);
router.delete('/deleteItem/:recordId', deleteSalesItem);

export default router;
