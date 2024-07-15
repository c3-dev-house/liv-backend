import express from 'express';
import { login, resetPassword, forgotPassword,adminLogin } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/adminLogin',adminLogin);
router.post('/reset-password', resetPassword);
router.post('/forgot-password', forgotPassword);

export default router;
