import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
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
const messageSchema = joi.object({
    to: joi.string().empty(' ').required(),
    text: joi.string().empty(' ').required(),
    type: joi.string().valid('message', 'private_message').required()
})

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

server.get('/participants', async (req, res) => {
    const response = await db.collection('participants').find().toArray();
    res.send(response);
});

server.post('/messages', async (req, res) => {
    const bodyMessage = req.body;
    const fromMessage = req.headers.user;

    if (fromMessage === undefined) {
        res.sendStatus(422);
        return;
    }

    const participant = await db.collection('participants').findOne({ name: fromMessage });
    if (!participant) {
        res.sendStatus(422);
        return;
    }

    const validation = messageSchema.validate(bodyMessage);
    if (validation.error) {
        res.sendStatus(422);
        return;
    }

    db.collection('messages').insertOne({
        from: fromMessage,
        to: bodyMessage.to,
        text: bodyMessage.text,
        type: bodyMessage.type,
        time: dayjs().format('HH:mm:ss')
    });

    res.sendStatus(201);
});

server.get('/messages', async (req, res) => {
    const { limit } = req.query;
    const user = req.headers.user;

    if (user === undefined) {
        res.sendStatus(422);
        return;
    }
    
    if (limit !== undefined) {
        const responseLimit = await db.collection('messages').find().sort({time: -1}).limit(Number(limit)).toArray();
        res.send(responseLimit);
        return;
    }

    const allMessages = await db.collection('messages').find().toArray();
    const response = allMessages.filter(message => (message.from === user || message.to === user || message.to === 'Todos'));
    res.send(response);
});

server.post('/status', async (req, res) => {
    const user = req.headers.user;

    if (user === undefined) {
        res.sendStatus(422);
        return;
    }

    const participant = await db.collection('participants').findOne({name: user});
    if (!participant) {
        res.sendStatus(404);
        return;
    }

    const newStatus = {
        lastStatus: Date.now()
    };
    await db.collection('participants').updateOne({
        name: participant.name
    }, { $set: newStatus });

    res.sendStatus(200);
});

server.listen(5000, () => console.log('Listening on port 5000'));