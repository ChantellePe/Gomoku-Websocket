import React, { useState } from "react"
import { SquareContext } from "../context"
import { PLAYER } from "../constants"

type SquareProviderProps = {
    children: React.ReactNode
}

export default function SquareProvider({ children }: SquareProviderProps) {
    const [playerTurn, setPlayerTurn] = useState<PLAYER>(PLAYER.PLAYER_ONE)
    const nextTurn = (player: PLAYER) => setPlayerTurn(player)

    return (
        <SquareContext.Provider value={{ playerTurn, nextTurn }}>
            {children}
        </SquareContext.Provider>
    )
}
