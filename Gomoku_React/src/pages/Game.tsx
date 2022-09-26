/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useReducer, useState, useEffect, useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { GameContext, SquareContext, UserContext } from '../context'
import style from './Game.module.css'
import { Square, Button } from '../components'
import { PLAYER, PLAYER_MOVE_ACTION } from '../constants'
import { GameType } from '../types'
import buttonStyle from '../components/Button.module.css'
import { put } from '../utils/http'
import { trackPromise, usePromiseTracker } from "react-promise-tracker";


type PlayerMove = {
    type: PLAYER_MOVE_ACTION
    payload: number[]
}

function gameReducer(state: number[][] = [], action: PlayerMove) {
    const { type, payload } = action
    switch (type) {
        case PLAYER_MOVE_ACTION.SELECT:
            return [...state, payload]
        case PLAYER_MOVE_ACTION.RESET:
            return []
        default:
            return state
    }
}

export default function Game() {
    const navigate = useNavigate()
    const [resetButtonClicked, setResetButtonClicked] = useState(false);
    const { boardSize } = useContext(GameContext)
    const { user } = useContext(UserContext)
    const { playerTurn, nextTurn } = useContext(SquareContext)
    const [game, setGame] = useState<GameType>()
    const [playerOneState, dispatch1] = useReducer(gameReducer, [])
    const [playerTwoState, dispatch2] = useReducer(gameReducer, [])
    const { id = "" } = useParams()
    const { promiseInProgress } = usePromiseTracker();
    const ws = useMemo(() => new WebSocket('ws://localhost:8080'), [])
    const [gameMoves, setGameMoves] = useState<Number[][]>([[]])
    const resetGame = async () => {
        if (game?.gameOver) {
            return navigate(`/`)
        } else {
            dispatch1({ type: PLAYER_MOVE_ACTION.RESET, payload: [] })
            dispatch2({ type: PLAYER_MOVE_ACTION.RESET, payload: [] })
            nextTurn(PLAYER.PLAYER_ONE)
        }
    }


    const getClassNames = () => {
        switch (game?.gameOver) {
            case false:
                return `${style.header}`
            case true && game?.winner === "Black":
                return `${style.header} ${style.winnerBlack}`
            case true && game?.winner === "White":
                return `${style.header} ${style.winnerWhite}`
            case true && game?.winner === "Tie":
                return `${style.header} ${style.winnerTie}`
            default:
                return `${style.header}`
        }
    }

    const gameMove = async () => {
        try {
            let results: GameType
            if (playerTurn === PLAYER.PLAYER_ONE && !game?.gameOver) {
                results = await put(`/game/${id}`, {
                    userId: user?._id,
                    gameOver: false,
                    currentPlayer: "Black",
                    gameArray: [],
                    winner: "",
                    gameArray_PlayerOne: playerOneState,
                    gameArray_PlayerTwo: playerTwoState,
                    boardSize: boardSize
                })
                return setGame(results)
            } else if (playerTurn === PLAYER.PLAYER_TWO && !game?.gameOver) {
                results = await put(`/game/${id}`, {
                    userId: user?._id,
                    gameOver: false,
                    currentPlayer: "White",
                    gameArray: [],
                    winner: "",
                    gameArray_PlayerOne: playerOneState,
                    gameArray_PlayerTwo: playerTwoState,
                    boardSize: boardSize
                })
                return setGame(results)
            }
        } catch (err) {
            console.log((err as Error).message)
            navigate('/')
        }
    }

    useEffect(() => {
        trackPromise(gameMove())
        if (!user) return
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                if (
                    typeof data === 'object' &&
                    data.undatedBy !== user._id &&
                    'gameArray' in data
                ) {
                    setGameMoves(data.gameArray)
                    //notify('Seat map is updated')
                }
            } catch (e) {
                console.log(e)
            }
        }
        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                console.log('closing websocket connection')
                ws.close()
            }
        }
    }, [playerOneState, playerTwoState])

    useEffect(() => {
        resetGame()
    }, [resetButtonClicked])

    if (!user) return <Navigate to="/login" replace />
    if (!boardSize) return null
    console.log(playerOneState)
    console.log(playerTwoState)

    const idGenerator = (id: number): number[] => {
        let row = 0
        let square = 0
        const index = id + 1
        if (index > boardSize) {
            if (index % boardSize !== 0) {
                square = id
                row = Math.floor((id / boardSize))
            } else if (index % boardSize === 0) {
                row = (index / boardSize) - 1
                square = id
            }
        } else if (id < boardSize) {
            row = 0
            square = id
        }
        return [square, row]
    }

    const announceWinner = () => {
        if (game) {
            if (game.winner === "Black") {
                return 'Black WINS!!!'
            } else if (game.winner === "White") {
                return 'White WINS!!!'
            } else if (game.winner === "Tie") {
                return `It's a TIE!!!`
            } else {
                return
            }
        }
    }

    const getBoardStyles = (): string => {
        if (game?.gameOver || promiseInProgress === true) {
            return `${style.gameOver} ${style.board}`
        } else if (!game?.gameOver) {
            return `${style.board}`
        }
        return `${style.board}`
    }

    const leave = () => {
        if (game?.gameOver && game?.gameArray.length > 0) {
            navigate('/games')
        } else {
            resetGame()
            navigate('/')
        }
    }

    return (
        <div className={style.container}>
            <h1 className={getClassNames()} >{game?.winner === "" ? `Current Player: ${playerTurn}` : announceWinner()}</h1>
            <div className={getBoardStyles()} id={game?._id}
                style={{ gridTemplateColumns: `repeat(${boardSize}, 1fr)` }}>
                {[...Array(boardSize * boardSize)].map((_, index) => (
                    <Square resetButtonClicked={resetButtonClicked} key={idGenerator(index).join(",")} id={idGenerator(index)} playerTurn={playerTurn}
                        playerMove={() => {
                            if (playerTurn === PLAYER.PLAYER_ONE) {
                                dispatch1({ type: PLAYER_MOVE_ACTION.SELECT, payload: idGenerator(index) })
                            } else if (playerTurn === PLAYER.PLAYER_TWO) {
                                dispatch2({ type: PLAYER_MOVE_ACTION.SELECT, payload: idGenerator(index) })
                            }
                        }} />
                ))}
            </div>
            <div className={style.buttonSection}>
                <Button className={[buttonStyle.button, buttonStyle.reset].join(' ')} disabled={game?.gameOver === true} onClick={() => {
                    setResetButtonClicked(() => resetButtonClicked ? false : true)
                }}>Restart</Button>
                <Button className={[buttonStyle.button, buttonStyle.leave].join(' ')} onClick={leave}>Leave</Button>
            </div>
        </div>
    )
}