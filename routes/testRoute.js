import express from 'express';
import { test } from '../controllers/testController.js';
import { deleteAllRecords } from '../controllers/testController.js';

const router = express.Router();

router.get('/', test);
router.delete('/deleteAll',deleteAllRecords)

export default router;
