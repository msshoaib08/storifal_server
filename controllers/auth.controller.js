import validator from 'validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';
import { sendEmailVerification } from '../config/emailService.js';
import isDisposalEmails from 'is-disposable-email';

/**
 * Utility function for handling errors in a consistent format.
 */
const handleErrorResponse = (res, status, message) => {
	return res.status(status).json({ message });
};

/**
 * Password regex pattern to enforce security standards.
 */
const passwordRegex =
	/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user & send email verification
 * @access  Public
 */
export const registerUser = async (req, res) => {
	try {
		const { name, email, password } = req.body;

		// Validate required fields
		if (!name || !email || !password) {
			return handleErrorResponse(res, 400, 'All fields are required.');
		}

		// Validate email format
		if (!validator.isEmail(email)) {
			return handleErrorResponse(res, 400, 'Invalid email format.');
		}

		// Reject disposable email domains
		if (isDisposalEmails(email)) {
			return handleErrorResponse(
				res,
				400,
				'Disposable emails are not allowed.'
			);
		}

		// Enforce password security rules
		if (!passwordRegex.test(password)) {
			return handleErrorResponse(
				res,
				400,
				'Password must be at least 6 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.'
			);
		}

		// Check if email is already registered
		const existingUser = await User.findOne({ email });

		if (existingUser) {
			return handleErrorResponse(res, 400, 'Email already exists.');
		}

		// Hash password before saving
		const hashedPassword = await bcrypt.hash(password, 10);

		// Generate email verification token (short expiration)
		const emailVerificationToken = jwt.sign(
			{ email },
			process.env.JWT_SECRET_KEY,
			{ expiresIn: '30m' } // Shorter expiry for security
		);

		// Create new user
		const newUser = new User({
			name,
			email,
			password: hashedPassword,
			emailVerificationToken,
			isVerified: false,
		});

		await newUser.save();

		// Send verification email
		await sendEmailVerification(email, emailVerificationToken);

		// Response
		res.status(201).json({
			message:
				'Verification link sent to your email. Please verify your account.',
			userId: newUser._id,
		});
	} catch (error) {
		console.error(error);
		handleErrorResponse(res, 500, 'Internal server error');
	}
};

/**
 * @route   GET /api/auth/verify-email
 * @desc    Verify email from token
 * @access  Public
 */
export const verifyEmail = async (req, res) => {
	try {
		const { token } = req.query;

		if (!token) {
			return handleErrorResponse(res, 400, 'Invalid or expired token.');
		}

		// Decode and validate token
		const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
		const user = await User.findOne({ email: decoded.email });

		if (!user) {
			return handleErrorResponse(res, 404, 'User not found.');
		}

		// Prevent re-verification
		if (user.isVerified) {
			return handleErrorResponse(res, 400, 'Email already verified.');
		}

		// Mark user as verified
		user.isVerified = true;
		user.emailVerificationToken = null;
		await user.save();

		res
			.status(200)
			.json({ message: 'Email verified successfully. You can now log in.' });
	} catch (error) {
		console.error(error);
		handleErrorResponse(res, 400, 'Invalid or expired token.');
	}
};

/**
 * @route   POST /api/auth/check-email
 * @desc    Check if email exists
 * @access  Public
 */
export const checkEmailExists = async (req, res) => {
	try {
		const { email } = req.body;

		if (!email) {
			return handleErrorResponse(res, 400, 'Email is required.');
		}

		if (!validator.isEmail(email)) {
			return handleErrorResponse(res, 400, 'Invalid email format.');
		}

		const existingUser = await User.findOne({ email });

		res.json({ exists: !!existingUser });
	} catch (error) {
		console.error(error);
		handleErrorResponse(res, 500, 'Server Error');
	}
};

/**
 * @route   POST /api/auth/login
 * @desc    Authentication user and issue JWT token
 * @access  Public
 */

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return handleErrorResponse(res, 400, 'Email and password are required.');
		}

		if (!validator.isEmail(email)) {
			return handleErrorResponse(res, 400, 'Invalid email format.');
		}

		const user = await User.findOne({ email });

		if (!user) {
			return handleErrorResponse(res, 401, 'Invalid email or password.');
		}

		if (!user.isVerified) {
			return handleErrorResponse(
				res,
				403,
				'Email is not verified. Please verify your email.'
			);
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return handleErrorResponse(res, 401, 'Invalid email or password.');
		}

		// Generate JWT token
		const token = jwt.sign(
			{
				userId: user._id,
				email: user.email,
			},
			process.env.JWT_SECRET_KEY,
			{
				expiresIn: '7d',
			}
		);

		res.status(200).json({
			message: 'Login successful.',
			token,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
			},
		});
	} catch (error) {
		console.log(error);
		handleErrorResponse(res, 500, 'Server Error');
	}
};
