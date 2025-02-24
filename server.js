import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import connectStorifalDB from './config/db.js';

dotenv.config();

const server = express();

server.use(express.json());
server.use(cors());

// DB Connection
connectStorifalDB();

server.get('/', (req, res) => {
	res.send('Welcome to the server of Storifal');
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
