
import express, { Request, Response } from "express";
import { deleteGamesByFilter } from '../service/games.service'
import { deserializeUser } from "../middleware/deserializeUser";
import mongoose from "mongoose";
import WebSocket from 'ws';
import { wss } from '../../websocket';

const homeHandler = express.Router();
homeHandler.use(deserializeUser);

//Delete unfinished games
homeHandler.delete("/", async (req: Request, res: Response) => {
    try {
        const game = req.body;
        const id = req.params.id;
        const userId = req.userId;
        await deleteGamesByFilter(
            {
                $and: [
                    { userId: new mongoose.Types.ObjectId(userId) },
                    { $or: [{ gameOver: { $eq: false } }, { gameArray: { $eq: [] } }] }
                ]
            });
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(
                    JSON.stringify({
                        updateBy: userId,
                        gameId: [id],
                    })
                )
            }
        })
        return res.sendStatus(200);
    } catch (err) {
        return res.status(500).send(err);
    }
})


export default homeHandler;
