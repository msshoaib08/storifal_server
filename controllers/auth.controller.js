import validator from 'validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';
import { sendEmailVerification } from '../config/emailService.js';
import isDisposalEmails from 'is-disposable-email';

const passwordRegex =
	/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

export const registerUser = async (req, res) => {
	try {
		const { name, email, password } = req.body;

		if (!name || !email || !password) {
			return res.status(400).json({ message: 'All fields are required' });
		}

		// Validate Email format
		if (!validator.isEmail(email)) {
			return res.status(400).json({ message: 'Invalid email format' });
		}

		// Disposal Email domain verification
		if (isDisposalEmails(email)) {
			return res
				.status(400)
				.json({ message: 'Disposable email addresses are not allowed.' });
		}

		// Validate password strength
		if (!passwordRegex.test(password)) {
			return res.status(400).json({
				message:
					'Password must be at least 6 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
			});
		}

		// Check if email already exists
		const existingUser = await User.findOne({ email });

		if (existingUser) {
			return res.status(400).json({ message: 'Email already exists.' });
		}

		// Hash Password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Generate email verification token
		const emailVerificationToken = jwt.sign(
			{ email },
			process.env.JWT_SECRET_KEY,
			{ expiresIn: '1h' }
		);

		// Create and Save User to Database
		const newUser = new User({
			name,
			email,
			password: hashedPassword,
			emailVerificationToken,
			isVerified: false,
		});

		await newUser.save();

		// Send Email Verification Link
		await sendEmailVerification(email, emailVerificationToken);

		res.status(201).json({
			message: 'Verification link sent to email. Please verify your account.',
			userId: newUser._id,
		});
	} catch (error) {
		console.log(error);
		res
			.status(500)
			.json({ message: 'Internal server error', error: error.message });
	}
};

export const verifyEmail = async (req, res) => {
	try {
		const { token } = req.query;

		if (!token) {
			return res.status(400).json({ message: 'Invalid or expired token' });
		}

		// Decode Token
		const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
		const user = await User.findOne({ email: decoded.email });

		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		// Check if user is already verified
		if (user.isVerified) {
			return res.status(400).json({ message: 'Email already verified.' });
		}

		// Mark user as verified
		user.isVerified = true;
		user.emailVerificationToken = null;
		await user.save();

		res
			.status(200)
			.json({ message: 'Email verified successfully. You can now log in.' });
	} catch (error) {
		res.status(400).json({ message: 'Invalid or expired token' });
	}
};
