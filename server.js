import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import contactRoutes from './routes/contact.route.js';

import connectStorifalDB from './config/db.js';

dotenv.config();

const server = express();

server.use(express.json());
server.use(cors());

// DB Connection
connectStorifalDB();

server.use('/api/auth', authRoutes);
server.use('/api/contact', contactRoutes);

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
