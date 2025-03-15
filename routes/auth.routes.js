import express from 'express';
import {
	checkEmailExists,
	registerUser,
	verifyEmail,
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/check-email', checkEmailExists);
router.post('/register', registerUser);
router.get('/verify-email', verifyEmail);

export default router;
