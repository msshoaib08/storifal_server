import express from 'express';
import {
	checkEmailExists,
	login,
	registerUser,
	verifyEmail,
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/check-email', checkEmailExists);
router.post('/register', registerUser);
router.get('/verify-email', verifyEmail);
router.post('/login', login);

export default router;
