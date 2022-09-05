import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import joi from 'joi';
import dotenv from 'dotenv';
dotenv.config();
import dayjs from 'dayjs';

const server = express();
server.use(express.json());
server.use(cors());
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => db = mongoClient.db("batepapo-uol"));

const participantSchema = joi.object({
    name: joi.string().empty(' ').required()
});

server.post('/participants', async (req, res) => {
    const participant = req.body;
    const validation = participantSchema.validate(participant);
    if (validation.error) {
        res.sendStatus(422);
        return;
    }
    
    const response = await db.collection('participants').find({ name: participant.name }).toArray();
    if (response.length > 0) {
        res.sendStatus(409);
        return;
    }

    db.collection('participants').insertOne({
        ...participant,
        lastStatus: Date.now()
    });

    db.collection('messages').insertOne({
        from: participant.name,
        to: 'Todos',
        text: 'entrou na sala...',
        type: 'status',
        time: dayjs().format('HH:mm:ss')
    });
    res.sendStatus(201);
});

server.listen(5000, () => console.log('Listening on port 5000'));