'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Player = 'X' | 'O'
type Cell = Player | null

export default function Home() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X')
  const [winner, setWinner] = useState<Player | 'draw' | null>(null)
  const [playerXName, setPlayerXName] = useState('')
  const [playerOName, setPlayerOName] = useState('')
  const [gameStarted, setGameStarted] = useState(false)
  const [totalGames, setTotalGames] = useState(0)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [moves, setMoves] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setTotalGames(data.length)
      setLeaderboard(data)
    }
  }

  const checkWinner = (squares: Cell[]): Player | 'draw' | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ]

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a]
      }
    }

    if (squares.every(cell => cell !== null)) {
      return 'draw'
    }

    return null
  }

  const handleClick = async (index: number) => {
    if (board[index] || winner || !gameStarted) return

    const newBoard = [...board]
    newBoard[index] = currentPlayer
    setBoard(newBoard)
    setMoves(moves + 1)

    const gameWinner = checkWinner(newBoard)
    if (gameWinner) {
      setWinner(gameWinner)

      const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : null

      await supabase.from('games').insert({
        winner: gameWinner
      })

      await supabase.from('tic_tac_toe_scores').insert({
        player_name: playerXName,
        opponent_name: playerOName,
        winner: gameWinner === 'X' ? playerXName : gameWinner === 'O' ? playerOName : 'draw',
        moves: moves + 1,
        duration_seconds: duration
      })

      loadLeaderboard()
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X')
    }
  }

  const startGame = () => {
    if (playerXName.trim() && playerOName.trim()) {
      setGameStarted(true)
      setStartTime(Date.now())
    }
  }

  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setCurrentPlayer('X')
    setWinner(null)
    setGameStarted(false)
    setPlayerXName('')
    setPlayerOName('')
    setMoves(0)
    setStartTime(null)
  }

  const playAgain = () => {
    setBoard(Array(9).fill(null))
    setCurrentPlayer('X')
    setWinner(null)
    setMoves(0)
    setStartTime(Date.now())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-white text-center mb-4">Tic-Tac-Toe</h1>
        <p className="text-white text-center mb-8 text-xl">Global Games Played: {totalGames}</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {!gameStarted ? (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">Start New Game</h2>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Player X Name</label>
                  <input
                    type="text"
                    value={playerXName}
                    onChange={(e) => setPlayerXName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                    placeholder="Enter name for X"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Player O Name</label>
                  <input
                    type="text"
                    value={playerOName}
                    onChange={(e) => setPlayerOName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                    placeholder="Enter name for O"
                  />
                </div>
                <button
                  onClick={startGame}
                  disabled={!playerXName.trim() || !playerOName.trim()}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
                >
                  Start Game
                </button>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="text-gray-800">
                    <div className="font-semibold">X: {playerXName}</div>
                    <div className="font-semibold">O: {playerOName}</div>
                  </div>
                  {!winner && (
                    <div className="text-2xl font-bold text-gray-800">
                      {currentPlayer === 'X' ? playerXName : playerOName}'s Turn ({currentPlayer})
                    </div>
                  )}
                </div>

                {winner && (
                  <div className="mb-6 p-4 bg-green-100 border-2 border-green-500 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {winner === 'draw'
                        ? "It's a Draw!"
                        : `${winner === 'X' ? playerXName : playerOName} Wins!`}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {board.map((cell, index) => (
                    <button
                      key={index}
                      onClick={() => handleClick(index)}
                      disabled={!!winner}
                      className={`aspect-square text-5xl font-bold rounded-xl border-4 transition-all ${
                        cell === 'X'
                          ? 'bg-blue-100 text-blue-600 border-blue-400'
                          : cell === 'O'
                          ? 'bg-red-100 text-red-600 border-red-400'
                          : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                      } ${winner ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {cell}
                    </button>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={playAgain}
                    className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold py-3 px-6 rounded-lg hover:from-green-600 hover:to-teal-600 transition-all"
                  >
                    Play Again
                  </button>
                  <button
                    onClick={resetGame}
                    className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all"
                  >
                    New Players
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Recent Games</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {leaderboard.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No games played yet. Be the first!</p>
              ) : (
                leaderboard.map((game, idx) => (
                  <div key={game.id} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-gray-800">
                        #{totalGames - idx}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(game.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-2 text-lg font-bold text-purple-700">
                      {game.winner === 'draw' ? 'Draw' : `Winner: ${game.winner}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
