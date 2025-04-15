import { Contact } from '../models/contactModel.js';

export const submitContactForm = async (req, res) => {
	try {
		const { fullName, email, message } = req.body;

		if (!fullName || !email || !message) {
			return res.status(400).json({ message: 'All fields are required' });
		}

		const newContact = await Contact.create({ fullName, email, message });

		res.status(201).json({
			message: 'Contact form submitted successfully',
			contact: newContact,
		});
	} catch (error) {
		console.error('Contact form error: ', error.message);
		res.status(500).json({ message: 'Server error. Try again later.' });
	}
};
