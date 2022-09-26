import express, { Request, Response } from "express";
import validateSchema from '../middleware/validateSchema';
import { createGameSchema, updateGameSchema, winners } from '../schema/game.schema';
import { createGame, getGameByFilter, updateGame, deleteGamesByFilter } from "../service/games.service";
import mongoose from "mongoose";
import { deserializeUser } from "../middleware/deserializeUser";
import WebSocket from 'ws';
import { wss } from '../../websocket';

const gameHandler = express.Router();
gameHandler.use(deserializeUser);

// Create a game
gameHandler.post("/", validateSchema(createGameSchema), async (req: Request, res: Response) => {
    const userId = req.userId;
    const game = req.body;
    const newGame = await createGame({ userId, ...game });
    // wss.clients.forEach((client) => {
    //     if (client.readyState === WebSocket.OPEN) {
    //         client.send(
    //             JSON.stringify({
    //                 updateBy: userId,
    //                 gameOver: newGame.gameOver,
    //                 currentPlayer: newGame.currentPlayer,
    //             })
    //         )
    //     }
    // })
    if (!newGame) return res.status(500)
    return res.status(200).send(newGame)
})


// Modify a game
gameHandler.put("/:id", validateSchema(updateGameSchema), async (req: Request, res: Response) => {
    let game = req.body
    const id = req.params.id
    const userId = req.userId
    const currentGame = await getGameByFilter(
        {
            _id: new mongoose.Types.ObjectId(id),
            userId: new mongoose.Types.ObjectId(userId),
        }
    );
    if (!currentGame) {
        return res.sendStatus(404)
    } else if (currentGame.gameOver) {
        return res.sendStatus(405)
    } else {
        game.gameArray = mergeArrays(game?.gameArray_PlayerOne, game?.gameArray_PlayerTwo)
        if ((game.gameArray_PlayerOne.length + game.gameArray_PlayerTwo.length) === (game.boardSize ** 2)) {
            game.winner = winners.Tie
            game.gameOver = true
        } else {
            if (fiveConseq(game.gameArray_PlayerOne)) {
                game.winner = winners.PlayerOne
                game.gameOver = true
            } else if (fiveConseq(game.gameArray_PlayerTwo)) {
                game.winner = winners.PlayerTwo
                game.gameOver = true
            } else if (fiveDown(game.gameArray_PlayerTwo, game.boardSize)) {
                game.winner = winners.PlayerTwo
                game.gameOver = true
            } else if (fiveDown(game.gameArray_PlayerOne, game.boardSize)) {
                game.winner = winners.PlayerOne
                game.gameOver = true
            } else if (diagLeft(game.gameArray_PlayerTwo, game.boardSize)) {
                game.winner = winners.PlayerTwo
                game.gameOver = true
            } else if (diagLeft(game.gameArray_PlayerOne, game.boardSize)) {
                game.winner = winners.PlayerOne
                game.gameOver = true
            } else if (diagRight(game.gameArray_PlayerTwo, game.boardSize)) {
                game.winner = winners.PlayerTwo
                game.gameOver = true
            } else if (diagRight(game.gameArray_PlayerOne, game.boardSize)) {
                game.winner = winners.PlayerOne
                game.gameOver = true
            } else {
                game.winner = ""
            }
        }
    }
    const newGame = await updateGame(id, userId, { ...game });
    if (!newGame) return res.sendStatus(404)
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(
                JSON.stringify({
                    updateBy: userId,
                    gameOver: newGame.gameOver,
                    currentPlayer: newGame.currentPlayer,
                    gameArray: newGame.gameArray,
                    winner: newGame.winner,
                    gameArray_PlayerOne: newGame.gameArray_PlayerOne,
                    gameArray_PlayerTwo: newGame.gameArray_PlayerTwo,
                })
            )
        }
    })

    return res.status(200).send(newGame)
})

//Game helper function
function exists(arr: number[][], search: number[]): boolean {
    return arr.some(row => JSON.stringify(row) === JSON.stringify(search))
}

//Determine winner functions

function fiveConseq(squareIds: number[][]): boolean {
    for (let idx = 0; idx < squareIds.length; idx++) {
        if (exists(squareIds, [squareIds[idx][0], squareIds[idx][1]]) && exists(squareIds, [squareIds[idx][0] + 1, squareIds[idx][1]]) && exists(squareIds, [squareIds[idx][0] + 2, squareIds[idx][1]]) && exists(squareIds, [squareIds[idx][0] + 3, squareIds[idx][1]]) && exists(squareIds, [squareIds[idx][0] + 4, squareIds[idx][1]])) {
            if (!(exists(squareIds, [squareIds[idx][0] - 1, squareIds[idx][1]])) && (!exists(squareIds, [squareIds[idx][0] + 5, squareIds[idx][1]]))) {
                return true
            }
        }
    }
    return false
}

function fiveDown(squareIds: number[][], boardSize: number): boolean {
    const number = boardSize
    for (let idx = 0; idx < squareIds.length; idx++) {
        if (exists(squareIds, [squareIds[idx][0], squareIds[idx][1]]) && exists(squareIds, [squareIds[idx][0] + number, squareIds[idx][1] + 1]) && exists(squareIds, [squareIds[idx][0] + (number * 2), squareIds[idx][1] + 2]) && exists(squareIds, [squareIds[idx][0] + (number * 3), squareIds[idx][1] + 3]) && exists(squareIds, [squareIds[idx][0] + (number * 4), squareIds[idx][1] + 4])) {
            if (!(exists(squareIds, [squareIds[idx][0] - number, squareIds[idx][1] - 1])) && !(exists(squareIds, [squareIds[idx][0] + (number * 5), squareIds[idx][1] + 5]))) {
                return true
            }
        }
    }
    return false
}

function diagLeft(squareIds: number[][], boardSize: number): boolean {
    const number = boardSize - 1
    for (let idx = 0; idx < squareIds.length; idx++) {
        if (exists(squareIds, [squareIds[idx][0], squareIds[idx][1]]) && exists(squareIds, [squareIds[idx][0] + number, squareIds[idx][1] + 1]) && exists(squareIds, [squareIds[idx][0] + (number * 2), squareIds[idx][1] + 2]) && exists(squareIds, [squareIds[idx][0] + (number * 3), squareIds[idx][1] + 3]) && exists(squareIds, [squareIds[idx][0] + (number * 4), squareIds[idx][1] + 4])) {
            if (!(exists(squareIds, [squareIds[idx][0] - number, squareIds[idx][1] - 1])) && (!exists(squareIds, [squareIds[idx][0] + (number * 5), squareIds[idx][1] + 5]))) {
                return true
            }
        }
    }
    return false
}

function diagRight(squareIds: number[][], boardSize: number): boolean {
    const number = boardSize + 1
    for (let idx = 0; idx < squareIds.length; idx++) {
        if (exists(squareIds, [squareIds[idx][0], squareIds[idx][1]]) && exists(squareIds, [squareIds[idx][0] + number, squareIds[idx][1] + 1]) && exists(squareIds, [squareIds[idx][0] + (number * 2), squareIds[idx][1] + 2]) && exists(squareIds, [squareIds[idx][0] + (number * 3), squareIds[idx][1] + 3]) && exists(squareIds, [squareIds[idx][0] + (number * 4), squareIds[idx][1] + 4])) {
            if (!(exists(squareIds, [squareIds[idx][0] - number, squareIds[idx][1] - 1])) && (!exists(squareIds, [squareIds[idx][0] + (number * 5), squareIds[idx][1] + 5]))) {
                return true
            }
        }
    }
    return false
}

const mergeArrays = (a1: number[][], a2: number[][]) => {
    let length = a1.length > a2.length ? a1.length : a2.length
    let a3: number[][] = []

    for (let i: number = 0; i < length; i++) {
        a3.push(a1[i])
        a3.push(a2[i])
    }
    return a3
}

export default gameHandler;