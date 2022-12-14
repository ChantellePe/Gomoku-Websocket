import mongoose, { Document } from "mongoose"
import { UserDocument } from './user.model'

export interface GameDocument extends Document {
    userId: UserDocument["_id"];
    gameIndex: number;
    currentPlayer: String;
    winner: String;
    gameOver: Boolean;
    gameArray: [[number]];
    gameArray_PlayerOne: [[number]];
    gameArray_PlayerTwo: [[number]];
    boardSize: number;
}

const getGamesSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    gameIndex: Number,
    winner: String,
    currentPlayer: String,
    gameOver: Boolean,
    gameArray: [[Number]],
    gameArray_PlayerOne: [[Number]],
    gameArray_PlayerTwo: [[Number]],
    boardSize: Number,
}, { timestamps: true })


export default mongoose.model<GameDocument>("Game", getGamesSchema)