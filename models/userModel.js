import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
	name: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	username: { type: String, unique: true, sparse: true },
	dob: { type: Date },
	password: { type: String },
	profile_img: { type: String, default: '' },
	bio: { type: String, default: '' },
	socialLinks: {
		instgram: { type: String, default: '' },
		linkedin: { type: String, default: '' },
		github: { type: String, default: '' },
		website: { type: String, default: '' },
	},

	blogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],
	total_reads: { type: Number, default: 0 },
	total_blogs: { type: Number, default: 0 },

	isVerified: { type: Boolean, default: false },
	emailVerificationToken: String,
	// otp: { type: String },
	// otpExpiry: { type: Date },

	googleId: { type: String, unique: true, sparse: true },
	authType: { type: String, enum: ['manual', 'google'], default: 'manual' },
	createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model('User', userSchema);
