import express from 'express';
import cors from 'cors';
import getMessages from './routes/getMessages.js';
import getParticipants from './routes/getParticipants.js';
import postMessages from './routes/postMessages.js';
import postParticipants from './routes/postParticipants.js';
import postStatus from './routes/postStatus.js';

const server = express();
server.use(express.json());
server.use(cors());

getMessages();
getParticipants();
postMessages();
postParticipants();
postStatus();

server.listen(5000, () => console.log('Listening on port 5000'));