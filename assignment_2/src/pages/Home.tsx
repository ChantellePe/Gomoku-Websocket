import { useState } from 'react'
import { Button } from '../components'
import style from './Home.module.css'

export default function Home() {
    const [boardSize, setBoardSize] = useState(0)


    return (
        <div className={style.boardForm}>

            <form className={style.boardForm} onSubmit={(e) => {
                e.preventDefault()
            }}>
                <select className={style.dropDown}
                    onChange={(e) => {
                        setBoardSize(Number(e.target.value))
                        console.log(e.target.value)

                    }}>
                    <option value={0} hidden>Board Size</option>
                    {(Array.from(Array(15)).map((e, i) => i + 5).map((num) =>
                        <option value={num}>{num}</option>)
                    )}
                </select>
                <div className={style.gameRules}>
                    <header className={style.rulesTitle}>Game Rules:</header>
                    <p>Players alternate turns placing a stone of their color on an empty intersection. Black plays first.
                        The winner is the first player to form an unbroken chain of five stones horizontally, vertically, or diagonally.
                        Placing so that a line of more than five stones of the same color is created does not result in a win.</p>
                </div>
                <Button
                    className={style.startGameButton}
                    type="submit"
                    disabled={boardSize === 0}>
                    Start Game
                </Button>
            </form>
        </div >
    )
}
