import nodemailer from 'nodemailer';

export const sendEmailVerification = async (email, token) => {
	try {
		const transporter = nodemailer.createTransport({
			service: 'Gmail',
			auth: {
				user: process.env.SMTP_EMAIL,
				pass: process.env.SMTP_PASSWORD,
			},
		});

		const verificationLink = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;

		const mailOptions = {
			from: process.env.SMTP_EMAIL,
			to: email,
			subject: 'Email Verification',
			html: `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`,
		};

		await transporter.sendMail(mailOptions);
		console.log('Verification email sent');
	} catch (error) {
		console.error('Email sending failed:', error.message);
	}
};
