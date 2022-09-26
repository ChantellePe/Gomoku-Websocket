import { createServer } from 'http'
import express, { Express } from 'express';
import dotenv from 'dotenv';
import gameHandler from './src/handlers/game.handler';
import gamesHandler from './src/handlers/games.handler';
import authHandler from './src/handlers/auth.handler';
import connectDB from './src/util/connectDB';
import mongoose from 'mongoose';
import homeHandler from './src/handlers/home.handler';

// dotenv.config();

// // connect to database
// connectDB();

const app: Express = express();
// const port = process.env.PORT;
app.use(express.json());

app.use('/game', gameHandler);
app.use('/games', gamesHandler, homeHandler);
app.use('/', authHandler, homeHandler);

// mongoose.connection.once('connected', () => {
//     console.log('⚡️[server]: Connected to MongoDB.');
//     app.listen(port, () => {
//         console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
//     });
// })

export const server = createServer(app)

export default app